import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  Button,
  Card,
  Typography,
  Space,
  Table,
  Tag,
  Upload,
  App,
  Popconfirm,
} from 'antd';
import { UploadOutlined, PlusOutlined, LineChartOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  useMauBaoCaoDetail,
  useTaoMauBaoCao,
  useSuaMauBaoCao,
  useXoaMauBaoCao,
  useGiaoDonVi,
  useMoKy,
  useKyList,
  type MauBaoCaoInput,
} from '../../api/mauBaoCao';
import { useDonViList } from '../../api/donVi';
import { useUploadTep } from '../../api/tep';
import { BieuMauBuilder } from '../../components/BieuMauBuilder';
import { CHU_KY_LABEL, LOAI_NHAP_LABEL } from '../../utils/labels';

export function MauBaoCaoDetailPage() {
  const { id } = useParams();
  const isNew = id === 'moi';
  const mauId = isNew ? undefined : Number(id);
  const navigate = useNavigate();
  const { message } = App.useApp();

  const { data: mau } = useMauBaoCaoDetail(mauId);
  const { data: donViList } = useDonViList();
  const { data: kyList } = useKyList(mauId);

  const taoMau = useTaoMauBaoCao();
  const suaMau = useSuaMauBaoCao();
  const xoaMau = useXoaMauBaoCao();
  const giaoDonVi = useGiaoDonVi();
  const moKy = useMoKy();
  const uploadTep = useUploadTep();

  const [form] = Form.useForm();
  const loaiNhap = Form.useWatch('loaiNhap', form);
  const [donViDaGiao, setDonViDaGiao] = useState<number[]>([]);
  const [fileMauId, setFileMauId] = useState<number | undefined>();

  useEffect(() => {
    if (mau) {
      form.setFieldsValue(mau);
      setDonViDaGiao(mau.donViGiao?.map((g) => g.donViId) ?? []);
      setFileMauId(mau.fileMauId ?? undefined);
    } else if (isNew) {
      form.setFieldsValue({ chuKy: 'THANG', loaiNhap: 'BIEU_MAU', quyTacHan: { moc: 'sau_ky', so_ngay: 5 }, canDuyet: false, tuDongSinhKy: true });
    }
  }, [mau, isNew, form]);

  const onLuu = async () => {
    const values = (await form.validateFields()) as MauBaoCaoInput;
    const dto = { ...values, fileMauId };
    try {
      if (isNew) {
        const res = await taoMau.mutateAsync(dto);
        message.success('Đã tạo mẫu báo cáo');
        navigate(`/mau-bao-cao/${res.data.id}`, { replace: true });
      } else if (mauId) {
        await suaMau.mutateAsync({ id: mauId, dto });
        message.success('Đã lưu thay đổi');
      }
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? 'Có lỗi xảy ra');
    }
  };

  const onGiaoDonVi = async () => {
    if (!mauId) return;
    await giaoDonVi.mutateAsync({ id: mauId, donViIds: donViDaGiao });
    message.success('Đã cập nhật đơn vị được giao');
  };

  const onXoa = async () => {
    if (!mauId) return;
    try {
      await xoaMau.mutateAsync(mauId);
      message.success('Đã xoá mẫu báo cáo');
      navigate('/mau-bao-cao', { replace: true });
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? 'Không thể xoá mẫu báo cáo');
    }
  };

  const onMoKy = async () => {
    if (!mauId) return;
    try {
      await moKy.mutateAsync({ id: mauId });
      message.success('Đã mở kỳ mới');
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? 'Không thể mở kỳ');
    }
  };

  return (
    <div>
      <Space style={{ justifyContent: 'space-between', width: '100%', marginBottom: 8 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {isNew ? 'Tạo mẫu báo cáo' : `Mẫu báo cáo: ${mau?.ten ?? ''}`}
        </Typography.Title>
        {!isNew && mauId && (
          <Popconfirm
            title="Xoá mẫu báo cáo này?"
            description="Chỉ xoá được khi mẫu chưa có kỳ báo cáo nào."
            okText="Xoá"
            okButtonProps={{ danger: true }}
            cancelText="Huỷ"
            onConfirm={onXoa}
          >
            <Button danger icon={<DeleteOutlined />} loading={xoaMau.isPending}>
              Xoá mẫu báo cáo
            </Button>
          </Popconfirm>
        )}
      </Space>

      <Card title="Thông tin mẫu báo cáo" style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical">
          <Space wrap style={{ width: '100%' }}>
            <Form.Item name="ma" label="Mã mẫu" rules={[{ required: true }]}>
              <Input style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="ten" label="Tên mẫu báo cáo" rules={[{ required: true }]}>
              <Input style={{ width: 360 }} />
            </Form.Item>
          </Space>
          <Form.Item name="moTa" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Space wrap style={{ width: '100%' }}>
            <Form.Item name="chuKy" label="Chu kỳ" rules={[{ required: true }]}>
              <Select style={{ width: 160 }} options={Object.entries(CHU_KY_LABEL).map(([value, label]) => ({ value, label }))} />
            </Form.Item>
            <Form.Item name="loaiNhap" label="Cách nộp" rules={[{ required: true }]}>
              <Select style={{ width: 220 }} options={Object.entries(LOAI_NHAP_LABEL).map(([value, label]) => ({ value, label }))} />
            </Form.Item>
            <Form.Item label="Mốc tính hạn nộp" required>
              <Space.Compact>
                <Form.Item name={['quyTacHan', 'moc']} noStyle rules={[{ required: true }]}>
                  <Select
                    style={{ width: 160 }}
                    options={[
                      { value: 'sau_ky', label: 'Sau khi kết thúc kỳ' },
                      { value: 'dau_ky', label: 'Từ đầu kỳ' },
                    ]}
                  />
                </Form.Item>
                <Form.Item name={['quyTacHan', 'so_ngay']} noStyle rules={[{ required: true }]}>
                  <InputNumber min={0} addonAfter="ngày" style={{ width: 140 }} />
                </Form.Item>
              </Space.Compact>
            </Form.Item>
            <Form.Item name="canDuyet" label="Cần duyệt sau khi nộp" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="tuDongSinhKy" label="Tự động sinh kỳ mới" valuePropName="checked">
              <Switch />
            </Form.Item>
            {!isNew && (
              <Form.Item
                name="trangThai"
                label="Trạng thái"
                valuePropName="checked"
                getValueProps={(v) => ({ checked: v === 'HOAT_DONG' })}
                getValueFromEvent={(checked: boolean) => (checked ? 'HOAT_DONG' : 'NGUNG')}
              >
                <Switch checkedChildren="Hoạt động" unCheckedChildren="Ngừng" />
              </Form.Item>
            )}
          </Space>

          {(loaiNhap === 'BIEU_MAU' || loaiNhap === 'CA_HAI') && (
            <Form.Item name="cauHinhBieuMau" label="Thiết kế biểu mẫu số liệu">
              <BieuMauBuilder />
            </Form.Item>
          )}

          {(loaiNhap === 'TAI_FILE' || loaiNhap === 'CA_HAI') && (
            <Form.Item label="File mẫu trống (tuỳ chọn, để đơn vị tải về điền)">
              <Upload
                beforeUpload={async (file) => {
                  const tep = await uploadTep.mutateAsync({ file, loaiLienKet: 'file_mau' });
                  setFileMauId(tep.id);
                  message.success(`Đã tải lên: ${tep.tenGoc}`);
                  return false;
                }}
                maxCount={1}
                accept=".doc,.docx,.pdf"
              >
                <Button icon={<UploadOutlined />}>Tải file mẫu lên</Button>
              </Upload>
            </Form.Item>
          )}

          <Button type="primary" onClick={onLuu} loading={taoMau.isPending || suaMau.isPending}>
            {isNew ? 'Tạo mẫu báo cáo' : 'Lưu thay đổi'}
          </Button>
        </Form>
      </Card>

      {!isNew && mauId && (
        <>
          <Card title="Giao cho các đơn vị" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Select
                mode="multiple"
                style={{ width: '100%' }}
                placeholder="Chọn đơn vị phải nộp báo cáo này"
                value={donViDaGiao}
                onChange={setDonViDaGiao}
                options={donViList?.map((dv) => ({ value: dv.id, label: dv.tenDonVi }))}
              />
              <Button onClick={onGiaoDonVi} loading={giaoDonVi.isPending}>
                Lưu đơn vị được giao
              </Button>
            </Space>
          </Card>

          <Card
            title="Các kỳ báo cáo"
            extra={
              <Space>
                <Link to={`/mau-bao-cao/${mauId}/tong-hop-nam`}>
                  <Button icon={<LineChartOutlined />}>Xem tổng hợp theo năm</Button>
                </Link>
                <Button type="primary" icon={<PlusOutlined />} onClick={onMoKy} loading={moKy.isPending}>
                  Mở kỳ mới
                </Button>
              </Space>
            }
          >
            <Table
              scroll={{ x: 'max-content' }}
              rowKey="id"
              dataSource={kyList}
              pagination={false}
              columns={[
                { title: 'Kỳ', dataIndex: 'tenKy', render: (v, ky) => <Link to={`/ky/${ky.id}`}>{v}</Link> },
                { title: 'Hạn nộp', dataIndex: 'hanNop', render: (v) => new Date(v).toLocaleDateString('vi-VN') },
                {
                  title: 'Trạng thái',
                  dataIndex: 'trangThai',
                  render: (v) => <Tag color={v === 'DA_DONG' ? 'default' : 'blue'}>{v === 'DA_DONG' ? 'Đã đóng' : 'Đang mở'}</Tag>,
                },
              ]}
            />
          </Card>
        </>
      )}
    </div>
  );
}
