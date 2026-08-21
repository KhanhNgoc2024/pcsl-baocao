import { IsIn, IsOptional, IsString } from 'class-validator';

export class DuyetDonViDto {
  @IsIn(['DA_NOP', 'TRA_LAI'])
  ketQua: 'DA_NOP' | 'TRA_LAI';

  @IsOptional()
  @IsString()
  ghiChu?: string;
}
