import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuthModule } from './auth/auth.module';
import { DonViModule } from './don-vi/don-vi.module';
import { NguoiDungModule } from './nguoi-dung/nguoi-dung.module';
import { VaiTroModule } from './vai-tro/vai-tro.module';
import { NhatKyModule } from './nhat-ky/nhat-ky.module';
import { TepModule } from './tep/tep.module';
import { ThongBaoModule } from './thong-bao/thong-bao.module';
import { MauBaoCaoModule } from './mau-bao-cao/mau-bao-cao.module';
import { KyBaoCaoModule } from './ky-bao-cao/ky-bao-cao.module';
import { BaoCaoNopModule } from './bao-cao-nop/bao-cao-nop.module';
import { BaoCaoVanBanModule } from './bao-cao-van-ban/bao-cao-van-ban.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { ExportModule } from './export/export.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    DonViModule,
    NguoiDungModule,
    VaiTroModule,
    NhatKyModule,
    TepModule,
    ThongBaoModule,
    MauBaoCaoModule,
    KyBaoCaoModule,
    BaoCaoNopModule,
    BaoCaoVanBanModule,
    SchedulerModule,
    ExportModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
