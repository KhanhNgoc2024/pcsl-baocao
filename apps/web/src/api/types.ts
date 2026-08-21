export type MaVaiTro = 'SYS_ADMIN' | 'UNIT_ADMIN' | 'REPORTER' | 'APPROVER' | 'VIEWER';

export type LoaiDonVi = 'CONG_TY' | 'PHONG' | 'BAN_QLDA' | 'DIEN_LUC' | 'XI_NGHIEP' | 'TRUNG_TAM';
export type ChuKy = 'THANG' | 'QUY' | 'NAM';
export type LoaiNhap = 'BIEU_MAU' | 'TAI_FILE' | 'CA_HAI';
export type TrangThaiBaoCaoNop = 'CHUA_NOP' | 'NHAP' | 'CHO_DUYET_DON_VI' | 'DA_NOP' | 'DA_DUYET' | 'TRA_LAI';
export type CheDoBaoCaoVanBan = 'CHO_PHEP_TAI_LEN' | 'CHI_XEM';
export type TrangThaiBcvbNop = 'CHUA_NOP' | 'DA_NOP';

export interface DonVi {
  id: number;
  maDonVi: string;
  tenDonVi: string;
  loaiDonVi: LoaiDonVi;
  laDauMoi: boolean;
  donViChaId: number | null;
  thuTu: number;
  trangThai: 'HOAT_DONG' | 'NGUNG';
}

export interface NguoiDung {
  id: number;
  tenDangNhap: string;
  hoTen: string;
  email: string | null;
  donViId: number;
  donVi?: DonVi;
  trangThai: 'HOAT_DONG' | 'NGUNG';
  vaiTro: MaVaiTro[];
}

export interface TruongBieuMau {
  ma: string;
  nhan: string;
  kieu: 'text' | 'so' | 'ngay' | 'chon_1' | 'chon_nhieu' | 'van_ban_dai' | 'bang' | 'nhom';
  bat_buoc?: boolean;
  don_vi_tinh?: string;
  tuy_chon?: string[];
  cot?: { ma: string; nhan: string; kieu: string; tong?: boolean }[]; // dùng khi kieu = 'bang'
  dong?: { ma: string; nhan: string }[]; // dùng khi kieu = 'bang': nếu có, bảng có danh sách dòng cố định (vd Viettel, VNPT...), người nộp không thêm/xoá được dòng
  con?: { ma: string; nhan: string; kieu: 'text' | 'so' }[]; // dùng khi kieu = 'nhom': nhiều nhãn/mã con dùng chung 1 trường cha
}

export interface CauHinhBieuMau {
  tieu_de: string;
  truong: TruongBieuMau[];
}

export interface QuyTacHan {
  moc: 'dau_ky' | 'sau_ky';
  so_ngay: number;
}

export interface MauBaoCao {
  id: number;
  ma: string;
  ten: string;
  moTa: string | null;
  donViTaoId: number;
  donViTao?: DonVi;
  chuKy: ChuKy;
  loaiNhap: LoaiNhap;
  cauHinhBieuMau: CauHinhBieuMau | null;
  fileMauId: number | null;
  quyTacHan: QuyTacHan;
  canDuyet: boolean;
  tuDongSinhKy: boolean;
  trangThai: 'HOAT_DONG' | 'NGUNG';
  donViGiao?: { donViId: number; donVi: DonVi }[];
}

export interface KyBaoCao {
  id: number;
  mauBaoCaoId: number;
  mauBaoCao?: MauBaoCao;
  nam: number;
  kySo: number;
  tenKy: string;
  ngayBatDau: string;
  ngayKetThuc: string;
  hanNop: string;
  trangThai: 'MO' | 'DANG_MO' | 'DA_DONG';
}

export interface TepDinhKem {
  id: number;
  tenGoc: string;
  loaiFile: 'doc' | 'docx' | 'pdf';
  kichThuoc: string;
  createdAt: string;
}

export interface BaoCaoNop {
  id: number;
  kyBaoCaoId: number;
  kyBaoCao?: KyBaoCao;
  donViId: number;
  donVi?: DonVi;
  nguoiNopId: number | null;
  duLieu: Record<string, unknown> | null;
  trangThai: TrangThaiBaoCaoNop;
  thoiGianNop: string | null;
  treHan: boolean;
  nguoiDuyetId: number | null;
  thoiGianDuyet: string | null;
  ghiChuDuyet: string | null;
  nguoiDuyetDonViId: number | null;
  thoiGianDuyetDonVi: string | null;
  ghiChuDuyetDonVi: string | null;
  tepDinhKem?: TepDinhKem[];
}

export interface TongHopItem {
  donVi: DonVi;
  baoCaoNopId?: number | null;
  bcvbNopId?: number;
  trangThai: string;
  thoiGianNop: string | null;
  treHan: boolean;
  nguoiNop: { id: number; hoTen: string } | null;
  soFile: number;
}

export interface TongHopKy {
  ky: KyBaoCao;
  items: TongHopItem[];
  thongKe: { tongDonVi: number; daNop: number; chuaNop: number; tyLe: number };
}

export interface BaoCaoVanBan {
  id: number;
  ten: string;
  moTa: string | null;
  donViTaoId: number;
  donViTao?: DonVi;
  cheDo: CheDoBaoCaoVanBan;
  hanNop: string;
  fileYeuCauId: number | null;
  trangThai: 'HOAT_DONG' | 'NGUNG';
  donViGiao?: { donViId: number; donVi: DonVi }[];
}

export interface BaoCaoVanBanNop {
  id: number;
  baoCaoVanBanId: number;
  baoCaoVanBan?: BaoCaoVanBan;
  donViId: number;
  nguoiNopId: number | null;
  trangThai: TrangThaiBcvbNop;
  thoiGianNop: string | null;
  treHan: boolean;
  ghiChu: string | null;
  tepDinhKem?: TepDinhKem[];
}

export interface TongHopVanBan {
  baoCaoVanBan: BaoCaoVanBan;
  items: TongHopItem[];
  thongKe: { tongDonVi: number; daNop: number; chuaNop: number; tyLe: number };
}

export interface ThongBao {
  id: number;
  loai: string;
  tieuDe: string;
  noiDung: string | null;
  duongDan: string | null;
  daDoc: boolean;
  createdAt: string;
}
