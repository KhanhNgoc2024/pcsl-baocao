import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ThongBaoService } from '../thong-bao/thong-bao.service';
import { NhatKyService } from '../nhat-ky/nhat-ky.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { isSysAdmin, isDauMoiRole, hasRole } from '../common/scope/scope.util';
import { LuuNhapDto } from './dto/luu-nhap.dto';

@Injectable()
export class BaoCaoNopService {
  constructor(
    private prisma: PrismaService,
    private thongBaoService: ThongBaoService,
    private nhatKyService: NhatKyService,
  ) {}

  async baoCaoCanNop(user: CurrentUserPayload) {
    return this.prisma.baoCaoNop.findMany({
      where: { donViId: user.donViId },
      include: { kyBaoCao: { include: { mauBaoCao: true } }, tepDinhKem: true },
      orderBy: [{ kyBaoCao: { hanNop: 'desc' } }],
    });
  }

  async findOne(id: number, user: CurrentUserPayload) {
    const bc = await this.prisma.baoCaoNop.findUnique({
      where: { id },
      include: {
        kyBaoCao: { include: { mauBaoCao: true } },
        tepDinhKem: true,
        nguoiNop: true,
        nguoiDuyet: true,
        nguoiDuyetDonVi: true,
        donVi: true,
      },
    });
    if (!bc) throw new NotFoundException('Không tìm thấy bản nộp');
    const allowed =
      isSysAdmin(user) ||
      bc.donViId === user.donViId ||
      (isDauMoiRole(user) && bc.kyBaoCao.mauBaoCao.donViTaoId === user.donViId);
    if (!allowed) throw new ForbiddenException('Không có quyền truy cập bản nộp này');
    return bc;
  }

  async luuNhap(dto: LuuNhapDto, user: CurrentUserPayload) {
    const ky = await this.prisma.kyBaoCao.findUnique({ where: { id: dto.kyBaoCaoId } });
    if (!ky) throw new NotFoundException('Không tìm thấy kỳ báo cáo');
    if (ky.trangThai === 'DA_DONG') throw new BadRequestException('Kỳ báo cáo đã đóng');

    const existing = await this.prisma.baoCaoNop.findUnique({
      where: { kyBaoCaoId_donViId: { kyBaoCaoId: dto.kyBaoCaoId, donViId: user.donViId } },
    });
    if (existing && (existing.trangThai === 'DA_DUYET' || existing.trangThai === 'CHO_DUYET_DON_VI' || existing.trangThai === 'DA_NOP')) {
      throw new BadRequestException('Báo cáo đang chờ duyệt hoặc đã được duyệt, không thể sửa');
    }

    return this.prisma.baoCaoNop.upsert({
      where: { kyBaoCaoId_donViId: { kyBaoCaoId: dto.kyBaoCaoId, donViId: user.donViId } },
      create: {
        kyBaoCaoId: dto.kyBaoCaoId,
        donViId: user.donViId,
        nguoiNopId: user.id,
        duLieu: dto.duLieu as any,
        trangThai: 'NHAP',
      },
      update: {
        duLieu: dto.duLieu as any,
        nguoiNopId: user.id,
        trangThai: 'NHAP',
      },
    });
  }

  /** Đơn vị (không phải người tự duyệt được) có APPROVER/UNIT_ADMIN đang hoạt động hay không — quyết định báo cáo có phải qua duyệt nội bộ hay không. */
  private async coNguoiDuyetNoiBo(donViId: number): Promise<number[]> {
    const nguoiDuyet = await this.prisma.nguoiDung.findMany({
      where: {
        donViId,
        trangThai: 'HOAT_DONG',
        vaiTro: { some: { vaiTro: { ma: { in: ['UNIT_ADMIN', 'APPROVER'] } } } },
      },
      select: { id: true },
    });
    return nguoiDuyet.map((u) => u.id);
  }

  async nop(id: number, user: CurrentUserPayload) {
    const bc = await this.findOne(id, user);
    if (bc.donViId !== user.donViId && !isSysAdmin(user)) {
      throw new ForbiddenException('Không có quyền nộp báo cáo của đơn vị khác');
    }
    if (bc.trangThai === 'DA_DUYET' || bc.trangThai === 'CHO_DUYET_DON_VI' || bc.trangThai === 'DA_NOP') {
      throw new BadRequestException('Báo cáo đang chờ duyệt hoặc đã được nộp, không thể nộp lại');
    }

    // Người tự có quyền duyệt (UNIT_ADMIN/APPROVER của chính đơn vị, hoặc SYS_ADMIN) thì nộp là gửi thẳng đến phòng ban chủ trì, khỏi cần tự duyệt cho mình.
    const tuDuyetDuoc = isSysAdmin(user) || hasRole(user, 'UNIT_ADMIN', 'APPROVER');

    if (tuDuyetDuoc) {
      const now = new Date();
      const treHan = now > bc.kyBaoCao.hanNop;
      const updated = await this.prisma.baoCaoNop.update({
        where: { id },
        data: { trangThai: 'DA_NOP', thoiGianNop: now, treHan, nguoiNopId: user.id },
      });
      await this.nhatKyService.ghiLog({
        nguoiDungId: user.id,
        hanhDong: 'NOP_BAO_CAO',
        doiTuong: 'bao_cao_nop',
        doiTuongId: id,
        chiTiet: { treHan },
      });
      return updated;
    }

    const nguoiDuyetIds = await this.coNguoiDuyetNoiBo(bc.donViId);
    if (nguoiDuyetIds.length === 0) {
      throw new BadRequestException(
        'Đơn vị của bạn chưa có Quản trị đơn vị hoặc Người duyệt để xét duyệt báo cáo trước khi gửi đi. Vui lòng liên hệ quản trị hệ thống.',
      );
    }

    const updated = await this.prisma.baoCaoNop.update({
      where: { id },
      data: { trangThai: 'CHO_DUYET_DON_VI', nguoiNopId: user.id },
    });

    await this.thongBaoService.taoChoNguoiDung({
      nguoiDungIds: nguoiDuyetIds,
      loai: 'CHO_DUYET_DON_VI',
      tieuDe: `Có báo cáo cần duyệt: ${bc.kyBaoCao.tenKy}`,
      noiDung: `${bc.kyBaoCao.mauBaoCao.ten} — chờ duyệt trước khi gửi đến phòng ban chủ trì.`,
      duongDan: '/bao-cao-can-nop',
    });

    await this.nhatKyService.ghiLog({
      nguoiDungId: user.id,
      hanhDong: 'NOP_CHO_DUYET_DON_VI',
      doiTuong: 'bao_cao_nop',
      doiTuongId: id,
    });

    return updated;
  }

  /** Duyệt nội bộ tại đơn vị nộp: APPROVER/UNIT_ADMIN của chính đơn vị đó xét duyệt trước khi báo cáo được gửi đến phòng ban chủ trì. */
  async duyetDonVi(id: number, ketQua: 'DA_NOP' | 'TRA_LAI', ghiChu: string | undefined, user: CurrentUserPayload) {
    const bc = await this.findOne(id, user);
    const coQuyen = isSysAdmin(user) || (bc.donViId === user.donViId && hasRole(user, 'UNIT_ADMIN', 'APPROVER'));
    if (!coQuyen) {
      throw new ForbiddenException('Không có quyền duyệt báo cáo này');
    }
    if (bc.trangThai !== 'CHO_DUYET_DON_VI') {
      throw new BadRequestException('Chỉ có thể duyệt báo cáo đang chờ duyệt đơn vị');
    }

    const now = new Date();
    const data: any = {
      nguoiDuyetDonViId: user.id,
      thoiGianDuyetDonVi: now,
      ghiChuDuyetDonVi: ghiChu,
    };
    if (ketQua === 'DA_NOP') {
      data.trangThai = 'DA_NOP';
      data.thoiGianNop = now;
      data.treHan = now > bc.kyBaoCao.hanNop;
    } else {
      data.trangThai = 'TRA_LAI';
    }

    const updated = await this.prisma.baoCaoNop.update({ where: { id }, data });

    if (ketQua === 'TRA_LAI' && bc.nguoiNopId) {
      await this.thongBaoService.taoChoNguoiDung({
        nguoiDungIds: [bc.nguoiNopId],
        loai: 'TRA_LAI',
        tieuDe: `Báo cáo bị trả lại: ${bc.kyBaoCao.tenKy}`,
        noiDung: ghiChu ?? 'Vui lòng kiểm tra và nộp lại.',
        duongDan: '/bao-cao-can-nop',
      });
    }

    await this.nhatKyService.ghiLog({
      nguoiDungId: user.id,
      hanhDong: ketQua === 'DA_NOP' ? 'DUYET_DON_VI' : 'TRA_LAI_DON_VI',
      doiTuong: 'bao_cao_nop',
      doiTuongId: id,
      chiTiet: { ghiChu },
    });

    return updated;
  }

  async duyet(id: number, ketQua: 'DA_DUYET' | 'TRA_LAI', ghiChu: string | undefined, user: CurrentUserPayload) {
    const bc = await this.findOne(id, user);
    if (!isSysAdmin(user) && bc.kyBaoCao.mauBaoCao.donViTaoId !== user.donViId) {
      throw new ForbiddenException('Không có quyền duyệt báo cáo này');
    }
    if (!bc.kyBaoCao.mauBaoCao.canDuyet) {
      throw new BadRequestException('Mẫu báo cáo này không yêu cầu duyệt');
    }
    if (bc.trangThai !== 'DA_NOP') {
      throw new BadRequestException('Chỉ có thể duyệt báo cáo đã nộp');
    }

    const updated = await this.prisma.baoCaoNop.update({
      where: { id },
      data: {
        trangThai: ketQua,
        nguoiDuyetId: user.id,
        thoiGianDuyet: new Date(),
        ghiChuDuyet: ghiChu,
      },
    });

    if (ketQua === 'TRA_LAI' && bc.nguoiNopId) {
      await this.thongBaoService.taoChoNguoiDung({
        nguoiDungIds: [bc.nguoiNopId],
        loai: 'TRA_LAI',
        tieuDe: `Báo cáo bị trả lại: ${bc.kyBaoCao.tenKy}`,
        noiDung: ghiChu ?? 'Vui lòng kiểm tra và nộp lại.',
        duongDan: '/bao-cao-can-nop',
      });
    }

    await this.nhatKyService.ghiLog({
      nguoiDungId: user.id,
      hanhDong: ketQua === 'DA_DUYET' ? 'DUYET_BAO_CAO' : 'TRA_LAI_BAO_CAO',
      doiTuong: 'bao_cao_nop',
      doiTuongId: id,
      chiTiet: { ghiChu },
    });

    return updated;
  }
}
