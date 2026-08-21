import { IsString, MinLength } from 'class-validator';

export class ResetMatKhauDto {
  @IsString()
  @MinLength(6)
  matKhauMoi: string;
}

export class DoiMatKhauDto {
  @IsString()
  matKhauCu: string;

  @IsString()
  @MinLength(6)
  matKhauMoi: string;
}
