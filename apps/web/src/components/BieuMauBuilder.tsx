import { Button, Card, Checkbox, Input, Select, Space, Typography, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { CauHinhBieuMau, TruongBieuMau } from '../api/types';

const KIEU_OPTIONS = [
  { value: 'text', label: 'Văn bản ngắn' },
  { value: 'so', label: 'Số' },
  { value: 'ngay', label: 'Ngày' },
  { value: 'chon_1', label: 'Chọn 1' },
  { value: 'chon_nhieu', label: 'Chọn nhiều' },
  { value: 'van_ban_dai', label: 'Văn bản dài' },
  { value: 'bang', label: 'Bảng dòng (có tổng)' },
  { value: 'nhom', label: 'Nhóm nhiều nhãn con' },
];

interface Props {
  value?: CauHinhBieuMau;
  onChange?: (value: CauHinhBieuMau) => void;
}

function taoMaTuNhan(nhan: string, index: number): string {
  const chuan = nhan
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return chuan || `truong_${index + 1}`;
}

export function BieuMauBuilder({ value, onChange }: Props) {
  const truong = value?.truong ?? [];

  const capNhat = (truongMoi: TruongBieuMau[]) => {
    onChange?.({ tieu_de: value?.tieu_de ?? '', truong: truongMoi });
  };

  const themTruong = () => {
    const t: TruongBieuMau = { ma: `truong_${truong.length + 1}`, nhan: 'Trường mới', kieu: 'text', bat_buoc: false };
    capNhat([...truong, t]);
  };

  const suaTruong = (index: number, patch: Partial<TruongBieuMau>) => {
    const moi = truong.map((t, i) => (i === index ? { ...t, ...patch } : t));
    capNhat(moi);
  };

  const xoaTruong = (index: number) => {
    capNhat(truong.filter((_, i) => i !== index));
  };

  const themCot = (index: number) => {
    const t = truong[index];
    const cot = t.cot ?? [];
    suaTruong(index, { cot: [...cot, { ma: `cot_${cot.length + 1}`, nhan: 'Cột mới', kieu: 'so', tong: false }] });
  };

  const suaCot = (index: number, cotIndex: number, patch: Partial<NonNullable<TruongBieuMau['cot']>[number]>) => {
    const t = truong[index];
    const cot = (t.cot ?? []).map((c, i) => (i === cotIndex ? { ...c, ...patch } : c));
    suaTruong(index, { cot });
  };

  const xoaCot = (index: number, cotIndex: number) => {
    const t = truong[index];
    suaTruong(index, { cot: (t.cot ?? []).filter((_, i) => i !== cotIndex) });
  };

  const themDongCoDinh = (index: number) => {
    const t = truong[index];
    const dong = t.dong ?? [];
    suaTruong(index, { dong: [...dong, { ma: `dong_${dong.length + 1}`, nhan: 'Dòng mới' }] });
  };

  const suaDongCoDinh = (index: number, dongIndex: number, patch: Partial<NonNullable<TruongBieuMau['dong']>[number]>) => {
    const t = truong[index];
    const dong = (t.dong ?? []).map((d, i) => (i === dongIndex ? { ...d, ...patch } : d));
    suaTruong(index, { dong });
  };

  const xoaDongCoDinh = (index: number, dongIndex: number) => {
    const t = truong[index];
    suaTruong(index, { dong: (t.dong ?? []).filter((_, i) => i !== dongIndex) });
  };

  const themCon = (index: number) => {
    const t = truong[index];
    const con = t.con ?? [];
    suaTruong(index, { con: [...con, { ma: `con_${con.length + 1}`, nhan: 'Nhãn con mới', kieu: 'so' }] });
  };

  const suaCon = (index: number, conIndex: number, patch: Partial<NonNullable<TruongBieuMau['con']>[number]>) => {
    const t = truong[index];
    const con = (t.con ?? []).map((c, i) => (i === conIndex ? { ...c, ...patch } : c));
    suaTruong(index, { con });
  };

  const xoaCon = (index: number, conIndex: number) => {
    const t = truong[index];
    suaTruong(index, { con: (t.con ?? []).filter((_, i) => i !== conIndex) });
  };

  return (
    <div>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {truong.length === 0 && <Empty description="Chưa có trường nào, bấm 'Thêm trường' để bắt đầu" />}
        {truong.map((t, index) => (
          <Card
            key={index}
            size="small"
            title={`Trường ${index + 1}`}
            extra={
              <Button danger size="small" icon={<DeleteOutlined />} onClick={() => xoaTruong(index)}>
                Xoá
              </Button>
            }
          >
            <Space wrap style={{ width: '100%' }}>
              <Input
                addonBefore="Nhãn"
                style={{ width: 240 }}
                value={t.nhan}
                onChange={(e) => suaTruong(index, { nhan: e.target.value, ma: t.ma || taoMaTuNhan(e.target.value, index) })}
              />
              <Input addonBefore="Mã trường" style={{ width: 220 }} value={t.ma} onChange={(e) => suaTruong(index, { ma: e.target.value })} />
              <Select
                style={{ width: 200 }}
                value={t.kieu}
                options={KIEU_OPTIONS}
                onChange={(kieu) => suaTruong(index, { kieu })}
              />
              {t.kieu === 'so' && (
                <Input
                  addonBefore="Đơn vị tính"
                  style={{ width: 160 }}
                  placeholder="vd: cột, sự cố, km"
                  value={t.don_vi_tinh}
                  onChange={(e) => suaTruong(index, { don_vi_tinh: e.target.value })}
                />
              )}
              <Checkbox checked={t.bat_buoc} onChange={(e) => suaTruong(index, { bat_buoc: e.target.checked })}>
                Bắt buộc
              </Checkbox>
            </Space>

            {(t.kieu === 'chon_1' || t.kieu === 'chon_nhieu') && (
              <div style={{ marginTop: 12 }}>
                <Input
                  addonBefore="Danh sách lựa chọn (cách nhau bởi dấu phẩy)"
                  value={(t.tuy_chon ?? []).join(', ')}
                  onChange={(e) => suaTruong(index, { tuy_chon: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                />
              </div>
            )}

            {t.kieu === 'bang' && (
              <div style={{ marginTop: 12, paddingLeft: 16, borderLeft: '2px solid #f0f0f0' }}>
                <Typography.Text type="secondary">Các cột của bảng:</Typography.Text>
                <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
                  {(t.cot ?? []).map((c, cotIndex) => (
                    <Space key={cotIndex} wrap>
                      <Input
                        addonBefore="Nhãn cột"
                        style={{ width: 180 }}
                        value={c.nhan}
                        onChange={(e) => suaCot(index, cotIndex, { nhan: e.target.value })}
                      />
                      <Input
                        addonBefore="Mã cột"
                        style={{ width: 160 }}
                        value={c.ma}
                        onChange={(e) => suaCot(index, cotIndex, { ma: e.target.value })}
                      />
                      <Select
                        style={{ width: 140 }}
                        value={c.kieu}
                        options={[{ value: 'text', label: 'Văn bản' }, { value: 'so', label: 'Số' }]}
                        onChange={(kieu) => suaCot(index, cotIndex, { kieu })}
                      />
                      <Checkbox checked={c.tong} onChange={(e) => suaCot(index, cotIndex, { tong: e.target.checked })}>
                        Tính tổng khi xuất Excel
                      </Checkbox>
                      <Button danger size="small" icon={<DeleteOutlined />} onClick={() => xoaCot(index, cotIndex)} />
                    </Space>
                  ))}
                  <Button size="small" icon={<PlusOutlined />} onClick={() => themCot(index)}>
                    Thêm cột
                  </Button>
                </Space>

                <Typography.Text type="secondary" style={{ display: 'block', marginTop: 16 }}>
                  Các dòng cố định của bảng (tuỳ chọn — để trống nếu muốn người nộp tự thêm/xoá dòng; vd: Viettel, VNPT, FPT, Mobiphone):
                </Typography.Text>
                <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
                  {(t.dong ?? []).map((d, dongIndex) => (
                    <Space key={dongIndex} wrap>
                      <Input
                        addonBefore="Nhãn dòng"
                        style={{ width: 180 }}
                        value={d.nhan}
                        onChange={(e) =>
                          suaDongCoDinh(index, dongIndex, {
                            nhan: e.target.value,
                            ma: d.ma || taoMaTuNhan(e.target.value, dongIndex),
                          })
                        }
                      />
                      <Input
                        addonBefore="Mã dòng"
                        style={{ width: 160 }}
                        value={d.ma}
                        onChange={(e) => suaDongCoDinh(index, dongIndex, { ma: e.target.value })}
                      />
                      <Button danger size="small" icon={<DeleteOutlined />} onClick={() => xoaDongCoDinh(index, dongIndex)} />
                    </Space>
                  ))}
                  <Button size="small" icon={<PlusOutlined />} onClick={() => themDongCoDinh(index)}>
                    Thêm dòng cố định
                  </Button>
                </Space>
              </div>
            )}

            {t.kieu === 'nhom' && (
              <div style={{ marginTop: 12, paddingLeft: 16, borderLeft: '2px solid #f0f0f0' }}>
                <Typography.Text type="secondary">
                  Các nhãn con dùng chung trường "{t.nhan}" (vd: Kế hoạch, Thực hiện):
                </Typography.Text>
                <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
                  {(t.con ?? []).map((c, conIndex) => (
                    <Space key={conIndex} wrap>
                      <Input
                        addonBefore="Nhãn con"
                        style={{ width: 180 }}
                        value={c.nhan}
                        onChange={(e) =>
                          suaCon(index, conIndex, {
                            nhan: e.target.value,
                            ma: c.ma || taoMaTuNhan(e.target.value, conIndex),
                          })
                        }
                      />
                      <Input
                        addonBefore="Mã con"
                        style={{ width: 160 }}
                        value={c.ma}
                        onChange={(e) => suaCon(index, conIndex, { ma: e.target.value })}
                      />
                      <Select
                        style={{ width: 140 }}
                        value={c.kieu}
                        options={[{ value: 'text', label: 'Văn bản' }, { value: 'so', label: 'Số' }]}
                        onChange={(kieu) => suaCon(index, conIndex, { kieu })}
                      />
                      <Button danger size="small" icon={<DeleteOutlined />} onClick={() => xoaCon(index, conIndex)} />
                    </Space>
                  ))}
                  <Button size="small" icon={<PlusOutlined />} onClick={() => themCon(index)}>
                    Thêm nhãn con
                  </Button>
                </Space>
              </div>
            )}
          </Card>
        ))}
        <Button type="dashed" block icon={<PlusOutlined />} onClick={themTruong}>
          Thêm trường
        </Button>
      </Space>
    </div>
  );
}
