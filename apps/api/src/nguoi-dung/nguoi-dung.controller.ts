import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { NguoiDungService } from './nguoi-dung.service';
import { CreateNguoiDungDto } from './dto/create-nguoi-dung.dto';
import { UpdateNguoiDungDto } from './dto/update-nguoi-dung.dto';
import { DoiMatKhauDto, ResetMatKhauDto } from './dto/reset-mat-khau.dto';

@Controller('nguoi-dung')
export class NguoiDungController {
  constructor(private readonly nguoiDungService: NguoiDungService) {}

  @Get()
  @Roles('SYS_ADMIN', 'UNIT_ADMIN')
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.nguoiDungService.findAll(user);
  }

  @Get(':id')
  @Roles('SYS_ADMIN', 'UNIT_ADMIN')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    return this.nguoiDungService.findOne(id, user);
  }

  @Post()
  @Roles('SYS_ADMIN', 'UNIT_ADMIN')
  create(@Body() dto: CreateNguoiDungDto, @CurrentUser() user: CurrentUserPayload) {
    return this.nguoiDungService.create(dto, user);
  }

  @Put(':id')
  @Roles('SYS_ADMIN', 'UNIT_ADMIN')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateNguoiDungDto, @CurrentUser() user: CurrentUserPayload) {
    return this.nguoiDungService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles('SYS_ADMIN', 'UNIT_ADMIN')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    return this.nguoiDungService.remove(id, user);
  }

  @Post(':id/dat-lai-mat-khau')
  @Roles('SYS_ADMIN', 'UNIT_ADMIN')
  resetMatKhau(@Param('id', ParseIntPipe) id: number, @Body() dto: ResetMatKhauDto, @CurrentUser() user: CurrentUserPayload) {
    return this.nguoiDungService.resetMatKhau(id, dto.matKhauMoi, user);
  }

  @Post('doi-mat-khau')
  doiMatKhau(@CurrentUser() user: CurrentUserPayload, @Body() dto: DoiMatKhauDto) {
    return this.nguoiDungService.doiMatKhau(user.id, dto.matKhauCu, dto.matKhauMoi);
  }
}
