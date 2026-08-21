import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NhatKyService } from '../nhat-ky/nhat-ky.service';
import { ThongBaoService } from '../thong-bao/thong-bao.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { isSysAdmin, isDauMoiRole } from '../common/scope/scope.util';

@Injectable()
export class BaoCaoVanBanNopService {
  constructor(
    private prisma: PrismaService,
    private nhatKyService: NhatKyService,
    private thongBaoService: ThongBaoService,
  ) {}

  vanBanCanNop(user: CurrentUserPayload) {
    return this.prisma.baoCaoVanBanNop.findMany({
      where: { donViId: user.donViId },
      include: { baoCaoVanBan: true, tepDinhKem: true },
      orderBy: [{ baoCaoVanBan: { hanNop: 'desc' } }],
    });
  }

  async findOne(id: number, user: CurrentUserPayload) {
    const nop = await this.prisma.baoCaoVanBanNop.findUnique({
      where: { id },
      include: { baoCaoVanBan: true, tepDinhKem: true },
    });
    if (!nop) throw new NotFoundException('Không tìm thấy bản nộp');
    const allowed =
      isSysAdmin(user) ||
      nop.donViId === user.donViId ||
      (isDauMoiRole(user) && nop.baoCaoVanBan.donViTaoId === user.donViId);
    if (!allowed) throw new ForbiddenException('Không có quyền truy cập bản nộp này');
    return nop;
  }

  async nop(id: number, user: CurrentUserPayload) {
    const nop = await this.findOne(id, user);
    if (nop.donViId !== user.donViId && !isSysAdmin(user)) {
      throw new ForbiddenException('Không có quyền nộp thay đơn vị khác');
    }
    if (nop.baoCaoVanBan.cheDo !== 'CHO_PHEP_TAI_LEN') {
      throw new BadRequestException('Yêu cầu này chỉ cho phép xem, không cho phép tải lên');
    }
    if (nop.trangThai === 'DA_NOP' || nop.trangThai === 'DA_DUYET') {
      throw new BadRequestException('Báo cáo đã được nộp hoặc đã duyệt, không thể nộp lại');
    }
    if (nop.tepDinhKem.length === 0) {
      throw new BadRequestException('Cần tải lên ít nhất 1 file trước khi nộp');
    }

    const now = new Date();
    const treHan = now > nop.baoCaoVanBan.hanNop;
    const updated = await this.prisma.baoCaoVanBanNop.update({
      where: { id },
      data: { trangThai: 'DA_NOP', thoiGianNop: now, treHan, nguoiNopId: user.id },
    });

    await this.nhatKyService.ghiLog({
      nguoiDungId: user.id,
      hanhDong: 'NOP_BAO_CAO_VAN_BAN',
      doiTuong: 'bao_cao_van_ban_nop',
      doiTuongId: id,
      chiTiet: { treHan },
    });

    return updated;
  }

  /** Duyệt hoặc trả lại bản nộp — chỉ áp dụng cho yêu cầu có bật "Cần duyệt", do đơn vị đầu mối (hoặc SYS_ADMIN) thực hiện. */
  async duyet(id: number, ketQua: 'DA_DUYET' | 'TRA_LAI', ghiChu: string | undefined, user: CurrentUserPayload) {
    const nop = await this.findOne(id, user);
    if (!isSysAdmin(user) && nop.baoCaoVanBan.donViTaoId !== user.donViId) {
      throw new ForbiddenException('Không có quyền duyệt báo cáo này');
    }
    if (!nop.baoCaoVanBan.canDuyet) {
      throw new BadRequestException('Yêu cầu này không yêu cầu duyệt');
    }
    if (nop.trangThai !== 'DA_NOP') {
      throw new BadRequestException('Chỉ có thể duyệt báo cáo đã nộp');
    }

    const updated = await this.prisma.baoCaoVanBanNop.update({
      where: { id },
      data: {
        trangThai: ketQua,
        nguoiDuyetId: user.id,
        thoiGianDuyet: new Date(),
        ghiChuDuyet: ghiChu,
      },
    });

    if (ketQua === 'TRA_LAI' && nop.nguoiNopId) {
      await this.thongBaoService.taoChoNguoiDung({
        nguoiDungIds: [nop.nguoiNopId],
        loai: 'TRA_LAI',
        tieuDe: `Báo cáo văn bản bị trả lại: ${nop.baoCaoVanBan.ten}`,
        noiDung: ghiChu ?? 'Vui lòng kiểm tra và nộp lại.',
        duongDan: '/bao-cao-van-ban-can-nop',
      });
    }

    await this.nhatKyService.ghiLog({
      nguoiDungId: user.id,
      hanhDong: ketQua === 'DA_DUYET' ? 'DUYET_BAO_CAO_VAN_BAN' : 'TRA_LAI_BAO_CAO_VAN_BAN',
      doiTuong: 'bao_cao_van_ban_nop',
      doiTuongId: id,
      chiTiet: { ghiChu },
    });

    return updated;
  }
}
