import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { TrangThaiDonVi } from '@prisma/client';
import { CreateDonViDto } from './create-don-vi.dto';

export class UpdateDonViDto extends PartialType(CreateDonViDto) {
  @IsOptional()
  @IsEnum(TrangThaiDonVi)
  trangThai?: TrangThaiDonVi;
}
