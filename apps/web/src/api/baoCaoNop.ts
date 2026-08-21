import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { BaoCaoNop } from './types';

export function useBaoCaoCanNop() {
  return useQuery({
    queryKey: ['bao-cao-can-nop'],
    queryFn: async () => (await api.get<BaoCaoNop[]>('/bao-cao-can-nop')).data,
  });
}

export function useBaoCaoNopDetail(id: number | undefined) {
  return useQuery({
    queryKey: ['bao-cao-nop', id],
    queryFn: async () => (await api.get<BaoCaoNop>(`/bao-cao-nop/${id}`)).data,
    enabled: !!id,
  });
}

export function useLuuNhap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { kyBaoCaoId: number; duLieu?: Record<string, unknown> }) => api.post<BaoCaoNop>('/bao-cao-nop', dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bao-cao-can-nop'] });
      qc.invalidateQueries({ queryKey: ['bao-cao-nop'] });
    },
  });
}

export function useNopBaoCao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post(`/bao-cao-nop/${id}/nop`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bao-cao-can-nop'] });
      qc.invalidateQueries({ queryKey: ['bao-cao-nop'] });
    },
  });
}

export function useDuyetBaoCao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ketQua, ghiChu }: { id: number; ketQua: 'DA_DUYET' | 'TRA_LAI'; ghiChu?: string }) =>
      api.post(`/bao-cao-nop/${id}/duyet`, { ketQua, ghiChu }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ky'] }),
  });
}

export function useDuyetDonVi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ketQua, ghiChu }: { id: number; ketQua: 'DA_NOP' | 'TRA_LAI'; ghiChu?: string }) =>
      api.post(`/bao-cao-nop/${id}/duyet-don-vi`, { ketQua, ghiChu }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bao-cao-can-nop'] });
      qc.invalidateQueries({ queryKey: ['bao-cao-nop'] });
      qc.invalidateQueries({ queryKey: ['ky'] });
    },
  });
}
