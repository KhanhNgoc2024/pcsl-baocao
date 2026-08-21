import { Link } from 'react-router-dom';
import { Typography, Table, Tag, Progress } from 'antd';
import { useKyList } from '../../api/kyBaoCao';
import { CHU_KY_LABEL } from '../../utils/labels';

export function TongHopBaoCaoPage() {
  const { data, isLoading } = useKyList();

  return (
    <div>
      <Typography.Title level={4}>Tổng hợp báo cáo</Typography.Title>
      <Table
        scroll={{ x: 'max-content' }}
        rowKey="id"
        loading={isLoading}
        dataSource={data}
        columns={[
          { title: 'Mẫu báo cáo', dataIndex: ['mauBaoCao', 'ten'] },
          { title: 'Kỳ', dataIndex: 'tenKy', render: (v, r) => <Link to={`/ky/${r.id}`}>{v}</Link> },
          { title: 'Chu kỳ', dataIndex: ['mauBaoCao', 'chuKy'], render: (v) => CHU_KY_LABEL[v] ?? v },
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
            title: 'Trạng thái kỳ',
            dataIndex: 'trangThai',
            render: (v) => <Tag color={v === 'DA_DONG' ? 'default' : 'blue'}>{v === 'DA_DONG' ? 'Đã đóng' : 'Đang mở'}</Tag>,
          },
        ]}
      />
    </div>
  );
}
