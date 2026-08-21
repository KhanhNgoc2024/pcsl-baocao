import { Table, Button, Tag, Typography, Space, Popconfirm, App } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useMauBaoCaoList, useXoaMauBaoCao } from '../../api/mauBaoCao';
import { CHU_KY_LABEL, LOAI_NHAP_LABEL } from '../../utils/labels';

export function MauBaoCaoListPage() {
  const { data, isLoading } = useMauBaoCaoList();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const xoaMau = useXoaMauBaoCao();

  const onXoa = async (id: number) => {
    try {
      await xoaMau.mutateAsync(id);
      message.success('Đã xoá mẫu báo cáo');
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? 'Không thể xoá mẫu báo cáo');
    }
  };

  return (
    <div>
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Danh sách báo cáo — Quản lý mẫu báo cáo
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/mau-bao-cao/moi')}>
          Tạo mẫu báo cáo
        </Button>
      </Space>
      <Table
        scroll={{ x: 'max-content' }}
        rowKey="id"
        loading={isLoading}
        dataSource={data}
        onRow={(mau) => ({ onClick: () => navigate(`/mau-bao-cao/${mau.id}`), style: { cursor: 'pointer' } })}
        columns={[
          { title: 'Mã', dataIndex: 'ma', width: 120 },
          { title: 'Tên mẫu báo cáo', dataIndex: 'ten' },
          { title: 'Đơn vị đầu mối', dataIndex: ['donViTao', 'tenDonVi'] },
          { title: 'Chu kỳ', dataIndex: 'chuKy', render: (v) => CHU_KY_LABEL[v] ?? v },
          { title: 'Cách nộp', dataIndex: 'loaiNhap', render: (v) => LOAI_NHAP_LABEL[v] ?? v },
          { title: 'Cần duyệt', dataIndex: 'canDuyet', render: (v) => (v ? <Tag color="orange">Cần duyệt</Tag> : '') },
          {
            title: 'Trạng thái',
            dataIndex: 'trangThai',
            render: (v) => <Tag color={v === 'HOAT_DONG' ? 'green' : 'default'}>{v === 'HOAT_DONG' ? 'Hoạt động' : 'Ngừng'}</Tag>,
          },
          {
            title: '',
            key: 'action',
            width: 60,
            render: (_: unknown, mau: { id: number }) => (
              // eslint-disable-next-line jsx-a11y/no-static-element-interactions
              <span onClick={(e) => e.stopPropagation()}>
                <Popconfirm
                  title="Xoá mẫu báo cáo này?"
                  description="Chỉ xoá được khi mẫu chưa có kỳ báo cáo nào."
                  okText="Xoá"
                  okButtonProps={{ danger: true }}
                  cancelText="Huỷ"
                  onConfirm={() => onXoa(mau.id)}
                >
                  <Button danger size="small" icon={<DeleteOutlined />} loading={xoaMau.isPending} />
                </Popconfirm>
              </span>
            ),
          },
        ]}
      />
    </div>
  );
}
