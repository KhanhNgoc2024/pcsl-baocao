import { Module } from '@nestjs/common';
import { NhatKyService } from './nhat-ky.service';
import { NhatKyController } from './nhat-ky.controller';

@Module({
  providers: [NhatKyService],
  controllers: [NhatKyController],
  exports: [NhatKyService],
})
export class NhatKyModule {}
