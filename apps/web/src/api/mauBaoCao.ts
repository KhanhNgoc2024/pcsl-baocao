import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { CauHinhBieuMau, ChuKy, KyBaoCao, LoaiNhap, MauBaoCao, QuyTacHan } from './types';

export function useMauBaoCaoList() {
  return useQuery({
    queryKey: ['mau-bao-cao'],
    queryFn: async () => (await api.get<MauBaoCao[]>('/mau-bao-cao')).data,
  });
}

export function useMauBaoCaoDetail(id: number | undefined) {
  return useQuery({
    queryKey: ['mau-bao-cao', id],
    queryFn: async () => (await api.get<MauBaoCao>(`/mau-bao-cao/${id}`)).data,
    enabled: !!id,
  });
}

export function useKyList(mauId: number | undefined) {
  return useQuery({
    queryKey: ['mau-bao-cao', mauId, 'ky'],
    queryFn: async () => (await api.get<KyBaoCao[]>(`/mau-bao-cao/${mauId}/ky`)).data,
    enabled: !!mauId,
  });
}

export interface KyThongKeNam {
  kyId: number;
  kySo: number;
  tenKy: string;
  hanNop: string;
  tongDonVi: number;
  daNop: number;
  chuaNop: number;
  tyLe: number;
  giaTri: Record<string, number>;
}

export interface TongHopNam {
  mauBaoCao: MauBaoCao;
  nam: number;
  truongSo: { ma: string; nhan: string }[];
  kyThongKe: KyThongKeNam[];
}

export function useTongHopNam(mauId: number | undefined, nam: number) {
  return useQuery({
    queryKey: ['mau-bao-cao', mauId, 'tong-hop-nam', nam],
    queryFn: async () => (await api.get<TongHopNam>(`/mau-bao-cao/${mauId}/tong-hop-nam`, { params: { nam } })).data,
    enabled: !!mauId,
  });
}

export interface MauBaoCaoInput {
  ma: string;
  ten: string;
  moTa?: string;
  chuKy: ChuKy;
  loaiNhap: LoaiNhap;
  cauHinhBieuMau?: CauHinhBieuMau;
  fileMauId?: number;
  quyTacHan: QuyTacHan;
  canDuyet?: boolean;
  tuDongSinhKy?: boolean;
}

export function useTaoMauBaoCao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: MauBaoCaoInput) => api.post<MauBaoCao>('/mau-bao-cao', dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mau-bao-cao'] }),
  });
}

export function useSuaMauBaoCao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Partial<MauBaoCaoInput> & { trangThai?: string } }) =>
      api.put(`/mau-bao-cao/${id}`, dto),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['mau-bao-cao'] });
      qc.invalidateQueries({ queryKey: ['mau-bao-cao', vars.id] });
    },
  });
}

export function useXoaMauBaoCao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/mau-bao-cao/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mau-bao-cao'] }),
  });
}

export function useNhanBanMauBaoCao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.post(`/mau-bao-cao/${id}/nhan-ban`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mau-bao-cao'] }),
  });
}

export function useGiaoDonVi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, donViIds }: { id: number; donViIds: number[] }) =>
      api.post(`/mau-bao-cao/${id}/giao-don-vi`, { donViIds }),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['mau-bao-cao', vars.id] }),
  });
}

export function useMoKy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, nam, kySo }: { id: number; nam?: number; kySo?: number }) =>
      api.post(`/mau-bao-cao/${id}/mo-ky`, { nam, kySo }),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['mau-bao-cao', vars.id, 'ky'] }),
  });
}
