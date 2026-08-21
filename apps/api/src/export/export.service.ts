import { Injectable, NotFoundException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import archiver = require('archiver');
import type { Response } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

const TRANG_THAI_LABEL: Record<string, string> = {
  CHUA_NOP: 'Chưa nộp',
  NHAP: 'Đang soạn (nháp)',
  CHO_DUYET_DON_VI: 'Chờ duyệt đơn vị',
  DA_NOP: 'Đã nộp',
  DA_DUYET: 'Đã duyệt',
  TRA_LAI: 'Trả lại',
};

interface TruongBieuMau {
  ma: string;
  nhan: string;
  kieu: string;
  cot?: { ma: string; nhan: string; kieu: string; tong?: boolean }[];
  con?: { ma: string; nhan: string; kieu: string }[];
}

@Injectable()
export class ExportService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  private uploadDir(): string {
    return join(process.cwd(), this.config.get<string>('UPLOAD_DIR') ?? './uploads');
  }

  // ==================== KỲ BÁO CÁO (Danh sách báo cáo) ====================

  async taoExcelKy(kyId: number): Promise<Buffer> {
    const ky = await this.prisma.kyBaoCao.findUnique({ where: { id: kyId }, include: { mauBaoCao: true } });
    if (!ky) throw new NotFoundException('Không tìm thấy kỳ báo cáo');

    const donViGiao = await this.prisma.mauBaoCaoDonVi.findMany({
      where: { mauBaoCaoId: ky.mauBaoCaoId },
      include: { donVi: true },
      orderBy: { donVi: { thuTu: 'asc' } },
    });
    const baoCaoNop = await this.prisma.baoCaoNop.findMany({
      where: { kyBaoCaoId: kyId },
      include: { nguoiNop: true },
    });
    const nopMap = new Map(baoCaoNop.map((b) => [b.donViId, b]));

    const truongList: TruongBieuMau[] = ((ky.mauBaoCao.cauHinhBieuMau as any)?.truong ?? []) as TruongBieuMau[];

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Tổng hợp');

    const cotCoBan = ['Đơn vị', 'Trạng thái', 'Thời gian nộp', 'Đúng/Trễ hạn', 'Người nộp'];
    const cotDuLieu: string[] = [];
    for (const t of truongList) {
      if (t.kieu === 'bang') {
        for (const c of t.cot ?? []) {
          if (c.tong) cotDuLieu.push(`${t.nhan} - ${c.nhan} (tổng)`);
        }
      } else if (t.kieu === 'nhom') {
        for (const c of t.con ?? []) {
          cotDuLieu.push(`${t.nhan} - ${c.nhan}`);
        }
      } else {
        cotDuLieu.push(t.nhan);
      }
    }
    sheet.addRow([...cotCoBan, ...cotDuLieu]);
    sheet.getRow(1).font = { bold: true };

    for (const g of donViGiao) {
      const nop = nopMap.get(g.donViId);
      const duLieu = (nop?.duLieu as Record<string, any>) ?? {};
      const dong: (string | number)[] = [
        g.donVi.tenDonVi,
        TRANG_THAI_LABEL[nop?.trangThai ?? 'CHUA_NOP'],
        nop?.thoiGianNop ? new Date(nop.thoiGianNop).toLocaleString('vi-VN') : '',
        nop?.thoiGianNop ? (nop.treHan ? 'Trễ hạn' : 'Đúng hạn') : '',
        nop?.nguoiNop?.hoTen ?? '',
      ];
      for (const t of truongList) {
        if (t.kieu === 'bang') {
          const rows: Record<string, any>[] = duLieu[t.ma] ?? [];
          for (const c of t.cot ?? []) {
            if (!c.tong) continue;
            const tong = rows.reduce((sum, r) => sum + (Number(r[c.ma]) || 0), 0);
            dong.push(tong);
          }
        } else if (t.kieu === 'nhom') {
          const giaTriNhom: Record<string, any> = duLieu[t.ma] ?? {};
          for (const c of t.con ?? []) {
            dong.push(giaTriNhom[c.ma] ?? '');
          }
        } else {
          dong.push(duLieu[t.ma] ?? '');
        }
      }
      sheet.addRow(dong);
    }

    sheet.columns.forEach((col) => (col.width = 22));
    return workbook.xlsx.writeBuffer() as Promise<any>;
  }

  async taiZipKy(kyId: number, res: Response): Promise<void> {
    const ky = await this.prisma.kyBaoCao.findUnique({ where: { id: kyId } });
    if (!ky) throw new NotFoundException('Không tìm thấy kỳ báo cáo');

    const baoCaoNop = await this.prisma.baoCaoNop.findMany({
      where: { kyBaoCaoId: kyId },
      include: { donVi: true, tepDinhKem: true },
    });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="ky-${kyId}.zip"`);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    for (const bc of baoCaoNop) {
      for (const tep of bc.tepDinhKem) {
        const fullPath = join(this.uploadDir(), tep.duongDanLuu);
        if (existsSync(fullPath)) {
          archive.file(fullPath, { name: `${bc.donVi.maDonVi}/${tep.tenGoc}` });
        }
      }
    }
    await archive.finalize();
  }

  // ==================== BÁO CÁO BẰNG VĂN BẢN ====================

  async taoExcelVanBan(bcvbId: number): Promise<Buffer> {
    const bcvb = await this.prisma.baoCaoVanBan.findUnique({ where: { id: bcvbId } });
    if (!bcvb) throw new NotFoundException('Không tìm thấy yêu cầu báo cáo văn bản');

    const nopList = await this.prisma.baoCaoVanBanNop.findMany({
      where: { baoCaoVanBanId: bcvbId },
      include: { donVi: true, nguoiNop: true },
      orderBy: { donVi: { thuTu: 'asc' } },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Tổng hợp');
    sheet.addRow(['Đơn vị', 'Trạng thái', 'Thời gian nộp', 'Đúng/Trễ hạn', 'Người nộp']);
    sheet.getRow(1).font = { bold: true };

    for (const n of nopList) {
      sheet.addRow([
        n.donVi.tenDonVi,
        n.trangThai === 'DA_NOP' ? 'Đã nộp' : 'Chưa nộp',
        n.thoiGianNop ? new Date(n.thoiGianNop).toLocaleString('vi-VN') : '',
        n.thoiGianNop ? (n.treHan ? 'Trễ hạn' : 'Đúng hạn') : '',
        n.nguoiNop?.hoTen ?? '',
      ]);
    }
    sheet.columns.forEach((col) => (col.width = 24));
    return workbook.xlsx.writeBuffer() as Promise<any>;
  }

  async taiZipVanBan(bcvbId: number, res: Response): Promise<void> {
    const bcvb = await this.prisma.baoCaoVanBan.findUnique({ where: { id: bcvbId } });
    if (!bcvb) throw new NotFoundException('Không tìm thấy yêu cầu báo cáo văn bản');

    const nopList = await this.prisma.baoCaoVanBanNop.findMany({
      where: { baoCaoVanBanId: bcvbId },
      include: { donVi: true, tepDinhKem: true },
    });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="bao-cao-van-ban-${bcvbId}.zip"`);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    for (const n of nopList) {
      for (const tep of n.tepDinhKem) {
        const fullPath = join(this.uploadDir(), tep.duongDanLuu);
        if (existsSync(fullPath)) {
          archive.file(fullPath, { name: `${n.donVi.maDonVi}/${tep.tenGoc}` });
        }
      }
    }
    await archive.finalize();
  }
}
