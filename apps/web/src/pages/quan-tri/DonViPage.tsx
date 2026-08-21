import { useState } from 'react';
import { Table, Button, Tag, Typography, Modal, Form, Input, Select, Switch, Space, App } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { useDonViList, useTaoDonVi, useSuaDonVi, type DonViInput } from '../../api/donVi';
import { LOAI_DON_VI_LABEL } from '../../utils/labels';
import type { DonVi } from '../../api/types';

export function DonViPage() {
  const { data, isLoading } = useDonViList();
  const taoDonVi = useTaoDonVi();
  const suaDonVi = useSuaDonVi();
  const { message } = App.useApp();

  const [modalMo, setModalMo] = useState(false);
  const [dangSua, setDangSua] = useState<DonVi | null>(null);
  const [form] = Form.useForm();

  const moTaoMoi = () => {
    setDangSua(null);
    form.resetFields();
    setModalMo(true);
  };

  const moSua = (dv: DonVi) => {
    setDangSua(dv);
    form.setFieldsValue(dv);
    setModalMo(true);
  };

  const onSubmit = async () => {
    const values = (await form.validateFields()) as DonViInput;
    try {
      if (dangSua) {
        await suaDonVi.mutateAsync({ id: dangSua.id, dto: values });
        message.success('Đã cập nhật đơn vị');
      } else {
        await taoDonVi.mutateAsync(values);
        message.success('Đã tạo đơn vị mới');
      }
      setModalMo(false);
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? 'Có lỗi xảy ra');
    }
  };

  const toggleTrangThai = async (dv: DonVi) => {
    await suaDonVi.mutateAsync({ id: dv.id, dto: { trangThai: dv.trangThai === 'HOAT_DONG' ? 'NGUNG' : 'HOAT_DONG' } });
  };

  return (
    <div>
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Quản trị đơn vị
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={moTaoMoi}>
          Thêm đơn vị
        </Button>
      </Space>
      <Table
        scroll={{ x: 'max-content' }}
        rowKey="id"
        loading={isLoading}
        dataSource={data}
        pagination={false}
        columns={[
          { title: 'Mã đơn vị', dataIndex: 'maDonVi' },
          { title: 'Tên đơn vị', dataIndex: 'tenDonVi' },
          { title: 'Loại', dataIndex: 'loaiDonVi', render: (v) => LOAI_DON_VI_LABEL[v] ?? v },
          { title: 'Đầu mối', dataIndex: 'laDauMoi', render: (v) => (v ? <Tag color="blue">Đầu mối</Tag> : '') },
          {
            title: 'Trạng thái',
            dataIndex: 'trangThai',
            render: (v, dv) => (
              <Switch checked={v === 'HOAT_DONG'} checkedChildren="Hoạt động" unCheckedChildren="Ngừng" onChange={() => toggleTrangThai(dv)} />
            ),
          },
          {
            title: 'Thao tác',
            render: (_, dv) => (
              <Button size="small" icon={<EditOutlined />} onClick={() => moSua(dv)}>
                Sửa
              </Button>
            ),
          },
        ]}
      />

      <Modal
        title={dangSua ? 'Sửa đơn vị' : 'Thêm đơn vị'}
        open={modalMo}
        onCancel={() => setModalMo(false)}
        onOk={onSubmit}
        confirmLoading={taoDonVi.isPending || suaDonVi.isPending}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="maDonVi" label="Mã đơn vị" rules={[{ required: true }]}>
            <Input disabled={!!dangSua} />
          </Form.Item>
          <Form.Item name="tenDonVi" label="Tên đơn vị" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="loaiDonVi" label="Loại đơn vị" rules={[{ required: true }]}>
            <Select options={Object.entries(LOAI_DON_VI_LABEL).map(([value, label]) => ({ value, label }))} />
          </Form.Item>
          <Form.Item name="laDauMoi" label="Là đầu mối (được tạo mẫu báo cáo)" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
