import { IsIn, IsOptional, IsString } from 'class-validator';

export class DuyetDto {
  @IsIn(['DA_DUYET', 'TRA_LAI'])
  ketQua: 'DA_DUYET' | 'TRA_LAI';

  @IsOptional()
  @IsString()
  ghiChu?: string;
}
