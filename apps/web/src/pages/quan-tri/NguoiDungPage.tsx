import { useState } from 'react';
import { Table, Button, Tag, Typography, Modal, Form, Input, Select, Space, App, Switch, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, KeyOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  useNguoiDungList,
  useVaiTroList,
  useTaoNguoiDung,
  useSuaNguoiDung,
  useXoaNguoiDung,
  useDatLaiMatKhau,
  type NguoiDungInput,
} from '../../api/nguoiDung';
import { useDonViList } from '../../api/donVi';
import { useAuthStore, coVaiTro } from '../../auth/store';
import { VAI_TRO_LABEL } from '../../utils/labels';
import type { MaVaiTro, NguoiDung } from '../../api/types';

const VAI_TRO_UNIT_ADMIN_DUOC_GAN: MaVaiTro[] = ['REPORTER', 'APPROVER', 'VIEWER'];
const VAI_TRO_QUAN_TRI: MaVaiTro[] = ['SYS_ADMIN', 'UNIT_ADMIN'];

export function NguoiDungPage() {
  const { data, isLoading } = useNguoiDungList();
  const { data: donViList } = useDonViList();
  const { data: vaiTroList } = useVaiTroList();
  const taoNguoiDung = useTaoNguoiDung();
  const suaNguoiDung = useSuaNguoiDung();
  const xoaNguoiDung = useXoaNguoiDung();
  const datLaiMatKhau = useDatLaiMatKhau();
  const { user: currentUser } = useAuthStore();
  const { message, modal } = App.useApp();

  const laSysAdmin = coVaiTro(currentUser, 'SYS_ADMIN');
  const laTaiKhoanQuanTri = (nd: NguoiDung) => nd.vaiTro.some((v) => VAI_TRO_QUAN_TRI.includes(v as MaVaiTro));
  const coTheThaoTac = (nd: NguoiDung) => laSysAdmin || !laTaiKhoanQuanTri(nd);

  const [modalMo, setModalMo] = useState(false);
  const [dangSua, setDangSua] = useState<NguoiDung | null>(null);
  const [form] = Form.useForm();

  const moTaoMoi = () => {
    setDangSua(null);
    form.resetFields();
    if (!laSysAdmin && currentUser) {
      form.setFieldsValue({ donViId: currentUser.donViId });
    }
    setModalMo(true);
  };

  const moSua = (nd: NguoiDung) => {
    setDangSua(nd);
    form.setFieldsValue(nd);
    setModalMo(true);
  };

  const onSubmit = async () => {
    const values = (await form.validateFields()) as NguoiDungInput;
    try {
      if (dangSua) {
        await suaNguoiDung.mutateAsync({ id: dangSua.id, dto: values });
        message.success('Đã cập nhật người dùng');
      } else {
        await taoNguoiDung.mutateAsync(values);
        message.success('Đã tạo người dùng mới');
      }
      setModalMo(false);
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? 'Có lỗi xảy ra');
    }
  };

  const toggleTrangThai = async (nd: NguoiDung) => {
    await suaNguoiDung.mutateAsync({ id: nd.id, dto: { trangThai: nd.trangThai === 'HOAT_DONG' ? 'NGUNG' : 'HOAT_DONG' } });
  };

  const onXoa = async (id: number) => {
    try {
      await xoaNguoiDung.mutateAsync(id);
      message.success('Đã xoá (vô hiệu hoá) tài khoản');
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? 'Không thể xoá tài khoản');
    }
  };

  const moDatLaiMatKhau = (nd: NguoiDung) => {
    let matKhauMoi = '';
    modal.confirm({
      title: `Đặt lại mật khẩu cho ${nd.hoTen}`,
      content: (
        <Input.Password placeholder="Mật khẩu mới (tối thiểu 6 ký tự)" onChange={(e) => (matKhauMoi = e.target.value)} />
      ),
      onOk: async () => {
        if (matKhauMoi.length < 6) {
          message.error('Mật khẩu tối thiểu 6 ký tự');
          return Promise.reject();
        }
        await datLaiMatKhau.mutateAsync({ id: nd.id, matKhauMoi });
        message.success('Đã đặt lại mật khẩu');
      },
    });
  };

  return (
    <div>
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Quản trị người dùng
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={moTaoMoi}>
          Thêm người dùng
        </Button>
      </Space>
      <Table
        scroll={{ x: 'max-content' }}
        rowKey="id"
        loading={isLoading}
        dataSource={data}
        pagination={{ pageSize: 20 }}
        columns={[
          { title: 'Tên đăng nhập', dataIndex: 'tenDangNhap' },
          { title: 'Họ tên', dataIndex: 'hoTen' },
          { title: 'Đơn vị', dataIndex: ['donVi', 'tenDonVi'] },
          {
            title: 'Vai trò',
            dataIndex: 'vaiTro',
            render: (roles: string[]) => roles.map((r) => <Tag key={r}>{VAI_TRO_LABEL[r] ?? r}</Tag>),
          },
          {
            title: 'Trạng thái',
            dataIndex: 'trangThai',
            render: (v, nd) => (
              <Switch
                checked={v === 'HOAT_DONG'}
                checkedChildren="Hoạt động"
                unCheckedChildren="Ngừng"
                disabled={!coTheThaoTac(nd)}
                onChange={() => toggleTrangThai(nd)}
              />
            ),
          },
          {
            title: 'Thao tác',
            render: (_, nd) =>
              !coTheThaoTac(nd) ? (
                <Typography.Text type="secondary">—</Typography.Text>
              ) : (
                <Space>
                  <Button size="small" icon={<EditOutlined />} onClick={() => moSua(nd)}>
                    Sửa
                  </Button>
                  <Button size="small" icon={<KeyOutlined />} onClick={() => moDatLaiMatKhau(nd)}>
                    Đặt lại mật khẩu
                  </Button>
                  {nd.id !== currentUser?.id && (
                    <Popconfirm
                      title="Xoá tài khoản này?"
                      description="Tài khoản sẽ bị vô hiệu hoá (không đăng nhập được), lịch sử dữ liệu liên quan vẫn được giữ lại."
                      okText="Xoá"
                      okButtonProps={{ danger: true }}
                      cancelText="Huỷ"
                      onConfirm={() => onXoa(nd.id)}
                    >
                      <Button size="small" danger icon={<DeleteOutlined />} loading={xoaNguoiDung.isPending}>
                        Xoá
                      </Button>
                    </Popconfirm>
                  )}
                </Space>
              ),
          },
        ]}
      />

      <Modal
        title={dangSua ? 'Sửa người dùng' : 'Thêm người dùng'}
        open={modalMo}
        onCancel={() => setModalMo(false)}
        onOk={onSubmit}
        confirmLoading={taoNguoiDung.isPending || suaNguoiDung.isPending}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="tenDangNhap" label="Tên đăng nhập" rules={[{ required: true }]}>
            <Input disabled={!!dangSua} />
          </Form.Item>
          {!dangSua && (
            <Form.Item name="matKhau" label="Mật khẩu" rules={[{ required: true, min: 6 }]}>
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item name="hoTen" label="Họ tên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input />
          </Form.Item>
          <Form.Item name="donViId" label="Đơn vị" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              disabled={!laSysAdmin}
              options={donViList?.map((dv) => ({ value: dv.id, label: dv.tenDonVi }))}
            />
          </Form.Item>
          <Form.Item name="vaiTro" label="Vai trò" rules={[{ required: true }]}>
            <Select
              mode="multiple"
              options={vaiTroList
                ?.filter((vt) => laSysAdmin || VAI_TRO_UNIT_ADMIN_DUOC_GAN.includes(vt.ma))
                .map((vt) => ({ value: vt.ma, label: VAI_TRO_LABEL[vt.ma] ?? vt.ten }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
