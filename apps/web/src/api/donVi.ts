import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { DonVi } from './types';

export function useDonViList() {
  return useQuery({
    queryKey: ['don-vi'],
    queryFn: async () => (await api.get<DonVi[]>('/don-vi')).data,
  });
}

export interface DonViInput {
  maDonVi: string;
  tenDonVi: string;
  loaiDonVi: DonVi['loaiDonVi'];
  laDauMoi: boolean;
  donViChaId?: number | null;
}

export function useTaoDonVi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: DonViInput) => api.post('/don-vi', dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['don-vi'] }),
  });
}

export function useSuaDonVi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Partial<DonViInput> & { trangThai?: string } }) =>
      api.put(`/don-vi/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['don-vi'] }),
  });
}
