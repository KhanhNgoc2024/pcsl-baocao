import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { List, Typography, Button, Tag, Space, Badge } from 'antd';
import { useThongBaoList, useDanhDauDaDoc, useDanhDauTatCaDaDoc } from '../../api/thongBao';
import type { ThongBao } from '../../api/types';

const LOAI_LABEL: Record<string, string> = {
  GIAO_MAU: 'Giao mẫu',
  MO_KY: 'Mở kỳ',
  SAP_DEN_HAN: 'Sắp đến hạn',
  DA_DEN_HAN: 'Đã đến hạn',
  QUA_HAN: 'Quá hạn',
  CHO_DUYET_DON_VI: 'Chờ duyệt đơn vị',
  DA_NOP: 'Đã nộp',
  TRA_LAI: 'Trả lại',
  KHAC: 'Khác',
};

export function ThongBaoPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useThongBaoList(page);
  const danhDauDaDoc = useDanhDauDaDoc();
  const danhDauTatCa = useDanhDauTatCaDaDoc();
  const navigate = useNavigate();

  const onClick = (tb: ThongBao) => {
    if (!tb.daDoc) danhDauDaDoc.mutate(tb.id);
    if (tb.duongDan) navigate(tb.duongDan);
  };

  return (
    <div>
      <Space style={{ marginBottom: 16, justifyContent: 'space-between', width: '100%' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Thông báo
        </Typography.Title>
        <Button onClick={() => danhDauTatCa.mutate()} loading={danhDauTatCa.isPending}>
          Đánh dấu tất cả đã đọc
        </Button>
      </Space>

      <List
        loading={isLoading}
        dataSource={data?.items}
        pagination={{
          current: page,
          pageSize: data?.pageSize ?? 20,
          total: data?.total,
          onChange: setPage,
        }}
        renderItem={(tb) => (
          <List.Item
            style={{ cursor: 'pointer', background: tb.daDoc ? undefined : '#e6f4ff', padding: 12 }}
            onClick={() => onClick(tb)}
          >
            <List.Item.Meta
              avatar={!tb.daDoc ? <Badge status="processing" /> : undefined}
              title={
                <Space>
                  <Tag>{LOAI_LABEL[tb.loai] ?? tb.loai}</Tag>
                  {tb.tieuDe}
                </Space>
              }
              description={
                <>
                  <div>{tb.noiDung}</div>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {new Date(tb.createdAt).toLocaleString('vi-VN')}
                  </Typography.Text>
                </>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
}
