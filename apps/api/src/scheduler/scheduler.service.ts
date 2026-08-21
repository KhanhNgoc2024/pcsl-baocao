import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ThongBaoService } from '../thong-bao/thong-bao.service';
import { MauBaoCaoService } from '../mau-bao-cao/mau-bao-cao.service';
import { MailService } from './mail.service';

function soNgayLech(hanNop: Date, now: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const hanNgay = Date.UTC(hanNop.getUTCFullYear(), hanNop.getUTCMonth(), hanNop.getUTCDate());
  const nowNgay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((hanNgay - nowNgay) / msPerDay);
}

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private thongBaoService: ThongBaoService,
    private mauBaoCaoService: MauBaoCaoService,
    private mailService: MailService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async sinhKyTuDong() {
    const daSinh = await this.mauBaoCaoService.sinhKyTuDongChoTatCa();
    if (daSinh.length > 0) {
      this.logger.log(`Đã tự động sinh ${daSinh.length} kỳ báo cáo mới: ${daSinh.map((k) => k.ky).join(', ')}`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async nhacHan() {
    const now = new Date();
    await this.nhacHanKyBaoCao(now);
    await this.nhacHanBaoCaoVanBan(now);
  }

  private async guiNhac(donViIds: number[], tieuDe: string, noiDung: string, duongDan: string) {
    if (donViIds.length === 0) return;
    await this.thongBaoService.taoChoDonVi({ donViIds, loai: 'SAP_DEN_HAN', tieuDe, noiDung, duongDan });
    const users = await this.prisma.nguoiDung.findMany({
      where: { donViId: { in: donViIds }, trangThai: 'HOAT_DONG', email: { not: null } },
      select: { email: true },
    });
    const emails = users.map((u) => u.email!).filter(Boolean);
    await this.mailService.gui(emails, tieuDe, `<p>${noiDung}</p>`);
  }

  private async nhacHanKyBaoCao(now: Date) {
    const kyMoList = await this.prisma.kyBaoCao.findMany({
      where: { trangThai: { not: 'DA_DONG' } },
      include: { mauBaoCao: true, baoCaoNop: true },
    });
    for (const ky of kyMoList) {
      const lech = soNgayLech(ky.hanNop, now);
      if (![3, 1, 0].includes(lech)) continue;
      const donViChuaNop = ky.baoCaoNop
        .filter((b) => b.trangThai === 'CHUA_NOP' || b.trangThai === 'NHAP')
        .map((b) => b.donViId);
      const nhan = lech === 0 ? 'đã đến hạn hôm nay' : `còn ${lech} ngày nữa đến hạn`;
      await this.guiNhac(
        donViChuaNop,
        `Nhắc nộp: ${ky.tenKy} (${ky.mauBaoCao.ten})`,
        `Kỳ báo cáo "${ky.tenKy}" ${nhan} (hạn ${ky.hanNop.toLocaleDateString('vi-VN')}). Đơn vị của bạn chưa nộp báo cáo.`,
        '/bao-cao-can-nop',
      );
    }
  }

  private async nhacHanBaoCaoVanBan(now: Date) {
    const bcvbList = await this.prisma.baoCaoVanBan.findMany({
      where: { trangThai: 'HOAT_DONG' },
      include: { bcvbNop: true },
    });
    for (const bcvb of bcvbList) {
      const lech = soNgayLech(bcvb.hanNop, now);
      if (![3, 1, 0].includes(lech)) continue;
      const donViChuaNop = bcvb.bcvbNop.filter((n) => n.trangThai === 'CHUA_NOP').map((n) => n.donViId);
      const nhan = lech === 0 ? 'đã đến hạn hôm nay' : `còn ${lech} ngày nữa đến hạn`;
      await this.guiNhac(
        donViChuaNop,
        `Nhắc nộp: ${bcvb.ten}`,
        `Yêu cầu báo cáo văn bản "${bcvb.ten}" ${nhan} (hạn ${bcvb.hanNop.toLocaleDateString('vi-VN')}). Đơn vị của bạn chưa nộp.`,
        '/bao-cao-van-ban-can-nop',
      );
    }
  }
}
