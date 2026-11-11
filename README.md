# Pizza & Pasta Inn — Hệ Thống Đặt Món Trực Tuyến & Gợi Ý Món Ăn Thông Minh

Hệ thống website đặt món Pizza & Mì Ý trực tuyến tích hợp thuật toán gợi ý món ăn theo khẩu vị và dị ứng, bao gồm 3 phân hệ độc lập:
- **Backend API (`backend/`)**: Node.js, Express 5, TypeScript, Prisma 7 ORM, PostgreSQL (chạy tại cổng `4000`).
- **Customer Frontend (`frontend/`)**: Next.js 16, React 19, Tailwind CSS 4, Zustand (chạy tại cổng `3000`).
- **Admin Dashboard (`admin/`)**: Next.js 16, React 19, Tailwind CSS 4, ApexCharts (chạy tại cổng `3001`).

---

## 1. Yêu Cầu Môi Trường (Cài đặt trước khi tải dự án)

Người cài đặt trên máy mới cần cài sẵn 3 phần mềm sau:
1. **Node.js**: Phiên bản `>= 20.x` (khuyến nghị bản LTS từ [nodejs.org](https://nodejs.org/)). Kiểm tra bằng lệnh `node -v`.
2. **PostgreSQL**: Phiên bản `>= 15.x` (đi kèm công cụ quản trị **pgAdmin 4**, tải tại [postgresql.org](https://www.postgresql.org/download/)).
3. **Git**: Tải tại [git-scm.com](https://git-scm.com/).

---

## 2. Hướng Dẫn Tải và Cài Đặt Dự Án Từ Đầu

### Bước 1: Tải mã nguồn về máy (Clone Repository)

Mở **Terminal / PowerShell** tại thư mục muốn lưu dự án và chạy:

```bash
git clone https://github.com/duytruong1234/Pizza-PastaInn.git
cd Pizza-PastaInn
```

*(Nếu đã cấu hình SSH key, có thể dùng: `git clone git@github.com:duytruong1234/Pizza-PastaInn.git`)*.

---

### Bước 2: Khởi tạo Cơ sở dữ liệu PostgreSQL

Trong thư mục gốc của dự án đã có sẵn file sao lưu cơ sở dữ liệu đầy đủ thực đơn, hình ảnh, chi nhánh và đơn hàng mẫu là **`pizzaa.backup`**.

#### Cách 1: Khôi phục bằng giao diện pgAdmin 4 (Khuyên dùng)
1. Mở **pgAdmin 4**, đăng nhập vào PostgreSQL Server.
2. Chuột phải vào mục **Databases** -> chọn **Create** -> **Database...** -> Đặt tên Database là `pizza` -> nhấn **Save**.
3. Chuột phải vào Database `pizza` vừa tạo -> chọn **Restore...**.
4. Tại ô **Filename**, chọn tới file `pizzaa.backup` nằm ở thư mục gốc dự án (`Pizza-PastaInn/pizzaa.backup`).
5. Chuyển sang tab **Restore options**, bật **Yes** ở mục *Do not save -> Owner* (để tránh lỗi khác tên user PostgreSQL giữa các máy) -> nhấn **Restore**.

#### Cách 2: Khôi phục bằng dòng lệnh `pg_restore`
```bash
createdb -U postgres pizza
pg_restore -U postgres -d pizza --no-owner --no-privileges pizzaa.backup
```

*(Lưu ý: Nếu muốn tạo bảng mới hoàn toàn từ Prisma Schema mà không dùng file backup, xem mục lệnh Prisma ở Bước 3).*

---

### Bước 3: Cài đặt và Chạy Backend (`http://localhost:4000`)

Mở cửa sổ Terminal thứ nhất:

```bash
cd backend
npm install
```

Tạo file `.env` trong thư mục `backend/` bằng cách sao chép từ file `.env.example`:

```bash
cp .env.example .env
```

*(Nếu dùng Windows PowerShell và muốn tạo trực tiếp file `.env` bằng 1 lệnh, chạy lệnh sau):*

```powershell
@"
DATABASE_URL="postgresql://postgres:MAT_KHAU_POSTGRES_CUA_BAN@localhost:5432/pizza?schema=public"
PORT=4000
NODE_ENV=development
JWT_SECRET="pizza_pasta_inn_secret_key_2026"
JWT_EXPIRES_IN="7d"
"@ | Set-Content -Path .env -Encoding UTF8
```

Mở file `backend/.env` và cập nhật lại đúng mật khẩu PostgreSQL (`YOUR_PASSWORD`) và tên database (`pizza`) trên máy của bạn:

```env
DATABASE_URL="postgresql://postgres:MAT_KHAU_POSTGRES_CUA_BAN@localhost:5432/pizza?schema=public"
PORT=4000
NODE_ENV=development
JWT_SECRET="pizza_pasta_inn_secret_key_2026"
JWT_EXPIRES_IN="7d"
```

Khởi tạo Prisma Client và chạy server Backend:

```bash
npx prisma generate
npm run dev
```

*(Tùy chọn: Nếu ở Bước 2 bạn không restore file `pizzaa.backup` mà muốn tự tạo bảng từ đầu, hãy chạy `npx prisma db push` và `npx ts-node prisma/seed.ts` trước khi chạy `npm run dev`).*

Khi thành công, Terminal sẽ báo: `Server đang chạy tại http://localhost:4000`.

---

### Bước 4: Cài đặt và Chạy Frontend Khách Hàng (`http://localhost:3000`)

Mở cửa sổ Terminal thứ hai (giữ nguyên Terminal Backend đang chạy):

```bash
cd frontend
npm install
```

Tạo file `.env.local` (hoặc `.env`) từ file mẫu:

```bash
cp .env.example .env.local
```

Nội dung mặc định trong `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
NEXT_PUBLIC_BACKEND_URL="http://localhost:4000"
```

Khởi chạy giao diện Khách hàng:

```bash
npm run dev
```

Truy cập website khách hàng tại: **`http://localhost:3000`**

---

### Bước 5: Cài đặt và Chạy Trang Quản Trị Admin (`http://localhost:3001`)

Mở cửa sổ Terminal thứ ba:

```bash
cd admin
npm install
```

Tạo file `.env.local` (hoặc `.env`) từ file mẫu:

```bash
cp .env.example .env.local
```

Nội dung mặc định trong `admin/.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
NEXT_PUBLIC_BACKEND_URL="http://localhost:4000"
```

Khởi chạy trang Quản trị Admin (mặc định chạy trên cổng `3001`):

```bash
npm run dev
```

Truy cập trang Quản trị tại: **`http://localhost:3001`**

- **Tài khoản Admin mặc định (khi chạy seed):**
  - Email: `admin@gmail.com`
  - Mật khẩu: `admin`

---

## 3. Tóm Tắt Các Cổng Chạy (Ports)

| Phân hệ | Thư mục | Lệnh chạy | Địa chỉ truy cập |
| :--- | :--- | :--- | :--- |
| **Backend API** | `backend/` | `npm run dev` | `http://localhost:4000` |
| **Customer Web** | `frontend/` | `npm run dev` | `http://localhost:3000` |
| **Admin Panel** | `admin/` | `npm run dev` | `http://localhost:3001` |
| **PostgreSQL** | Hệ thống | Dịch vụ nền | `localhost:5432` |

---

## 4. Cấu Hình Git, Commit & Push Lên GitHub

Nếu bạn chỉnh sửa mã nguồn và muốn đẩy (push) thay đổi lên kho lưu trữ GitHub:

```bash
# 1. Cấu hình tên và email Git (chỉ cần chạy 1 lần trên máy mới)
git config --global user.name "duytruong1234"
git config --global user.email "duytruong04hdt@gmail.com"

# 2. Kiểm tra các file đã thay đổi
git status

# 3. Thêm toàn bộ thay đổi vào vùng chờ (Staging)
git add .

# 4. Tạo bản ghi commit với nội dung mô tả
git commit -m "feat: cap nhat chuc nang va tai lieu huong dan cai dat"

# 5. Đẩy code lên nhánh main trên GitHub
git push origin main
```

Để kéo bản cập nhật mới nhất từ GitHub về máy:

```bash
git pull origin main
```

---

## 5. Xử Lý Một Số Lỗi Thường Gặp Khi Cài Đặt Trên Máy Mới

1. **Lỗi `Environment variable not found: DATABASE_URL` khi chạy Backend:**
   - Kiểm tra xem bạn đã tạo file `.env` trong thư mục `backend/` chưa (lưu ý tên file là `.env`, không phải `.env.txt`).
2. **Lỗi `Cannot find module '.prisma/client'`:**
   - Chạy lệnh `npx prisma generate` bên trong thư mục `backend/`.
3. **Lỗi trùng cổng `Port 3000 / 3001 / 4000 is already in use`:**
   - Đóng các cửa sổ Terminal cũ đang chạy ngầm hoặc đổi cổng trong file `.env`.
4. **Lỗi kết nối PostgreSQL (`password authentication failed for user "postgres"`):**
   - Mở `backend/.env` và sửa lại đúng mật khẩu `postgres` mà bạn đã đặt lúc cài PostgreSQL trên máy đó.
