import { Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { ThongBaoService } from './thong-bao.service';

@Controller('thong-bao')
export class ThongBaoController {
  constructor(private readonly thongBaoService: ThongBaoService) {}

  @Get()
  list(@CurrentUser() user: CurrentUserPayload, @Query('page') page = '1', @Query('pageSize') pageSize = '20') {
    return this.thongBaoService.list(user.id, Number(page), Number(pageSize));
  }

  @Post(':id/da-doc')
  danhDauDaDoc(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    return this.thongBaoService.danhDauDaDoc(id, user.id);
  }

  @Post('da-doc-tat-ca')
  danhDauTatCaDaDoc(@CurrentUser() user: CurrentUserPayload) {
    return this.thongBaoService.danhDauTatCaDaDoc(user.id);
  }
}
