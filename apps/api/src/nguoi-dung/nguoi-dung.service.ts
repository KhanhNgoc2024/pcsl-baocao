import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { MaVaiTro } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { isSysAdmin } from '../common/scope/scope.util';
import { CreateNguoiDungDto } from './dto/create-nguoi-dung.dto';
import { UpdateNguoiDungDto } from './dto/update-nguoi-dung.dto';

const SELECT_SAFE = {
  id: true,
  tenDangNhap: true,
  hoTen: true,
  email: true,
  donViId: true,
  trangThai: true,
  donVi: true,
  vaiTro: { include: { vaiTro: true } },
  createdAt: true,
} as const;

/** Quản trị đơn vị (UNIT_ADMIN) chỉ được tạo/sửa các tài khoản nghiệp vụ trong đơn vị mình, không được cấp quyền quản trị. */
const VAI_TRO_UNIT_ADMIN_DUOC_GAN: MaVaiTro[] = ['REPORTER', 'APPROVER', 'VIEWER'];
const VAI_TRO_QUAN_TRI: MaVaiTro[] = ['SYS_ADMIN', 'UNIT_ADMIN'];

@Injectable()
export class NguoiDungService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: CurrentUserPayload) {
    const users = await this.prisma.nguoiDung.findMany({
      where: isSysAdmin(user) ? {} : { donViId: user.donViId },
      select: SELECT_SAFE,
      orderBy: { hoTen: 'asc' },
    });
    return users.map(this.serialize);
  }

  async findOne(id: number, user?: CurrentUserPayload) {
    const nguoiDung = await this.prisma.nguoiDung.findUnique({ where: { id }, select: SELECT_SAFE });
    if (!nguoiDung) throw new NotFoundException('Không tìm thấy người dùng');
    if (user && !isSysAdmin(user) && nguoiDung.donViId !== user.donViId) {
      throw new ForbiddenException('Không có quyền truy cập người dùng này');
    }
    return this.serialize(nguoiDung);
  }

  private serialize(user: any) {
    return { ...user, vaiTro: user.vaiTro.map((v: any) => v.vaiTro.ma) };
  }

  private assertVaiTroDuocPhepGan(vaiTro: MaVaiTro[], user: CurrentUserPayload) {
    if (isSysAdmin(user)) return;
    const viPham = vaiTro.some((v) => !VAI_TRO_UNIT_ADMIN_DUOC_GAN.includes(v));
    if (viPham) {
      throw new ForbiddenException(
        'Quản trị đơn vị chỉ được gán vai trò: Người nhập báo cáo, Người duyệt, Người xem báo cáo',
      );
    }
  }

  async create(dto: CreateNguoiDungDto, user: CurrentUserPayload) {
    if (!isSysAdmin(user)) {
      if (dto.donViId !== user.donViId) {
        throw new ForbiddenException('Chỉ được tạo tài khoản trong đơn vị của mình');
      }
      this.assertVaiTroDuocPhepGan(dto.vaiTro, user);
    }

    const existing = await this.prisma.nguoiDung.findUnique({ where: { tenDangNhap: dto.tenDangNhap } });
    if (existing) throw new ConflictException('Tên đăng nhập đã tồn tại');

    const vaiTroRecords = await this.prisma.vaiTro.findMany({ where: { ma: { in: dto.vaiTro } } });
    if (vaiTroRecords.length !== dto.vaiTro.length) {
      throw new BadRequestException('Vai trò không hợp lệ');
    }

    const matKhauHash = await bcrypt.hash(dto.matKhau, 10);
    const created = await this.prisma.nguoiDung.create({
      data: {
        tenDangNhap: dto.tenDangNhap,
        matKhauHash,
        hoTen: dto.hoTen,
        email: dto.email,
        donViId: dto.donViId,
        vaiTro: { create: vaiTroRecords.map((vt) => ({ vaiTroId: vt.id })) },
      },
      select: SELECT_SAFE,
    });
    return this.serialize(created);
  }

  async update(id: number, dto: UpdateNguoiDungDto, user: CurrentUserPayload) {
    const hienTai = await this.findOne(id, user);

    if (!isSysAdmin(user)) {
      if (dto.donViId !== undefined && dto.donViId !== user.donViId) {
        throw new ForbiddenException('Không thể chuyển tài khoản sang đơn vị khác');
      }
      if ((hienTai.vaiTro as MaVaiTro[]).some((v) => VAI_TRO_QUAN_TRI.includes(v))) {
        throw new ForbiddenException('Không có quyền sửa tài khoản quản trị');
      }
      if (dto.vaiTro) this.assertVaiTroDuocPhepGan(dto.vaiTro, user);
    }

    const { vaiTro, ...rest } = dto;

    if (vaiTro) {
      const vaiTroRecords = await this.prisma.vaiTro.findMany({ where: { ma: { in: vaiTro } } });
      if (vaiTroRecords.length !== vaiTro.length) {
        throw new BadRequestException('Vai trò không hợp lệ');
      }
      await this.prisma.nguoiDungVaiTro.deleteMany({ where: { nguoiDungId: id } });
      await this.prisma.nguoiDungVaiTro.createMany({
        data: vaiTroRecords.map((vt) => ({ nguoiDungId: id, vaiTroId: vt.id })),
      });
    }

    const updated = await this.prisma.nguoiDung.update({
      where: { id },
      data: rest,
      select: SELECT_SAFE,
    });
    return this.serialize(updated);
  }

  async remove(id: number, user: CurrentUserPayload) {
    const hienTai = await this.findOne(id, user);
    if (!isSysAdmin(user) && (hienTai.vaiTro as MaVaiTro[]).some((v) => VAI_TRO_QUAN_TRI.includes(v))) {
      throw new ForbiddenException('Không có quyền xoá tài khoản quản trị');
    }
    return this.prisma.nguoiDung.update({ where: { id }, data: { trangThai: 'NGUNG' } });
  }

  async resetMatKhau(id: number, matKhauMoi: string, user: CurrentUserPayload) {
    const hienTai = await this.findOne(id, user);
    if (!isSysAdmin(user) && (hienTai.vaiTro as MaVaiTro[]).some((v) => VAI_TRO_QUAN_TRI.includes(v))) {
      throw new ForbiddenException('Không có quyền đặt lại mật khẩu tài khoản quản trị');
    }
    const matKhauHash = await bcrypt.hash(matKhauMoi, 10);
    await this.prisma.nguoiDung.update({ where: { id }, data: { matKhauHash, refreshTokenHash: null } });
    return { message: 'Đặt lại mật khẩu thành công' };
  }

  async doiMatKhau(id: number, matKhauCu: string, matKhauMoi: string) {
    const user = await this.prisma.nguoiDung.findUniqueOrThrow({ where: { id } });
    const isMatch = await bcrypt.compare(matKhauCu, user.matKhauHash);
    if (!isMatch) throw new BadRequestException('Mật khẩu cũ không đúng');
    const matKhauHash = await bcrypt.hash(matKhauMoi, 10);
    await this.prisma.nguoiDung.update({ where: { id }, data: { matKhauHash } });
    return { message: 'Đổi mật khẩu thành công' };
  }
}
