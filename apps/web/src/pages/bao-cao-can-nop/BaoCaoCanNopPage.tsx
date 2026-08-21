import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Table, Tag, Typography, Button, Drawer, Space, Upload, App, Alert, List, Popconfirm, Input } from 'antd';
import { InboxOutlined, CheckOutlined, RollbackOutlined } from '@ant-design/icons';
import { useBaoCaoCanNop, useLuuNhap, useNopBaoCao, useDuyetDonVi } from '../../api/baoCaoNop';
import { useUploadTep, duongDanTaiXuong } from '../../api/tep';
import { DynamicForm } from '../../components/DynamicForm';
import { TRANG_THAI_BAO_CAO_NOP_LABEL } from '../../utils/labels';
import { useAuthStore, coVaiTro } from '../../auth/store';

const TRANG_THAI_COLOR: Record<string, string> = {
  CHUA_NOP: 'default',
  NHAP: 'gold',
  CHO_DUYET_DON_VI: 'orange',
  DA_NOP: 'blue',
  DA_DUYET: 'green',
  TRA_LAI: 'red',
};

const KHONG_THE_SUA = ['DA_DUYET', 'CHO_DUYET_DON_VI', 'DA_NOP'];

export function BaoCaoCanNopPage() {
  const { data, isLoading } = useBaoCaoCanNop();
  const luuNhap = useLuuNhap();
  const nopBaoCao = useNopBaoCao();
  const duyetDonVi = useDuyetDonVi();
  const uploadTep = useUploadTep();
  const { message, modal } = App.useApp();
  const qc = useQueryClient();
  const { user } = useAuthStore();

  const coTheDuyetDonVi = coVaiTro(user, 'SYS_ADMIN', 'UNIT_ADMIN', 'APPROVER');

  const [dangMoId, setDangMoId] = useState<number | null>(null);
  const [duLieu, setDuLieu] = useState<Record<string, unknown>>({});

  const dangMo = data?.find((bc) => bc.id === dangMoId) ?? null;

  const moPhieu = (id: number, duLieuBanDau: Record<string, unknown> | null) => {
    setDangMoId(id);
    setDuLieu(duLieuBanDau ?? {});
  };

  const dongPhieu = () => setDangMoId(null);

  const chiCoTheXem = dangMo ? KHONG_THE_SUA.includes(dangMo.trangThai) : false;
  const mauBaoCao = dangMo?.kyBaoCao?.mauBaoCao;

  const onDuyetDonVi = (id: number) => {
    modal.confirm({
      title: 'Duyệt báo cáo (đơn vị)',
      content: 'Xác nhận duyệt để gửi báo cáo này đến phòng ban chủ trì?',
      onOk: async () => {
        await duyetDonVi.mutateAsync({ id, ketQua: 'DA_NOP' });
        message.success('Đã duyệt và gửi báo cáo đến phòng ban chủ trì');
      },
    });
  };

  const onTraLaiDonVi = (id: number) => {
    let ghiChu = '';
    modal.confirm({
      title: 'Trả lại báo cáo',
      content: <Input.TextArea placeholder="Lý do trả lại" onChange={(e) => (ghiChu = e.target.value)} rows={3} />,
      onOk: async () => {
        await duyetDonVi.mutateAsync({ id, ketQua: 'TRA_LAI', ghiChu });
        message.success('Đã trả lại báo cáo cho người nộp');
      },
    });
  };

  const onLuuNhap = async () => {
    if (!dangMo) return;
    try {
      await luuNhap.mutateAsync({ kyBaoCaoId: dangMo.kyBaoCaoId, duLieu });
      message.success('Đã lưu nháp');
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? 'Có lỗi xảy ra');
    }
  };

  const onNop = async () => {
    if (!dangMo) return;
    try {
      await luuNhap.mutateAsync({ kyBaoCaoId: dangMo.kyBaoCaoId, duLieu });
      await nopBaoCao.mutateAsync(dangMo.id);
      message.success('Đã nộp báo cáo');
      dongPhieu();
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? 'Có lỗi xảy ra');
    }
  };

  return (
    <div>
      <Typography.Title level={4}>Báo cáo cần nộp</Typography.Title>
      <Table
        scroll={{ x: 'max-content' }}
        rowKey="id"
        loading={isLoading}
        dataSource={data}
        columns={[
          { title: 'Mẫu báo cáo', dataIndex: ['kyBaoCao', 'mauBaoCao', 'ten'] },
          { title: 'Kỳ', dataIndex: ['kyBaoCao', 'tenKy'] },
          { title: 'Hạn nộp', dataIndex: ['kyBaoCao', 'hanNop'], render: (v) => new Date(v).toLocaleDateString('vi-VN') },
          {
            title: 'Trạng thái',
            dataIndex: 'trangThai',
            render: (v, bc) => (
              <Space>
                <Tag color={TRANG_THAI_COLOR[v]}>{TRANG_THAI_BAO_CAO_NOP_LABEL[v] ?? v}</Tag>
                {bc.treHan && <Tag color="red">Trễ hạn</Tag>}
              </Space>
            ),
          },
          {
            title: 'Thao tác',
            render: (_, bc) => (
              <Space>
                <Button type="link" onClick={() => moPhieu(bc.id, bc.duLieu)}>
                  {KHONG_THE_SUA.includes(bc.trangThai) ? 'Xem' : 'Nhập liệu'}
                </Button>
                {coTheDuyetDonVi && bc.trangThai === 'CHO_DUYET_DON_VI' && (
                  <>
                    <Button size="small" icon={<CheckOutlined />} onClick={() => onDuyetDonVi(bc.id)}>
                      Duyệt
                    </Button>
                    <Button size="small" danger icon={<RollbackOutlined />} onClick={() => onTraLaiDonVi(bc.id)}>
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
        title={mauBaoCao?.ten}
        width={720}
        open={!!dangMo}
        onClose={dongPhieu}
        extra={
          !chiCoTheXem && (
            <Space>
              <Button onClick={onLuuNhap} loading={luuNhap.isPending}>
                Lưu nháp
              </Button>
              <Popconfirm title="Xác nhận nộp báo cáo?" onConfirm={onNop}>
                <Button type="primary" loading={nopBaoCao.isPending}>
                  Nộp báo cáo
                </Button>
              </Popconfirm>
            </Space>
          )
        }
      >
        {dangMo?.trangThai === 'TRA_LAI' && (dangMo.ghiChuDuyet || dangMo.ghiChuDuyetDonVi) && (
          <Alert
            type="warning"
            showIcon
            message="Báo cáo bị trả lại"
            description={dangMo.ghiChuDuyet ?? dangMo.ghiChuDuyetDonVi}
            style={{ marginBottom: 16 }}
          />
        )}

        {dangMo?.trangThai === 'CHO_DUYET_DON_VI' && (
          <Alert
            type="info"
            showIcon
            message="Đang chờ duyệt tại đơn vị"
            description="Báo cáo đã nộp, đang chờ Quản trị đơn vị hoặc Người duyệt của đơn vị bạn xét duyệt trước khi gửi đến phòng ban chủ trì."
            style={{ marginBottom: 16 }}
          />
        )}

        {mauBaoCao && (mauBaoCao.loaiNhap === 'BIEU_MAU' || mauBaoCao.loaiNhap === 'CA_HAI') && mauBaoCao.cauHinhBieuMau && (
          <DynamicForm cauHinh={mauBaoCao.cauHinhBieuMau} value={duLieu} onChange={setDuLieu} disabled={chiCoTheXem} />
        )}

        {mauBaoCao && (mauBaoCao.loaiNhap === 'TAI_FILE' || mauBaoCao.loaiNhap === 'CA_HAI') && dangMo && (
          <div style={{ marginTop: 16 }}>
            <Typography.Title level={5}>File đính kèm</Typography.Title>
            <List
              size="small"
              dataSource={dangMo.tepDinhKem}
              renderItem={(tep) => (
                <List.Item>
                  <a href={duongDanTaiXuong(tep.id)} target="_blank" rel="noreferrer">
                    {tep.tenGoc}
                  </a>
                </List.Item>
              )}
            />
            {!chiCoTheXem && (
              <Upload.Dragger
                multiple={false}
                showUploadList={false}
                beforeUpload={async (file) => {
                  await uploadTep.mutateAsync({ file, loaiLienKet: 'bao_cao_nop', lienKetId: dangMo.id });
                  await qc.invalidateQueries({ queryKey: ['bao-cao-can-nop'] });
                  message.success('Đã tải file lên');
                  return false;
                }}
                accept=".doc,.docx,.pdf"
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p>Kéo thả hoặc bấm để tải file .doc/.docx/.pdf</p>
              </Upload.Dragger>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
