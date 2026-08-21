import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { BaoCaoNopService } from './bao-cao-nop.service';
import { LuuNhapDto } from './dto/luu-nhap.dto';
import { DuyetDto } from './dto/duyet.dto';
import { DuyetDonViDto } from './dto/duyet-don-vi.dto';

@Controller()
export class BaoCaoNopController {
  constructor(private readonly baoCaoNopService: BaoCaoNopService) {}

  @Get('bao-cao-can-nop')
  baoCaoCanNop(@CurrentUser() user: CurrentUserPayload) {
    return this.baoCaoNopService.baoCaoCanNop(user);
  }

  @Get('bao-cao-nop/:id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    return this.baoCaoNopService.findOne(id, user);
  }

  @Post('bao-cao-nop')
  luuNhap(@Body() dto: LuuNhapDto, @CurrentUser() user: CurrentUserPayload) {
    return this.baoCaoNopService.luuNhap(dto, user);
  }

  @Post('bao-cao-nop/:id/nop')
  nop(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    return this.baoCaoNopService.nop(id, user);
  }

  @Post('bao-cao-nop/:id/duyet')
  @Roles('SYS_ADMIN', 'UNIT_ADMIN', 'APPROVER')
  duyet(@Param('id', ParseIntPipe) id: number, @Body() dto: DuyetDto, @CurrentUser() user: CurrentUserPayload) {
    return this.baoCaoNopService.duyet(id, dto.ketQua, dto.ghiChu, user);
  }

  @Post('bao-cao-nop/:id/duyet-don-vi')
  @Roles('SYS_ADMIN', 'UNIT_ADMIN', 'APPROVER')
  duyetDonVi(@Param('id', ParseIntPipe) id: number, @Body() dto: DuyetDonViDto, @CurrentUser() user: CurrentUserPayload) {
    return this.baoCaoNopService.duyetDonVi(id, dto.ketQua, dto.ghiChu, user);
  }
}
