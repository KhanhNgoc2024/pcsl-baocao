-- CreateEnum
CREATE TYPE "LoaiDonVi" AS ENUM ('PHONG', 'BAN_QLDA', 'DIEN_LUC', 'XI_NGHIEP', 'TRUNG_TAM');

-- CreateEnum
CREATE TYPE "TrangThaiDonVi" AS ENUM ('HOAT_DONG', 'NGUNG');

-- CreateEnum
CREATE TYPE "TrangThaiNguoiDung" AS ENUM ('HOAT_DONG', 'NGUNG');

-- CreateEnum
CREATE TYPE "MaVaiTro" AS ENUM ('SYS_ADMIN', 'UNIT_ADMIN', 'REPORTER', 'APPROVER', 'VIEWER');

-- CreateEnum
CREATE TYPE "ChuKy" AS ENUM ('THANG', 'QUY', 'NAM');

-- CreateEnum
CREATE TYPE "LoaiNhap" AS ENUM ('BIEU_MAU', 'TAI_FILE', 'CA_HAI');

-- CreateEnum
CREATE TYPE "TrangThaiMauBaoCao" AS ENUM ('HOAT_DONG', 'NGUNG');

-- CreateEnum
CREATE TYPE "TrangThaiKyBaoCao" AS ENUM ('MO', 'DANG_MO', 'DA_DONG');

-- CreateEnum
CREATE TYPE "TrangThaiBaoCaoNop" AS ENUM ('CHUA_NOP', 'NHAP', 'DA_NOP', 'DA_DUYET', 'TRA_LAI');

-- CreateEnum
CREATE TYPE "CheDoBaoCaoVanBan" AS ENUM ('CHO_PHEP_TAI_LEN', 'CHI_XEM');

-- CreateEnum
CREATE TYPE "TrangThaiBaoCaoVanBan" AS ENUM ('HOAT_DONG', 'NGUNG');

-- CreateEnum
CREATE TYPE "TrangThaiBcvbNop" AS ENUM ('CHUA_NOP', 'DA_NOP');

-- CreateEnum
CREATE TYPE "LoaiFile" AS ENUM ('docx', 'doc', 'pdf');

-- CreateEnum
CREATE TYPE "LoaiThongBao" AS ENUM ('GIAO_MAU', 'MO_KY', 'SAP_DEN_HAN', 'DA_DEN_HAN', 'QUA_HAN', 'DA_NOP', 'TRA_LAI', 'KHAC');

-- CreateTable
CREATE TABLE "don_vi" (
    "id" SERIAL NOT NULL,
    "ma_don_vi" VARCHAR(20) NOT NULL,
    "ten_don_vi" VARCHAR(255) NOT NULL,
    "loai_don_vi" "LoaiDonVi" NOT NULL,
    "la_dau_moi" BOOLEAN NOT NULL DEFAULT false,
    "don_vi_cha_id" INTEGER,
    "thu_tu" INTEGER NOT NULL DEFAULT 0,
    "trang_thai" "TrangThaiDonVi" NOT NULL DEFAULT 'HOAT_DONG',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "don_vi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vai_tro" (
    "id" SERIAL NOT NULL,
    "ma" "MaVaiTro" NOT NULL,
    "ten" VARCHAR(100) NOT NULL,
    "mo_ta" TEXT,

    CONSTRAINT "vai_tro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nguoi_dung" (
    "id" SERIAL NOT NULL,
    "ten_dang_nhap" VARCHAR(100) NOT NULL,
    "mat_khau_hash" TEXT NOT NULL,
    "refresh_token_hash" TEXT,
    "ho_ten" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "don_vi_id" INTEGER NOT NULL,
    "trang_thai" "TrangThaiNguoiDung" NOT NULL DEFAULT 'HOAT_DONG',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nguoi_dung_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nguoi_dung_vai_tro" (
    "nguoi_dung_id" INTEGER NOT NULL,
    "vai_tro_id" INTEGER NOT NULL,

    CONSTRAINT "nguoi_dung_vai_tro_pkey" PRIMARY KEY ("nguoi_dung_id","vai_tro_id")
);

-- CreateTable
CREATE TABLE "mau_bao_cao" (
    "id" SERIAL NOT NULL,
    "ma" VARCHAR(50) NOT NULL,
    "ten" VARCHAR(255) NOT NULL,
    "mo_ta" TEXT,
    "don_vi_tao_id" INTEGER NOT NULL,
    "chu_ky" "ChuKy" NOT NULL,
    "loai_nhap" "LoaiNhap" NOT NULL,
    "cau_hinh_bieu_mau" JSONB,
    "file_mau_id" INTEGER,
    "quy_tac_han" JSONB NOT NULL,
    "can_duyet" BOOLEAN NOT NULL DEFAULT false,
    "tu_dong_sinh_ky" BOOLEAN NOT NULL DEFAULT true,
    "trang_thai" "TrangThaiMauBaoCao" NOT NULL DEFAULT 'HOAT_DONG',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mau_bao_cao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mau_bao_cao_don_vi" (
    "mau_bao_cao_id" INTEGER NOT NULL,
    "don_vi_id" INTEGER NOT NULL,

    CONSTRAINT "mau_bao_cao_don_vi_pkey" PRIMARY KEY ("mau_bao_cao_id","don_vi_id")
);

-- CreateTable
CREATE TABLE "ky_bao_cao" (
    "id" SERIAL NOT NULL,
    "mau_bao_cao_id" INTEGER NOT NULL,
    "nam" INTEGER NOT NULL,
    "ky_so" INTEGER NOT NULL,
    "ten_ky" VARCHAR(255) NOT NULL,
    "ngay_bat_dau" TIMESTAMP(3) NOT NULL,
    "ngay_ket_thuc" TIMESTAMP(3) NOT NULL,
    "han_nop" TIMESTAMP(3) NOT NULL,
    "trang_thai" "TrangThaiKyBaoCao" NOT NULL DEFAULT 'DANG_MO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ky_bao_cao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bao_cao_nop" (
    "id" SERIAL NOT NULL,
    "ky_bao_cao_id" INTEGER NOT NULL,
    "don_vi_id" INTEGER NOT NULL,
    "nguoi_nop_id" INTEGER,
    "du_lieu" JSONB,
    "trang_thai" "TrangThaiBaoCaoNop" NOT NULL DEFAULT 'CHUA_NOP',
    "thoi_gian_nop" TIMESTAMP(3),
    "tre_han" BOOLEAN NOT NULL DEFAULT false,
    "nguoi_duyet_id" INTEGER,
    "thoi_gian_duyet" TIMESTAMP(3),
    "ghi_chu_duyet" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bao_cao_nop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bao_cao_van_ban" (
    "id" SERIAL NOT NULL,
    "ten" VARCHAR(255) NOT NULL,
    "mo_ta" TEXT,
    "don_vi_tao_id" INTEGER NOT NULL,
    "che_do" "CheDoBaoCaoVanBan" NOT NULL,
    "han_nop" TIMESTAMP(3) NOT NULL,
    "file_yeu_cau_id" INTEGER,
    "trang_thai" "TrangThaiBaoCaoVanBan" NOT NULL DEFAULT 'HOAT_DONG',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bao_cao_van_ban_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bao_cao_van_ban_don_vi" (
    "bao_cao_van_ban_id" INTEGER NOT NULL,
    "don_vi_id" INTEGER NOT NULL,

    CONSTRAINT "bao_cao_van_ban_don_vi_pkey" PRIMARY KEY ("bao_cao_van_ban_id","don_vi_id")
);

-- CreateTable
CREATE TABLE "bao_cao_van_ban_nop" (
    "id" SERIAL NOT NULL,
    "bao_cao_van_ban_id" INTEGER NOT NULL,
    "don_vi_id" INTEGER NOT NULL,
    "nguoi_nop_id" INTEGER,
    "trang_thai" "TrangThaiBcvbNop" NOT NULL DEFAULT 'CHUA_NOP',
    "thoi_gian_nop" TIMESTAMP(3),
    "tre_han" BOOLEAN NOT NULL DEFAULT false,
    "ghi_chu" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bao_cao_van_ban_nop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tep_dinh_kem" (
    "id" SERIAL NOT NULL,
    "bao_cao_nop_id" INTEGER,
    "bcvb_nop_id" INTEGER,
    "ten_goc" VARCHAR(500) NOT NULL,
    "duong_dan_luu" VARCHAR(500) NOT NULL,
    "loai_file" "LoaiFile" NOT NULL,
    "kich_thuoc" BIGINT NOT NULL,
    "nguoi_tai_len_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tep_dinh_kem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "thong_bao" (
    "id" SERIAL NOT NULL,
    "nguoi_dung_id" INTEGER NOT NULL,
    "loai" "LoaiThongBao" NOT NULL,
    "tieu_de" VARCHAR(255) NOT NULL,
    "noi_dung" TEXT,
    "duong_dan" VARCHAR(500),
    "da_doc" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "thong_bao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nhat_ky" (
    "id" SERIAL NOT NULL,
    "nguoi_dung_id" INTEGER,
    "hanh_dong" VARCHAR(100) NOT NULL,
    "doi_tuong" VARCHAR(100),
    "doi_tuong_id" INTEGER,
    "chi_tiet" JSONB,
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nhat_ky_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "don_vi_ma_don_vi_key" ON "don_vi"("ma_don_vi");

-- CreateIndex
CREATE UNIQUE INDEX "vai_tro_ma_key" ON "vai_tro"("ma");

-- CreateIndex
CREATE UNIQUE INDEX "nguoi_dung_ten_dang_nhap_key" ON "nguoi_dung"("ten_dang_nhap");

-- CreateIndex
CREATE UNIQUE INDEX "ky_bao_cao_mau_bao_cao_id_nam_ky_so_key" ON "ky_bao_cao"("mau_bao_cao_id", "nam", "ky_so");

-- CreateIndex
CREATE UNIQUE INDEX "bao_cao_nop_ky_bao_cao_id_don_vi_id_key" ON "bao_cao_nop"("ky_bao_cao_id", "don_vi_id");

-- CreateIndex
CREATE UNIQUE INDEX "bao_cao_van_ban_nop_bao_cao_van_ban_id_don_vi_id_key" ON "bao_cao_van_ban_nop"("bao_cao_van_ban_id", "don_vi_id");

-- AddForeignKey
ALTER TABLE "don_vi" ADD CONSTRAINT "don_vi_don_vi_cha_id_fkey" FOREIGN KEY ("don_vi_cha_id") REFERENCES "don_vi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nguoi_dung" ADD CONSTRAINT "nguoi_dung_don_vi_id_fkey" FOREIGN KEY ("don_vi_id") REFERENCES "don_vi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nguoi_dung_vai_tro" ADD CONSTRAINT "nguoi_dung_vai_tro_nguoi_dung_id_fkey" FOREIGN KEY ("nguoi_dung_id") REFERENCES "nguoi_dung"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nguoi_dung_vai_tro" ADD CONSTRAINT "nguoi_dung_vai_tro_vai_tro_id_fkey" FOREIGN KEY ("vai_tro_id") REFERENCES "vai_tro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mau_bao_cao" ADD CONSTRAINT "mau_bao_cao_don_vi_tao_id_fkey" FOREIGN KEY ("don_vi_tao_id") REFERENCES "don_vi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mau_bao_cao" ADD CONSTRAINT "mau_bao_cao_file_mau_id_fkey" FOREIGN KEY ("file_mau_id") REFERENCES "tep_dinh_kem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mau_bao_cao_don_vi" ADD CONSTRAINT "mau_bao_cao_don_vi_mau_bao_cao_id_fkey" FOREIGN KEY ("mau_bao_cao_id") REFERENCES "mau_bao_cao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mau_bao_cao_don_vi" ADD CONSTRAINT "mau_bao_cao_don_vi_don_vi_id_fkey" FOREIGN KEY ("don_vi_id") REFERENCES "don_vi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ky_bao_cao" ADD CONSTRAINT "ky_bao_cao_mau_bao_cao_id_fkey" FOREIGN KEY ("mau_bao_cao_id") REFERENCES "mau_bao_cao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bao_cao_nop" ADD CONSTRAINT "bao_cao_nop_ky_bao_cao_id_fkey" FOREIGN KEY ("ky_bao_cao_id") REFERENCES "ky_bao_cao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bao_cao_nop" ADD CONSTRAINT "bao_cao_nop_don_vi_id_fkey" FOREIGN KEY ("don_vi_id") REFERENCES "don_vi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bao_cao_nop" ADD CONSTRAINT "bao_cao_nop_nguoi_nop_id_fkey" FOREIGN KEY ("nguoi_nop_id") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bao_cao_nop" ADD CONSTRAINT "bao_cao_nop_nguoi_duyet_id_fkey" FOREIGN KEY ("nguoi_duyet_id") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bao_cao_van_ban" ADD CONSTRAINT "bao_cao_van_ban_don_vi_tao_id_fkey" FOREIGN KEY ("don_vi_tao_id") REFERENCES "don_vi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bao_cao_van_ban" ADD CONSTRAINT "bao_cao_van_ban_file_yeu_cau_id_fkey" FOREIGN KEY ("file_yeu_cau_id") REFERENCES "tep_dinh_kem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bao_cao_van_ban_don_vi" ADD CONSTRAINT "bao_cao_van_ban_don_vi_bao_cao_van_ban_id_fkey" FOREIGN KEY ("bao_cao_van_ban_id") REFERENCES "bao_cao_van_ban"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bao_cao_van_ban_don_vi" ADD CONSTRAINT "bao_cao_van_ban_don_vi_don_vi_id_fkey" FOREIGN KEY ("don_vi_id") REFERENCES "don_vi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bao_cao_van_ban_nop" ADD CONSTRAINT "bao_cao_van_ban_nop_bao_cao_van_ban_id_fkey" FOREIGN KEY ("bao_cao_van_ban_id") REFERENCES "bao_cao_van_ban"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bao_cao_van_ban_nop" ADD CONSTRAINT "bao_cao_van_ban_nop_don_vi_id_fkey" FOREIGN KEY ("don_vi_id") REFERENCES "don_vi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bao_cao_van_ban_nop" ADD CONSTRAINT "bao_cao_van_ban_nop_nguoi_nop_id_fkey" FOREIGN KEY ("nguoi_nop_id") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tep_dinh_kem" ADD CONSTRAINT "tep_dinh_kem_bao_cao_nop_id_fkey" FOREIGN KEY ("bao_cao_nop_id") REFERENCES "bao_cao_nop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tep_dinh_kem" ADD CONSTRAINT "tep_dinh_kem_bcvb_nop_id_fkey" FOREIGN KEY ("bcvb_nop_id") REFERENCES "bao_cao_van_ban_nop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tep_dinh_kem" ADD CONSTRAINT "tep_dinh_kem_nguoi_tai_len_id_fkey" FOREIGN KEY ("nguoi_tai_len_id") REFERENCES "nguoi_dung"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "thong_bao" ADD CONSTRAINT "thong_bao_nguoi_dung_id_fkey" FOREIGN KEY ("nguoi_dung_id") REFERENCES "nguoi_dung"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nhat_ky" ADD CONSTRAINT "nhat_ky_nguoi_dung_id_fkey" FOREIGN KEY ("nguoi_dung_id") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE CASCADE;
