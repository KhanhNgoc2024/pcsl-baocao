import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { ThongBao } from './types';

export function useThongBaoList(page: number, pageSize = 20) {
  return useQuery({
    queryKey: ['thong-bao', 'list', page, pageSize],
    queryFn: async () =>
      (await api.get<{ items: ThongBao[]; total: number; page: number; pageSize: number; soChuaDoc: number }>('/thong-bao', {
        params: { page, pageSize },
      })).data,
  });
}

export function useDanhDauDaDoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post(`/thong-bao/${id}/da-doc`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['thong-bao'] }),
  });
}

export function useDanhDauTatCaDaDoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/thong-bao/da-doc-tat-ca'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['thong-bao'] }),
  });
}
