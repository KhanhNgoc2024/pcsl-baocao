import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from './layout/MainLayout';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { LoginPage } from './pages/login/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { DonViPage } from './pages/quan-tri/DonViPage';
import { NguoiDungPage } from './pages/quan-tri/NguoiDungPage';
import { MauBaoCaoListPage } from './pages/mau-bao-cao/MauBaoCaoListPage';
import { MauBaoCaoDetailPage } from './pages/mau-bao-cao/MauBaoCaoDetailPage';
import { KyBaoCaoDetailPage } from './pages/mau-bao-cao/KyBaoCaoDetailPage';
import { TongHopNamPage } from './pages/mau-bao-cao/TongHopNamPage';
import { BaoCaoCanNopPage } from './pages/bao-cao-can-nop/BaoCaoCanNopPage';
import { BaoCaoVanBanListPage } from './pages/bao-cao-van-ban/BaoCaoVanBanListPage';
import { BaoCaoVanBanCanNopPage } from './pages/bao-cao-van-ban/BaoCaoVanBanCanNopPage';
import { ThongBaoPage } from './pages/thong-bao/ThongBaoPage';
import { TongHopBaoCaoPage } from './pages/tong-hop/TongHopBaoCaoPage';
import { DoiMatKhauPage } from './pages/DoiMatKhauPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '*', element: <DashboardPage /> },
          { path: '/bao-cao-can-nop', element: <BaoCaoCanNopPage /> },
          { path: '/bao-cao-van-ban-can-nop', element: <BaoCaoVanBanCanNopPage /> },
          { path: '/thong-bao', element: <ThongBaoPage /> },
          { path: '/doi-mat-khau', element: <DoiMatKhauPage /> },
          {
            element: <ProtectedRoute roles={['SYS_ADMIN', 'UNIT_ADMIN', 'APPROVER']} />,
            children: [
              { path: '/tong-hop-bao-cao', element: <TongHopBaoCaoPage /> },
              { path: '/mau-bao-cao', element: <MauBaoCaoListPage /> },
              { path: '/mau-bao-cao/:id', element: <MauBaoCaoDetailPage /> },
              { path: '/mau-bao-cao/:id/tong-hop-nam', element: <TongHopNamPage /> },
              { path: '/ky/:kyId', element: <KyBaoCaoDetailPage /> },
              { path: '/bao-cao-van-ban', element: <BaoCaoVanBanListPage /> },
            ],
          },
          {
            element: <ProtectedRoute roles={['SYS_ADMIN']} />,
            children: [{ path: '/quan-tri/don-vi', element: <DonViPage /> }],
          },
          {
            element: <ProtectedRoute roles={['SYS_ADMIN', 'UNIT_ADMIN']} />,
            children: [{ path: '/quan-tri/nguoi-dung', element: <NguoiDungPage /> }],
          },
        ],
      },
    ],
  },
]);
