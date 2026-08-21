import { Module } from '@nestjs/common';
import { DonViService } from './don-vi.service';
import { DonViController } from './don-vi.controller';

@Module({
  providers: [DonViService],
  controllers: [DonViController],
  exports: [DonViService],
})
export class DonViModule {}
