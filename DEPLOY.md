# Hướng dẫn triển khai lên internet (VPS Ubuntu + Nginx + PM2)

Áp dụng cho: máy chủ Ubuntu bạn đang có sẵn (đang chạy trang "Phương án thi công"), tên miền `pcsonla.vn` đã tạo tên miền con và NAT port.

Trong hướng dẫn này, thay `baocao.pcsonla.vn` bằng đúng tên miền con bạn đã tạo.

Kiến trúc sau khi triển khai:

```
Internet → NAT port 80/443 → Ubuntu server
                                 └─ Nginx (một tiến trình, định tuyến theo tên miền)
                                      ├─ pcsonla.vn / trang cũ           → site "Phương án thi công" (giữ nguyên, không đụng vào)
                                      └─ baocao.pcsonla.vn               → serve file tĩnh React (apps/web/dist)
                                                                            + reverse proxy /api → NestJS (PM2, cổng nội bộ 3000)
                                                                            + NestJS → PostgreSQL (localhost:5432)
```

Nginx dùng cơ chế "server block" định tuyến theo tên miền (`server_name`), nên thêm site mới **không ảnh hưởng** đến trang "Phương án thi công" đang chạy — miễn là bạn **không sửa** file cấu hình của site đó.

---

## Bước 0 — Kiểm tra DNS và NAT đã đúng chưa

Trên máy Mac của bạn:

```bash
dig +short baocao.pcsonla.vn
```

Kết quả phải ra đúng địa chỉ IP public nhà bạn (kiểm tra bằng cách vào `whatismyip.com` từ mạng nhà). Nếu chưa ra đúng IP, chờ DNS cập nhật (có thể mất vài phút đến vài giờ) trước khi làm tiếp.

NAT port: đảm bảo router đã forward **cả port 80 và 443** (nhiều người chỉ NAT có 1 port) tới đúng IP LAN của máy Ubuntu.

---

## Bước 1 — SSH vào máy chủ Ubuntu

```bash
ssh <user>@<ip-hoặc-hostname-may-chu>
```

## Bước 2 — Kiểm tra những gì đã có sẵn (bỏ qua bước cài nếu đã có)

```bash
node -v          # cần Node 20.x — nếu chưa có hoặc là bản cũ, cài ở Bước 2a
psql --version   # cần PostgreSQL — nếu chưa có, cài ở Bước 2b
nginx -v         # gần như chắc chắn ĐÃ CÓ vì đang chạy site "Phương án thi công"
pm2 -v           # trình quản lý tiến trình Node — nếu chưa có, cài ở Bước 2c
```

### 2a. Cài Node.js 20 (nếu chưa có / bản cũ)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2b. Cài PostgreSQL (nếu chưa có)

```bash
sudo apt-get update
sudo apt-get install -y postgresql
sudo systemctl enable --now postgresql
```

> Nếu PostgreSQL server "Phương án thi công" đang dùng đã có sẵn, bạn có thể dùng chung — chỉ cần tạo thêm 1 database + user riêng cho ứng dụng này (Bước 4), không đụng đến database của site kia.

### 2c. Cài PM2 (chạy Node app dạng service, tự khởi động lại khi crash/reboot)

```bash
sudo npm install -g pm2
```

---

## Bước 3 — Đưa code lên server (qua GitHub, giống quy trình "Phương án thi công")

Dự án đã có commit đầu tiên trên nhánh `main`. Các bước còn lại **bạn tự thực hiện** (đẩy code là thao tác bạn muốn chủ động làm):

### 3a. Tạo repo trống trên GitHub

Vào github.com → New repository → đặt tên (vd `pcsl-baocao`) → chọn **Private** → **không** tích "Add a README" (để tránh xung đột với code đã có sẵn) → Create.

### 3b. Đẩy code từ máy Mac lên GitHub

```bash
cd ~/pcsl-baocao
git remote add origin git@github.com:<ten-tai-khoan-hoac-to-chuc>/pcsl-baocao.git
git push -u origin main
```

(Nếu dùng HTTPS thay vì SSH key: `git remote add origin https://github.com/<ten-tai-khoan>/pcsl-baocao.git`)

### 3c. Trên server Ubuntu: clone repo về

Vì repo là **private**, cần thiết lập quyền truy cập cho server trước khi `git clone` — dùng đúng cách bạn đã làm cho "Phương án thi công" (deploy key hoặc GitHub App/token). Cách phổ biến nhất — tạo SSH deploy key riêng cho server này:

```bash
# Trên server Ubuntu
ssh-keygen -t ed25519 -C "deploy-pcsl-baocao" -f ~/.ssh/pcsl_baocao_deploy -N ""
cat ~/.ssh/pcsl_baocao_deploy.pub
```

Copy khóa public vừa in ra, vào GitHub repo → Settings → Deploy keys → Add deploy key (không cần quyền ghi, chỉ đọc) → dán vào.

Rồi thêm cấu hình để git dùng đúng key này khi clone (trên server):

```bash
cat >> ~/.ssh/config <<'EOF'
Host github.com-pcsl-baocao
  HostName github.com
  User git
  IdentityFile ~/.ssh/pcsl_baocao_deploy
EOF

sudo mkdir -p /var/www/pcsl-baocao
sudo chown $USER:$USER /var/www/pcsl-baocao
git clone git@github.com-pcsl-baocao:<ten-tai-khoan>/pcsl-baocao.git /var/www/pcsl-baocao
```

Từ lần sau chỉ cần `cd /var/www/pcsl-baocao && git pull` để cập nhật (xem mục "Cập nhật sau này" cuối file).

---

## Bước 4 — Tạo database PostgreSQL cho production

```bash
sudo -u postgres psql
```

Trong psql:

```sql
CREATE USER pcsl_prod WITH PASSWORD 'đặt-mật-khẩu-mạnh-ở-đây';
CREATE DATABASE pcsl_baocao_prod OWNER pcsl_prod;
\q
```

---

## Bước 5 — Cấu hình biến môi trường production

Trên server:

```bash
cd /var/www/pcsl-baocao/apps/api
cp .env.example .env
nano .env
```

Sửa các giá trị sau (khác hoàn toàn so với máy dev của bạn):

```
DATABASE_URL="postgresql://pcsl_prod:đặt-mật-khẩu-mạnh-ở-đây@localhost:5432/pcsl_baocao_prod?schema=public"
JWT_ACCESS_SECRET="<dán chuỗi ngẫu nhiên bên dưới>"
JWT_REFRESH_SECRET="<dán chuỗi ngẫu nhiên khác>"
PORT=3000
CORS_ORIGIN="https://baocao.pcsonla.vn"
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE_MB=25
```

Tạo 2 chuỗi bí mật ngẫu nhiên (chạy 2 lần, dán vào 2 dòng JWT ở trên, **không dùng lại giá trị dev cũ**):

```bash
openssl rand -hex 32
```

---

## Bước 6 — Cài dependency, chạy migration, build

```bash
cd /var/www/pcsl-baocao
npm install

# Sinh Prisma Client (npm install KHÔNG tự làm việc này — bắt buộc phải chạy tay)
cd apps/api
npx prisma generate

# Áp dụng toàn bộ migration đã có sẵn trong repo lên database production (KHÔNG dùng migrate dev ở đây)
npx prisma migrate deploy
cd ../..

npm run build --workspace=apps/api
npm run build --workspace=apps/web
```

### Về dữ liệu ban đầu (đơn vị, tài khoản quản trị...)

Bạn có 2 lựa chọn:

**A. Bắt đầu từ đầu (khuyến nghị nếu đây là lần đầu đưa lên thật):**

```bash
cd apps/api && npx prisma db seed && cd ../..
```

Lệnh này tạo lại 22 đơn vị mẫu + 1 tài khoản SYS_ADMIN (mật khẩu in ra ở console khi seed) — **đổi ngay mật khẩu này**, và tạo lại "Công ty Điện lực Sơn La" + tài khoản `sysadmin.pcsl` như bạn đã có ở máy dev nếu muốn giữ đúng cấu trúc đó.

**B. Copy nguyên dữ liệu hiện tại từ máy dev sang production** (giữ đúng 22 đơn vị, tài khoản `sysadmin.pcsl`, mẫu báo cáo bạn đã tạo...):

Trên máy Mac:

```bash
cd ~/pcsl-baocao
PGPASSWORD=pcsl_dev_pw pg_dump -h localhost -U pcsl_app -d pcsl_baocao -F c -f backups/backup_len_prod.dump
scp backups/backup_len_prod.dump <user>@<ip-may-chu>:/tmp/
```

Trên server:

```bash
PGPASSWORD=đặt-mật-khẩu-mạnh-ở-đây pg_restore -h localhost -U pcsl_prod -d pcsl_baocao_prod --no-owner /tmp/backup_len_prod.dump
```

---

## Bước 7 — Chạy API bằng PM2

```bash
cd /var/www/pcsl-baocao/apps/api
pm2 start dist/main.js --name pcsl-api
pm2 save
pm2 startup   # chạy lệnh nó in ra (thường cần sudo) để PM2 tự khởi động lại khi server reboot
```

Kiểm tra: `pm2 logs pcsl-api` — phải thấy Nest khởi động không lỗi, đang lắng nghe cổng 3000.

---

## Bước 8 — Cấu hình Nginx cho tên miền con này

Tạo file cấu hình **mới, riêng biệt** — không sửa file của site "Phương án thi công":

```bash
sudo nano /etc/nginx/sites-available/pcsl-baocao
```

Nội dung:

```nginx
server {
    listen 80;
    server_name baocao.pcsonla.vn;

    root /var/www/pcsl-baocao/apps/web/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 30M;
}
```

(`client_max_body_size` nới rộng hơn `MAX_FILE_SIZE_MB=25` một chút để tránh Nginx tự chặn trước khi tới app.)

Kích hoạt site và kiểm tra cú pháp:

```bash
sudo ln -s /etc/nginx/sites-available/pcsl-baocao /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

`nginx -t` phải báo `syntax is ok` — nếu lỗi, đọc kỹ thông báo, khả năng cao do gõ nhầm cú pháp, không phải do xung đột với site cũ.

Vào thử `http://baocao.pcsonla.vn` — đã thấy trang web (chưa có HTTPS, sẽ thêm ở bước sau).

---

## Bước 9 — Bật HTTPS miễn phí (Let's Encrypt)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d baocao.pcsonla.vn
```

Certbot tự động sửa file Nginx ở Bước 8 để thêm cấu hình SSL + tự chuyển hướng HTTP → HTTPS, và tự đặt lịch gia hạn chứng chỉ (90 ngày/lần).

---

## Bước 10 — Tường lửa

```bash
sudo ufw status
```

Nếu `ufw` đang bật, đảm bảo đủ các rule sau (không được chặn 22, không cần mở 3000/5432 ra ngoài — chỉ Nginx cần thấy chúng, ở localhost):

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
```

---

## Bước 11 — Kiểm tra lần cuối

- Vào `https://baocao.pcsonla.vn` — có khoá ổ khoá HTTPS, không cảnh báo chứng chỉ.
- Đăng nhập thử.
- Vào `pcsonla.vn` (site "Phương án thi công") — vẫn hoạt động bình thường như trước, không bị ảnh hưởng gì.
- Thử nộp báo cáo/tải file lên để chắc chắn `client_max_body_size` và `UPLOAD_DIR` hoạt động đúng.

---

## Cập nhật code sau này (mỗi lần sửa/thêm tính năng)

```bash
# Từ máy Mac
cd ~/pcsl-baocao
git add -A && git commit -m "mô tả thay đổi"
git push

# SSH vào server
ssh <user>@<ip-may-chu>
cd /var/www/pcsl-baocao
git pull
npm install
cd apps/api && npx prisma generate && npx prisma migrate deploy && cd ../..
npm run build --workspace=apps/api
npm run build --workspace=apps/web
pm2 restart pcsl-api
```

---

## Lưu ý bảo mật quan trọng

- Đổi mật khẩu PostgreSQL, JWT secrets sang giá trị **mạnh, ngẫu nhiên, khác hoàn toàn** với máy dev (đã nhắc ở Bước 5).
- Sao lưu định kỳ: đặt cron job `pg_dump` hàng ngày trên server, lưu ra nơi khác (không chỉ trên chính máy đó).
- Không mở port 3000 (API) hay 5432 (Postgres) ra internet — chỉ Nginx cần truy cập, qua `localhost`.
