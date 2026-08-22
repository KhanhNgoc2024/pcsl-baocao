import { Link } from 'react-router-dom';
import { Typography, Card, Row, Col, Statistic, Table, Tag, Space } from 'antd';
import { useBaoCaoCanNop } from '../../api/baoCaoNop';
import { useBaoCaoVanBanCanNop } from '../../api/baoCaoVanBan';
import { TRANG_THAI_BAO_CAO_NOP_LABEL, TRANG_THAI_BCVB_NOP_LABEL } from '../../utils/labels';

const TRANG_THAI_COLOR: Record<string, string> = {
  CHUA_NOP: 'default',
  NHAP: 'gold',
  CHO_DUYET_DON_VI: 'orange',
  DA_NOP: 'blue',
  DA_DUYET: 'green',
  TRA_LAI: 'red',
};

// Trạng thái coi là "đã nộp" (đã rời khỏi tay đơn vị, dù đang chờ duyệt/đã duyệt/bị trả lại) — thống nhất với quy ước dùng ở các trang Tổng hợp khác.
const DA_NOP_STATES = new Set(['CHO_DUYET_DON_VI', 'DA_NOP', 'DA_DUYET', 'TRA_LAI']);

function tinhThongKe(items: { trangThai: string; treHan: boolean }[]) {
  const tong = items.length;
  const daNop = items.filter((i) => DA_NOP_STATES.has(i.trangThai)).length;
  const treHan = items.filter((i) => i.treHan).length;
  return { tong, daNop, chuaNop: tong - daNop, treHan, tyLe: tong ? daNop / tong : 0 };
}

export function TongHopDonViPage() {
  const { data: baoCaoNop, isLoading: dangTaiBc } = useBaoCaoCanNop();
  const { data: vanBanNop, isLoading: dangTaiVb } = useBaoCaoVanBanCanNop();

  const thongKeBc = tinhThongKe(baoCaoNop ?? []);
  const thongKeVb = tinhThongKe(vanBanNop ?? []);

  return (
    <div>
      <Typography.Title level={4}>Tổng hợp báo cáo đơn vị</Typography.Title>
      <Typography.Paragraph type="secondary">
        Thống kê tình hình nộp báo cáo của đơn vị bạn — cả báo cáo theo mẫu số liệu và báo cáo bằng văn bản.
      </Typography.Paragraph>

      <Card title="Danh sách báo cáo" loading={dangTaiBc} style={{ marginBottom: 16 }}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={12} md={6}>
            <Statistic title="Tổng số" value={thongKeBc.tong} />
          </Col>
          <Col xs={12} md={6}>
            <Statistic title="Đã nộp" value={thongKeBc.daNop} valueStyle={{ color: '#3f8600' }} />
          </Col>
          <Col xs={12} md={6}>
            <Statistic title="Chưa nộp" value={thongKeBc.chuaNop} valueStyle={{ color: '#cf1322' }} />
          </Col>
          <Col xs={12} md={6}>
            <Statistic title="Trễ hạn" value={thongKeBc.treHan} valueStyle={{ color: '#cf1322' }} />
          </Col>
        </Row>
        <Table
          scroll={{ x: 'max-content' }}
          rowKey="id"
          dataSource={baoCaoNop}
          pagination={false}
          columns={[
            {
              title: 'Mẫu báo cáo',
              dataIndex: ['kyBaoCao', 'mauBaoCao', 'ten'],
              render: (v, r) => <Link to={`/bao-cao-can-nop?xem=${r.id}`}>{v}</Link>,
            },
            { title: 'Kỳ', dataIndex: ['kyBaoCao', 'tenKy'] },
            { title: 'Hạn nộp', dataIndex: ['kyBaoCao', 'hanNop'], render: (v) => (v ? new Date(v).toLocaleDateString('vi-VN') : '—') },
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
      </Card>

      <Card title="Báo cáo bằng văn bản" loading={dangTaiVb}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={12} md={6}>
            <Statistic title="Tổng số" value={thongKeVb.tong} />
          </Col>
          <Col xs={12} md={6}>
            <Statistic title="Đã nộp" value={thongKeVb.daNop} valueStyle={{ color: '#3f8600' }} />
          </Col>
          <Col xs={12} md={6}>
            <Statistic title="Chưa nộp" value={thongKeVb.chuaNop} valueStyle={{ color: '#cf1322' }} />
          </Col>
          <Col xs={12} md={6}>
            <Statistic title="Trễ hạn" value={thongKeVb.treHan} valueStyle={{ color: '#cf1322' }} />
          </Col>
        </Row>
        <Table
          scroll={{ x: 'max-content' }}
          rowKey="id"
          dataSource={vanBanNop}
          pagination={false}
          columns={[
            {
              title: 'Tên yêu cầu',
              dataIndex: ['baoCaoVanBan', 'ten'],
              render: (v, r) => <Link to={`/bao-cao-van-ban-can-nop?xem=${r.id}`}>{v}</Link>,
            },
            { title: 'Hạn nộp', dataIndex: ['baoCaoVanBan', 'hanNop'], render: (v) => (v ? new Date(v).toLocaleDateString('vi-VN') : '—') },
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
      </Card>
    </div>
  );
}
