import { Link } from 'react-router-dom';
import { Typography, Table, Tag, Progress, Space } from 'antd';
import { useKyList } from '../../api/kyBaoCao';
import { useBaoCaoCanNop } from '../../api/baoCaoNop';
import { useAuthStore, coVaiTro } from '../../auth/store';
import { CHU_KY_LABEL, TRANG_THAI_BAO_CAO_NOP_LABEL } from '../../utils/labels';

const TRANG_THAI_COLOR: Record<string, string> = {
  CHUA_NOP: 'default',
  NHAP: 'gold',
  CHO_DUYET_DON_VI: 'orange',
  DA_NOP: 'blue',
  DA_DUYET: 'green',
  TRA_LAI: 'red',
};

export function TongHopBaoCaoPage() {
  const user = useAuthStore((s) => s.user);
  const laDauMoi = coVaiTro(user, 'UNIT_ADMIN', 'APPROVER', 'SYS_ADMIN');
  return laDauMoi ? <TongHopBaoCaoDauMoi /> : <TongHopBaoCaoDonVi />;
}

/** Đơn vị đầu mối: xem tình hình nộp của tất cả đơn vị được giao, cho từng kỳ thuộc mẫu do mình quản lý. */
function TongHopBaoCaoDauMoi() {
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

/** Đơn vị thường: chỉ xem tình hình nộp của chính đơn vị mình cho từng kỳ được giao. */
function TongHopBaoCaoDonVi() {
  const { data, isLoading } = useBaoCaoCanNop();

  return (
    <div>
      <Typography.Title level={4}>Tổng hợp báo cáo</Typography.Title>
      <Table
        scroll={{ x: 'max-content' }}
        rowKey="id"
        loading={isLoading}
        dataSource={data}
        columns={[
          {
            title: 'Mẫu báo cáo',
            dataIndex: ['kyBaoCao', 'mauBaoCao', 'ten'],
            render: (v, r) => <Link to={`/bao-cao-can-nop?xem=${r.id}`}>{v}</Link>,
          },
          { title: 'Kỳ', dataIndex: ['kyBaoCao', 'tenKy'] },
          { title: 'Chu kỳ', dataIndex: ['kyBaoCao', 'mauBaoCao', 'chuKy'], render: (v) => CHU_KY_LABEL[v] ?? v },
          {
            title: 'Hạn nộp',
            dataIndex: ['kyBaoCao', 'hanNop'],
            render: (v) => (v ? new Date(v).toLocaleDateString('vi-VN') : '—'),
          },
          {
            title: 'Trạng thái',
            dataIndex: 'trangThai',
            render: (v, r) => (
              <Space>
                <Tag color={TRANG_THAI_COLOR[v]}>{TRANG_THAI_BAO_CAO_NOP_LABEL[v] ?? v}</Tag>
                {r.treHan && <Tag color="red">Trễ hạn</Tag>}
              </Space>
            ),
          },
        ]}
      />
    </div>
  );
}
