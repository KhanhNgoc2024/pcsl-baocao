import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class MoKyDto {
  @IsOptional()
  @IsInt()
  nam?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  kySo?: number;
}
