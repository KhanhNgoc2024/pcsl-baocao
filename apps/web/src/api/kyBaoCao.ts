import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { KyBaoCao, TongHopKy } from './types';

export interface KyBaoCaoVoiThongKe extends KyBaoCao {
  thongKe: { tongDonVi: number; daNop: number; chuaNop: number; tyLe: number };
}

export function useKyList() {
  return useQuery({
    queryKey: ['ky'],
    queryFn: async () => (await api.get<KyBaoCaoVoiThongKe[]>('/ky')).data,
  });
}

export function useKyDetail(kyId: number | undefined) {
  return useQuery({
    queryKey: ['ky', kyId],
    queryFn: async () => (await api.get(`/ky/${kyId}`)).data,
    enabled: !!kyId,
  });
}

export function useTongHopKy(kyId: number | undefined) {
  return useQuery({
    queryKey: ['ky', kyId, 'tong-hop'],
    queryFn: async () => (await api.get<TongHopKy>(`/ky/${kyId}/tong-hop`)).data,
    enabled: !!kyId,
  });
}

export function useNhacNop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (kyId: number) => api.post(`/ky/${kyId}/nhac-nop`),
    onSuccess: (_data, kyId) => qc.invalidateQueries({ queryKey: ['ky', kyId] }),
  });
}

async function taiFile(url: string, tenFile: string) {
  const res = await api.get(url, { responseType: 'blob' });
  const blobUrl = URL.createObjectURL(res.data as Blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = tenFile;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
}

export function taiExcelKy(kyId: number) {
  return taiFile(`/ky/${kyId}/xuat-excel`, `tong-hop-ky-${kyId}.xlsx`);
}

export function taiZipKy(kyId: number) {
  return taiFile(`/ky/${kyId}/tai-zip`, `ky-${kyId}.zip`);
}
