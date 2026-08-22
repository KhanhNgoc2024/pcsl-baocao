import { Module } from '@nestjs/common';
import { HeThongService } from './he-thong.service';
import { HeThongController } from './he-thong.controller';

@Module({
  providers: [HeThongService],
  controllers: [HeThongController],
})
export class HeThongModule {}
