import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { ChuKy } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ThongBaoService } from '../thong-bao/thong-bao.service';
import { NhatKyService } from '../nhat-ky/nhat-ky.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { isSysAdmin, isDauMoiRole, mauBaoCaoScopeWhere, hasRole, TRANG_THAI_DA_DEN_HUB } from '../common/scope/scope.util';
import { kyHienTai, tenKyMacDinh, tinhHanNop, tinhKhoangKy, QuyTacHan } from '../common/ky-time.util';
import { layDanhSachTruongSo, tinhTongGiaTriTruongSo } from '../common/truong-so.util';
import { CreateMauBaoCaoDto } from './dto/create-mau-bao-cao.dto';
import { UpdateMauBaoCaoDto } from './dto/update-mau-bao-cao.dto';
import { GiaoDonViDto } from './dto/giao-don-vi.dto';
import { MoKyDto } from './dto/mo-ky.dto';

@Injectable()
export class MauBaoCaoService {
  constructor(
    private prisma: PrismaService,
    private thongBaoService: ThongBaoService,
    private nhatKyService: NhatKyService,
  ) {}

  async findAll(user: CurrentUserPayload) {
    return this.prisma.mauBaoCao.findMany({
      where: mauBaoCaoScopeWhere(user),
      include: { donViTao: true, donViGiao: { include: { donVi: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, user: CurrentUserPayload) {
    const mau = await this.prisma.mauBaoCao.findFirst({
      where: { id, ...mauBaoCaoScopeWhere(user) },
      include: { donViTao: true, donViGiao: { include: { donVi: true } }, fileMau: true },
    });
    if (!mau) throw new NotFoundException('Không tìm thấy mẫu báo cáo');
    return mau;
  }

  private async assertDauMoi(donViId: number) {
    const donVi = await this.prisma.donVi.findUnique({ where: { id: donViId } });
    if (!donVi || !donVi.laDauMoi) {
      throw new BadRequestException('Đơn vị này không phải đầu mối, không thể tạo mẫu báo cáo');
    }
  }

  async create(dto: CreateMauBaoCaoDto, user: CurrentUserPayload) {
    if (!isSysAdmin(user) && !hasRole(user, 'UNIT_ADMIN')) {
      throw new ForbiddenException('Chỉ quản trị đơn vị hoặc quản trị hệ thống mới được tạo mẫu báo cáo');
    }
    const donViTaoId = dto.donViTaoId ?? user.donViId;
    if (!isSysAdmin(user) && donViTaoId !== user.donViId) {
      throw new ForbiddenException('Không thể tạo mẫu báo cáo thay cho đơn vị khác');
    }
    await this.assertDauMoi(donViTaoId);

    const created = await this.prisma.mauBaoCao.create({
      data: {
        ma: dto.ma,
        ten: dto.ten,
        moTa: dto.moTa,
        donViTaoId,
        chuKy: dto.chuKy,
        loaiNhap: dto.loaiNhap,
        cauHinhBieuMau: dto.cauHinhBieuMau as any,
        fileMauId: dto.fileMauId,
        quyTacHan: dto.quyTacHan as any,
        canDuyet: dto.canDuyet ?? false,
        tuDongSinhKy: dto.tuDongSinhKy ?? true,
      },
    });
    await this.nhatKyService.ghiLog({
      nguoiDungId: user.id,
      hanhDong: 'TAO_MAU_BAO_CAO',
      doiTuong: 'mau_bao_cao',
      doiTuongId: created.id,
    });
    return created;
  }

  async update(id: number, dto: UpdateMauBaoCaoDto, user: CurrentUserPayload) {
    const mau = await this.findOne(id, user);
    if (!isSysAdmin(user) && mau.donViTaoId !== user.donViId) {
      throw new ForbiddenException('Không có quyền sửa mẫu báo cáo này');
    }
    const updated = await this.prisma.mauBaoCao.update({
      where: { id },
      data: {
        ma: dto.ma,
        ten: dto.ten,
        moTa: dto.moTa,
        chuKy: dto.chuKy,
        loaiNhap: dto.loaiNhap,
        cauHinhBieuMau: dto.cauHinhBieuMau as any,
        fileMauId: dto.fileMauId,
        quyTacHan: dto.quyTacHan as any,
        canDuyet: dto.canDuyet,
        tuDongSinhKy: dto.tuDongSinhKy,
        trangThai: dto.trangThai,
      },
    });
    await this.nhatKyService.ghiLog({
      nguoiDungId: user.id,
      hanhDong: 'SUA_MAU_BAO_CAO',
      doiTuong: 'mau_bao_cao',
      doiTuongId: id,
    });
    return updated;
  }

  async remove(id: number, user: CurrentUserPayload) {
    const mau = await this.findOne(id, user);
    if (!isSysAdmin(user) && mau.donViTaoId !== user.donViId) {
      throw new ForbiddenException('Không có quyền xoá mẫu báo cáo này');
    }
    const soKy = await this.prisma.kyBaoCao.count({ where: { mauBaoCaoId: id } });
    if (soKy > 0) {
      throw new ConflictException(
        'Không thể xoá vì mẫu báo cáo đã có kỳ báo cáo được tạo. Hãy đặt trạng thái "Ngừng hoạt động" thay vì xoá để giữ lại dữ liệu đã nộp.',
      );
    }
    await this.prisma.mauBaoCao.delete({ where: { id } });
    await this.nhatKyService.ghiLog({
      nguoiDungId: user.id,
      hanhDong: 'XOA_MAU_BAO_CAO',
      doiTuong: 'mau_bao_cao',
      doiTuongId: id,
    });
    return { thanhCong: true };
  }

  async nhanBan(id: number, user: CurrentUserPayload) {
    const mau = await this.findOne(id, user);
    if (!isSysAdmin(user) && mau.donViTaoId !== user.donViId) {
      throw new ForbiddenException('Không có quyền nhân bản mẫu báo cáo này');
    }
    return this.prisma.mauBaoCao.create({
      data: {
        ma: `${mau.ma}-COPY`,
        ten: `${mau.ten} (bản sao)`,
        moTa: mau.moTa,
        donViTaoId: mau.donViTaoId,
        chuKy: mau.chuKy,
        loaiNhap: mau.loaiNhap,
        cauHinhBieuMau: mau.cauHinhBieuMau as any,
        fileMauId: mau.fileMauId,
        quyTacHan: mau.quyTacHan as any,
        canDuyet: mau.canDuyet,
        tuDongSinhKy: mau.tuDongSinhKy,
      },
    });
  }

  async giaoDonVi(id: number, dto: GiaoDonViDto, user: CurrentUserPayload) {
    const mau = await this.findOne(id, user);
    if (!isSysAdmin(user) && mau.donViTaoId !== user.donViId) {
      throw new ForbiddenException('Không có quyền giao mẫu báo cáo này');
    }
    await this.prisma.mauBaoCaoDonVi.deleteMany({ where: { mauBaoCaoId: id } });
    await this.prisma.mauBaoCaoDonVi.createMany({
      data: dto.donViIds.map((donViId) => ({ mauBaoCaoId: id, donViId })),
      skipDuplicates: true,
    });
    await this.thongBaoService.taoChoDonVi({
      donViIds: dto.donViIds,
      loai: 'GIAO_MAU',
      tieuDe: `Mẫu báo cáo mới: ${mau.ten}`,
      noiDung: `Đơn vị của bạn được giao nộp mẫu báo cáo "${mau.ten}".`,
      duongDan: `/bao-cao-can-nop`,
    });
    return this.findOne(id, user);
  }

  async listKy(id: number, user: CurrentUserPayload) {
    await this.findOne(id, user);
    return this.prisma.kyBaoCao.findMany({
      where: { mauBaoCaoId: id },
      orderBy: [{ nam: 'desc' }, { kySo: 'desc' }],
    });
  }

  /** Tổng hợp theo năm: tỷ lệ nộp từng kỳ + số liệu từng kỳ (tháng/quý) trong năm dùng để vẽ biểu đồ, kèm tổng cộng cả năm (cộng dồn các kỳ). */
  async tongHopNam(id: number, nam: number, user: CurrentUserPayload) {
    const mau = await this.findOne(id, user);

    const kyList = await this.prisma.kyBaoCao.findMany({
      where: { mauBaoCaoId: id, nam },
      include: { baoCaoNop: { select: { trangThai: true, duLieu: true } } },
      orderBy: { kySo: 'asc' },
    });

    // Trường số để so sánh trên biểu đồ: trường kiểu "so", nhãn con kiểu "so" trong "nhom", và cột "tong" trong bảng.
    const truongList: any[] = (mau.cauHinhBieuMau as any)?.truong ?? [];
    const truongSo = layDanhSachTruongSo(truongList);

    const kyThongKe = kyList.map((ky) => {
      const tongDonVi = ky.baoCaoNop.length;
      const daNop = ky.baoCaoNop.filter((b) => TRANG_THAI_DA_DEN_HUB.includes(b.trangThai)).length;
      const giaTri = tinhTongGiaTriTruongSo(truongSo, ky.baoCaoNop);
      return {
        kyId: ky.id,
        kySo: ky.kySo,
        tenKy: ky.tenKy,
        hanNop: ky.hanNop,
        tongDonVi,
        daNop,
        chuaNop: tongDonVi - daNop,
        tyLe: tongDonVi ? daNop / tongDonVi : 0,
        giaTri,
      };
    });

    // Tổng hợp cả năm: cộng dồn số liệu của tất cả các kỳ (tháng/quý) đã tính ở trên — hiển thị ở phần riêng, tách biệt với bảng so sánh từng kỳ.
    const tongCongCaNam: Record<string, number> = {};
    for (const t of truongSo) {
      tongCongCaNam[t.ma] = kyThongKe.reduce((sum, k) => sum + (k.giaTri[t.ma] ?? 0), 0);
    }

    return { mauBaoCao: mau, nam, truongSo, kyThongKe, tongCongCaNam };
  }

  /** Tạo 1 kỳ báo cáo (dùng chung cho mở kỳ thủ công và cron tự động sinh kỳ). */
  private async taoKyBaoCao(
    mau: { id: number; ten: string; chuKy: ChuKy; quyTacHan: unknown; donViGiao: { donViId: number }[] },
    nam: number,
    kySo: number,
    nguoiDungId: number | null,
    hanhDong: string,
  ) {
    const { ngayBatDau, ngayKetThuc } = tinhKhoangKy(mau.chuKy, nam, kySo);
    const hanNop = tinhHanNop(mau.quyTacHan as unknown as QuyTacHan, ngayBatDau, ngayKetThuc);

    const ky = await this.prisma.kyBaoCao.create({
      data: {
        mauBaoCaoId: mau.id,
        nam,
        kySo,
        tenKy: tenKyMacDinh(mau.chuKy, nam, kySo),
        ngayBatDau,
        ngayKetThuc,
        hanNop,
        trangThai: 'DANG_MO',
      },
    });

    await this.prisma.baoCaoNop.createMany({
      data: mau.donViGiao.map((g) => ({
        kyBaoCaoId: ky.id,
        donViId: g.donViId,
        trangThai: 'CHUA_NOP' as const,
      })),
    });

    await this.thongBaoService.taoChoDonVi({
      donViIds: mau.donViGiao.map((g) => g.donViId),
      loai: 'MO_KY',
      tieuDe: `Kỳ báo cáo mới mở: ${ky.tenKy} — ${mau.ten}`,
      noiDung: `Hạn nộp: ${hanNop.toLocaleDateString('vi-VN')}`,
      duongDan: `/bao-cao-can-nop`,
    });

    await this.nhatKyService.ghiLog({
      nguoiDungId,
      hanhDong,
      doiTuong: 'ky_bao_cao',
      doiTuongId: ky.id,
    });

    return ky;
  }

  /** Mở kỳ thủ công: tạo ky_bao_cao + pre-create bao_cao_nop CHUA_NOP cho từng đơn vị được giao + gửi thông báo. */
  async moKy(id: number, dto: MoKyDto, user: CurrentUserPayload) {
    const mau = await this.prisma.mauBaoCao.findUnique({
      where: { id },
      include: { donViGiao: true },
    });
    if (!mau) throw new NotFoundException('Không tìm thấy mẫu báo cáo');
    if (!isSysAdmin(user) && mau.donViTaoId !== user.donViId) {
      throw new ForbiddenException('Không có quyền mở kỳ cho mẫu báo cáo này');
    }
    if (mau.donViGiao.length === 0) {
      throw new BadRequestException('Mẫu báo cáo chưa được giao cho đơn vị nào');
    }

    const macDinh = kyHienTai(mau.chuKy);
    const nam = dto.nam ?? macDinh.nam;
    const kySo = dto.kySo ?? macDinh.kySo;

    const existed = await this.prisma.kyBaoCao.findUnique({
      where: { mauBaoCaoId_nam_kySo: { mauBaoCaoId: id, nam, kySo } },
    });
    if (existed) throw new BadRequestException('Kỳ này đã được mở trước đó');

    return this.taoKyBaoCao(mau, nam, kySo, user.id, 'MO_KY');
  }

  /** Cron: với mỗi mẫu tu_dong_sinh_ky=true, sinh kỳ hiện tại nếu chưa có và kỳ đã bắt đầu. */
  async sinhKyTuDongChoTatCa(): Promise<{ mauId: number; ky: string }[]> {
    const mauList = await this.prisma.mauBaoCao.findMany({
      where: { tuDongSinhKy: true, trangThai: 'HOAT_DONG' },
      include: { donViGiao: true },
    });
    const now = new Date();
    const daSinh: { mauId: number; ky: string }[] = [];

    for (const mau of mauList) {
      if (mau.donViGiao.length === 0) continue;
      const { nam, kySo } = kyHienTai(mau.chuKy, now);
      const existed = await this.prisma.kyBaoCao.findUnique({
        where: { mauBaoCaoId_nam_kySo: { mauBaoCaoId: mau.id, nam, kySo } },
      });
      if (existed) continue;
      const { ngayBatDau } = tinhKhoangKy(mau.chuKy, nam, kySo);
      if (now < ngayBatDau) continue;

      const ky = await this.taoKyBaoCao(mau, nam, kySo, null, 'SINH_KY_TU_DONG');
      daSinh.push({ mauId: mau.id, ky: ky.tenKy });
    }
    return daSinh;
  }
}
