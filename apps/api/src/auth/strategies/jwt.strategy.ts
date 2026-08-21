import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: number;
  tenDangNhap: string;
  donViId: number;
  vaiTro: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET')!,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.nguoiDung.findUnique({
      where: { id: payload.sub },
      include: { vaiTro: { include: { vaiTro: true } } },
    });
    if (!user || user.trangThai !== 'HOAT_DONG') {
      throw new UnauthorizedException('Tài khoản không hợp lệ hoặc đã bị khoá');
    }
    return {
      id: user.id,
      tenDangNhap: user.tenDangNhap,
      hoTen: user.hoTen,
      donViId: user.donViId,
      vaiTro: user.vaiTro.map((v) => v.vaiTro.ma),
    };
  }
}
