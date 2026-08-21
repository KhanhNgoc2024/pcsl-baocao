import { Injectable } from '@nestjs/common';
import { LoaiThongBao } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ThongBaoService {
  constructor(private prisma: PrismaService) {}

  /** Tạo thông báo cho tất cả người dùng thuộc các đơn vị chỉ định. */
  async taoChoDonVi(params: {
    donViIds: number[];
    loai: LoaiThongBao;
    tieuDe: string;
    noiDung?: string;
    duongDan?: string;
  }) {
    if (params.donViIds.length === 0) return;
    const users = await this.prisma.nguoiDung.findMany({
      where: { donViId: { in: params.donViIds }, trangThai: 'HOAT_DONG' },
      select: { id: true },
    });
    if (users.length === 0) return;
    await this.prisma.thongBao.createMany({
      data: users.map((u) => ({
        nguoiDungId: u.id,
        loai: params.loai,
        tieuDe: params.tieuDe,
        noiDung: params.noiDung,
        duongDan: params.duongDan,
      })),
    });
  }

  async taoChoNguoiDung(params: {
    nguoiDungIds: number[];
    loai: LoaiThongBao;
    tieuDe: string;
    noiDung?: string;
    duongDan?: string;
  }) {
    if (params.nguoiDungIds.length === 0) return;
    await this.prisma.thongBao.createMany({
      data: params.nguoiDungIds.map((id) => ({
        nguoiDungId: id,
        loai: params.loai,
        tieuDe: params.tieuDe,
        noiDung: params.noiDung,
        duongDan: params.duongDan,
      })),
    });
  }

  async list(nguoiDungId: number, page = 1, pageSize = 20) {
    const [items, total, soChuaDoc] = await Promise.all([
      this.prisma.thongBao.findMany({
        where: { nguoiDungId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.thongBao.count({ where: { nguoiDungId } }),
      this.prisma.thongBao.count({ where: { nguoiDungId, daDoc: false } }),
    ]);
    return { items, total, page, pageSize, soChuaDoc };
  }

  async danhDauDaDoc(id: number, nguoiDungId: number) {
    await this.prisma.thongBao.updateMany({ where: { id, nguoiDungId }, data: { daDoc: true } });
    return { message: 'Đã đánh dấu đã đọc' };
  }

  async danhDauTatCaDaDoc(nguoiDungId: number) {
    await this.prisma.thongBao.updateMany({ where: { nguoiDungId, daDoc: false }, data: { daDoc: true } });
    return { message: 'Đã đánh dấu tất cả đã đọc' };
  }
}
