import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ThongBaoService } from '../thong-bao/thong-bao.service';
import { NhatKyService } from '../nhat-ky/nhat-ky.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { isSysAdmin, hasRole, baoCaoVanBanScopeWhere } from '../common/scope/scope.util';
import { CreateBaoCaoVanBanDto } from './dto/create-bao-cao-van-ban.dto';
import { UpdateBaoCaoVanBanDto } from './dto/update-bao-cao-van-ban.dto';
import { GiaoDonViBcvbDto } from './dto/giao-don-vi.dto';

@Injectable()
export class BaoCaoVanBanService {
  constructor(
    private prisma: PrismaService,
    private thongBaoService: ThongBaoService,
    private nhatKyService: NhatKyService,
  ) {}

  findAll(user: CurrentUserPayload) {
    return this.prisma.baoCaoVanBan.findMany({
      where: baoCaoVanBanScopeWhere(user),
      include: { donViTao: true, donViGiao: { include: { donVi: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, user: CurrentUserPayload) {
    const bcvb = await this.prisma.baoCaoVanBan.findFirst({
      where: { id, ...baoCaoVanBanScopeWhere(user) },
      include: { donViTao: true, donViGiao: { include: { donVi: true } }, fileYeuCau: true },
    });
    if (!bcvb) throw new NotFoundException('Không tìm thấy yêu cầu báo cáo văn bản');
    return bcvb;
  }

  private async assertDauMoi(donViId: number) {
    const donVi = await this.prisma.donVi.findUnique({ where: { id: donViId } });
    if (!donVi || !donVi.laDauMoi) {
      throw new BadRequestException('Đơn vị này không phải đầu mối, không thể tạo yêu cầu báo cáo văn bản');
    }
  }

  async create(dto: CreateBaoCaoVanBanDto, user: CurrentUserPayload) {
    if (!isSysAdmin(user) && !hasRole(user, 'UNIT_ADMIN')) {
      throw new ForbiddenException('Chỉ quản trị đơn vị hoặc quản trị hệ thống mới được tạo yêu cầu báo cáo văn bản');
    }
    const donViTaoId = dto.donViTaoId ?? user.donViId;
    if (!isSysAdmin(user) && donViTaoId !== user.donViId) {
      throw new ForbiddenException('Không thể tạo yêu cầu thay cho đơn vị khác');
    }
    await this.assertDauMoi(donViTaoId);

    const created = await this.prisma.baoCaoVanBan.create({
      data: {
        ten: dto.ten,
        moTa: dto.moTa,
        donViTaoId,
        cheDo: dto.cheDo,
        hanNop: new Date(dto.hanNop),
        fileYeuCauId: dto.fileYeuCauId,
      },
    });
    await this.nhatKyService.ghiLog({
      nguoiDungId: user.id,
      hanhDong: 'TAO_BAO_CAO_VAN_BAN',
      doiTuong: 'bao_cao_van_ban',
      doiTuongId: created.id,
    });
    return created;
  }

  async update(id: number, dto: UpdateBaoCaoVanBanDto, user: CurrentUserPayload) {
    const bcvb = await this.findOne(id, user);
    if (!isSysAdmin(user) && bcvb.donViTaoId !== user.donViId) {
      throw new ForbiddenException('Không có quyền sửa yêu cầu này');
    }
    return this.prisma.baoCaoVanBan.update({
      where: { id },
      data: {
        ten: dto.ten,
        moTa: dto.moTa,
        cheDo: dto.cheDo,
        hanNop: dto.hanNop ? new Date(dto.hanNop) : undefined,
        fileYeuCauId: dto.fileYeuCauId,
        trangThai: dto.trangThai,
      },
    });
  }

  async giaoDonVi(id: number, dto: GiaoDonViBcvbDto, user: CurrentUserPayload) {
    const bcvb = await this.findOne(id, user);
    if (!isSysAdmin(user) && bcvb.donViTaoId !== user.donViId) {
      throw new ForbiddenException('Không có quyền giao yêu cầu này');
    }

    await this.prisma.baoCaoVanBanDonVi.deleteMany({ where: { baoCaoVanBanId: id } });
    await this.prisma.baoCaoVanBanDonVi.createMany({
      data: dto.donViIds.map((donViId) => ({ baoCaoVanBanId: id, donViId })),
      skipDuplicates: true,
    });

    const existingNop = await this.prisma.baoCaoVanBanNop.findMany({ where: { baoCaoVanBanId: id } });
    const existingDonViIds = new Set(existingNop.map((n) => n.donViId));
    const moiDonViIds = dto.donViIds.filter((d) => !existingDonViIds.has(d));
    if (moiDonViIds.length > 0) {
      await this.prisma.baoCaoVanBanNop.createMany({
        data: moiDonViIds.map((donViId) => ({ baoCaoVanBanId: id, donViId, trangThai: 'CHUA_NOP' as const })),
      });
    }

    await this.thongBaoService.taoChoDonVi({
      donViIds: dto.donViIds,
      loai: 'GIAO_MAU',
      tieuDe: `Yêu cầu báo cáo văn bản: ${bcvb.ten}`,
      noiDung: `Hạn nộp: ${bcvb.hanNop.toLocaleDateString('vi-VN')}`,
      duongDan: `/bao-cao-van-ban-can-nop`,
    });

    return this.findOne(id, user);
  }

  async tongHop(id: number, user: CurrentUserPayload) {
    const bcvb = await this.findOne(id, user);
    const nopList = await this.prisma.baoCaoVanBanNop.findMany({
      where: { baoCaoVanBanId: id },
      include: { donVi: true, nguoiNop: true, tepDinhKem: true },
    });
    const items = nopList.map((n) => ({
      donVi: n.donVi,
      bcvbNopId: n.id,
      trangThai: n.trangThai,
      thoiGianNop: n.thoiGianNop,
      treHan: n.treHan,
      nguoiNop: n.nguoiNop ? { id: n.nguoiNop.id, hoTen: n.nguoiNop.hoTen } : null,
      soFile: n.tepDinhKem.length,
    }));
    const daNop = items.filter((i) => i.trangThai === 'DA_NOP').length;
    return {
      baoCaoVanBan: bcvb,
      items,
      thongKe: { tongDonVi: items.length, daNop, chuaNop: items.length - daNop, tyLe: items.length ? daNop / items.length : 0 },
    };
  }

  async nhacNop(id: number, user: CurrentUserPayload) {
    const { items, baoCaoVanBan } = await this.tongHop(id, user);
    const donViChuaNop = items.filter((i) => i.trangThai === 'CHUA_NOP').map((i) => i.donVi.id);
    if (donViChuaNop.length > 0) {
      await this.thongBaoService.taoChoDonVi({
        donViIds: donViChuaNop,
        loai: 'SAP_DEN_HAN',
        tieuDe: `Nhắc nộp: ${baoCaoVanBan.ten}`,
        noiDung: `Đơn vị chưa nộp báo cáo văn bản "${baoCaoVanBan.ten}", hạn nộp ${baoCaoVanBan.hanNop.toLocaleDateString('vi-VN')}.`,
        duongDan: '/bao-cao-van-ban-can-nop',
      });
    }
    return { message: `Đã gửi nhắc nộp tới ${donViChuaNop.length} đơn vị` };
  }
}
