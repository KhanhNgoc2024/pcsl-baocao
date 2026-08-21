import { ChuKy } from '@prisma/client';

export interface QuyTacHan {
  moc: 'dau_ky' | 'sau_ky';
  so_ngay: number;
}

export function soKyTrongNam(chuKy: ChuKy): number {
  if (chuKy === 'THANG') return 12;
  if (chuKy === 'QUY') return 4;
  return 1;
}

/** Trả về khoảng ngày [bắt đầu, kết thúc] (giờ UTC 00:00) của 1 kỳ. */
export function tinhKhoangKy(chuKy: ChuKy, nam: number, kySo: number): { ngayBatDau: Date; ngayKetThuc: Date } {
  if (chuKy === 'THANG') {
    const ngayBatDau = new Date(Date.UTC(nam, kySo - 1, 1));
    const ngayKetThuc = new Date(Date.UTC(nam, kySo, 0));
    return { ngayBatDau, ngayKetThuc };
  }
  if (chuKy === 'QUY') {
    const thangBatDau = (kySo - 1) * 3;
    const ngayBatDau = new Date(Date.UTC(nam, thangBatDau, 1));
    const ngayKetThuc = new Date(Date.UTC(nam, thangBatDau + 3, 0));
    return { ngayBatDau, ngayKetThuc };
  }
  // NAM
  return {
    ngayBatDau: new Date(Date.UTC(nam, 0, 1)),
    ngayKetThuc: new Date(Date.UTC(nam, 11, 31)),
  };
}

/** Tính hạn nộp dựa trên quy_tac_han: mốc = đầu kỳ hoặc sau kỳ (kết thúc kỳ), cộng thêm so_ngay. */
export function tinhHanNop(quyTacHan: QuyTacHan, ngayBatDau: Date, ngayKetThuc: Date): Date {
  const moc = quyTacHan.moc === 'dau_ky' ? ngayBatDau : ngayKetThuc;
  const hanNop = new Date(moc);
  hanNop.setUTCDate(hanNop.getUTCDate() + (quyTacHan.so_ngay ?? 0));
  return hanNop;
}

/** Xác định (năm, kỳ số) hiện tại theo chu kỳ, dùng khi admin không chỉ định kỳ cụ thể. */
export function kyHienTai(chuKy: ChuKy, at: Date = new Date()): { nam: number; kySo: number } {
  const nam = at.getUTCFullYear();
  if (chuKy === 'THANG') return { nam, kySo: at.getUTCMonth() + 1 };
  if (chuKy === 'QUY') return { nam, kySo: Math.floor(at.getUTCMonth() / 3) + 1 };
  return { nam, kySo: 1 };
}

export function tenKyMacDinh(chuKy: ChuKy, nam: number, kySo: number): string {
  if (chuKy === 'THANG') return `Kỳ tháng ${kySo}/${nam}`;
  if (chuKy === 'QUY') return `Kỳ quý ${kySo}/${nam}`;
  return `Kỳ năm ${nam}`;
}
