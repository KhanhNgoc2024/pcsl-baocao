import { IsBoolean, IsEnum, IsInt, IsObject, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { ChuKy, LoaiNhap } from '@prisma/client';
import type { QuyTacHan } from '../../common/ky-time.util';

export class CreateMauBaoCaoDto {
  @IsString()
  @MaxLength(50)
  ma: string;

  @IsString()
  @MaxLength(255)
  ten: string;

  @IsOptional()
  @IsString()
  moTa?: string;

  @IsOptional()
  @IsInt()
  donViTaoId?: number;

  @IsEnum(ChuKy)
  chuKy: ChuKy;

  @IsEnum(LoaiNhap)
  loaiNhap: LoaiNhap;

  @ValidateIf((o) => o.loaiNhap === 'BIEU_MAU' || o.loaiNhap === 'CA_HAI')
  @IsObject()
  cauHinhBieuMau?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  fileMauId?: number;

  @IsObject()
  quyTacHan: QuyTacHan;

  @IsOptional()
  @IsBoolean()
  canDuyet?: boolean;

  @IsOptional()
  @IsBoolean()
  tuDongSinhKy?: boolean;
}
