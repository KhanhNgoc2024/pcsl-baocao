import { Link } from 'react-router-dom';
import { Typography, Table, Tag, Progress } from 'antd';
import { useTongHopBaoCaoVanBanList } from '../../api/baoCaoVanBan';

export function TongHopBaoCaoVanBanPage() {
  const { data, isLoading } = useTongHopBaoCaoVanBanList();

  return (
    <div>
      <Typography.Title level={4}>Tổng hợp báo cáo bằng văn bản</Typography.Title>
      <Table
        scroll={{ x: 'max-content' }}
        rowKey="id"
        loading={isLoading}
        dataSource={data}
        columns={[
          { title: 'Tên yêu cầu', dataIndex: 'ten', render: (v, r) => <Link to={`/bao-cao-van-ban?xem=${r.id}`}>{v}</Link> },
          { title: 'Đơn vị đầu mối', dataIndex: ['donViTao', 'tenDonVi'] },
          { title: 'Hạn nộp', dataIndex: 'hanNop', render: (v) => new Date(v).toLocaleDateString('vi-VN') },
          {
            title: 'Tình hình nộp',
            dataIndex: 'thongKe',
            render: (tk) => (
              <span>
                {tk.daNop}/{tk.tongDonVi} đơn vị{' '}
                <Progress percent={Math.round(tk.tyLe * 100)} size="small" style={{ width: 120, display: 'inline-block' }} />
              </span>
            ),
          },
          {
            title: 'Trạng thái',
            dataIndex: 'trangThai',
            render: (v) => <Tag color={v === 'HOAT_DONG' ? 'green' : 'default'}>{v === 'HOAT_DONG' ? 'Hoạt động' : 'Ngừng'}</Tag>,
          },
        ]}
      />
    </div>
  );
}
