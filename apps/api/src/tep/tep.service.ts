import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { isSysAdmin, isDauMoiRole } from '../common/scope/scope.util';
import { LoaiLienKet } from './dto/upload-tep.dto';

const EXT_MIME: Record<string, string[]> = {
  pdf: ['application/pdf'],
  docx: ['application/zip'], // docx = zip container, file-type reports 'application/zip' or 'application/vnd.openxmlformats-officedocument...'
  doc: ['application/x-cfb', 'application/msword'], // doc = OLE Compound File
};

@Injectable()
export class TepService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  private uploadDir(): string {
    return join(process.cwd(), this.config.get<string>('UPLOAD_DIR') ?? './uploads');
  }

  async upload(
    file: Express.Multer.File,
    loaiLienKet: LoaiLienKet,
    lienKetId: number | undefined,
    user: CurrentUserPayload,
  ) {
    const fullPath = join(this.uploadDir(), file.filename);
    try {
      await this.validateMagicBytes(fullPath, file.originalname);

      if (loaiLienKet === 'bao_cao_nop') {
        if (!lienKetId) throw new BadRequestException('Thiếu lienKetId cho bao_cao_nop');
        const baoCaoNop = await this.prisma.baoCaoNop.findUnique({ where: { id: lienKetId } });
        if (!baoCaoNop) throw new NotFoundException('Không tìm thấy bản nộp');
        if (!isSysAdmin(user) && baoCaoNop.donViId !== user.donViId) {
          throw new ForbiddenException('Không có quyền tải file lên bản nộp này');
        }
        return this.createRecord(file, fullPath, user.id, { baoCaoNopId: lienKetId });
      }

      if (loaiLienKet === 'bcvb_nop') {
        if (!lienKetId) throw new BadRequestException('Thiếu lienKetId cho bcvb_nop');
        const bcvbNop = await this.prisma.baoCaoVanBanNop.findUnique({ where: { id: lienKetId } });
        if (!bcvbNop) throw new NotFoundException('Không tìm thấy bản nộp');
        if (!isSysAdmin(user) && bcvbNop.donViId !== user.donViId) {
          throw new ForbiddenException('Không có quyền tải file lên bản nộp này');
        }
        return this.createRecord(file, fullPath, user.id, { bcvbNopId: lienKetId });
      }

      // file_mau / file_yeu_cau: file mẫu trống đính kèm mẫu báo cáo hoặc yêu cầu văn bản — chỉ đầu mối/SYS_ADMIN mới tạo được
      if (!isSysAdmin(user) && !isDauMoiRole(user)) {
        throw new ForbiddenException('Không có quyền tải lên file mẫu/hướng dẫn');
      }
      return this.createRecord(file, fullPath, user.id, {});
    } catch (err) {
      await unlink(fullPath).catch(() => undefined);
      throw err;
    }
  }

  private async createRecord(
    file: Express.Multer.File,
    fullPath: string,
    nguoiTaiLenId: number,
    lienKet: { baoCaoNopId?: number; bcvbNopId?: number },
  ) {
    const ext = file.originalname.split('.').pop()!.toLowerCase() as 'doc' | 'docx' | 'pdf';
    return this.prisma.tepDinhKem.create({
      data: {
        tenGoc: file.originalname,
        duongDanLuu: file.filename,
        loaiFile: ext,
        kichThuoc: BigInt(file.size),
        nguoiTaiLenId,
        ...lienKet,
      },
    });
  }

  private async validateMagicBytes(fullPath: string, originalName: string): Promise<void> {
    const ext = originalName.split('.').pop()?.toLowerCase();
    if (!ext || !EXT_MIME[ext]) {
      throw new BadRequestException('Chỉ chấp nhận file .doc, .docx, .pdf');
    }
    const { fileTypeFromFile } = await import('file-type');
    const detected = await fileTypeFromFile(fullPath);

    if (ext === 'pdf') {
      if (!detected || detected.ext !== 'pdf') {
        throw new BadRequestException('Nội dung file không khớp với định dạng PDF');
      }
      return;
    }
    if (ext === 'docx') {
      if (!detected || (detected.ext !== 'docx' && detected.ext !== 'zip')) {
        throw new BadRequestException('Nội dung file không khớp với định dạng DOCX');
      }
      return;
    }
    // .doc (OLE Compound File) — file-type nhận diện là 'cfb'
    if (!detected || detected.ext !== 'cfb') {
      throw new BadRequestException('Nội dung file không khớp với định dạng DOC');
    }
  }

  async findWithScopeCheck(id: number, user: CurrentUserPayload) {
    const tep = await this.prisma.tepDinhKem.findUnique({
      where: { id },
      include: {
        baoCaoNop: { include: { kyBaoCao: { include: { mauBaoCao: true } } } },
        bcvbNop: { include: { baoCaoVanBan: true } },
      },
    });
    if (!tep) throw new NotFoundException('Không tìm thấy file');

    if (tep.baoCaoNop) {
      const donViTaoId = tep.baoCaoNop.kyBaoCao.mauBaoCao.donViTaoId;
      const ownDonViId = tep.baoCaoNop.donViId;
      const allowed =
        isSysAdmin(user) || (isDauMoiRole(user) && user.donViId === donViTaoId) || user.donViId === ownDonViId;
      if (!allowed) throw new ForbiddenException('Không có quyền tải file này');
    } else if (tep.bcvbNop) {
      const donViTaoId = tep.bcvbNop.baoCaoVanBan.donViTaoId;
      const ownDonViId = tep.bcvbNop.donViId;
      const allowed =
        isSysAdmin(user) || (isDauMoiRole(user) && user.donViId === donViTaoId) || user.donViId === ownDonViId;
      if (!allowed) throw new ForbiddenException('Không có quyền tải file này');
    }
    // file_mau / file_yeu_cau (không gắn baoCaoNop/bcvbNop): mọi người dùng đã đăng nhập đều có thể tải (file mẫu/hướng dẫn dùng chung)

    return { ...tep, fullPath: join(this.uploadDir(), tep.duongDanLuu) };
  }
}
