import { IsIn, IsNumberString, IsOptional } from 'class-validator';

export const LOAI_LIEN_KET = ['bao_cao_nop', 'bcvb_nop', 'file_mau', 'file_yeu_cau'] as const;
export type LoaiLienKet = (typeof LOAI_LIEN_KET)[number];

export class UploadTepDto {
  @IsIn(LOAI_LIEN_KET)
  loaiLienKet: LoaiLienKet;

  @IsOptional()
  @IsNumberString()
  lienKetId?: string;
}
