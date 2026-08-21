import { IsInt, IsObject, IsOptional } from 'class-validator';

export class LuuNhapDto {
  @IsInt()
  kyBaoCaoId: number;

  @IsOptional()
  @IsObject()
  duLieu?: Record<string, unknown>;
}
