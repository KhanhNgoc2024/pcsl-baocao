import { Link } from 'react-router-dom';
import { Typography, Row, Col, Card, Statistic, Table, Tag } from 'antd';
import { useAuthStore, coVaiTro } from '../../auth/store';
import { useBaoCaoCanNop } from '../../api/baoCaoNop';
import { useBaoCaoVanBanCanNop } from '../../api/baoCaoVanBan';
import { useMauBaoCaoList } from '../../api/mauBaoCao';
import { CHU_KY_LABEL } from '../../utils/labels';

function trongNgay(date: string, soNgay: number): boolean {
  const now = new Date();
  const han = new Date(date);
  const diff = (han.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= soNgay;
}

function daQuaHan(date: string): boolean {
  return new Date(date).getTime() < Date.now();
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const laDauMoi = coVaiTro(user, 'UNIT_ADMIN', 'APPROVER', 'SYS_ADMIN');
  const coTheDuyetDonVi = coVaiTro(user, 'SYS_ADMIN', 'UNIT_ADMIN', 'APPROVER');

  const { data: baoCaoNop } = useBaoCaoCanNop();
  const { data: vanBanNop } = useBaoCaoVanBanCanNop();
  const { data: mauBaoCaoList } = useMauBaoCaoList();

  const canNop = [
    ...(baoCaoNop ?? []).filter((b) => b.trangThai === 'CHUA_NOP' || b.trangThai === 'NHAP'),
  ];
  const sapDenHan = canNop.filter((b) => b.kyBaoCao && trongNgay(b.kyBaoCao.hanNop, 3));
  const treHan = canNop.filter((b) => b.kyBaoCao && daQuaHan(b.kyBaoCao.hanNop));
  const choDuyetDonVi = (baoCaoNop ?? []).filter((b) => b.trangThai === 'CHO_DUYET_DON_VI');

  const vanBanCanNop = (vanBanNop ?? []).filter((n) => n.trangThai === 'CHUA_NOP');

  return (
    <div>
      <Typography.Title level={4}>Bảng điều khiển</Typography.Title>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Báo cáo cần nộp" value={canNop.length} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Sắp đến hạn (3 ngày)" value={sapDenHan.length} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Trễ hạn" value={treHan.length} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Văn bản cần nộp" value={vanBanCanNop.length} />
          </Card>
        </Col>
        {coTheDuyetDonVi && (
          <Col xs={12} md={6}>
            <Card>
              <Statistic title="Chờ duyệt (đơn vị)" value={choDuyetDonVi.length} valueStyle={{ color: '#fa8c16' }} />
            </Card>
          </Col>
        )}
      </Row>

      {laDauMoi && (
        <Card title="Mẫu báo cáo do đơn vị bạn quản lý">
          <Table
            scroll={{ x: 'max-content' }}
            rowKey="id"
            dataSource={mauBaoCaoList}
            pagination={false}
            columns={[
              { title: 'Mã', dataIndex: 'ma', width: 100 },
              { title: 'Tên mẫu báo cáo', dataIndex: 'ten', render: (v, r) => <Link to={`/mau-bao-cao/${r.id}`}>{v}</Link> },
              { title: 'Chu kỳ', dataIndex: 'chuKy', render: (v) => CHU_KY_LABEL[v] ?? v },
              { title: 'Số đơn vị được giao', dataIndex: 'donViGiao', render: (v) => v?.length ?? 0 },
              {
                title: 'Trạng thái',
                dataIndex: 'trangThai',
                render: (v) => <Tag color={v === 'HOAT_DONG' ? 'green' : 'default'}>{v === 'HOAT_DONG' ? 'Hoạt động' : 'Ngừng'}</Tag>,
              },
            ]}
          />
        </Card>
      )}
    </div>
  );
}
