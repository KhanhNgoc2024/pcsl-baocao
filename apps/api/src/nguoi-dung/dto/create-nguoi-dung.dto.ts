import { ArrayMinSize, IsArray, IsEmail, IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { MaVaiTro } from '@prisma/client';

export class CreateNguoiDungDto {
  @IsString()
  @MaxLength(100)
  tenDangNhap: string;

  @IsString()
  @MinLength(6)
  matKhau: string;

  @IsString()
  @MaxLength(255)
  hoTen: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsInt()
  donViId: number;

  @IsArray()
  @ArrayMinSize(1)
  vaiTro: MaVaiTro[];
}
