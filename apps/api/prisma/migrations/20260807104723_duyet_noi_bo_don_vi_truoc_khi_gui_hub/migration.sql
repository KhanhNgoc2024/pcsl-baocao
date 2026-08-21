-- AlterEnum
ALTER TYPE "LoaiThongBao" ADD VALUE 'CHO_DUYET_DON_VI';

-- AlterEnum
ALTER TYPE "TrangThaiBaoCaoNop" ADD VALUE 'CHO_DUYET_DON_VI';

-- AlterTable
ALTER TABLE "bao_cao_nop" ADD COLUMN     "ghi_chu_duyet_don_vi" TEXT,
ADD COLUMN     "nguoi_duyet_don_vi_id" INTEGER,
ADD COLUMN     "thoi_gian_duyet_don_vi" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "bao_cao_nop" ADD CONSTRAINT "bao_cao_nop_nguoi_duyet_don_vi_id_fkey" FOREIGN KEY ("nguoi_duyet_don_vi_id") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE CASCADE;
