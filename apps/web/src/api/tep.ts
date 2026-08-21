import { useMutation } from '@tanstack/react-query';
import { api } from './client';
import type { TepDinhKem } from './types';

export type LoaiLienKet = 'bao_cao_nop' | 'bcvb_nop' | 'file_mau' | 'file_yeu_cau';

export function useUploadTep() {
  return useMutation({
    mutationFn: async ({ file, loaiLienKet, lienKetId }: { file: File; loaiLienKet: LoaiLienKet; lienKetId?: number }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('loaiLienKet', loaiLienKet);
      if (lienKetId) formData.append('lienKetId', String(lienKetId));
      const res = await api.post<TepDinhKem>('/tep/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
  });
}

export function useXoaTep() {
  return useMutation({
    mutationFn: (tepId: number) => api.delete(`/tep/${tepId}`),
  });
}

export function duongDanTaiXuong(tepId: number) {
  return `/api/tep/${tepId}/tai-xuong`;
}
