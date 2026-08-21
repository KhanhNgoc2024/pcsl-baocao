/** Mô tả 1 trường số có thể so sánh/tổng hợp qua các kỳ hoặc các đơn vị: trường kiểu "so", nhãn con kiểu "so" trong "nhom", hoặc cột "tong" trong bảng. */
export interface TruongSoMoTa {
  ma: string;
  nhan: string;
  layGiaTri: (duLieu: Record<string, any> | null | undefined) => number;
}

/** Rút ra danh sách các trường số (kiểu "so", "nhom.con[].so", "bang" cột tong) từ cấu hình biểu mẫu, để so sánh/tổng hợp qua các kỳ. */
export function layDanhSachTruongSo(truongList: any[]): TruongSoMoTa[] {
  const ketQua: TruongSoMoTa[] = [];
  for (const t of truongList ?? []) {
    if (t.kieu === 'so') {
      ketQua.push({ ma: t.ma, nhan: t.nhan, layGiaTri: (d) => Number(d?.[t.ma]) || 0 });
    } else if (t.kieu === 'nhom') {
      for (const c of t.con ?? []) {
        if (c.kieu !== 'so') continue;
        const ma = `${t.ma}.${c.ma}`;
        ketQua.push({ ma, nhan: `${t.nhan} - ${c.nhan}`, layGiaTri: (d) => Number(d?.[t.ma]?.[c.ma]) || 0 });
      }
    } else if (t.kieu === 'bang') {
      const dongCoDinh: { ma: string }[] = t.dong ?? [];
      for (const c of t.cot ?? []) {
        if (!c.tong) continue;
        const ma = `${t.ma}.${c.ma}`;
        ketQua.push({
          ma,
          nhan: `${t.nhan} - ${c.nhan}`,
          layGiaTri: (d) => {
            const giaTriTruong = d?.[t.ma];
            if (!giaTriTruong) return 0;
            if (dongCoDinh.length > 0) {
              return dongCoDinh.reduce((sum, dg) => sum + (Number(giaTriTruong?.[dg.ma]?.[c.ma]) || 0), 0);
            }
            if (Array.isArray(giaTriTruong)) {
              return giaTriTruong.reduce((sum: number, r: any) => sum + (Number(r?.[c.ma]) || 0), 0);
            }
            return 0;
          },
        });
      }
    }
  }
  return ketQua;
}

/** Cộng dồn giá trị các trường số qua danh sách bản nộp (dùng chung cho tổng hợp theo đơn vị trong 1 kỳ hoặc theo kỳ). */
export function tinhTongGiaTriTruongSo(
  truongSo: TruongSoMoTa[],
  baoCaoNopList: { duLieu: unknown }[],
): Record<string, number> {
  const giaTri: Record<string, number> = {};
  for (const t of truongSo) {
    giaTri[t.ma] = baoCaoNopList.reduce((sum, b) => sum + t.layGiaTri((b.duLieu as Record<string, any>) ?? {}), 0);
  }
  return giaTri;
}
