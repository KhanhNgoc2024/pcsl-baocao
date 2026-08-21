import { Module } from '@nestjs/common';
import { BaoCaoNopService } from './bao-cao-nop.service';
import { BaoCaoNopController } from './bao-cao-nop.controller';
import { ThongBaoModule } from '../thong-bao/thong-bao.module';
import { NhatKyModule } from '../nhat-ky/nhat-ky.module';

@Module({
  imports: [ThongBaoModule, NhatKyModule],
  providers: [BaoCaoNopService],
  controllers: [BaoCaoNopController],
  exports: [BaoCaoNopService],
})
export class BaoCaoNopModule {}
