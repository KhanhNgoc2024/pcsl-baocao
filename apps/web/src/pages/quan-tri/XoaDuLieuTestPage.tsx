import { useState } from 'react';
import { Typography, Card, Alert, Descriptions, Input, Button, App, Space, Result } from 'antd';
import { WarningOutlined, DeleteOutlined } from '@ant-design/icons';
import { useThongKeDuLieuTest, useXoaDuLieuTest } from '../../api/heThong';
import type { ThongKeDuLieuTest } from '../../api/heThong';

const CUM_TU_XAC_NHAN = 'XOA DU LIEU TEST';

const NHAN_MUC: Record<keyof ThongKeDuLieuTest, string> = {
  mauBaoCao: 'Mẫu báo cáo',
  kyBaoCao: 'Kỳ báo cáo',
  baoCaoNop: 'Bản nộp (theo mẫu số liệu)',
  baoCaoVanBan: 'Yêu cầu báo cáo văn bản',
  baoCaoVanBanNop: 'Bản nộp (báo cáo văn bản)',
  tepDinhKem: 'File đính kèm',
  thongBao: 'Thông báo',
  nhatKy: 'Nhật ký thao tác',
};

export function XoaDuLieuTestPage() {
  const { data, isLoading, refetch } = useThongKeDuLieuTest();
  const xoaDuLieuTest = useXoaDuLieuTest();
  const { message, modal } = App.useApp();
  const [xacNhan, setXacNhan] = useState('');
  const [daXoaXong, setDaXoaXong] = useState(false);

  const tongSo = data ? Object.values(data).reduce((a, b) => a + b, 0) : 0;
  const duocPhepXoa = xacNhan.trim() === CUM_TU_XAC_NHAN && tongSo > 0;

  const onXacNhanXoa = () => {
    modal.confirm({
      title: 'Xoá dữ liệu test — không thể hoàn tác',
      icon: <WarningOutlined style={{ color: '#cf1322' }} />,
      content: `Toàn bộ ${tongSo} bản ghi liệt kê bên dưới sẽ bị xoá vĩnh viễn khỏi hệ thống. Đơn vị và Người dùng vẫn được giữ nguyên. Xác nhận thực hiện?`,
      okText: 'Xoá vĩnh viễn',
      okButtonProps: { danger: true },
      cancelText: 'Huỷ',
      onOk: async () => {
        try {
          await xoaDuLieuTest.mutateAsync();
          message.success('Đã xoá xong dữ liệu test');
          setDaXoaXong(true);
          setXacNhan('');
        } catch (err: any) {
          message.error(err?.response?.data?.message ?? 'Có lỗi xảy ra khi xoá dữ liệu');
        }
      },
    });
  };

  if (daXoaXong && tongSo === 0) {
    return (
      <div>
        <Typography.Title level={4}>Xoá dữ liệu test</Typography.Title>
        <Result
          status="success"
          title="Đã xoá xong dữ liệu test"
          subTitle="Đơn vị và Người dùng vẫn được giữ nguyên. Hệ thống đã sẵn sàng để nhập dữ liệu thật."
          extra={
            <Button onClick={() => setDaXoaXong(false)} type="primary">
              Quay lại
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <Typography.Title level={4}>Xoá dữ liệu test</Typography.Title>
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        message="Thao tác này xoá vĩnh viễn, không thể hoàn tác"
        description="Sẽ xoá toàn bộ: mẫu báo cáo, kỳ báo cáo, bản nộp, báo cáo bằng văn bản, file đính kèm, thông báo và nhật ký. CHỈ giữ lại dữ liệu Đơn vị và Người dùng (kèm vai trò)."
      />

      <Card title="Dữ liệu sẽ bị xoá" loading={isLoading} style={{ marginBottom: 16 }} extra={<Button onClick={() => refetch()}>Làm mới</Button>}>
        <Descriptions column={2} bordered size="small">
          {Object.entries(NHAN_MUC).map(([khoa, nhan]) => (
            <Descriptions.Item key={khoa} label={nhan}>
              {data?.[khoa as keyof typeof NHAN_MUC] ?? 0}
            </Descriptions.Item>
          ))}
        </Descriptions>
      </Card>

      <Card title="Xác nhận xoá">
        {tongSo === 0 ? (
          <Typography.Text type="secondary">Hiện không có dữ liệu test nào để xoá.</Typography.Text>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Typography.Text>
              Để xác nhận, nhập đúng cụm từ <Typography.Text code>{CUM_TU_XAC_NHAN}</Typography.Text> vào ô bên dưới:
            </Typography.Text>
            <Input
              style={{ maxWidth: 320 }}
              placeholder={CUM_TU_XAC_NHAN}
              value={xacNhan}
              onChange={(e) => setXacNhan(e.target.value)}
            />
            <Button danger type="primary" icon={<DeleteOutlined />} disabled={!duocPhepXoa} loading={xoaDuLieuTest.isPending} onClick={onXacNhanXoa}>
              Xoá dữ liệu test
            </Button>
          </Space>
        )}
      </Card>
    </div>
  );
}
