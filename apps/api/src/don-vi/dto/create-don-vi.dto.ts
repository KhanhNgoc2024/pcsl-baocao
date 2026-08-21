import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { LoaiDonVi } from '@prisma/client';

export class CreateDonViDto {
  @IsString()
  @MaxLength(20)
  maDonVi: string;

  @IsString()
  @MaxLength(255)
  tenDonVi: string;

  @IsEnum(LoaiDonVi)
  loaiDonVi: LoaiDonVi;

  @IsOptional()
  @IsBoolean()
  laDauMoi?: boolean;

  @IsOptional()
  @IsInt()
  donViChaId?: number;

  @IsOptional()
  @IsInt()
  thuTu?: number;
}
