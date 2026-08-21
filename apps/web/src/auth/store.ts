import { create } from 'zustand';
import { api, getAccessToken, setTokens } from '../api/client';
import type { NguoiDung } from '../api/types';

interface AuthState {
  user: NguoiDung | null;
  daNap: boolean;
  login: (tenDangNhap: string, matKhau: string) => Promise<void>;
  logout: () => void;
  napLai: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  daNap: false,
  login: async (tenDangNhap, matKhau) => {
    const res = await api.post('/auth/login', { tenDangNhap, matKhau });
    setTokens(res.data);
    set({ user: res.data.user, daNap: true });
  },
  logout: () => {
    setTokens(null);
    set({ user: null, daNap: true });
  },
  napLai: async () => {
    if (!getAccessToken()) {
      set({ daNap: true });
      return;
    }
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data, daNap: true });
    } catch {
      setTokens(null);
      set({ user: null, daNap: true });
    }
  },
}));

export function coVaiTro(user: NguoiDung | null, ...roles: string[]): boolean {
  if (!user) return false;
  return roles.some((r) => user.vaiTro.includes(r as any));
}
