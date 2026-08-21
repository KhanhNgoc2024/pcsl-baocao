import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { TrangThaiMauBaoCao } from '@prisma/client';
import { CreateMauBaoCaoDto } from './create-mau-bao-cao.dto';

export class UpdateMauBaoCaoDto extends PartialType(OmitType(CreateMauBaoCaoDto, ['donViTaoId'] as const)) {
  @IsOptional()
  @IsEnum(TrangThaiMauBaoCao)
  trangThai?: TrangThaiMauBaoCao;
}
