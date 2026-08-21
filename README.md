# Hệ thống Quản lý Báo cáo Nội bộ — PC Sơn La

Cổng báo cáo nội bộ tập trung cho Công ty Điện lực Sơn La, thay thế việc gửi báo cáo rời rạc qua email/USB. Xây dựng theo đặc tả trong `phan-tich-he-thong-bao-cao-pcsl.md`.

## Tính năng chính

- **Danh sách báo cáo**: tạo mẫu báo cáo định kỳ (tháng/quý/năm), thiết kế biểu mẫu số liệu động, giao đơn vị, sinh kỳ tự động/thủ công, nhập & nộp số liệu, duyệt/trả lại, tổng hợp + xuất Excel + tải ZIP.
- **Báo cáo bằng văn bản**: tạo yêu cầu báo cáo đột xuất, giao đơn vị, đơn vị tải file lên, tổng hợp tình hình nộp.
- **Quản trị**: đơn vị, người dùng, phân quyền theo vai trò (SYS_ADMIN, UNIT_ADMIN, REPORTER, APPROVER, VIEWER) với cách ly dữ liệu theo đơn vị.
- **Thông báo & nhắc hạn**: thông báo trong ứng dụng, cron tự động sinh kỳ và nhắc hạn (T-3 ngày, T-1 ngày, quá hạn), gửi email tuỳ chọn qua SMTP.
- **Bảo mật file**: kiểm tra đuôi file + magic bytes, giới hạn dung lượng, lưu ngoài webroot với tên ngẫu nhiên.
- **Nhật ký (audit log)**: ghi lại đăng nhập, tạo/sửa mẫu, nộp/duyệt/trả lại.

## Công nghệ

| Lớp | Công nghệ |
|---|---|
| Frontend | React + TypeScript + Vite, Ant Design, React Router, TanStack Query, Zustand |
| Backend | NestJS (TypeScript) |
| CSDL | PostgreSQL + Prisma ORM |
| Xuất báo cáo | ExcelJS, archiver (ZIP) |
| Tác vụ nền | @nestjs/schedule (cron) |
| Email | Nodemailer (tuỳ chọn) |

> **Lưu ý:** Xác thực dùng tài khoản nội bộ (username/password + JWT), chưa tích hợp AD/LDAP thật như tài liệu gốc đề xuất — để dành nâng cấp sau khi có thông tin kết nối AD thực tế của PC Sơn La.

## Cấu trúc thư mục

```
pcsl-baocao/
  apps/
    api/     # NestJS backend
    web/     # React frontend
  docker-compose.yml   # Postgres (dùng khi triển khai bằng Docker)
  .env.example
```

## Chạy dự án (development)

### 1. Yêu cầu
- Node.js 20+
- PostgreSQL 16 (chạy qua Docker Compose, hoặc cài trực tiếp qua Homebrew/apt)

### 2. Cài đặt

```bash
npm install --workspaces
```

### 3. Cấu hình database

Dùng Docker Compose (khuyến nghị):
```bash
docker compose up -d
```

Hoặc PostgreSQL cài trực tiếp — tạo role/database khớp với `DATABASE_URL` trong `.env.example`:
```sql
CREATE ROLE pcsl_app LOGIN PASSWORD 'pcsl_dev_pw' CREATEDB;
CREATE DATABASE pcsl_baocao OWNER pcsl_app;
```
(Cần quyền `CREATEDB` cho role vì Prisma Migrate dùng shadow database khi chạy `migrate dev`.)

### 4. Cấu hình biến môi trường

```bash
cp .env.example apps/api/.env
```
Sửa `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` thành chuỗi ngẫu nhiên riêng (không dùng giá trị mẫu khi triển khai thật).

### 5. Migrate + seed dữ liệu

```bash
cd apps/api
npx prisma migrate dev
npx prisma db seed
```

Seed sẽ tạo:
- 5 vai trò (SYS_ADMIN, UNIT_ADMIN, REPORTER, APPROVER, VIEWER)
- 22 đơn vị: 12 Phòng, 1 Ban QLDA, 7 Điện lực (**tên placeholder `Điện lực số 1..7` — cần đổi tên qua màn Quản trị đơn vị vì tài liệu gốc chưa cung cấp tên thật**), 1 Xí nghiệp, 1 Trung tâm
- 1 tài khoản `sysadmin` — mật khẩu ngẫu nhiên được in ra console khi seed chạy, hãy đổi mật khẩu ngay sau khi đăng nhập lần đầu

### 6. Chạy ứng dụng

```bash
# Terminal 1 — backend (http://localhost:3000/api)
npm run dev:api

# Terminal 2 — frontend (http://localhost:5173)
npm run dev:web
```

Đăng nhập bằng tài khoản `sysadmin` và mật khẩu được in ra ở bước seed.

## Đơn giản hóa so với tài liệu đặc tả gốc

Để giảm hạ tầng phụ trợ cho bản dựng đầu (quy mô 22 đơn vị là nhỏ):
- Cron trong process (`@nestjs/schedule`) thay vì BullMQ + Redis; xuất Excel/ZIP chạy đồng bộ.
- Lưu file trên đĩa cục bộ (`apps/api/uploads`, ngoài webroot) thay vì MinIO/S3.
- Chưa tích hợp AD/LDAP thật, chưa tích hợp quét virus ClamAV.
- Dashboard là bản rút gọn (đếm số liệu + danh sách mẫu quản lý), chưa có biểu đồ phức tạp.

## Kiểm thử thủ công đã thực hiện

Đã kiểm thử end-to-end qua trình duyệt và API (curl) cho các luồng:
- Đăng nhập, làm mới token tự động khi hết hạn, đăng xuất, đổi mật khẩu.
- SYS_ADMIN: CRUD đơn vị, CRUD người dùng + gán vai trò, đặt lại mật khẩu.
- UNIT_ADMIN: tạo mẫu báo cáo + thiết kế biểu mẫu động, giao đơn vị, mở kỳ (thủ công & tự động qua cron), xem tổng hợp, xuất Excel, tải ZIP, gửi nhắc nộp, duyệt/trả lại báo cáo.
- REPORTER: xem báo cáo cần nộp, nhập liệu theo biểu mẫu động, lưu nháp, nộp, tải file đính kèm.
- Báo cáo bằng văn bản: tạo yêu cầu, giao đơn vị, đơn vị tải file lên, nộp, xem tổng hợp.
- Thông báo: nhận thông báo trong-app, đánh dấu đã đọc, điều hướng đúng trang theo vai trò.
- Cách ly dữ liệu: xác nhận REPORTER không xem/tải được báo cáo hoặc file của đơn vị khác (403).
- Kiểm soát file tải lên: từ chối file giả mạo đuôi (nội dung không khớp magic bytes).

## Việc còn lại trước khi triển khai thật

- Đối chiếu và điền tên thật cho 7 Điện lực trực thuộc (hiện là placeholder).
- Tích hợp AD/LDAP nếu công ty muốn dùng tài khoản domain có sẵn.
- Cấu hình SMTP thật (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`) để bật nhắc hạn qua email.
- Đặt `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` ngẫu nhiên, mạnh cho môi trường production.
- Cân nhắc chuyển sang MinIO/S3 và BullMQ+Redis nếu số lượng đơn vị/người dùng tăng đáng kể.
