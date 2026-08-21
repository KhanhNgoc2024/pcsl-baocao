import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { NhatKyService } from '../nhat-ky/nhat-ky.service';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private nhatKyService: NhatKyService,
  ) {}

  private async signTokens(payload: JwtPayload) {
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN') ?? '15m',
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN') ?? '7d',
    });
    return { accessToken, refreshToken };
  }

  async login(tenDangNhap: string, matKhau: string, ipAddress?: string) {
    const user = await this.prisma.nguoiDung.findUnique({
      where: { tenDangNhap },
      include: { vaiTro: { include: { vaiTro: true } } },
    });
    if (!user || user.trangThai !== 'HOAT_DONG') {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không đúng');
    }
    const isMatch = await bcrypt.compare(matKhau, user.matKhauHash);
    if (!isMatch) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không đúng');
    }

    const payload: JwtPayload = {
      sub: user.id,
      tenDangNhap: user.tenDangNhap,
      donViId: user.donViId,
      vaiTro: user.vaiTro.map((v) => v.vaiTro.ma),
    };
    const tokens = await this.signTokens(payload);
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.prisma.nguoiDung.update({
      where: { id: user.id },
      data: { refreshTokenHash },
    });

    await this.nhatKyService.ghiLog({
      nguoiDungId: user.id,
      hanhDong: 'DANG_NHAP',
      doiTuong: 'nguoi_dung',
      doiTuongId: user.id,
      ipAddress,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        tenDangNhap: user.tenDangNhap,
        hoTen: user.hoTen,
        email: user.email,
        donViId: user.donViId,
        vaiTro: payload.vaiTro,
      },
    };
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    const user = await this.prisma.nguoiDung.findUnique({
      where: { id: payload.sub },
      include: { vaiTro: { include: { vaiTro: true } } },
    });
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }
    const isMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isMatch) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    const newPayload: JwtPayload = {
      sub: user.id,
      tenDangNhap: user.tenDangNhap,
      donViId: user.donViId,
      vaiTro: user.vaiTro.map((v) => v.vaiTro.ma),
    };
    const tokens = await this.signTokens(newPayload);
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.prisma.nguoiDung.update({
      where: { id: user.id },
      data: { refreshTokenHash },
    });
    return tokens;
  }

  async me(userId: number) {
    const user = await this.prisma.nguoiDung.findUniqueOrThrow({
      where: { id: userId },
      include: { vaiTro: { include: { vaiTro: true } }, donVi: true },
    });
    return {
      id: user.id,
      tenDangNhap: user.tenDangNhap,
      hoTen: user.hoTen,
      email: user.email,
      donViId: user.donViId,
      donVi: user.donVi,
      vaiTro: user.vaiTro.map((v) => v.vaiTro.ma),
    };
  }
}
