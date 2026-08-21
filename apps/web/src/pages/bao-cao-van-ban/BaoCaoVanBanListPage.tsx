import { useState } from 'react';
import dayjs from 'dayjs';
import {
  Table,
  Button,
  Tag,
  Typography,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Upload,
  App,
  Drawer,
  Statistic,
  Row,
  Col,
} from 'antd';
import { PlusOutlined, UploadOutlined, FileExcelOutlined, FileZipOutlined, BellOutlined } from '@ant-design/icons';
import {
  useBaoCaoVanBanList,
  useTaoBaoCaoVanBan,
  useGiaoDonViVanBan,
  useTongHopVanBan,
  useNhacNopVanBan,
  taiExcelVanBan,
  taiZipVanBan,
} from '../../api/baoCaoVanBan';
import { useDonViList } from '../../api/donVi';
import { useUploadTep } from '../../api/tep';

const TRANG_THAI_COLOR: Record<string, string> = { CHUA_NOP: 'default', DA_NOP: 'blue' };
const TRANG_THAI_LABEL: Record<string, string> = { CHUA_NOP: 'Chưa nộp', DA_NOP: 'Đã nộp' };

export function BaoCaoVanBanListPage() {
  const { data, isLoading } = useBaoCaoVanBanList();
  const taoBcvb = useTaoBaoCaoVanBan();
  const giaoDonVi = useGiaoDonViVanBan();
  const nhacNop = useNhacNopVanBan();
  const uploadTep = useUploadTep();
  const { message } = App.useApp();

  const [modalMo, setModalMo] = useState(false);
  const [form] = Form.useForm();
  const [fileYeuCauId, setFileYeuCauId] = useState<number | undefined>();

  const [dangXemId, setDangXemId] = useState<number | null>(null);
  const [donViDaGiao, setDonViDaGiao] = useState<number[]>([]);
  const { data: donViList } = useDonViList();
  const { data: tongHop } = useTongHopVanBan(dangXemId ?? undefined);

  const moTaoMoi = () => {
    form.resetFields();
    setFileYeuCauId(undefined);
    setModalMo(true);
  };

  const onSubmit = async () => {
    const values = (await form.validateFields()) as any;
    try {
      await taoBcvb.mutateAsync({
        ...values,
        hanNop: values.hanNop.toISOString(),
        fileYeuCauId,
      });
      message.success('Đã tạo yêu cầu báo cáo văn bản');
      setModalMo(false);
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? 'Có lỗi xảy ra');
    }
  };

  const moXem = (id: number, donViGiao?: { donViId: number }[]) => {
    setDangXemId(id);
    setDonViDaGiao(donViGiao?.map((g) => g.donViId) ?? []);
  };

  const onGiaoDonVi = async () => {
    if (!dangXemId) return;
    await giaoDonVi.mutateAsync({ id: dangXemId, donViIds: donViDaGiao });
    message.success('Đã cập nhật đơn vị được giao');
  };

  const onNhacNop = async () => {
    if (!dangXemId) return;
    const res = await nhacNop.mutateAsync(dangXemId);
    message.success((res.data as any).message ?? 'Đã gửi nhắc nộp');
  };

  return (
    <div>
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Báo cáo bằng văn bản — Quản lý yêu cầu
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={moTaoMoi}>
          Tạo yêu cầu
        </Button>
      </Space>

      <Table
        scroll={{ x: 'max-content' }}
        rowKey="id"
        loading={isLoading}
        dataSource={data}
        onRow={(r) => ({ onClick: () => moXem(r.id, r.donViGiao), style: { cursor: 'pointer' } })}
        columns={[
          { title: 'Tên yêu cầu', dataIndex: 'ten' },
          { title: 'Đơn vị đầu mối', dataIndex: ['donViTao', 'tenDonVi'] },
          { title: 'Chế độ', dataIndex: 'cheDo', render: (v) => (v === 'CHO_PHEP_TAI_LEN' ? 'Cho phép tải lên' : 'Chỉ xem') },
          { title: 'Hạn nộp', dataIndex: 'hanNop', render: (v) => new Date(v).toLocaleDateString('vi-VN') },
          {
            title: 'Trạng thái',
            dataIndex: 'trangThai',
            render: (v) => <Tag color={v === 'HOAT_DONG' ? 'green' : 'default'}>{v === 'HOAT_DONG' ? 'Hoạt động' : 'Ngừng'}</Tag>,
          },
        ]}
      />

      <Modal title="Tạo yêu cầu báo cáo văn bản" open={modalMo} onCancel={() => setModalMo(false)} onOk={onSubmit} confirmLoading={taoBcvb.isPending} destroyOnHidden>
        <Form form={form} layout="vertical">
          <Form.Item name="ten" label="Tên yêu cầu" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="moTa" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="cheDo" label="Chế độ" rules={[{ required: true }]} initialValue="CHO_PHEP_TAI_LEN">
            <Select
              options={[
                { value: 'CHO_PHEP_TAI_LEN', label: 'Cho phép tải lên' },
                { value: 'CHI_XEM', label: 'Chỉ xem' },
              ]}
            />
          </Form.Item>
          <Form.Item name="hanNop" label="Hạn nộp" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" disabledDate={(d) => d.isBefore(dayjs(), 'day')} />
          </Form.Item>
          <Form.Item label="File hướng dẫn / biểu mẫu (tuỳ chọn)">
            <Upload
              beforeUpload={async (file) => {
                const tep = await uploadTep.mutateAsync({ file, loaiLienKet: 'file_yeu_cau' });
                setFileYeuCauId(tep.id);
                message.success(`Đã tải lên: ${tep.tenGoc}`);
                return false;
              }}
              maxCount={1}
              accept=".doc,.docx,.pdf"
            >
              <Button icon={<UploadOutlined />}>Tải file lên</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer title="Chi tiết yêu cầu báo cáo văn bản" width={800} open={!!dangXemId} onClose={() => setDangXemId(null)}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Typography.Title level={5}>Giao cho các đơn vị</Typography.Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Select
                mode="multiple"
                style={{ width: '100%' }}
                placeholder="Chọn đơn vị phải nộp"
                value={donViDaGiao}
                onChange={setDonViDaGiao}
                options={donViList?.map((dv) => ({ value: dv.id, label: dv.tenDonVi }))}
              />
              <Button onClick={onGiaoDonVi} loading={giaoDonVi.isPending}>
                Lưu đơn vị được giao
              </Button>
            </Space>
          </div>

          {tongHop && (
            <div>
              <Row gutter={16} style={{ margin: '16px 0' }}>
                <Col xs={24} sm={8}>
                  <Statistic title="Tổng đơn vị" value={tongHop.thongKe.tongDonVi} />
                </Col>
                <Col xs={24} sm={8}>
                  <Statistic title="Đã nộp" value={tongHop.thongKe.daNop} valueStyle={{ color: '#3f8600' }} />
                </Col>
                <Col xs={24} sm={8}>
                  <Statistic title="Chưa nộp" value={tongHop.thongKe.chuaNop} valueStyle={{ color: '#cf1322' }} />
                </Col>
              </Row>
              <Space style={{ marginBottom: 12 }}>
                <Button icon={<FileExcelOutlined />} onClick={() => dangXemId && taiExcelVanBan(dangXemId)}>
                  Xuất Excel
                </Button>
                <Button icon={<FileZipOutlined />} onClick={() => dangXemId && taiZipVanBan(dangXemId)}>
                  Tải ZIP
                </Button>
                <Button icon={<BellOutlined />} onClick={onNhacNop} loading={nhacNop.isPending}>
                  Gửi nhắc nộp
                </Button>
              </Space>
              <Table
                scroll={{ x: 'max-content' }}
                rowKey={(r) => r.donVi.id}
                dataSource={tongHop.items}
                pagination={false}
                columns={[
                  { title: 'Đơn vị', dataIndex: ['donVi', 'tenDonVi'] },
                  { title: 'Trạng thái', dataIndex: 'trangThai', render: (v) => <Tag color={TRANG_THAI_COLOR[v]}>{TRANG_THAI_LABEL[v] ?? v}</Tag> },
                  { title: 'Thời gian nộp', dataIndex: 'thoiGianNop', render: (v) => (v ? new Date(v).toLocaleString('vi-VN') : '—') },
                  { title: 'Người nộp', dataIndex: ['nguoiNop', 'hoTen'] },
                  { title: 'Số file', dataIndex: 'soFile' },
                ]}
              />
            </div>
          )}
        </Space>
      </Drawer>
    </div>
  );
}
