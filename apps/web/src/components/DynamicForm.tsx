import { Input, InputNumber, DatePicker, Select, Form, Table, Button, Space, Typography, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { CauHinhBieuMau, TruongBieuMau } from '../api/types';

interface Props {
  cauHinh: CauHinhBieuMau;
  value?: Record<string, unknown>;
  onChange?: (value: Record<string, unknown>) => void;
  disabled?: boolean;
}

/** Bảng với danh sách dòng cố định do admin định nghĩa (vd: Viettel, VNPT...) — người nộp chỉ điền giá trị từng ô, không thêm/xoá được dòng. */
function BangDongCoDinhField({
  truong,
  giaTri,
  onChange,
  disabled,
}: {
  truong: TruongBieuMau;
  giaTri: Record<string, Record<string, unknown>>;
  onChange: (giaTri: Record<string, Record<string, unknown>>) => void;
  disabled?: boolean;
}) {
  const cot = truong.cot ?? [];
  const dong = truong.dong ?? [];

  const suaO = (dongMa: string, cotMa: string, val: unknown) => {
    onChange({ ...giaTri, [dongMa]: { ...(giaTri[dongMa] ?? {}), [cotMa]: val } });
  };

  const tong = (cotMa: string) => dong.reduce((s, d) => s + (Number(giaTri[d.ma]?.[cotMa]) || 0), 0);

  return (
    <Table
      scroll={{ x: 'max-content' }}
      rowKey="ma"
      dataSource={dong}
      pagination={false}
      size="small"
      columns={[
        { title: '', dataIndex: 'nhan', fixed: 'left' as const },
        ...cot.map((c) => ({
          title: c.nhan + (c.tong ? ' (tổng)' : ''),
          dataIndex: c.ma,
          render: (_: unknown, d: { ma: string }) =>
            c.kieu === 'so' ? (
              <InputNumber
                value={giaTri[d.ma]?.[c.ma] as number}
                disabled={disabled}
                onChange={(val) => suaO(d.ma, c.ma, val)}
                style={{ width: '100%' }}
              />
            ) : (
              <Input
                value={giaTri[d.ma]?.[c.ma] as string}
                disabled={disabled}
                onChange={(e) => suaO(d.ma, c.ma, e.target.value)}
              />
            ),
        })),
      ]}
      summary={() =>
        cot.some((c) => c.tong) ? (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0}>
              <b>Tổng</b>
            </Table.Summary.Cell>
            {cot.map((c, i) => (
              <Table.Summary.Cell key={c.ma} index={i + 1}>
                {c.tong ? <b>{tong(c.ma)}</b> : ''}
              </Table.Summary.Cell>
            ))}
          </Table.Summary.Row>
        ) : null
      }
    />
  );
}

/** Bảng cho người nộp tự thêm/xoá dòng (hành vi gốc, dùng khi mẫu chưa cấu hình dòng cố định). */
function BangDongTuDoField({
  truong,
  rows,
  onChange,
  disabled,
}: {
  truong: TruongBieuMau;
  rows: Record<string, unknown>[];
  onChange: (rows: Record<string, unknown>[]) => void;
  disabled?: boolean;
}) {
  const cot = truong.cot ?? [];

  const suaODong = (index: number, ma: string, val: unknown) => {
    onChange(rows.map((r, i) => (i === index ? { ...r, [ma]: val } : r)));
  };

  const themDong = () => onChange([...rows, {}]);
  const xoaDong = (index: number) => onChange(rows.filter((_, i) => i !== index));

  const tong = (ma: string) => rows.reduce((s, r) => s + (Number(r[ma]) || 0), 0);

  return (
    <div>
      <Table
        scroll={{ x: 'max-content' }}
        rowKey={(_r, i) => String(i)}
        dataSource={rows}
        pagination={false}
        size="small"
        columns={[
          ...cot.map((c) => ({
            title: c.nhan + (c.tong ? ' (tổng)' : ''),
            dataIndex: c.ma,
            render: (v: unknown, _r: unknown, index: number) =>
              c.kieu === 'so' ? (
                <InputNumber
                  value={v as number}
                  disabled={disabled}
                  onChange={(val) => suaODong(index, c.ma, val)}
                  style={{ width: '100%' }}
                />
              ) : (
                <Input value={v as string} disabled={disabled} onChange={(e) => suaODong(index, c.ma, e.target.value)} />
              ),
          })),
          ...(disabled
            ? []
            : [
                {
                  title: '',
                  key: 'action',
                  width: 50,
                  render: (_: unknown, _r: unknown, index: number) => (
                    <Button danger size="small" icon={<DeleteOutlined />} onClick={() => xoaDong(index)} />
                  ),
                },
              ]),
        ]}
        summary={() =>
          cot.some((c) => c.tong) ? (
            <Table.Summary.Row>
              {cot.map((c) => (
                <Table.Summary.Cell key={c.ma} index={0}>
                  {c.tong ? <b>{tong(c.ma)}</b> : ''}
                </Table.Summary.Cell>
              ))}
              {!disabled && <Table.Summary.Cell index={1} />}
            </Table.Summary.Row>
          ) : null
        }
      />
      {!disabled && (
        <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={themDong} style={{ marginTop: 8 }}>
          Thêm dòng
        </Button>
      )}
    </div>
  );
}

function NhomField({
  truong,
  giaTri,
  onChange,
  disabled,
}: {
  truong: TruongBieuMau;
  giaTri: Record<string, unknown>;
  onChange: (giaTri: Record<string, unknown>) => void;
  disabled?: boolean;
}) {
  const con = truong.con ?? [];

  const suaCon = (ma: string, val: unknown) => {
    onChange({ ...giaTri, [ma]: val });
  };

  return (
    <Space wrap size="middle">
      {con.map((c) => (
        <div key={c.ma}>
          <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>{c.nhan}</div>
          {c.kieu === 'so' ? (
            <InputNumber
              style={{ width: 160 }}
              value={giaTri[c.ma] as number}
              disabled={disabled}
              onChange={(v) => suaCon(c.ma, v)}
            />
          ) : (
            <Input style={{ width: 200 }} value={giaTri[c.ma] as string} disabled={disabled} onChange={(e) => suaCon(c.ma, e.target.value)} />
          )}
        </div>
      ))}
      {con.length === 0 && <Typography.Text type="secondary">Chưa cấu hình nhãn con</Typography.Text>}
    </Space>
  );
}

/** Trường gọn (số/text/ngày/chọn 1) xếp nhiều cột mỗi hàng để đỡ phải cuộn khi mẫu có nhiều trường đơn giản. */
const SPAN_GON = { xs: 24, sm: 12, md: 8 };
const SPAN_VUA = { xs: 24, sm: 12 };
const SPAN_DAY_DU = { xs: 24 };

function spanCuaTruong(kieu: TruongBieuMau['kieu']) {
  if (kieu === 'van_ban_dai' || kieu === 'bang' || kieu === 'nhom') return SPAN_DAY_DU;
  if (kieu === 'chon_nhieu') return SPAN_VUA;
  return SPAN_GON;
}

export function DynamicForm({ cauHinh, value, onChange, disabled }: Props) {
  const duLieu = value ?? {};

  const capNhat = (ma: string, val: unknown) => {
    onChange?.({ ...duLieu, [ma]: val });
  };

  return (
    <Row gutter={[16, 8]}>
      {cauHinh.truong.map((t) => (
        <Col key={t.ma} {...spanCuaTruong(t.kieu)}>
        <Form.Item
          label={t.nhan}
          required={t.bat_buoc}
          layout="vertical"
          style={{ marginBottom: 8 }}
        >
          {t.kieu === 'so' && (
            <InputNumber
              style={{ width: '100%' }}
              addonAfter={t.don_vi_tinh || undefined}
              value={duLieu[t.ma] as number}
              disabled={disabled}
              onChange={(v) => capNhat(t.ma, v)}
            />
          )}
          {t.kieu === 'text' && (
            <Input value={duLieu[t.ma] as string} disabled={disabled} onChange={(e) => capNhat(t.ma, e.target.value)} />
          )}
          {t.kieu === 'van_ban_dai' && (
            <Input.TextArea rows={3} value={duLieu[t.ma] as string} disabled={disabled} onChange={(e) => capNhat(t.ma, e.target.value)} />
          )}
          {t.kieu === 'ngay' && (
            <DatePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              value={duLieu[t.ma] ? dayjs(duLieu[t.ma] as string) : undefined}
              disabled={disabled}
              onChange={(d) => capNhat(t.ma, d ? d.format('YYYY-MM-DD') : undefined)}
            />
          )}
          {t.kieu === 'chon_1' && (
            <Select
              style={{ width: '100%' }}
              value={duLieu[t.ma] as string}
              disabled={disabled}
              options={(t.tuy_chon ?? []).map((o) => ({ value: o, label: o }))}
              onChange={(v) => capNhat(t.ma, v)}
            />
          )}
          {t.kieu === 'chon_nhieu' && (
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              value={(duLieu[t.ma] as string[]) ?? []}
              disabled={disabled}
              options={(t.tuy_chon ?? []).map((o) => ({ value: o, label: o }))}
              onChange={(v) => capNhat(t.ma, v)}
            />
          )}
          {t.kieu === 'bang' && (t.dong ?? []).length > 0 && (
            <BangDongCoDinhField
              truong={t}
              giaTri={(duLieu[t.ma] as Record<string, Record<string, unknown>>) ?? {}}
              onChange={(giaTri) => capNhat(t.ma, giaTri)}
              disabled={disabled}
            />
          )}
          {t.kieu === 'bang' && (t.dong ?? []).length === 0 && (
            <BangDongTuDoField
              truong={t}
              rows={(duLieu[t.ma] as Record<string, unknown>[]) ?? []}
              onChange={(rows) => capNhat(t.ma, rows)}
              disabled={disabled}
            />
          )}
          {t.kieu === 'nhom' && (
            <NhomField
              truong={t}
              giaTri={(duLieu[t.ma] as Record<string, unknown>) ?? {}}
              onChange={(giaTri) => capNhat(t.ma, giaTri)}
              disabled={disabled}
            />
          )}
        </Form.Item>
        </Col>
      ))}
      {cauHinh.truong.length === 0 && (
        <Col span={24}>
          <Typography.Text type="secondary">Mẫu báo cáo này chưa có trường nào.</Typography.Text>
        </Col>
      )}
    </Row>
  );
}
