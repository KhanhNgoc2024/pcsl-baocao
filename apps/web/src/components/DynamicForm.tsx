import { useEffect, useState } from 'react';
import { Input, InputNumber, DatePicker, Select, Form, Table, Button, Space, Typography, Row, Col, Modal } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { CauHinhBieuMau, TruongBieuMau } from '../api/types';

interface Props {
  cauHinh: CauHinhBieuMau;
  value?: Record<string, unknown>;
  onChange?: (value: Record<string, unknown>) => void;
  disabled?: boolean;
}

type CotBang = NonNullable<TruongBieuMau['cot']>[number];

function hienThiGiaTri(v: unknown): string {
  if (v === undefined || v === null || v === '') return '—';
  return String(v);
}

/** Cửa sổ nhập liệu 1 dòng của bảng — mỗi cột 1 ô riêng, xếp dọc, dễ nhập hơn nhiều so với sửa trực tiếp trong bảng nhiều cột. */
function SuaDongBangModal({
  open,
  tieuDe,
  cot,
  giaTriBanDau,
  onLuu,
  onDong,
}: {
  open: boolean;
  tieuDe: string;
  cot: CotBang[];
  giaTriBanDau: Record<string, unknown>;
  onLuu: (giaTri: Record<string, unknown>) => void;
  onDong: () => void;
}) {
  const [giaTri, setGiaTri] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (open) setGiaTri(giaTriBanDau);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const suaO = (ma: string, val: unknown) => setGiaTri((g) => ({ ...g, [ma]: val }));

  return (
    <Modal
      title={tieuDe}
      open={open}
      onCancel={onDong}
      onOk={() => {
        onLuu(giaTri);
        onDong();
      }}
      okText="Lưu"
      cancelText="Huỷ"
      destroyOnHidden
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {cot.map((c, i) => (
          <Form.Item key={c.ma} label={c.nhan} style={{ marginBottom: 0 }}>
            {c.kieu === 'so' ? (
              <InputNumber
                style={{ width: '100%' }}
                autoFocus={i === 0}
                value={giaTri[c.ma] as number}
                onChange={(v) => suaO(c.ma, v)}
              />
            ) : (
              <Input autoFocus={i === 0} value={giaTri[c.ma] as string} onChange={(e) => suaO(c.ma, e.target.value)} />
            )}
          </Form.Item>
        ))}
      </Space>
    </Modal>
  );
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
  const [dongDangSua, setDongDangSua] = useState<{ ma: string; nhan: string } | null>(null);

  const tong = (cotMa: string) => dong.reduce((s, d) => s + (Number(giaTri[d.ma]?.[cotMa]) || 0), 0);

  return (
    <>
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
            render: (_: unknown, d: { ma: string }) => hienThiGiaTri(giaTri[d.ma]?.[c.ma]),
          })),
          ...(disabled
            ? []
            : [
                {
                  title: '',
                  key: 'action',
                  width: 90,
                  render: (_: unknown, d: { ma: string; nhan: string }) => (
                    <Button size="small" icon={<EditOutlined />} onClick={() => setDongDangSua(d)}>
                      Sửa
                    </Button>
                  ),
                },
              ]),
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
              {!disabled && <Table.Summary.Cell index={cot.length + 1} />}
            </Table.Summary.Row>
          ) : null
        }
      />
      <SuaDongBangModal
        open={!!dongDangSua}
        tieuDe={dongDangSua?.nhan ?? ''}
        cot={cot}
        giaTriBanDau={(dongDangSua && giaTri[dongDangSua.ma]) || {}}
        onDong={() => setDongDangSua(null)}
        onLuu={(giaTriMoi) => {
          if (!dongDangSua) return;
          onChange({ ...giaTri, [dongDangSua.ma]: giaTriMoi });
        }}
      />
    </>
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
  const [indexDangSua, setIndexDangSua] = useState<number | null>(null);
  const dangThemMoi = indexDangSua === rows.length;

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
            render: (v: unknown) => hienThiGiaTri(v),
          })),
          ...(disabled
            ? []
            : [
                {
                  title: '',
                  key: 'action',
                  width: 120,
                  render: (_: unknown, _r: unknown, index: number) => (
                    <Space>
                      <Button size="small" icon={<EditOutlined />} onClick={() => setIndexDangSua(index)} />
                      <Button danger size="small" icon={<DeleteOutlined />} onClick={() => xoaDong(index)} />
                    </Space>
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
        <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => setIndexDangSua(rows.length)} style={{ marginTop: 8 }}>
          Thêm dòng
        </Button>
      )}
      <SuaDongBangModal
        open={indexDangSua !== null}
        tieuDe={dangThemMoi ? 'Thêm dòng mới' : `Sửa dòng ${(indexDangSua ?? 0) + 1}`}
        cot={cot}
        giaTriBanDau={(indexDangSua !== null && rows[indexDangSua]) || {}}
        onDong={() => setIndexDangSua(null)}
        onLuu={(giaTriMoi) => {
          if (indexDangSua === null) return;
          if (dangThemMoi) {
            onChange([...rows, giaTriMoi]);
          } else {
            onChange(rows.map((r, i) => (i === indexDangSua ? giaTriMoi : r)));
          }
        }}
      />
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
