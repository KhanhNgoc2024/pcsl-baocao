import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Table, Tag, Typography, Button, Drawer, Space, Upload, App, List, Popconfirm } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { useBaoCaoVanBanCanNop, useNopVanBan } from '../../api/baoCaoVanBan';
import { useUploadTep, duongDanTaiXuong } from '../../api/tep';

const TRANG_THAI_COLOR: Record<string, string> = { CHUA_NOP: 'default', DA_NOP: 'blue' };
const TRANG_THAI_LABEL: Record<string, string> = { CHUA_NOP: 'Chưa nộp', DA_NOP: 'Đã nộp' };

export function BaoCaoVanBanCanNopPage() {
  const { data, isLoading } = useBaoCaoVanBanCanNop();
  const nopVanBan = useNopVanBan();
  const uploadTep = useUploadTep();
  const { message } = App.useApp();
  const qc = useQueryClient();

  const [dangMoId, setDangMoId] = useState<number | null>(null);
  const dangMo = data?.find((n) => n.id === dangMoId) ?? null;
  const cheDo = dangMo?.baoCaoVanBan?.cheDo;
  const chiCoTheXem = cheDo === 'CHI_XEM' || dangMo?.trangThai === 'DA_NOP';

  const onNop = async () => {
    if (!dangMoId) return;
    try {
      await nopVanBan.mutateAsync(dangMoId);
      message.success('Đã nộp báo cáo văn bản');
      setDangMoId(null);
    } catch (err: any) {
      message.error(err?.response?.data?.message ?? 'Có lỗi xảy ra');
    }
  };

  return (
    <div>
      <Typography.Title level={4}>Báo cáo bằng văn bản cần nộp</Typography.Title>
      <Table
        scroll={{ x: 'max-content' }}
        rowKey="id"
        loading={isLoading}
        dataSource={data}
        columns={[
          { title: 'Tên yêu cầu', dataIndex: ['baoCaoVanBan', 'ten'] },
          { title: 'Hạn nộp', dataIndex: ['baoCaoVanBan', 'hanNop'], render: (v) => new Date(v).toLocaleDateString('vi-VN') },
          {
            title: 'Trạng thái',
            dataIndex: 'trangThai',
            render: (v, r) => (
              <Space>
                <Tag color={TRANG_THAI_COLOR[v]}>{TRANG_THAI_LABEL[v] ?? v}</Tag>
                {r.treHan && <Tag color="red">Trễ hạn</Tag>}
              </Space>
            ),
          },
          {
            title: 'Thao tác',
            render: (_, r) => (
              <Button type="link" onClick={() => setDangMoId(r.id)}>
                {r.baoCaoVanBan?.cheDo === 'CHI_XEM' ? 'Xem' : 'Nộp file'}
              </Button>
            ),
          },
        ]}
      />

      <Drawer title={dangMo?.baoCaoVanBan?.ten} width={600} open={!!dangMoId} onClose={() => setDangMoId(null)}>
        <Typography.Title level={5}>File đính kèm</Typography.Title>
        <List
          size="small"
          dataSource={dangMo?.tepDinhKem}
          renderItem={(tep) => (
            <List.Item>
              <a href={duongDanTaiXuong(tep.id)} target="_blank" rel="noreferrer">
                {tep.tenGoc}
              </a>
            </List.Item>
          )}
        />

        {!chiCoTheXem && dangMo && (
          <>
            <Upload.Dragger
              multiple={false}
              showUploadList={false}
              beforeUpload={async (file) => {
                await uploadTep.mutateAsync({ file, loaiLienKet: 'bcvb_nop', lienKetId: dangMo.id });
                await qc.invalidateQueries({ queryKey: ['bao-cao-van-ban-can-nop'] });
                message.success('Đã tải file lên');
                return false;
              }}
              accept=".doc,.docx,.pdf"
              style={{ marginTop: 16 }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p>Kéo thả hoặc bấm để tải file .doc/.docx/.pdf</p>
            </Upload.Dragger>

            <Popconfirm title="Xác nhận nộp báo cáo?" onConfirm={onNop}>
              <Button type="primary" style={{ marginTop: 16 }} loading={nopVanBan.isPending} disabled={!dangMo.tepDinhKem?.length}>
                Nộp báo cáo
              </Button>
            </Popconfirm>
          </>
        )}
      </Drawer>
    </div>
  );
}
