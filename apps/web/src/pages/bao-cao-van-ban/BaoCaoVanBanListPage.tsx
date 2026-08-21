import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Checkbox,
} from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  FileExcelOutlined,
  FileZipOutlined,
  BellOutlined,
  CheckOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import {
  useBaoCaoVanBanList,
  useTaoBaoCaoVanBan,
  useSuaBaoCaoVanBan,
  useGiaoDonViVanBan,
  useTongHopVanBan,
  useNhacNopVanBan,
  useDuyetVanBanNop,
  taiExcelVanBan,
  taiZipVanBan,
} from '../../api/baoCaoVanBan';
import { useDonViList } from '../../api/donVi';
import { useUploadTep } from '../../api/tep';
import { TRANG_THAI_BCVB_NOP_LABEL } from '../../utils/labels';

const TRANG_THAI_COLOR: Record<string, string> = { CHUA_NOP: 'default', DA_NOP: 'blue', DA_DUYET: 'green', TRA_LAI: 'red' };

export function BaoCaoVanBanListPage() {
  const { data, isLoading } = useBaoCaoVanBanList();
  const [searchParams, setSearchParams] = useSearchParams();
  const taoBcvb = useTaoBaoCaoVanBan();
  const suaBcvb = useSuaBaoCaoVanBan();
  const giaoDonVi = useGiaoDonViVanBan();
  const nhacNop = useNhacNopVanBan();
  const duyetVanBan = useDuyetVanBanNop();
  const uploadTep = useUploadTep();
  const { message, modal } = App.useApp();

  const [modalMo, setModalMo] = useState(false);
  const [form] = Form.useForm();
  const [fileYeuCauId, setFileYeuCauId] = useState<number | undefined>();

  const [dangXemId, setDangXemId] = useState<number | null>(null);
  const [donViDaGiao, setDonViDaGiao] = useState<number[]>([]);
  const { data: donViList } = useDonViList();
  const { data: tongHop, refetch: refetchTongHop } = useTongHopVanBan(dangXemId ?? undefined);

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

  // Mở sẵn chi tiết khi được điều hướng tới từ trang "Tổng hợp báo cáo" kèm ?xem=<id>
  useEffect(() => {
    const xemId = Number(searchParams.get('xem'));
    if (xemId && data) {
      const bcvb = data.find((b) => b.id === xemId);
      if (bcvb) moXem(bcvb.id, bcvb.donViGiao);
      setSearchParams((prev) => {
        prev.delete('xem');
        return prev;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

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

  const onDoiCanDuyet = async (checked: boolean) => {
    if (!dangXemId) return;
    await suaBcvb.mutateAsync({ id: dangXemId, dto: { canDuyet: checked } });
    message.success(checked ? 'Đã bật yêu cầu duyệt sau khi nộp' : 'Đã tắt yêu cầu duyệt sau khi nộp');
  };

  const onDuyet = (bcvbNopId: number) => {
    modal.confirm({
      title: 'Duyệt báo cáo',
      content: 'Xác nhận duyệt báo cáo văn bản này?',
      onOk: async () => {
        await duyetVanBan.mutateAsync({ id: bcvbNopId, ketQua: 'DA_DUYET' });
        message.success('Đã duyệt báo cáo');
        refetchTongHop();
      },
    });
  };

  const onTraLai = (bcvbNopId: number) => {
    let ghiChu = '';
    modal.confirm({
      title: 'Trả lại báo cáo',
      content: <Input.TextArea placeholder="Lý do trả lại" onChange={(e) => (ghiChu = e.target.value)} rows={3} />,
      onOk: async () => {
        await duyetVanBan.mutateAsync({ id: bcvbNopId, ketQua: 'TRA_LAI', ghiChu });
        message.success('Đã trả lại báo cáo');
        refetchTongHop();
      },
    });
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
          { title: 'Cần duyệt', dataIndex: 'canDuyet', render: (v) => (v ? <Tag color="orange">Cần duyệt</Tag> : '') },
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
          <Form.Item name="canDuyet" valuePropName="checked" initialValue={false}>
            <Checkbox>Cần duyệt sau khi nộp</Checkbox>
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
            <Checkbox checked={tongHop?.baoCaoVanBan.canDuyet ?? false} onChange={(e) => onDoiCanDuyet(e.target.checked)}>
              Cần duyệt sau khi nộp
            </Checkbox>
          </div>

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
                  {
                    title: 'Trạng thái',
                    dataIndex: 'trangThai',
                    render: (v) => <Tag color={TRANG_THAI_COLOR[v]}>{TRANG_THAI_BCVB_NOP_LABEL[v] ?? v}</Tag>,
                  },
                  { title: 'Thời gian nộp', dataIndex: 'thoiGianNop', render: (v) => (v ? new Date(v).toLocaleString('vi-VN') : '—') },
                  { title: 'Người nộp', dataIndex: ['nguoiNop', 'hoTen'] },
                  { title: 'Số file', dataIndex: 'soFile' },
                  {
                    title: 'Thao tác',
                    render: (_: unknown, r: NonNullable<typeof tongHop>['items'][number]) =>
                      tongHop.baoCaoVanBan.canDuyet && r.trangThai === 'DA_NOP' && r.bcvbNopId ? (
                        <Space>
                          <Button size="small" icon={<CheckOutlined />} onClick={() => onDuyet(r.bcvbNopId!)}>
                            Duyệt
                          </Button>
                          <Button size="small" danger icon={<RollbackOutlined />} onClick={() => onTraLai(r.bcvbNopId!)}>
                            Trả lại
                          </Button>
                        </Space>
                      ) : null,
                  },
                ]}
              />
            </div>
          )}
        </Space>
      </Drawer>
    </div>
  );
}
