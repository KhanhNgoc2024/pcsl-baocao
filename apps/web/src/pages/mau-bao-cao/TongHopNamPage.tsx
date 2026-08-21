import { useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Typography, Select, Card, Table, Empty, Space, Button, Row, Col, Statistic } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import { useTongHopNam } from '../../api/mauBaoCao';
import { BarChartTyLeNop } from '../../components/charts/BarChartTyLeNop';
import { LineChartSoSanh } from '../../components/charts/LineChartSoSanh';

const NAM_HIEN_TAI = new Date().getFullYear();
const DANH_SACH_NAM = Array.from({ length: 5 }, (_, i) => NAM_HIEN_TAI - i);

export function TongHopNamPage() {
  const { id } = useParams();
  const mauId = Number(id);
  const [searchParams] = useSearchParams();
  const namTuUrl = Number(searchParams.get('nam'));
  const [nam, setNam] = useState(namTuUrl && DANH_SACH_NAM.includes(namTuUrl) ? namTuUrl : NAM_HIEN_TAI);

  const { data, isLoading } = useTongHopNam(mauId, nam);

  const duLieuTyLeNop =
    data?.kyThongKe.map((k) => ({
      nhan: `Kỳ ${k.kySo}`,
      tyLe: k.tyLe,
      daNop: k.daNop,
      tongDonVi: k.tongDonVi,
    })) ?? [];

  const chuoiSoLieu =
    data?.truongSo.map((t) => ({
      ma: t.ma,
      nhan: t.nhan,
      giaTri: data.kyThongKe.map((k) => k.giaTri[t.ma] ?? 0),
    })) ?? [];

  return (
    <div>
      <Space style={{ marginBottom: 8 }}>
        <Link to={`/mau-bao-cao/${mauId}`}>
          <Button icon={<LeftOutlined />} type="link" style={{ paddingLeft: 0 }}>
            Quay lại mẫu báo cáo
          </Button>
        </Link>
      </Space>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Tổng hợp theo năm — {data?.mauBaoCao?.ten}
        </Typography.Title>
        <Select value={nam} onChange={setNam} options={DANH_SACH_NAM.map((n) => ({ value: n, label: `Năm ${n}` }))} style={{ width: 140 }} />
      </Space>

      <Card title="Tỷ lệ nộp theo kỳ" loading={isLoading} style={{ marginBottom: 16 }}>
        {duLieuTyLeNop.length > 0 ? (
          <BarChartTyLeNop duLieu={duLieuTyLeNop} />
        ) : (
          <Empty description={`Chưa có kỳ báo cáo nào trong năm ${nam}`} />
        )}
      </Card>

      {chuoiSoLieu.length > 0 && (
        <Card title="So sánh số liệu qua các kỳ" loading={isLoading} style={{ marginBottom: 16 }}>
          <LineChartSoSanh nhanTruc={data!.kyThongKe.map((k) => `Kỳ ${k.kySo}`)} chuoi={chuoiSoLieu} />
        </Card>
      )}

      {data && data.truongSo.length > 0 && (
        <Card title={`Tổng hợp cả năm ${nam} (cộng dồn các kỳ)`} loading={isLoading} style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            {data.truongSo.map((t) => (
              <Col key={t.ma} xs={12} sm={8} md={6}>
                <Statistic title={t.nhan} value={data.tongCongCaNam[t.ma] ?? 0} />
              </Col>
            ))}
          </Row>
        </Card>
      )}

      <Card title="Bảng dữ liệu chi tiết">
        <Table
          scroll={{ x: 'max-content' }}
          rowKey="kyId"
          loading={isLoading}
          dataSource={data?.kyThongKe}
          pagination={false}
          columns={[
            { title: 'Kỳ', dataIndex: 'tenKy' },
            { title: 'Hạn nộp', dataIndex: 'hanNop', render: (v) => new Date(v).toLocaleDateString('vi-VN') },
            { title: 'Đã nộp / Tổng', render: (_, r) => `${r.daNop}/${r.tongDonVi}` },
            { title: 'Tỷ lệ nộp', dataIndex: 'tyLe', render: (v) => `${Math.round(v * 100)}%` },
            ...(data?.truongSo.map((t) => ({
              title: t.nhan,
              render: (_: unknown, r: (typeof data.kyThongKe)[number]) => (r.giaTri[t.ma] ?? 0).toLocaleString('vi-VN'),
            })) ?? []),
          ]}
        />
      </Card>
    </div>
  );
}
