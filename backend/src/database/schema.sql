-- 1. Khởi tạo nhóm bảng phân quyền hệ thống và cán bộ vận hành
CREATE TABLE NhomQuyen (
    MaNhom SERIAL PRIMARY KEY,
    TenNhom VARCHAR(50) NOT NULL
);

CREATE TABLE NhanVien (
    MaNhanVien SERIAL PRIMARY KEY,
    HoTen VARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    MatKhau VARCHAR(255) NOT NULL,
    MaNhom INT REFERENCES NhomQuyen(MaNhom),
    IsLocked BOOLEAN DEFAULT FALSE
);

-- 2. Khởi tạo cấu trúc tổ chức đơn vị đào tạo trường học
CREATE TABLE Khoa (
    MaKhoa VARCHAR(10) PRIMARY KEY,
    TenKhoa VARCHAR(100) NOT NULL
);

CREATE TABLE Nganh (
    MaNganh VARCHAR(10) PRIMARY KEY,
    TenNganh VARCHAR(100) NOT NULL,
    MaKhoa VARCHAR(10) REFERENCES Khoa(MaKhoa)
);

-- 3. Khởi tạo danh mục bộ môn và tổ hợp môn xét tuyển học thuật
CREATE TABLE ToHopMon (
    MaToHop VARCHAR(10) PRIMARY KEY,
    TenToHop VARCHAR(100) NOT NULL
);

CREATE TABLE MonHoc (
    MaMon VARCHAR(10) PRIMARY KEY,
    TenMon VARCHAR(100) NOT NULL
);

CREATE TABLE CauTrucToHop (
    ID SERIAL PRIMARY KEY,
    MaToHop VARCHAR(10) REFERENCES ToHopMon(MaToHop),
    MaMon VARCHAR(10) REFERENCES MonHoc(MaMon),
    HeSo INT DEFAULT 1 NOT NULL,
    CONSTRAINT UQ_ToHop_Mon UNIQUE (MaToHop, MaMon)
);

-- 4. Khởi tạo cấu trúc đợt tuyển sinh và phân bổ chỉ tiêu hàng năm
CREATE TABLE DotTuyenSinh (
    MaDot SERIAL PRIMARY KEY,
    TenDot VARCHAR(100) NOT NULL,
    NamHoc INT NOT NULL,
    IsActive BOOLEAN DEFAULT TRUE
);

CREATE TABLE ChiTieuTuyenSinh (
    ID SERIAL PRIMARY KEY,
    MaDot INT REFERENCES DotTuyenSinh(MaDot),
    MaNganh VARCHAR(10) REFERENCES Nganh(MaNganh),
    SoLuong INT NOT NULL,
    CONSTRAINT UQ_Dot_Nganh UNIQUE (MaDot, MaNganh)
);

CREATE TABLE CauTrucXetTuyen (
    ID SERIAL PRIMARY KEY,
    MaNganh VARCHAR(10) REFERENCES Nganh(MaNganh),
    MaToHop VARCHAR(10) REFERENCES ToHopMon(MaToHop),
    DiemSan DECIMAL(5,2) NULL,
    CONSTRAINT UQ_Nganh_ToHop UNIQUE (MaNganh, MaToHop)
);

-- 5. Khởi tạo thực thể thí sinh và lưu vết đầu điểm thi chi tiết
CREATE TABLE ThiSinh (
    SBD VARCHAR(20) PRIMARY KEY,
    CCCD VARCHAR(12) UNIQUE NOT NULL,
    HoTen VARCHAR(100) NOT NULL,
    NgaySinh DATE NOT NULL,
    GioiTinh BOOLEAN NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    SDT VARCHAR(15) NOT NULL,
    KhuVuc VARCHAR(10) NULL,
    OTP_code VARCHAR(6) NULL,
    OTP_ExpiredAt TIMESTAMP NULL,
    createdAt TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ChiTietDiem (
    ID SERIAL PRIMARY KEY,
    SBD VARCHAR(20) REFERENCES ThiSinh(SBD),
    MaMon VARCHAR(10) REFERENCES MonHoc(MaMon),
    Diem DECIMAL(4,2) NOT NULL,
    CONSTRAINT UQ_ThiSinh_Mon UNIQUE (SBD, MaMon)
);

CREATE TABLE NguyenVong (
    MaNguyenVong SERIAL PRIMARY KEY,
    SBD VARCHAR(20) REFERENCES ThiSinh(SBD) ON DELETE CASCADE,
    ID_ChiTieu INT REFERENCES ChiTieuTuyenSinh(ID),
    MaToHop VARCHAR(10) REFERENCES ToHopMon(MaToHop),
    ThuTuUuTien INT NOT NULL,
    DiemTong DECIMAL(5,2) NULL,
    TrangThai INT DEFAULT 0, -- 0: Chờ xét; 1: Đậu; 2: Rớt
    CONSTRAINT UQ_ThiSinh_ThuTu UNIQUE (SBD, ThuTuUuTien)
);

-- 6. Khởi tạo danh mục thủ tục số hóa hồ sơ trực tuyến thí sinh nộp
CREATE TABLE LoaiGiayTo (
    MaLoai VARCHAR(10) PRIMARY KEY,
    TenLoai VARCHAR(150) NOT NULL,
    BatBuoc BOOLEAN DEFAULT TRUE
);

CREATE TABLE HoSoNhapHoc (
    MaHoSo SERIAL PRIMARY KEY,
    SBD VARCHAR(20) UNIQUE REFERENCES ThiSinh(SBD),
    NguoiDuyet INT REFERENCES NhanVien(MaNhanVien),
    NgayNop TIMESTAMP DEFAULT NOW(),
    TrangThai INT DEFAULT 0 -- 0: Nháp; 1: Chờ duyệt; 2: Đủ; 3: Thiếu
);

CREATE TABLE GiayToDinhKem (
    ID SERIAL PRIMARY KEY,
    MaHoSo INT REFERENCES HoSoNhapHoc(MaHoSo),
    MaLoai VARCHAR(10) REFERENCES LoaiGiayTo(MaLoai),
    DuongDanFile VARCHAR(255) NOT NULL,
    TrangThaiFile INT DEFAULT 1, -- 1: Hợp lệ; 0: Lỗi/Mờ
    GhiChuLoi VARCHAR(255) NULL
);

-- 7. Thực thể chuyển trạng thái Tân sinh viên chính thức và Maker-Checker
CREATE TABLE SinhVien (
    MSSV VARCHAR(15) PRIMARY KEY,
    MaHoSo INT UNIQUE REFERENCES HoSoNhapHoc(MaHoSo),
    NgayTao TIMESTAMP DEFAULT NOW()
);

CREATE TABLE YeuCauPheDuyet (
    ID SERIAL PRIMARY KEY,
    MaHoSo INT REFERENCES HoSoNhapHoc(MaHoSo),
    MaNhanVien INT REFERENCES NhanVien(MaNhanVien),
    LoaiYeuCau VARCHAR(20) NOT NULL, -- 'THEM_MOI'; 'XOA'
    LyDo TEXT NOT NULL,
    TrangThai INT DEFAULT 0 -- 0: Chờ duyệt; 1: Chấp thuận; 2: Từ chối
);