import { Module } from '@nestjs/common';
import { ThongBaoService } from './thong-bao.service';
import { ThongBaoController } from './thong-bao.controller';

@Module({
  providers: [ThongBaoService],
  controllers: [ThongBaoController],
  exports: [ThongBaoService],
})
export class ThongBaoModule {}
