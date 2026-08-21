import { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../auth/store';

export function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [loi, setLoi] = useState<string | null>(null);
  const [dangDangNhap, setDangDangNhap] = useState(false);

  const onFinish = async (values: { tenDangNhap: string; matKhau: string }) => {
    setLoi(null);
    setDangDangNhap(true);
    try {
      await login(values.tenDangNhap, values.matKhau);
      navigate('/');
    } catch (err: any) {
      setLoi(err?.response?.data?.message ?? 'Đăng nhập thất bại');
    } finally {
      setDangDangNhap(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 380 }}>
        <Typography.Title level={3} style={{ textAlign: 'center' }}>
          Hệ thống Báo cáo PC Sơn La
        </Typography.Title>
        {loi && <Alert type="error" message={loi} style={{ marginBottom: 16 }} showIcon />}
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="tenDangNhap" label="Tên đăng nhập" rules={[{ required: true, message: 'Nhập tên đăng nhập' }]}>
            <Input prefix={<UserOutlined />} autoFocus />
          </Form.Item>
          <Form.Item name="matKhau" label="Mật khẩu" rules={[{ required: true, message: 'Nhập mật khẩu' }]}>
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={dangDangNhap}>
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
