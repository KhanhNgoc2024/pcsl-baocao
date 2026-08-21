import { Card, Form, Input, Button, Typography, App } from 'antd';
import { useDoiMatKhau } from '../api/nguoiDung';

export function DoiMatKhauPage() {
  const [form] = Form.useForm();
  const doiMatKhau = useDoiMatKhau();
  const { message } = App.useApp();

  const onSubmit = async () => {
    const values = await form.validateFields();
    try {
      await doiMatKhau.mutateAsync({ matKhauCu: values.matKhauCu, matKhauMoi: values.matKhauMoi });
      message.success('Đổi mật khẩu thành công');
      form.resetFields();
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? 'Có lỗi xảy ra');
    }
  };

  return (
    <div>
      <Typography.Title level={4}>Đổi mật khẩu</Typography.Title>
      <Card style={{ maxWidth: 420 }}>
        <Form form={form} layout="vertical" onFinish={onSubmit}>
          <Form.Item name="matKhauCu" label="Mật khẩu hiện tại" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="matKhauMoi" label="Mật khẩu mới" rules={[{ required: true, min: 6, message: 'Tối thiểu 6 ký tự' }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="xacNhan"
            label="Xác nhận mật khẩu mới"
            dependencies={['matKhauMoi']}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('matKhauMoi') === value) return Promise.resolve();
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={doiMatKhau.isPending}>
            Đổi mật khẩu
          </Button>
        </Form>
      </Card>
    </div>
  );
}
