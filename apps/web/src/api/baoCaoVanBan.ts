import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { BaoCaoVanBan, BaoCaoVanBanNop, CheDoBaoCaoVanBan, TongHopVanBan } from './types';

export function useBaoCaoVanBanList() {
  return useQuery({
    queryKey: ['bao-cao-van-ban'],
    queryFn: async () => (await api.get<BaoCaoVanBan[]>('/bao-cao-van-ban')).data,
  });
}

export interface BaoCaoVanBanVoiThongKe extends BaoCaoVanBan {
  thongKe: { tongDonVi: number; daNop: number; chuaNop: number; tyLe: number };
}

export function useTongHopBaoCaoVanBanList() {
  return useQuery({
    queryKey: ['bao-cao-van-ban-tong-hop'],
    queryFn: async () => (await api.get<BaoCaoVanBanVoiThongKe[]>('/bao-cao-van-ban-tong-hop')).data,
  });
}

export function useBaoCaoVanBanDetail(id: number | undefined) {
  return useQuery({
    queryKey: ['bao-cao-van-ban', id],
    queryFn: async () => (await api.get<BaoCaoVanBan>(`/bao-cao-van-ban/${id}`)).data,
    enabled: !!id,
  });
}

export function useTongHopVanBan(id: number | undefined) {
  return useQuery({
    queryKey: ['bao-cao-van-ban', id, 'tong-hop'],
    queryFn: async () => (await api.get<TongHopVanBan>(`/bao-cao-van-ban/${id}/tong-hop`)).data,
    enabled: !!id,
  });
}

export interface BaoCaoVanBanInput {
  ten: string;
  moTa?: string;
  cheDo: CheDoBaoCaoVanBan;
  hanNop: string;
  fileYeuCauId?: number;
}

export function useTaoBaoCaoVanBan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: BaoCaoVanBanInput) => api.post<BaoCaoVanBan>('/bao-cao-van-ban', dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bao-cao-van-ban'] }),
  });
}

export function useSuaBaoCaoVanBan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Partial<BaoCaoVanBanInput> & { trangThai?: string } }) =>
      api.put(`/bao-cao-van-ban/${id}`, dto),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['bao-cao-van-ban'] });
      qc.invalidateQueries({ queryKey: ['bao-cao-van-ban', vars.id] });
    },
  });
}

export function useGiaoDonViVanBan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, donViIds }: { id: number; donViIds: number[] }) =>
      api.post(`/bao-cao-van-ban/${id}/giao-don-vi`, { donViIds }),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['bao-cao-van-ban', vars.id] }),
  });
}

export function useBaoCaoVanBanCanNop() {
  return useQuery({
    queryKey: ['bao-cao-van-ban-can-nop'],
    queryFn: async () => (await api.get<BaoCaoVanBanNop[]>('/bao-cao-van-ban-can-nop')).data,
  });
}

export function useNopVanBan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post(`/bao-cao-van-ban-nop/${id}/nop`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bao-cao-van-ban-can-nop'] }),
  });
}

export function useNhacNopVanBan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post(`/bao-cao-van-ban/${id}/nhac-nop`),
    onSuccess: (_d, id) => qc.invalidateQueries({ queryKey: ['bao-cao-van-ban', id] }),
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

export function taiExcelVanBan(id: number) {
  return taiFile(`/bao-cao-van-ban/${id}/xuat-excel`, `bao-cao-van-ban-${id}.xlsx`);
}

export function taiZipVanBan(id: number) {
  return taiFile(`/bao-cao-van-ban/${id}/tai-zip`, `bao-cao-van-ban-${id}.zip`);
}
