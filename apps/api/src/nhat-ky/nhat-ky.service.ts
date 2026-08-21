import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NhatKyService {
  constructor(private prisma: PrismaService) {}

  async ghiLog(params: {
    nguoiDungId?: number | null;
    hanhDong: string;
    doiTuong?: string;
    doiTuongId?: number;
    chiTiet?: Record<string, unknown>;
    ipAddress?: string;
  }): Promise<void> {
    await this.prisma.nhatKy.create({
      data: {
        nguoiDungId: params.nguoiDungId ?? null,
        hanhDong: params.hanhDong,
        doiTuong: params.doiTuong,
        doiTuongId: params.doiTuongId,
        chiTiet: params.chiTiet as any,
        ipAddress: params.ipAddress,
      },
    });
  }

  async list(params: { page: number; pageSize: number }) {
    const { page, pageSize } = params;
    const [items, total] = await Promise.all([
      this.prisma.nhatKy.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { nguoiDung: { select: { id: true, hoTen: true, tenDangNhap: true } } },
      }),
      this.prisma.nhatKy.count(),
    ]);
    return { items, total, page, pageSize };
  }
}
