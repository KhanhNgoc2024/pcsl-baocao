import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { TrangThaiBaoCaoVanBan } from '@prisma/client';
import { CreateBaoCaoVanBanDto } from './create-bao-cao-van-ban.dto';

export class UpdateBaoCaoVanBanDto extends PartialType(OmitType(CreateBaoCaoVanBanDto, ['donViTaoId'] as const)) {
  @IsOptional()
  @IsEnum(TrangThaiBaoCaoVanBan)
  trangThai?: TrangThaiBaoCaoVanBan;
}
