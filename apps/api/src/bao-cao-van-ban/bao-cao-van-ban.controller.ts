import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { BaoCaoVanBanService } from './bao-cao-van-ban.service';
import { BaoCaoVanBanNopService } from './bao-cao-van-ban-nop.service';
import { CreateBaoCaoVanBanDto } from './dto/create-bao-cao-van-ban.dto';
import { UpdateBaoCaoVanBanDto } from './dto/update-bao-cao-van-ban.dto';
import { GiaoDonViBcvbDto } from './dto/giao-don-vi.dto';
import { ExportService } from '../export/export.service';

@Controller()
export class BaoCaoVanBanController {
  constructor(
    private readonly baoCaoVanBanService: BaoCaoVanBanService,
    private readonly baoCaoVanBanNopService: BaoCaoVanBanNopService,
    private readonly exportService: ExportService,
  ) {}

  @Get('bao-cao-van-ban-can-nop')
  vanBanCanNop(@CurrentUser() user: CurrentUserPayload) {
    return this.baoCaoVanBanNopService.vanBanCanNop(user);
  }

  @Get('bao-cao-van-ban-nop/:id')
  findOneNop(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    return this.baoCaoVanBanNopService.findOne(id, user);
  }

  @Post('bao-cao-van-ban-nop/:id/nop')
  nop(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    return this.baoCaoVanBanNopService.nop(id, user);
  }

  @Get('bao-cao-van-ban')
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.baoCaoVanBanService.findAll(user);
  }

  @Get('bao-cao-van-ban/:id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    return this.baoCaoVanBanService.findOne(id, user);
  }

  @Post('bao-cao-van-ban')
  @Roles('SYS_ADMIN', 'UNIT_ADMIN')
  create(@Body() dto: CreateBaoCaoVanBanDto, @CurrentUser() user: CurrentUserPayload) {
    return this.baoCaoVanBanService.create(dto, user);
  }

  @Put('bao-cao-van-ban/:id')
  @Roles('SYS_ADMIN', 'UNIT_ADMIN')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBaoCaoVanBanDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.baoCaoVanBanService.update(id, dto, user);
  }

  @Post('bao-cao-van-ban/:id/giao-don-vi')
  @Roles('SYS_ADMIN', 'UNIT_ADMIN')
  giaoDonVi(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: GiaoDonViBcvbDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.baoCaoVanBanService.giaoDonVi(id, dto, user);
  }

  @Get('bao-cao-van-ban/:id/tong-hop')
  @Roles('SYS_ADMIN', 'UNIT_ADMIN', 'APPROVER')
  tongHop(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    return this.baoCaoVanBanService.tongHop(id, user);
  }

  @Post('bao-cao-van-ban/:id/nhac-nop')
  @Roles('SYS_ADMIN', 'UNIT_ADMIN')
  nhacNop(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload) {
    return this.baoCaoVanBanService.nhacNop(id, user);
  }

  @Get('bao-cao-van-ban/:id/xuat-excel')
  @Roles('SYS_ADMIN', 'UNIT_ADMIN', 'APPROVER')
  async xuatExcel(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload, @Res() res: Response) {
    await this.baoCaoVanBanService.findOne(id, user);
    const buffer = await this.exportService.taoExcelVanBan(id);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="bao-cao-van-ban-${id}.xlsx"`);
    res.send(buffer);
  }

  @Get('bao-cao-van-ban/:id/tai-zip')
  @Roles('SYS_ADMIN', 'UNIT_ADMIN', 'APPROVER')
  async taiZip(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: CurrentUserPayload, @Res() res: Response) {
    await this.baoCaoVanBanService.findOne(id, user);
    await this.exportService.taiZipVanBan(id, res);
  }
}
