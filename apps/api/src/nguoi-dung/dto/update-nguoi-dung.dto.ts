import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { TrangThaiNguoiDung } from '@prisma/client';
import { CreateNguoiDungDto } from './create-nguoi-dung.dto';

export class UpdateNguoiDungDto extends PartialType(OmitType(CreateNguoiDungDto, ['matKhau'] as const)) {
  @IsOptional()
  @IsEnum(TrangThaiNguoiDung)
  trangThai?: TrangThaiNguoiDung;
}
