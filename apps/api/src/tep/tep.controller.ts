import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { createReadStream } from 'fs';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { TepService } from './tep.service';
import { UploadTepDto } from './dto/upload-tep.dto';

@Controller('tep')
export class TepController {
  constructor(private readonly tepService: TepService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadTepDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (!file) throw new BadRequestException('Thiếu file tải lên');
    const lienKetId = dto.lienKetId ? Number(dto.lienKetId) : undefined;
    return this.tepService.upload(file, dto.loaiLienKet, lienKetId, user);
  }

  @Get(':id/tai-xuong')
  async taiXuong(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
    @Res() res: Response,
  ) {
    const tep = await this.tepService.findWithScopeCheck(id, user);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(tep.tenGoc)}`);
    createReadStream(tep.fullPath).pipe(res);
  }
}
