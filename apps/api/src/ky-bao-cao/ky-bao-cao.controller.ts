import { Controller, Get, Param, ParseIntPipe, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { KyBaoCaoService } from './ky-bao-cao.service';
import { ExportService } from '../export/export.service';

@Controller('ky')
export class KyBaoCaoController {
  constructor(
    private readonly kyBaoCaoService: KyBaoCaoService,
    private readonly exportService: ExportService,
  ) {}

  @Get()
  @Roles('SYS_ADMIN', 'UNIT_ADMIN', 'APPROVER')
  listAll(@CurrentUser() user: CurrentUserPayload) {
    return this.kyBaoCaoService.listAll(user);
  }

  @Get(':kyId')
  findOne(@Param('kyId', ParseIntPipe) kyId: number, @CurrentUser() user: CurrentUserPayload) {
    return this.kyBaoCaoService.findWithScopeCheck(kyId, user);
  }

  @Get(':kyId/tong-hop')
  @Roles('SYS_ADMIN', 'UNIT_ADMIN', 'APPROVER')
  tongHop(@Param('kyId', ParseIntPipe) kyId: number, @CurrentUser() user: CurrentUserPayload) {
    return this.kyBaoCaoService.tongHop(kyId, user);
  }

  @Post(':kyId/nhac-nop')
  @Roles('SYS_ADMIN', 'UNIT_ADMIN')
  nhacNop(@Param('kyId', ParseIntPipe) kyId: number, @CurrentUser() user: CurrentUserPayload) {
    return this.kyBaoCaoService.nhacNop(kyId, user);
  }

  @Get(':kyId/xuat-excel')
  @Roles('SYS_ADMIN', 'UNIT_ADMIN', 'APPROVER')
  async xuatExcel(
    @Param('kyId', ParseIntPipe) kyId: number,
    @CurrentUser() user: CurrentUserPayload,
    @Res() res: Response,
  ) {
    await this.kyBaoCaoService.findWithScopeCheck(kyId, user);
    const buffer = await this.exportService.taoExcelKy(kyId);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="tong-hop-ky-${kyId}.xlsx"`);
    res.send(buffer);
  }

  @Get(':kyId/tai-zip')
  @Roles('SYS_ADMIN', 'UNIT_ADMIN', 'APPROVER')
  async taiZip(@Param('kyId', ParseIntPipe) kyId: number, @CurrentUser() user: CurrentUserPayload, @Res() res: Response) {
    await this.kyBaoCaoService.findWithScopeCheck(kyId, user);
    await this.exportService.taiZipKy(kyId, res);
  }
}
