import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ThongBaoService } from '../thong-bao/thong-bao.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { isSysAdmin, kyBaoCaoScopeWhere, TRANG_THAI_DA_DEN_HUB } from '../common/scope/scope.util';
import { layDanhSachTruongSo, tinhTongGiaTriTruongSo } from '../common/truong-so.util';

@Injectable()
export class KyBaoCaoService {
  constructor(
    private prisma: PrismaService,
    private thongBaoService: ThongBaoService,
  ) {}

  /** Danh sách tất cả kỳ báo cáo (thuộc mẫu do đơn vị mình quản lý, hoặc tất cả nếu SYS_ADMIN) kèm thống kê nộp — dùng cho trang "Tổng hợp báo cáo". */
  async listAll(user: CurrentUserPayload) {
    const kyList = await this.prisma.kyBaoCao.findMany({
      where: kyBaoCaoScopeWhere(user),
      include: {
        mauBaoCao: true,
        baoCaoNop: { select: { trangThai: true } },
      },
      orderBy: [{ hanNop: 'desc' }],
    });

    return kyList.map((ky) => {
      const tongDonVi = ky.baoCaoNop.length;
      const daNop = ky.baoCaoNop.filter((b) => TRANG_THAI_DA_DEN_HUB.includes(b.trangThai)).length;
      const { baoCaoNop, ...rest } = ky;
      return {
        ...rest,
        thongKe: { tongDonVi, daNop, chuaNop: tongDonVi - daNop, tyLe: tongDonVi ? daNop / tongDonVi : 0 },
      };
    });
  }

  async findWithScopeCheck(kyId: number, user: CurrentUserPayload) {
    const ky = await this.prisma.kyBaoCao.findUnique({
      where: { id: kyId },
      include: { mauBaoCao: true },
    });
    if (!ky) throw new NotFoundException('Không tìm thấy kỳ báo cáo');
    if (!isSysAdmin(user) && ky.mauBaoCao.donViTaoId !== user.donViId) {
      throw new ForbiddenException('Không có quyền truy cập kỳ báo cáo này');
    }
    return ky;
  }

  async tongHop(kyId: number, user: CurrentUserPayload) {
    const ky = await this.findWithScopeCheck(kyId, user);
    const donViGiao = await this.prisma.mauBaoCaoDonVi.findMany({
      where: { mauBaoCaoId: ky.mauBaoCaoId },
      include: { donVi: true },
    });
    const baoCaoNop = await this.prisma.baoCaoNop.findMany({
      where: { kyBaoCaoId: kyId },
      include: { nguoiNop: true, tepDinhKem: true },
    });
    const nopMap = new Map(baoCaoNop.map((b) => [b.donViId, b]));

    const items = donViGiao.map((g) => {
      const nop = nopMap.get(g.donViId);
      return {
        donVi: g.donVi,
        baoCaoNopId: nop?.id ?? null,
        trangThai: nop?.trangThai ?? 'CHUA_NOP',
        thoiGianNop: nop?.thoiGianNop ?? null,
        treHan: nop?.treHan ?? false,
        nguoiNop: nop?.nguoiNop ? { id: nop.nguoiNop.id, hoTen: nop.nguoiNop.hoTen } : null,
        soFile: nop?.tepDinhKem?.length ?? 0,
      };
    });

    const daNop = items.filter((i) => TRANG_THAI_DA_DEN_HUB.includes(i.trangThai)).length;
    return {
      ky,
      items,
      thongKe: { tongDonVi: items.length, daNop, chuaNop: items.length - daNop, tyLe: items.length ? daNop / items.length : 0 },
    };
  }

  /** So sánh số liệu (trường kiểu "so", nhãn con "nhom", cột tổng "bang") của kỳ này với kỳ liền trước cùng mẫu báo cáo — hiển thị ở phần riêng, tách biệt với bảng tổng hợp theo đơn vị. */
  async soSanh(kyId: number, user: CurrentUserPayload) {
    const ky = await this.findWithScopeCheck(kyId, user);
    const truongList: any[] = (ky.mauBaoCao.cauHinhBieuMau as any)?.truong ?? [];
    const truongSo = layDanhSachTruongSo(truongList);

    const kyTruoc = await this.prisma.kyBaoCao.findFirst({
      where: {
        mauBaoCaoId: ky.mauBaoCaoId,
        OR: [
          { nam: ky.nam, kySo: { lt: ky.kySo } },
          { nam: { lt: ky.nam } },
        ],
      },
      orderBy: [{ nam: 'desc' }, { kySo: 'desc' }],
    });

    const layGiaTriTheoKy = async (id: number) => {
      const baoCaoNop = await this.prisma.baoCaoNop.findMany({ where: { kyBaoCaoId: id }, select: { duLieu: true } });
      return tinhTongGiaTriTruongSo(truongSo, baoCaoNop);
    };

    const giaTriHienTai = await layGiaTriTheoKy(ky.id);
    const giaTriTruoc = kyTruoc ? await layGiaTriTheoKy(kyTruoc.id) : null;

    const soSanh = truongSo.map((t) => {
      const hienTai = giaTriHienTai[t.ma] ?? 0;
      const truoc = giaTriTruoc ? (giaTriTruoc[t.ma] ?? 0) : null;
      const chenhLech = truoc !== null ? hienTai - truoc : null;
      const phanTram = truoc !== null && truoc !== 0 ? (chenhLech! / truoc) * 100 : null;
      return { ma: t.ma, nhan: t.nhan, hienTai, truoc, chenhLech, phanTram };
    });

    return {
      kyHienTai: { id: ky.id, tenKy: ky.tenKy, nam: ky.nam, kySo: ky.kySo },
      kyTruoc: kyTruoc ? { id: kyTruoc.id, tenKy: kyTruoc.tenKy, nam: kyTruoc.nam, kySo: kyTruoc.kySo } : null,
      soSanh,
    };
  }

  async nhacNop(kyId: number, user: CurrentUserPayload) {
    const { items, ky } = await this.tongHop(kyId, user);
    const donViChuaNop = items.filter((i) => i.trangThai === 'CHUA_NOP' || i.trangThai === 'NHAP').map((i) => i.donVi.id);
    if (donViChuaNop.length > 0) {
      await this.thongBaoService.taoChoDonVi({
        donViIds: donViChuaNop,
        loai: 'SAP_DEN_HAN',
        tieuDe: `Nhắc nộp: ${ky.tenKy}`,
        noiDung: `Đơn vị chưa nộp báo cáo cho kỳ "${ky.tenKy}", hạn nộp ${ky.hanNop.toLocaleDateString('vi-VN')}.`,
        duongDan: '/bao-cao-can-nop',
      });
    }
    return { message: `Đã gửi nhắc nộp tới ${donViChuaNop.length} đơn vị` };
  }
}
