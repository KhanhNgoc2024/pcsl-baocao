import { Controller, Get, Post } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { HeThongService } from './he-thong.service';

@Controller('he-thong')
export class HeThongController {
  constructor(private readonly heThongService: HeThongService) {}

  @Get('thong-ke-du-lieu-test')
  @Roles('SYS_ADMIN')
  thongKeDuLieuTest() {
    return this.heThongService.thongKeDuLieuTest();
  }

  @Post('xoa-du-lieu-test')
  @Roles('SYS_ADMIN')
  xoaDuLieuTest(@CurrentUser() user: CurrentUserPayload) {
    return this.heThongService.xoaDuLieuTest(user);
  }
}
