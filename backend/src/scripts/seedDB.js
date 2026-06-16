require('dotenv').config();
const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

const seedDatabase = async () => {
    // 1. Dữ liệu danh mục cốt lõi
    const loaiGiayToData = [
        { MaLoai: 'CCCD', TenLoai: 'Căn cước công dân', BatBuoc: true },
        { MaLoai: 'HOC_BA', TenLoai: 'Học bạ THPT', BatBuoc: true },
        { MaLoai: 'GIAY_BAO', TenLoai: 'Giấy chứng nhận tốt nghiệp', BatBuoc: true }
    ];

    const subjectsData = [
        { MaMon: 'TOAN', TenMon: 'Toán học' },
        { MaMon: 'LY', TenMon: 'Vật lý' },
        { MaMon: 'HOA', TenMon: 'Hóa học' },
        { MaMon: 'ANH', TenMon: 'Tiếng Anh' }
    ];

    const toHopData = [
        { MaToHop: 'A00', TenToHop: 'Toán, Vật lý, Hóa học' },
        { MaToHop: 'A01', TenToHop: 'Toán, Vật lý, Tiếng Anh' }
    ];

    const nhomQuyenData = [
        { MaNhom: 1, TenNhom: 'ADMIN' },
        { MaNhom: 2, TenNhom: 'OFFICER' }
    ];

    // 2. Dữ liệu tổ chức và Tuyển sinh
    const khoaData = [
        { MaKhoa: 'CNTT', TenKhoa: 'Khoa Công nghệ thông tin' },
        { MaKhoa: 'VT', TenKhoa: 'Khoa Viễn thông' }
    ];

    const nganhData = [
        { MaNganh: 'CNTT01', TenNganh: 'Công nghệ thông tin', MaKhoa: 'CNTT' },
        { MaNganh: 'ATTT01', TenNganh: 'An toàn thông tin', MaKhoa: 'CNTT' },
        { MaNganh: 'DTVT01', TenNganh: 'Kỹ thuật điện tử viễn thông', MaKhoa: 'VT' }
    ];

    const dotTuyenSinhData = [
        { TenDot: 'Xét tuyển Đại học Chính quy năm 2026', NamHoc: 2026, IsActive: true }
    ];

    const chiTieuData = [
        { MaNganh: 'CNTT01', SoLuong: 500 }, // Kỳ vọng ID sẽ là 1
        { MaNganh: 'ATTT01', SoLuong: 200 }, // Kỳ vọng ID sẽ là 2
        { MaNganh: 'DTVT01', SoLuong: 300 }  // Kỳ vọng ID sẽ là 3
    ];

    // 3. Dữ liệu Nhân viên & Thí sinh
    const staffData = [
        { email: 'admin@ptit.edu.vn', maNhom: 1, name: 'Quản trị viên Hệ thống' },
        { email: 'canbo1@ptit.edu.vn', maNhom: 2, name: 'Cán bộ Tuyển sinh 1' }
    ];

    const candidates = [
        { SBD: 'TS001', CCCD: '001082000001', HoTen: 'Nguyễn Văn An', NgaySinh: '2005-01-15', GioiTinh: 'Nam', Email: 'nguyenvanan.test@yopmail.com', SDT: '0901111222', KhuVuc: 'KV1' },
        { SBD: 'TS002', CCCD: '001082000002', HoTen: 'Trần Thị Bình', NgaySinh: '2005-02-20', GioiTinh: 'Nữ', Email: 'tranthibinh.test@yopmail.com', SDT: '0902222333', KhuVuc: 'KV2' },
        { SBD: 'TS003', CCCD: '001082000003', HoTen: 'Lê Hoàng Cường', NgaySinh: '2005-03-25', GioiTinh: 'Nam', Email: 'lehoangcuong.test@yopmail.com', SDT: '0903333444', KhuVuc: 'KV3' },
        { SBD: 'TS010', CCCD: '001082000010', HoTen: 'Ngô Kiều Oanh', NgaySinh: '2005-10-08', GioiTinh: 'Nữ', Email: 'hellotuilabao@gmail.com', SDT: '0900000111', KhuVuc: 'KV1' }
    ];

    // 4. Dữ liệu điểm chi tiết (Để có thông tin hiển thị lên giao diện nếu cần)
    const scoresData = [
        { SBD: 'TS001', scores: { TOAN: 8.5, LY: 8.0, HOA: 9.0 } },
        { SBD: 'TS002', scores: { TOAN: 5.0, LY: 6.0, HOA: 4.5 } },
        { SBD: 'TS003', scores: { TOAN: 9.0, LY: 8.5, HOA: 9.5 } },
        { SBD: 'TS010', scores: { TOAN: 8.5, LY: 8.0, HOA: 8.0 } }
    ];

    // 5. Dữ liệu Nguyện vọng phục vụ việc chạy thuật toán xét tuyển (UC 5)
    const nguyenVongData = [
        { SBD: 'TS001', ID_ChiTieu: 1, MaToHop: 'A00', ThuTuUuTien: 1, DiemTong: 25.5 },
        { SBD: 'TS002', ID_ChiTieu: 1, MaToHop: 'A00', ThuTuUuTien: 1, DiemTong: 15.5 },
        { SBD: 'TS003', ID_ChiTieu: 2, MaToHop: 'A01', ThuTuUuTien: 1, DiemTong: 27.0 },
        { SBD: 'TS010', ID_ChiTieu: 1, MaToHop: 'A00', ThuTuUuTien: 1, DiemTong: 24.5 }
    ];

    try {
        console.log('⏳ Đang tiến hành đồng bộ dữ liệu mẫu vào Database...');

        // Tự động bổ sung cột Điểm Chuẩn vào bảng ChiTieuTuyenSinh nếu trong schema chưa có
        await pool.query(`ALTER TABLE ChiTieuTuyenSinh ADD COLUMN IF NOT EXISTS DiemChuan DECIMAL(5,2) NULL;`);

        // --- NẠP DANH MỤC CƠ BẢN ---
        for (const nq of nhomQuyenData) {
            await pool.query(`INSERT INTO NhomQuyen (MaNhom, TenNhom) VALUES ($1, $2) ON CONFLICT (MaNhom) DO NOTHING;`, [nq.MaNhom, nq.TenNhom]);
        }
        for (const loai of loaiGiayToData) {
            await pool.query(`INSERT INTO LoaiGiayTo (MaLoai, TenLoai, BatBuoc) VALUES ($1, $2, $3) ON CONFLICT (MaLoai) DO UPDATE SET TenLoai = EXCLUDED.TenLoai;`, [loai.MaLoai, loai.TenLoai, loai.BatBuoc]);
        }
        for (const sub of subjectsData) {
            await pool.query(`INSERT INTO MonHoc (MaMon, TenMon) VALUES ($1, $2) ON CONFLICT (MaMon) DO UPDATE SET TenMon = EXCLUDED.TenMon;`, [sub.MaMon, sub.TenMon]);
        }
        for (const th of toHopData) {
            await pool.query(`INSERT INTO ToHopMon (MaToHop, TenToHop) VALUES ($1, $2) ON CONFLICT (MaToHop) DO UPDATE SET TenToHop = EXCLUDED.TenToHop;`, [th.MaToHop, th.TenToHop]);
        }
        
        // --- NẠP TÀI KHOẢN CÁN BỘ / ADMIN ---
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Ptit@123', salt);
        for (const staff of staffData) {
            await pool.query(`INSERT INTO NhanVien (Email, MatKhau, MaNhom, HoTen) VALUES ($1, $2, $3, $4) ON CONFLICT (Email) DO NOTHING;`, [staff.email, hashedPassword, staff.maNhom, staff.name]);
        }
        console.log('✅ Đã nạp thành công tài khoản Cán bộ/Admin! (Mật khẩu: Ptit@123)');

        // --- NẠP KHOA, NGÀNH VÀ CHỈ TIÊU ---
        for (const khoa of khoaData) {
            await pool.query(`INSERT INTO Khoa (MaKhoa, TenKhoa) VALUES ($1, $2) ON CONFLICT (MaKhoa) DO NOTHING;`, [khoa.MaKhoa, khoa.TenKhoa]);
        }
        for (const nganh of nganhData) {
            await pool.query(`INSERT INTO Nganh (MaNganh, TenNganh, MaKhoa) VALUES ($1, $2, $3) ON CONFLICT (MaNganh) DO NOTHING;`, [nganh.MaNganh, nganh.TenNganh, nganh.MaKhoa]);
        }
        
        // Tạo Đợt tuyển sinh và lấy ID
        const dotRes = await pool.query(`
            INSERT INTO DotTuyenSinh (TenDot, NamHoc, IsActive) VALUES ($1, $2, $3)
            ON CONFLICT DO NOTHING RETURNING MaDot;
        `, [dotTuyenSinhData[0].TenDot, dotTuyenSinhData[0].NamHoc, dotTuyenSinhData[0].IsActive]);
        let maDot = dotRes.rows.length > 0 ? dotRes.rows[0].madot : 1;

        // Xóa chỉ tiêu cũ để tránh trùng ID khi chạy seed nhiều lần, sau đó tạo 3 Chỉ tiêu
        await pool.query(`DELETE FROM ChiTieuTuyenSinh;`);
        await pool.query(`ALTER SEQUENCE chitieutuyensinh_id_seq RESTART WITH 1;`); 
        for (const chiTieu of chiTieuData) {
            await pool.query(`INSERT INTO ChiTieuTuyenSinh (MaDot, MaNganh, SoLuong) VALUES ($1, $2, $3)`, [maDot, chiTieu.MaNganh, chiTieu.SoLuong]);
        }
        console.log('✅ Đã nạp thành công 3 cấu hình Chỉ tiêu tuyển sinh!');

        // --- NẠP THÍ SINH ---
        for (const candidate of candidates) {
            const isMale = candidate.GioiTinh === 'Nam';
            await pool.query(`
                INSERT INTO ThiSinh (SBD, CCCD, HoTen, NgaySinh, GioiTinh, Email, SDT, KhuVuc)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (SBD) DO UPDATE SET HoTen = EXCLUDED.HoTen, KhuVuc = EXCLUDED.KhuVuc;
            `, [candidate.SBD, candidate.CCCD, candidate.HoTen, candidate.NgaySinh, isMale, candidate.Email, candidate.SDT, candidate.KhuVuc]);
        }
        console.log('✅ Đã nạp thông tin cá nhân thí sinh!');

        // --- NẠP CHI TIẾT ĐIỂM ---
        for (const cand of scoresData) {
            await pool.query('DELETE FROM ChiTietDiem WHERE SBD = $1', [cand.SBD]);
            for (const [maMon, diem] of Object.entries(cand.scores)) {
                await pool.query(
                    `INSERT INTO ChiTietDiem (SBD, MaMon, Diem) VALUES ($1, $2, $3)`,
                    [cand.SBD, maMon, diem]
                );
            }
        }
        console.log('✅ Đã nạp thành công Điểm chi tiết cho thí sinh!');

        // --- NẠP NGUYỆN VỌNG ---
        await pool.query(`DELETE FROM NguyenVong;`);
        for (const nv of nguyenVongData) {
            await pool.query(`
                INSERT INTO NguyenVong (SBD, ID_ChiTieu, MaToHop, ThuTuUuTien, DiemTong, TrangThai) 
                VALUES ($1, $2, $3, $4, $5, 0)
            `, [nv.SBD, nv.ID_ChiTieu, nv.MaToHop, nv.ThuTuUuTien, nv.DiemTong]);
        }
        console.log('✅ Đã nạp dữ liệu Nguyện vọng thành công!');

    } catch (error) {
        console.error('❌ Lỗi khi nạp dữ liệu (Seed Data):', error.message);
    } finally {
        await pool.end();
        console.log('👋 Đã đóng kết nối Database.');
    }
};

seedDatabase();