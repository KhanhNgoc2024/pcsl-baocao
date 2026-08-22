import { useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Badge, Dropdown, Avatar, Space, Typography } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  FileDoneOutlined,
  BellOutlined,
  TeamOutlined,
  ApartmentOutlined,
  LogoutOutlined,
  UserOutlined,
  BarChartOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore, coVaiTro } from '../auth/store';
import { api } from '../api/client';
import logoFull from '../assets/logo-full.png';

const { Header, Sider, Content } = Layout;

export function MainLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const { data: soChuaDoc } = useQuery({
    queryKey: ['thong-bao', 'so-chua-doc'],
    queryFn: async () => (await api.get('/thong-bao', { params: { pageSize: 1 } })).data.soChuaDoc as number,
    refetchInterval: 30000,
  });

  const laDauMoi = coVaiTro(user, 'UNIT_ADMIN', 'APPROVER', 'SYS_ADMIN');
  const laSysAdmin = coVaiTro(user, 'SYS_ADMIN');
  const laUnitAdmin = coVaiTro(user, 'UNIT_ADMIN');

  const menuItems = useMemo(() => {
    const items: any[] = [
      { key: '/', icon: <DashboardOutlined />, label: <Link to="/">Bảng điều khiển</Link> },
      {
        key: 'danh-sach-bao-cao',
        icon: <FileTextOutlined />,
        label: 'Danh sách báo cáo',
        children: [
          { key: '/bao-cao-can-nop', label: <Link to="/bao-cao-can-nop">Báo cáo cần nộp</Link> },
          ...(laDauMoi ? [{ key: '/mau-bao-cao', label: <Link to="/mau-bao-cao">Quản lý mẫu báo cáo</Link> }] : []),
          { key: '/tong-hop-bao-cao', icon: <BarChartOutlined />, label: <Link to="/tong-hop-bao-cao">Tổng hợp báo cáo</Link> },
        ],
      },
      {
        key: 'bao-cao-van-ban',
        icon: <FileDoneOutlined />,
        label: 'Báo cáo bằng văn bản',
        children: [
          { key: '/bao-cao-van-ban-can-nop', label: <Link to="/bao-cao-van-ban-can-nop">Cần nộp</Link> },
          ...(laDauMoi ? [{ key: '/bao-cao-van-ban', label: <Link to="/bao-cao-van-ban">Quản lý yêu cầu</Link> }] : []),
          {
            key: '/tong-hop-bao-cao-van-ban',
            icon: <BarChartOutlined />,
            label: <Link to="/tong-hop-bao-cao-van-ban">Tổng hợp báo cáo</Link>,
          },
        ],
      },
      { key: '/thong-bao', icon: <BellOutlined />, label: <Link to="/thong-bao">Thông báo</Link> },
    ];
    if (laSysAdmin || laUnitAdmin) {
      items.push({
        key: 'quan-tri',
        icon: <TeamOutlined />,
        label: 'Quản trị',
        children: [
          ...(laSysAdmin
            ? [{ key: '/quan-tri/don-vi', icon: <ApartmentOutlined />, label: <Link to="/quan-tri/don-vi">Đơn vị</Link> }]
            : []),
          { key: '/quan-tri/nguoi-dung', icon: <UserOutlined />, label: <Link to="/quan-tri/nguoi-dung">Người dùng</Link> },
          ...(laSysAdmin
            ? [
                {
                  key: '/quan-tri/xoa-du-lieu-test',
                  icon: <DeleteOutlined />,
                  label: <Link to="/quan-tri/xoa-du-lieu-test">Xoá dữ liệu test</Link>,
                },
              ]
            : []),
        ],
      });
    }
    return items;
  }, [laDauMoi, laSysAdmin, laUnitAdmin]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} breakpoint="lg" collapsedWidth={80} width={240}>
        <div
          style={{
            background: '#fff',
            textAlign: 'center',
            padding: collapsed ? 8 : 16,
            overflow: 'hidden',
          }}
        >
          <img
            src={logoFull}
            alt="EVNNPC PC Sơn La"
            style={
              collapsed
                ? { width: 48, height: 48, objectFit: 'cover', objectPosition: 'top center' }
                : { maxWidth: '100%', height: 96, objectFit: 'contain' }
            }
          />
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['danh-sach-bao-cao', 'bao-cao-van-ban', 'quan-tri']}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header className="app-header" style={{ background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24 }}>
          <Typography.Title level={4} className="app-header-title" style={{ margin: 0, color: '#1a4d95' }}>
            Portal PCSL
          </Typography.Title>
          <Space size={24} align="center">
          <Link to="/thong-bao">
            <Badge count={soChuaDoc ?? 0} size="small">
              <BellOutlined style={{ fontSize: 20 }} />
            </Badge>
          </Link>
          <Dropdown
            menu={{
              items: [
                { key: 'doi-mat-khau', label: <Link to="/doi-mat-khau">Đổi mật khẩu</Link> },
                {
                  key: 'logout',
                  label: 'Đăng xuất',
                  icon: <LogoutOutlined />,
                  onClick: () => {
                    logout();
                    navigate('/login');
                  },
                },
              ],
            }}
          >
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} />
              <Typography.Text className="app-header-username">{user?.hoTen}</Typography.Text>
            </Space>
          </Dropdown>
          </Space>
        </Header>
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
