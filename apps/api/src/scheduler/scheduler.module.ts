import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { MailService } from './mail.service';
import { ThongBaoModule } from '../thong-bao/thong-bao.module';
import { MauBaoCaoModule } from '../mau-bao-cao/mau-bao-cao.module';

@Module({
  imports: [ThongBaoModule, MauBaoCaoModule],
  providers: [SchedulerService, MailService],
})
export class SchedulerModule {}
