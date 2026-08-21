import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Typography, Table, Tag, Button, Space, Statistic, Row, Col, App, Input, Drawer, List, Empty } from 'antd';
import { FileExcelOutlined, FileZipOutlined, BellOutlined, CheckOutlined, RollbackOutlined, LineChartOutlined } from '@ant-design/icons';
import { useTongHopKy, useNhacNop, taiExcelKy, taiZipKy } from '../../api/kyBaoCao';
import { useDuyetBaoCao, useBaoCaoNopDetail } from '../../api/baoCaoNop';
import { duongDanTaiXuong } from '../../api/tep';
import { DynamicForm } from '../../components/DynamicForm';
import { TRANG_THAI_BAO_CAO_NOP_LABEL } from '../../utils/labels';

const TRANG_THAI_COLOR: Record<string, string> = {
  CHUA_NOP: 'default',
  NHAP: 'gold',
  CHO_DUYET_DON_VI: 'orange',
  DA_NOP: 'blue',
  DA_DUYET: 'green',
  TRA_LAI: 'red',
};

export function KyBaoCaoDetailPage() {
  const { kyId } = useParams();
  const id = Number(kyId);
  const { data, isLoading, refetch } = useTongHopKy(id);
  const nhacNop = useNhacNop();
  const duyetBaoCao = useDuyetBaoCao();
  const { message, modal } = App.useApp();
  const [dangTaiExcel, setDangTaiExcel] = useState(false);
  const [dangTaiZip, setDangTaiZip] = useState(false);
  const [dangXemId, setDangXemId] = useState<number | null>(null);
  const { data: baoCaoXem, isLoading: dangTaiChiTiet } = useBaoCaoNopDetail(dangXemId ?? undefined);

  const canDuyet = data?.ky?.mauBaoCao?.canDuyet;
  const cauHinhBieuMau = data?.ky?.mauBaoCao?.cauHinhBieuMau;

  const onXuatExcel = async () => {
    setDangTaiExcel(true);
    try {
      await taiExcelKy(id);
    } finally {
      setDangTaiExcel(false);
    }
  };

  const onTaiZip = async () => {
    setDangTaiZip(true);
    try {
      await taiZipKy(id);
    } finally {
      setDangTaiZip(false);
    }
  };

  const onNhacNop = async () => {
    const res = await nhacNop.mutateAsync(id);
    message.success((res.data as any).message ?? 'Đã gửi nhắc nộp');
  };

  const onDuyet = (baoCaoNopId: number) => {
    modal.confirm({
      title: 'Duyệt báo cáo',
      content: 'Xác nhận duyệt báo cáo này?',
      onOk: async () => {
        await duyetBaoCao.mutateAsync({ id: baoCaoNopId, ketQua: 'DA_DUYET' });
        message.success('Đã duyệt báo cáo');
        refetch();
      },
    });
  };

  const onTraLai = (baoCaoNopId: number) => {
    let ghiChu = '';
    modal.confirm({
      title: 'Trả lại báo cáo',
      content: <Input.TextArea placeholder="Lý do trả lại" onChange={(e) => (ghiChu = e.target.value)} rows={3} />,
      onOk: async () => {
        await duyetBaoCao.mutateAsync({ id: baoCaoNopId, ketQua: 'TRA_LAI', ghiChu });
        message.success('Đã trả lại báo cáo');
        refetch();
      },
    });
  };

  return (
    <div>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {data?.ky?.tenKy} — {data?.ky?.mauBaoCao?.ten}
        </Typography.Title>
        {data?.ky?.mauBaoCaoId && (
          <Link to={`/mau-bao-cao/${data.ky.mauBaoCaoId}/tong-hop-nam?nam=${data.ky.nam}`}>
            <Button icon={<LineChartOutlined />}>Xem tổng hợp theo năm</Button>
          </Link>
        )}
      </Space>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Statistic title="Tổng đơn vị" value={data?.thongKe.tongDonVi} />
        </Col>
        <Col xs={12} md={6}>
          <Statistic title="Đã nộp" value={data?.thongKe.daNop} valueStyle={{ color: '#3f8600' }} />
        </Col>
        <Col xs={12} md={6}>
          <Statistic title="Chưa nộp" value={data?.thongKe.chuaNop} valueStyle={{ color: '#cf1322' }} />
        </Col>
        <Col xs={12} md={6}>
          <Statistic title="Tỷ lệ nộp" value={(data?.thongKe.tyLe ?? 0) * 100} precision={0} suffix="%" />
        </Col>
      </Row>

      <Space style={{ marginBottom: 16 }}>
        <Button icon={<FileExcelOutlined />} onClick={onXuatExcel} loading={dangTaiExcel}>
          Xuất Excel
        </Button>
        <Button icon={<FileZipOutlined />} onClick={onTaiZip} loading={dangTaiZip}>
          Tải ZIP
        </Button>
        <Button icon={<BellOutlined />} onClick={onNhacNop} loading={nhacNop.isPending}>
          Gửi nhắc nộp
        </Button>
      </Space>

      <Table
        scroll={{ x: 'max-content' }}
        rowKey={(r) => r.donVi.id}
        loading={isLoading}
        dataSource={data?.items}
        columns={[
          { title: 'Đơn vị', dataIndex: ['donVi', 'tenDonVi'] },
          {
            title: 'Trạng thái',
            dataIndex: 'trangThai',
            filters: Object.entries(TRANG_THAI_BAO_CAO_NOP_LABEL).map(([value, text]) => ({ value, text })),
            onFilter: (value, record) => record.trangThai === value,
            render: (v) => <Tag color={TRANG_THAI_COLOR[v]}>{TRANG_THAI_BAO_CAO_NOP_LABEL[v] ?? v}</Tag>,
          },
          {
            title: 'Thời gian nộp',
            dataIndex: 'thoiGianNop',
            render: (v) => (v ? new Date(v).toLocaleString('vi-VN') : '—'),
          },
          {
            title: 'Đúng/Trễ hạn',
            dataIndex: 'treHan',
            render: (v, r) => (r.thoiGianNop ? <Tag color={v ? 'red' : 'green'}>{v ? 'Trễ hạn' : 'Đúng hạn'}</Tag> : ''),
          },
          { title: 'Người nộp', dataIndex: ['nguoiNop', 'hoTen'] },
          { title: 'Số file', dataIndex: 'soFile' },
          {
            title: 'Thao tác',
            render: (_: unknown, r: NonNullable<typeof data>['items'][number]) => (
              <Space>
                {r.baoCaoNopId && (
                  <Button size="small" onClick={() => setDangXemId(r.baoCaoNopId!)}>
                    Xem báo cáo
                  </Button>
                )}
                {canDuyet && r.trangThai === 'DA_NOP' && r.baoCaoNopId && (
                  <>
                    <Button size="small" icon={<CheckOutlined />} onClick={() => onDuyet(r.baoCaoNopId!)}>
                      Duyệt
                    </Button>
                    <Button size="small" danger icon={<RollbackOutlined />} onClick={() => onTraLai(r.baoCaoNopId!)}>
                      Trả lại
                    </Button>
                  </>
                )}
              </Space>
            ),
          },
        ]}
      />

      <Drawer
        title={baoCaoXem ? `Báo cáo của ${baoCaoXem.donVi?.tenDonVi ?? ''}` : 'Xem báo cáo'}
        width={720}
        open={!!dangXemId}
        onClose={() => setDangXemId(null)}
        loading={dangTaiChiTiet}
      >
        {baoCaoXem && cauHinhBieuMau && (
          <DynamicForm cauHinh={cauHinhBieuMau} value={baoCaoXem.duLieu ?? {}} disabled />
        )}
        {baoCaoXem && !cauHinhBieuMau && (!baoCaoXem.tepDinhKem || baoCaoXem.tepDinhKem.length === 0) && (
          <Empty description="Đơn vị chưa nộp file" />
        )}
        {baoCaoXem && baoCaoXem.tepDinhKem && baoCaoXem.tepDinhKem.length > 0 && (
          <>
            <Typography.Title level={5} style={{ marginTop: 16 }}>
              File đính kèm
            </Typography.Title>
            <List
              size="small"
              dataSource={baoCaoXem.tepDinhKem}
              renderItem={(tep) => (
                <List.Item>
                  <a href={duongDanTaiXuong(tep.id)} target="_blank" rel="noreferrer">
                    {tep.tenGoc}
                  </a>
                </List.Item>
              )}
            />
          </>
        )}
      </Drawer>
    </div>
  );
}
