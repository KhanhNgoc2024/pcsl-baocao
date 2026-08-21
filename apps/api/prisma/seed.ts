import { PrismaClient, MaVaiTro, LoaiDonVi } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

const PHONG = [
  'Văn phòng',
  'Phòng Tổ chức & Nhân sự',
  'Phòng Kế hoạch & Vật tư',
  'Phòng Kỹ thuật',
  'Phòng Tài chính Kế toán',
  'Phòng Kinh doanh',
  'Phòng Điều độ',
  'Phòng Công nghệ thông tin và Chuyển đổi số',
  'Phòng An toàn',
  'Phòng Thanh tra Bảo vệ & Pháp chế',
  'Phòng Quản lý đầu tư',
  'Phòng Kiểm tra giám sát mua bán điện',
];

// Tên 7 Điện lực trực thuộc chưa được xác nhận trong tài liệu gốc (đánh dấu "cần điền tên thực tế").
// Dùng placeholder để SYS_ADMIN đổi tên thật qua màn Quản trị đơn vị, tránh bịa tên đơn vị hành chính thật.
const DIEN_LUC_PLACEHOLDER = Array.from({ length: 7 }, (_, i) => `Điện lực số ${i + 1} (cần đổi tên)`);

function slugCode(prefix: string, index: number): string {
  return `${prefix}${String(index).padStart(2, '0')}`;
}

async function main() {
  console.log('== Seed vai trò ==');
  const vaiTroSeed: { ma: MaVaiTro; ten: string; moTa: string }[] = [
    { ma: 'SYS_ADMIN', ten: 'Quản trị hệ thống', moTa: 'Toàn Công ty: quản lý đơn vị, người dùng, cấu hình hệ thống, xem toàn bộ' },
    { ma: 'UNIT_ADMIN', ten: 'Quản trị đơn vị (đầu mối)', moTa: 'Tạo/sửa mẫu báo cáo, mở kỳ, giao đơn vị, xem tổng hợp, duyệt/trả lại' },
    { ma: 'REPORTER', ten: 'Người nhập báo cáo', moTa: 'Nhập & nộp báo cáo theo mẫu, tải file báo cáo văn bản' },
    { ma: 'APPROVER', ten: 'Người duyệt', moTa: 'Duyệt/trả lại báo cáo do đơn vị khác nộp' },
    { ma: 'VIEWER', ten: 'Người xem', moTa: 'Chỉ xem, tải xuống' },
  ];
  for (const vt of vaiTroSeed) {
    await prisma.vaiTro.upsert({
      where: { ma: vt.ma },
      update: { ten: vt.ten, moTa: vt.moTa },
      create: vt,
    });
  }

  console.log('== Seed đơn vị ==');
  const donViData: { maDonVi: string; tenDonVi: string; loaiDonVi: LoaiDonVi; laDauMoi: boolean; thuTu: number }[] = [
    ...PHONG.map((ten, i) => ({
      maDonVi: slugCode('PHONG', i + 1),
      tenDonVi: ten,
      loaiDonVi: 'PHONG' as LoaiDonVi,
      laDauMoi: true,
      thuTu: i + 1,
    })),
    {
      maDonVi: 'BAN_QLDA',
      tenDonVi: 'Ban Quản lý dự án',
      loaiDonVi: 'BAN_QLDA',
      laDauMoi: true,
      thuTu: 100,
    },
    ...DIEN_LUC_PLACEHOLDER.map((ten, i) => ({
      maDonVi: slugCode('DL', i + 1),
      tenDonVi: ten,
      loaiDonVi: 'DIEN_LUC' as LoaiDonVi,
      laDauMoi: false,
      thuTu: 200 + i,
    })),
    {
      maDonVi: 'XN_LDCT',
      tenDonVi: 'Xí nghiệp Lưới điện cao thế Sơn La',
      loaiDonVi: 'XI_NGHIEP',
      laDauMoi: false,
      thuTu: 300,
    },
    {
      maDonVi: 'TT_TNDIEN',
      tenDonVi: 'Trung tâm Thí nghiệm điện',
      loaiDonVi: 'TRUNG_TAM',
      laDauMoi: false,
      thuTu: 400,
    },
  ];

  const donViMap = new Map<string, number>();
  for (const dv of donViData) {
    const rec = await prisma.donVi.upsert({
      where: { maDonVi: dv.maDonVi },
      update: {
        tenDonVi: dv.tenDonVi,
        loaiDonVi: dv.loaiDonVi,
        laDauMoi: dv.laDauMoi,
        thuTu: dv.thuTu,
      },
      create: dv,
    });
    donViMap.set(dv.maDonVi, rec.id);
  }
  console.log(`Đã seed ${donViData.length} đơn vị.`);

  console.log('== Seed tài khoản SYS_ADMIN mặc định ==');
  const vanPhongId = donViMap.get('PHONG01')!;
  const existingAdmin = await prisma.nguoiDung.findUnique({ where: { tenDangNhap: 'sysadmin' } });
  const initialPassword = existingAdmin ? null : randomBytes(6).toString('hex');

  if (!existingAdmin) {
    const matKhauHash = await bcrypt.hash(initialPassword!, 10);
    const sysAdmin = await prisma.nguoiDung.create({
      data: {
        tenDangNhap: 'sysadmin',
        matKhauHash,
        hoTen: 'Quản trị hệ thống',
        email: 'sysadmin@pcsonla.local',
        donViId: vanPhongId,
      },
    });
    const sysAdminRole = await prisma.vaiTro.findUniqueOrThrow({ where: { ma: 'SYS_ADMIN' } });
    await prisma.nguoiDungVaiTro.create({
      data: { nguoiDungId: sysAdmin.id, vaiTroId: sysAdminRole.id },
    });
    console.log('----------------------------------------');
    console.log('Tài khoản SYS_ADMIN mặc định đã tạo:');
    console.log('  Tên đăng nhập: sysadmin');
    console.log(`  Mật khẩu ban đầu: ${initialPassword}`);
    console.log('  (Hãy đổi mật khẩu ngay sau lần đăng nhập đầu tiên)');
    console.log('----------------------------------------');
  } else {
    console.log('Tài khoản sysadmin đã tồn tại, bỏ qua.');
  }

  console.log('Seed hoàn tất.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
