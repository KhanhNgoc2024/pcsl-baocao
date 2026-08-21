import { Module } from '@nestjs/common';
import { VaiTroService } from './vai-tro.service';
import { VaiTroController } from './vai-tro.controller';

@Module({
  providers: [VaiTroService],
  controllers: [VaiTroController],
  exports: [VaiTroService],
})
export class VaiTroModule {}
