# Hệ Thống Quản Lý Tuyển Sinh (Admissions Management System)

Đây là hệ thống quản lý tuyển sinh được xây dựng với kiến trúc Client-Server, bao gồm Frontend (React + Vite) và Backend (Node.js + Express + PostgreSQL).

## 🚀 Công nghệ sử dụng

### Frontend
- **React.js** (Khởi tạo bằng Vite)
- **Tailwind CSS** (Styling giao diện)
- **React Router DOM** (Quản lý routing)
- **Axios** (Gọi API)
- **Recharts** (Vẽ biểu đồ)
- **Lucide React** (Icon)

### Backend
- **Node.js & Express.js** (Web server framework)
- **PostgreSQL** (Hệ quản trị cơ sở dữ liệu)
- **node-postgres (pg)** (Kết nối Database)
- **Bcrypt & JSON Web Token (JWT)** (Mã hóa mật khẩu & Xác thực)
- **Multer & Cloudinary** (Upload và lưu trữ file/hình ảnh)
- **Nodemailer** (Gửi email)
- **ExcelJS** (Xử lý file Excel)

---

## 🛠 Hướng dẫn cài đặt và chạy dự án (Local Setup Step-by-Step)

### Yêu cầu hệ thống (Prerequisites)
- [Node.js](https://nodejs.org/) (Khuyến nghị phiên bản 18.x trở lên)
- [PostgreSQL](https://www.postgresql.org/) (Đã cài đặt và đang chạy trên máy)
- Git

### 1. Clone dự án (nếu chưa có)
```bash
git clone <đường-dẫn-repo-của-bạn>
cd admissions-management
```

### 2. Cài đặt và cấu hình Backend

**Bước 2.1: Di chuyển vào thư mục backend và cài đặt dependencies**
```bash
cd backend
npm install
```

**Bước 2.2: Cấu hình biến môi trường**
Tạo một file `.env` trong thư mục `backend` (hoặc sử dụng file `.env` hiện tại nếu đã có) và cấu hình các thông số cơ bản sau:

```env
PORT=3000
NODE_ENV=development

# Thông tin kết nối PostgreSQL Database (Thay đổi cho phù hợp với máy của bạn)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres # Mật khẩu CSDL của bạn
DB_NAME=tuyensinh_db # Tên CSDL muốn tạo/sử dụng

# JWT Secret
JWT_SECRET=chuoi_bi_mat_cua_ban
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Cấu hình SMTP để gửi mail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email_cua_ban@gmail.com
SMTP_PASS=app_password_cua_ban

# Cloudinary (Dùng để upload ảnh/file)
CLOUDINARY_CLOUD_NAME=ten_cloud_cua_ban
CLOUDINARY_API_KEY=api_key_cua_ban
CLOUDINARY_API_SECRET=api_secret_cua_ban
```

**Bước 2.3: Khởi tạo cơ sở dữ liệu và dữ liệu mẫu (Seed)**
Lưu ý: Bạn phải đảm bảo PostgreSQL server đang chạy và đã tạo sẵn user/password như trong cấu hình file `.env`.

Chạy các lệnh sau:
```bash
# Khởi tạo Database và các bảng (Tables)
npm run db:init

# Chạy script chèn dữ liệu mẫu (Seed) vào Database
npm run db:seed
```

**Bước 2.4: Chạy server Backend**
```bash
# Chạy ở chế độ development (tự động reload khi có thay đổi code)
npm run dev
```
Server backend sẽ khởi chạy tại địa chỉ: `http://localhost:3000`

---

### 3. Cài đặt và cấu hình Frontend

Mở một cửa sổ terminal (Command Prompt/PowerShell) mới (vẫn giữ terminal Backend tiếp tục chạy).

**Bước 3.1: Di chuyển vào thư mục frontend và cài đặt dependencies**
```bash
cd frontend
npm install
```

**Bước 3.2: Chạy ứng dụng Frontend**
```bash
# Khởi chạy frontend ở chế độ development
npm run dev
```
Giao diện frontend sẽ chạy tại: `http://localhost:5173` (hoặc cổng được hiển thị trên terminal). Mở đường dẫn này trên trình duyệt web của bạn để sử dụng hệ thống.

---

## 📄 Các lệnh Scripts có sẵn

**Trong thư mục `backend/`:**
- `npm start`: Chạy server bằng node thông thường (dành cho production).
- `npm run dev`: Chạy server bằng nodemon (tự reload khi dev).
- `npm run db:init`: Script khởi tạo database.
- `npm run db:seed`: Script thêm dữ liệu mẫu vào database.

**Trong thư mục `frontend/`:**
- `npm run dev`: Chạy app frontend ở chế độ phát triển.
- `npm run build`: Build project để chuẩn bị deploy lên production.
- `npm run preview`: Xem trước giao diện của bản build production.
- `npm run lint`: Chạy ESLint để kiểm tra lỗi code.
