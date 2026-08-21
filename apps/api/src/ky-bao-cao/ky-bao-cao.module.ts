import { Module } from '@nestjs/common';
import { KyBaoCaoService } from './ky-bao-cao.service';
import { KyBaoCaoController } from './ky-bao-cao.controller';
import { ThongBaoModule } from '../thong-bao/thong-bao.module';
import { ExportModule } from '../export/export.module';

@Module({
  imports: [ThongBaoModule, ExportModule],
  providers: [KyBaoCaoService],
  controllers: [KyBaoCaoController],
  exports: [KyBaoCaoService],
})
export class KyBaoCaoModule {}
