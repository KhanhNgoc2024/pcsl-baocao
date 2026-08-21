import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NhatKyService } from '../nhat-ky/nhat-ky.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { isSysAdmin, isDauMoiRole } from '../common/scope/scope.util';

@Injectable()
export class BaoCaoVanBanNopService {
  constructor(
    private prisma: PrismaService,
    private nhatKyService: NhatKyService,
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
}
