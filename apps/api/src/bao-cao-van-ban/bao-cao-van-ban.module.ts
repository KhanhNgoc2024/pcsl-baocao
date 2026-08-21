import { Module } from '@nestjs/common';
import { BaoCaoVanBanService } from './bao-cao-van-ban.service';
import { BaoCaoVanBanNopService } from './bao-cao-van-ban-nop.service';
import { BaoCaoVanBanController } from './bao-cao-van-ban.controller';
import { ThongBaoModule } from '../thong-bao/thong-bao.module';
import { NhatKyModule } from '../nhat-ky/nhat-ky.module';
import { ExportModule } from '../export/export.module';

@Module({
  imports: [ThongBaoModule, NhatKyModule, ExportModule],
  providers: [BaoCaoVanBanService, BaoCaoVanBanNopService],
  controllers: [BaoCaoVanBanController],
  exports: [BaoCaoVanBanService, BaoCaoVanBanNopService],
})
export class BaoCaoVanBanModule {}
