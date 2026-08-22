import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export interface ThongKeDuLieuTest {
  mauBaoCao: number;
  kyBaoCao: number;
  baoCaoNop: number;
  baoCaoVanBan: number;
  baoCaoVanBanNop: number;
  tepDinhKem: number;
  thongBao: number;
  nhatKy: number;
}

export function useThongKeDuLieuTest() {
  return useQuery({
    queryKey: ['he-thong', 'thong-ke-du-lieu-test'],
    queryFn: async () => (await api.get<ThongKeDuLieuTest>('/he-thong/thong-ke-du-lieu-test')).data,
  });
}

export function useXoaDuLieuTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () =>
      (await api.post<{ thanhCong: boolean; daXoa: ThongKeDuLieuTest }>('/he-thong/xoa-du-lieu-test')).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['he-thong', 'thong-ke-du-lieu-test'] }),
  });
}
