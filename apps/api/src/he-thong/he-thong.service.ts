import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';

@Injectable()
export class HeThongService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  private uploadDir(): string {
    return join(process.cwd(), this.config.get<string>('UPLOAD_DIR') ?? './uploads');
  }

  /** Đếm số bản ghi từng loại sẽ bị xoá nếu chạy xoaDuLieuTest — dùng để cảnh báo trước khi người dùng xác nhận. */
  async thongKeDuLieuTest() {
    const [mauBaoCao, kyBaoCao, baoCaoNop, baoCaoVanBan, baoCaoVanBanNop, tepDinhKem, thongBao, nhatKy] = await Promise.all([
      this.prisma.mauBaoCao.count(),
      this.prisma.kyBaoCao.count(),
      this.prisma.baoCaoNop.count(),
      this.prisma.baoCaoVanBan.count(),
      this.prisma.baoCaoVanBanNop.count(),
      this.prisma.tepDinhKem.count(),
      this.prisma.thongBao.count(),
      this.prisma.nhatKy.count(),
    ]);
    return { mauBaoCao, kyBaoCao, baoCaoNop, baoCaoVanBan, baoCaoVanBanNop, tepDinhKem, thongBao, nhatKy };
  }

  /**
   * Xoá toàn bộ dữ liệu nghiệp vụ (mẫu báo cáo, kỳ, bản nộp, báo cáo văn bản, file đính kèm, thông báo, nhật ký) —
   * CHỈ giữ lại Đơn vị, Người dùng và Vai trò. Thứ tự xoá tuân theo ràng buộc khoá ngoại: bản nộp trước kỳ/yêu cầu,
   * kỳ trước mẫu báo cáo, rồi mới tới file đính kèm còn sót lại (file mẫu/file yêu cầu không cascade tự động).
   */
  async xoaDuLieuTest(user: CurrentUserPayload) {
    const truoc = await this.thongKeDuLieuTest();
    const tepList = await this.prisma.tepDinhKem.findMany({ select: { duongDanLuu: true } });

    await this.prisma.$transaction([
      this.prisma.thongBao.deleteMany(),
      this.prisma.nhatKy.deleteMany(),
      this.prisma.baoCaoNop.deleteMany(),
      this.prisma.baoCaoVanBanNop.deleteMany(),
      this.prisma.kyBaoCao.deleteMany(),
      this.prisma.baoCaoVanBan.deleteMany(),
      this.prisma.mauBaoCao.deleteMany(),
      this.prisma.tepDinhKem.deleteMany(),
    ]);

    await Promise.all(tepList.map((t) => unlink(join(this.uploadDir(), t.duongDanLuu)).catch(() => undefined)));

    // Ghi lại 1 dòng nhật ký duy nhất sau khi xoá xong, để còn dấu vết ai đã thực hiện thao tác này và khi nào.
    await this.prisma.nhatKy.create({
      data: { nguoiDungId: user.id, hanhDong: 'XOA_DU_LIEU_TEST', chiTiet: truoc as any },
    });

    return { thanhCong: true, daXoa: truoc };
  }
}
