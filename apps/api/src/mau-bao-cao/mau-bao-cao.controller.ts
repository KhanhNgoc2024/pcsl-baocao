import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, DefaultValuePipe } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { MauBaoCaoService } from './mau-bao-cao.service';
import { CreateMauBaoCaoDto } from './dto/create-mau-bao-cao.dto';
import { UpdateMauBaoCaoDto } from './dto/update-mau-bao-cao.dto';
import { GiaoDonViDto } from './dto/giao-don-vi.dto';
import { MoKyDto } from './dto/mo-ky.dto';

@Controller('mau-bao-cao')
export class MauBaoCaoController {
  constructor(private readonly mauBaoCaoService: MauBaoCaoService) {}

  @Get()
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.mauBaoCaoService.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    return this.mauBaoCaoService.findOne(id, user);
  }

  @Post()
  @Roles('SYS_ADMIN', 'UNIT_ADMIN')
  create(@Body() dto: CreateMauBaoCaoDto, @CurrentUser() user: CurrentUserPayload) {
    return this.mauBaoCaoService.create(dto, user);
  }

  @Put(':id')
  @Roles('SYS_ADMIN', 'UNIT_ADMIN')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMauBaoCaoDto, @CurrentUser() user: CurrentUserPayload) {
    return this.mauBaoCaoService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles('SYS_ADMIN', 'UNIT_ADMIN')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    return this.mauBaoCaoService.remove(id, user);
  }

  @Post(':id/nhan-ban')
  @Roles('SYS_ADMIN', 'UNIT_ADMIN')
  nhanBan(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    return this.mauBaoCaoService.nhanBan(id, user);
  }

  @Post(':id/giao-don-vi')
  @Roles('SYS_ADMIN', 'UNIT_ADMIN')
  giaoDonVi(@Param('id', ParseIntPipe) id: number, @Body() dto: GiaoDonViDto, @CurrentUser() user: CurrentUserPayload) {
    return this.mauBaoCaoService.giaoDonVi(id, dto, user);
  }

  @Post(':id/mo-ky')
  @Roles('SYS_ADMIN', 'UNIT_ADMIN')
  moKy(@Param('id', ParseIntPipe) id: number, @Body() dto: MoKyDto, @CurrentUser() user: CurrentUserPayload) {
    return this.mauBaoCaoService.moKy(id, dto, user);
  }

  @Get(':id/ky')
  listKy(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    return this.mauBaoCaoService.listKy(id, user);
  }

  @Get(':id/tong-hop-nam')
  @Roles('SYS_ADMIN', 'UNIT_ADMIN', 'APPROVER')
  tongHopNam(
    @Param('id', ParseIntPipe) id: number,
    @Query('nam', new DefaultValuePipe(new Date().getFullYear()), ParseIntPipe) nam: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.mauBaoCaoService.tongHopNam(id, nam, user);
  }
}
