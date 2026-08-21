import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { MaVaiTro, NguoiDung } from './types';

export function useNguoiDungList() {
  return useQuery({
    queryKey: ['nguoi-dung'],
    queryFn: async () => (await api.get<NguoiDung[]>('/nguoi-dung')).data,
  });
}

export function useVaiTroList() {
  return useQuery({
    queryKey: ['vai-tro'],
    queryFn: async () => (await api.get<{ id: number; ma: MaVaiTro; ten: string }[]>('/vai-tro')).data,
  });
}

export interface NguoiDungInput {
  tenDangNhap: string;
  matKhau?: string;
  hoTen: string;
  email?: string;
  donViId: number;
  vaiTro: MaVaiTro[];
}

export function useTaoNguoiDung() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: NguoiDungInput) => api.post('/nguoi-dung', dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nguoi-dung'] }),
  });
}

export function useSuaNguoiDung() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: Partial<Omit<NguoiDungInput, 'matKhau'>> & { trangThai?: string } }) =>
      api.put(`/nguoi-dung/${id}`, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nguoi-dung'] }),
  });
}

export function useXoaNguoiDung() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/nguoi-dung/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nguoi-dung'] }),
  });
}

export function useDatLaiMatKhau() {
  return useMutation({
    mutationFn: ({ id, matKhauMoi }: { id: number; matKhauMoi: string }) =>
      api.post(`/nguoi-dung/${id}/dat-lai-mat-khau`, { matKhauMoi }),
  });
}

export function useDoiMatKhau() {
  return useMutation({
    mutationFn: (dto: { matKhauCu: string; matKhauMoi: string }) => api.post('/nguoi-dung/doi-mat-khau', dto),
  });
}
