import { Link } from 'react-router-dom';
import { Typography, Table, Tag, Progress, Space } from 'antd';
import { useTongHopBaoCaoVanBanList, useBaoCaoVanBanCanNop } from '../../api/baoCaoVanBan';
import { useAuthStore, coVaiTro } from '../../auth/store';
import { TRANG_THAI_BCVB_NOP_LABEL } from '../../utils/labels';

const TRANG_THAI_COLOR: Record<string, string> = { CHUA_NOP: 'default', DA_NOP: 'blue', DA_DUYET: 'green', TRA_LAI: 'red' };

export function TongHopBaoCaoVanBanPage() {
  const user = useAuthStore((s) => s.user);
  const laDauMoi = coVaiTro(user, 'UNIT_ADMIN', 'APPROVER', 'SYS_ADMIN');
  return laDauMoi ? <TongHopVanBanDauMoi /> : <TongHopVanBanDonVi />;
}

/** Đơn vị đầu mối: xem tình hình nộp của tất cả đơn vị được giao, cho từng yêu cầu do mình quản lý. */
function TongHopVanBanDauMoi() {
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

/** Đơn vị thường: chỉ xem tình hình nộp của chính đơn vị mình cho từng yêu cầu được giao. */
function TongHopVanBanDonVi() {
  const { data, isLoading } = useBaoCaoVanBanCanNop();

  return (
    <div>
      <Typography.Title level={4}>Tổng hợp báo cáo bằng văn bản</Typography.Title>
      <Table
        scroll={{ x: 'max-content' }}
        rowKey="id"
        loading={isLoading}
        dataSource={data}
        columns={[
          {
            title: 'Tên yêu cầu',
            dataIndex: ['baoCaoVanBan', 'ten'],
            render: (v, r) => <Link to={`/bao-cao-van-ban-can-nop?xem=${r.id}`}>{v}</Link>,
          },
          {
            title: 'Hạn nộp',
            dataIndex: ['baoCaoVanBan', 'hanNop'],
            render: (v) => (v ? new Date(v).toLocaleDateString('vi-VN') : '—'),
          },
          {
            title: 'Trạng thái',
            dataIndex: 'trangThai',
            render: (v, r) => (
              <Space>
                <Tag color={TRANG_THAI_COLOR[v]}>{TRANG_THAI_BCVB_NOP_LABEL[v] ?? v}</Tag>
                {r.treHan && <Tag color="red">Trễ hạn</Tag>}
              </Space>
            ),
          },
        ]}
      />
    </div>
  );
}
