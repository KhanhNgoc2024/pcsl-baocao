import { Module } from '@nestjs/common';
import { MauBaoCaoService } from './mau-bao-cao.service';
import { MauBaoCaoController } from './mau-bao-cao.controller';
import { ThongBaoModule } from '../thong-bao/thong-bao.module';
import { NhatKyModule } from '../nhat-ky/nhat-ky.module';

@Module({
  imports: [ThongBaoModule, NhatKyModule],
  providers: [MauBaoCaoService],
  controllers: [MauBaoCaoController],
  exports: [MauBaoCaoService],
})
export class MauBaoCaoModule {}
