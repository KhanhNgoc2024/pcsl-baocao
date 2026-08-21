import { IsDateString, IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { CheDoBaoCaoVanBan } from '@prisma/client';

export class CreateBaoCaoVanBanDto {
  @IsString()
  @MaxLength(255)
  ten: string;

  @IsOptional()
  @IsString()
  moTa?: string;

  @IsOptional()
  @IsInt()
  donViTaoId?: number;

  @IsEnum(CheDoBaoCaoVanBan)
  cheDo: CheDoBaoCaoVanBan;

  @IsDateString()
  hanNop: string;

  @IsOptional()
  @IsInt()
  fileYeuCauId?: number;
}
