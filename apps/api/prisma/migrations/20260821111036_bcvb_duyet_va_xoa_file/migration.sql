-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TrangThaiBcvbNop" ADD VALUE 'DA_DUYET';
ALTER TYPE "TrangThaiBcvbNop" ADD VALUE 'TRA_LAI';

-- AlterTable
ALTER TABLE "bao_cao_van_ban" ADD COLUMN     "can_duyet" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "bao_cao_van_ban_nop" ADD COLUMN     "ghi_chu_duyet" TEXT,
ADD COLUMN     "nguoi_duyet_id" INTEGER,
ADD COLUMN     "thoi_gian_duyet" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "bao_cao_van_ban_nop" ADD CONSTRAINT "bao_cao_van_ban_nop_nguoi_duyet_id_fkey" FOREIGN KEY ("nguoi_duyet_id") REFERENCES "nguoi_dung"("id") ON DELETE SET NULL ON UPDATE CASCADE;
