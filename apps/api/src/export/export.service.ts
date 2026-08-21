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
  dong?: { ma: string; nhan: string }[];
  con?: { ma: string; nhan: string; kieu: string }[];
}

/** Tham số dùng chung khi render 1 trường — hoặc ghi giá trị thật (sheet đơn vị), hoặc ghi công thức cộng dồn (sheet Tổng hợp). */
interface ThamSoRenderTruong {
  sheet: ExcelJS.Worksheet;
  hang: number;
  t: TruongBieuMau;
  // Chế độ "sheet đơn vị": có duLieu + ghiThamChieu (lưu địa chỉ ô để sheet Tổng hợp dùng lại)
  duLieu?: Record<string, any>;
  ghiThamChieu?: (khoa: string, diaChiO: string) => void;
  // Chế độ "sheet Tổng hợp": có layThamChieu (lấy lại toàn bộ địa chỉ ô của các đơn vị theo khoá)
  layThamChieu?: (khoa: string) => string[] | undefined;
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

  private tenSheetAnToan(tenGoc: string, daDung: Set<string>): string {
    let sach = (tenGoc || 'Đơn vị').replace(/[:\\/?*[\]]/g, ' ').trim();
    if (sach.length > 31) sach = sach.slice(0, 31);
    if (!sach) sach = 'Đơn vị';
    let ketQua = sach;
    let dem = 1;
    while (daDung.has(ketQua)) {
      dem++;
      const hau = `(${dem})`;
      ketQua = sach.slice(0, Math.max(0, 31 - hau.length - 1)) + ' ' + hau;
    }
    daDung.add(ketQua);
    return ketQua;
  }

  private escapeTenSheet(tenSheet: string): string {
    return tenSheet.replace(/'/g, "''");
  }

  /**
   * Render dữ liệu của 1 trường vào sheet, dùng chung cho sheet đơn vị (ghi giá trị) và sheet Tổng hợp (ghi công thức cộng dồn).
   * Trả về hàng tiếp theo còn trống sau khi render xong trường này.
   */
  private renderTruong(p: ThamSoRenderTruong): number {
    const { sheet, t } = p;
    const laTongHop = !!p.layThamChieu;
    let hang = p.hang;

    const ghiONeu = (khoa: string, cell: ExcelJS.Cell) => {
      if (p.ghiThamChieu) {
        const diaChi = `'${this.escapeTenSheet(sheet.name)}'!$${cell.address.replace(/\d+$/, '')}$${cell.row}`;
        p.ghiThamChieu(khoa, diaChi);
      }
    };

    const congThucTuThamChieu = (khoa: string): string | number | { formula: string } | '' => {
      const refs = p.layThamChieu?.(khoa);
      if (!refs || refs.length === 0) return 0;
      return { formula: refs.join('+') };
    };

    if (t.kieu === 'bang') {
      const cot = t.cot ?? [];
      const dongCoDinh = t.dong ?? [];

      sheet.getCell(hang, 1).value = t.nhan;
      sheet.getCell(hang, 1).font = { bold: true };
      hang++;
      cot.forEach((c, i) => {
        const cell = sheet.getCell(hang, 2 + i);
        cell.value = c.nhan + (c.tong ? ' (tổng)' : '');
        cell.font = { bold: true };
      });
      hang++;

      if (dongCoDinh.length > 0) {
        const giaTriDong: Record<string, Record<string, any>> = p.duLieu?.[t.ma] ?? {};
        for (const d of dongCoDinh) {
          sheet.getCell(hang, 1).value = d.nhan;
          cot.forEach((c, i) => {
            const khoa = `${t.ma}|${d.ma}|${c.ma}`;
            const cell = sheet.getCell(hang, 2 + i);
            if (laTongHop) {
              cell.value = congThucTuThamChieu(khoa);
            } else {
              cell.value = Number(giaTriDong[d.ma]?.[c.ma]) || 0;
              ghiONeu(khoa, cell);
            }
          });
          hang++;
        }
      } else if (!laTongHop) {
        // Bảng tự do (không dòng cố định): số dòng khác nhau tuỳ đơn vị nên chỉ sheet đơn vị hiển thị chi tiết,
        // sheet Tổng hợp chỉ cộng dòng "Tổng" bên dưới.
        const rows: Record<string, any>[] = p.duLieu?.[t.ma] ?? [];
        for (const r of rows) {
          cot.forEach((c, i) => {
            sheet.getCell(hang, 2 + i).value = r[c.ma] ?? '';
          });
          hang++;
        }
        if (cot.some((c) => c.tong)) {
          sheet.getCell(hang, 1).value = 'Tổng';
          sheet.getCell(hang, 1).font = { bold: true };
          cot.forEach((c, i) => {
            if (!c.tong) return;
            const cell = sheet.getCell(hang, 2 + i);
            const colLetter = sheet.getColumn(2 + i).letter;
            if (rows.length > 0) {
              cell.value = { formula: `SUM(${colLetter}${hang - rows.length}:${colLetter}${hang - 1})` };
            } else {
              cell.value = 0;
            }
            cell.font = { bold: true };
            ghiONeu(`${t.ma}|_tong|${c.ma}`, cell);
          });
          hang++;
        }
      } else {
        // Sheet Tổng hợp, bảng tự do: chỉ hiện dòng Tổng cộng dồn từ dòng "Tổng" của từng đơn vị.
        if (cot.some((c) => c.tong)) {
          sheet.getCell(hang, 1).value = 'Tổng';
          sheet.getCell(hang, 1).font = { bold: true };
          cot.forEach((c, i) => {
            if (!c.tong) return;
            const cell = sheet.getCell(hang, 2 + i);
            cell.value = congThucTuThamChieu(`${t.ma}|_tong|${c.ma}`);
            cell.font = { bold: true };
          });
          hang++;
        }
      }
      hang++;
    } else if (t.kieu === 'nhom') {
      sheet.getCell(hang, 1).value = t.nhan;
      sheet.getCell(hang, 1).font = { bold: true };
      hang++;
      const giaTriNhom: Record<string, any> = p.duLieu?.[t.ma] ?? {};
      for (const c of t.con ?? []) {
        sheet.getCell(hang, 1).value = `  ${c.nhan}`;
        const khoa = `${t.ma}|${c.ma}`;
        const cell = sheet.getCell(hang, 2);
        if (c.kieu === 'so') {
          if (laTongHop) {
            cell.value = congThucTuThamChieu(khoa);
          } else {
            cell.value = Number(giaTriNhom[c.ma]) || 0;
            ghiONeu(khoa, cell);
          }
        } else if (!laTongHop) {
          cell.value = giaTriNhom[c.ma] ?? '';
        }
        hang++;
      }
      hang++;
    } else {
      sheet.getCell(hang, 1).value = t.nhan;
      sheet.getCell(hang, 1).font = { bold: true };
      const cell = sheet.getCell(hang, 2);
      const khoa = t.ma;
      if (t.kieu === 'so') {
        if (laTongHop) {
          cell.value = congThucTuThamChieu(khoa);
        } else {
          cell.value = Number(p.duLieu?.[t.ma]) || 0;
          ghiONeu(khoa, cell);
        }
      } else if (!laTongHop) {
        cell.value = p.duLieu?.[t.ma] ?? '';
      }
      hang += 2;
    }
    return hang;
  }

  // ==================== KỲ BÁO CÁO (Danh sách báo cáo) ====================

  /** Xuất Excel theo kỳ: mỗi đơn vị được giao 1 sheet riêng (giữ nguyên cấu trúc mẫu báo cáo), kèm 1 sheet "Tổng hợp" cộng dồn bằng công thức. */
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
    const tenSheetDaDung = new Set<string>();
    const thamChieuTheoKhoa = new Map<string, string[]>();

    for (const g of donViGiao) {
      const nop = nopMap.get(g.donViId);
      const duLieu = (nop?.duLieu as Record<string, any>) ?? {};
      const tenSheet = this.tenSheetAnToan(g.donVi.tenDonVi, tenSheetDaDung);
      const sheet = workbook.addWorksheet(tenSheet);
      sheet.columns = Array.from({ length: 12 }, () => ({ width: 24 }));

      sheet.getCell(1, 1).value = 'Trạng thái';
      sheet.getCell(1, 2).value = TRANG_THAI_LABEL[nop?.trangThai ?? 'CHUA_NOP'];
      sheet.getCell(2, 1).value = 'Thời gian nộp';
      sheet.getCell(2, 2).value = nop?.thoiGianNop ? new Date(nop.thoiGianNop).toLocaleString('vi-VN') : '';
      sheet.getCell(3, 1).value = 'Đúng/Trễ hạn';
      sheet.getCell(3, 2).value = nop?.thoiGianNop ? (nop.treHan ? 'Trễ hạn' : 'Đúng hạn') : '';
      sheet.getCell(4, 1).value = 'Người nộp';
      sheet.getCell(4, 2).value = nop?.nguoiNop?.hoTen ?? '';
      for (let r = 1; r <= 4; r++) sheet.getCell(r, 1).font = { bold: true };

      let hang = 6;
      for (const t of truongList) {
        hang = this.renderTruong({
          sheet,
          hang,
          t,
          duLieu,
          ghiThamChieu: (khoa, diaChi) => {
            const ds = thamChieuTheoKhoa.get(khoa) ?? [];
            ds.push(diaChi);
            thamChieuTheoKhoa.set(khoa, ds);
          },
        });
      }
    }

    const sheetTongHop = workbook.addWorksheet('Tổng hợp', { properties: { tabColor: { argb: 'FF1A4D95' } } });
    sheetTongHop.columns = Array.from({ length: 12 }, () => ({ width: 24 }));
    let hangTongHop = 1;
    for (const t of truongList) {
      hangTongHop = this.renderTruong({
        sheet: sheetTongHop,
        hang: hangTongHop,
        t,
        layThamChieu: (khoa) => thamChieuTheoKhoa.get(khoa),
      });
    }
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
