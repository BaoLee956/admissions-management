const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

// ========================================================
// 1. NHÓM API QUẢN LÝ VÀ DUYỆT HỒ SƠ (UC 3 & UC 4)
// ========================================================

// [GET] Lấy danh sách hồ sơ có trạng thái Chờ duyệt (TrangThai = 1)
const getPendingApplications = async (req, res) => {
    try {
        const query = `
            SELECT 
                hs.MaHoSo AS "maHoSo",
                hs.SBD AS "sbd",
                ts.HoTen AS "hoTen",
                ts.CCCD AS "cccd",
                ts.KhuVuc AS "khuVuc",
                hs.TrangThai AS "trangThai"
            FROM HoSoNhapHoc hs
            JOIN ThiSinh ts ON hs.SBD = ts.SBD
            WHERE hs.TrangThai = 1
            ORDER BY hs.MaHoSo ASC;
        `;
        const result = await pool.query(query);
        res.status(200).json({
            message: 'Lấy danh sách hồ sơ chờ duyệt thành công.',
            tongSo: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error('Lỗi tại getPendingApplications:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
    }
};

// [GET] Chi tiết hồ sơ
const getApplicationDetails = async (req, res) => {
    const { id } = req.params; 
    try {
        const hoSoQuery = `
            SELECT 
                hs.MaHoSo AS "maHoSo", hs.TrangThai AS "trangThai", ts.SBD AS "sbd",
                ts.HoTen AS "hoTen", ts.CCCD AS "cccd", ts.NgaySinh AS "ngaySinh",
                ts.GioiTinh AS "gioiTinh", ts.Email AS "email", ts.SDT AS "sdt", ts.KhuVuc AS "khuVuc"
            FROM HoSoNhapHoc hs
            JOIN ThiSinh ts ON hs.SBD = ts.SBD
            WHERE hs.MaHoSo = $1;
        `;
        const hoSoResult = await pool.query(hoSoQuery, [id]);

        if (hoSoResult.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy hồ sơ yêu cầu.' });
        }

        const giayToQuery = `
            SELECT 
                g.MaLoai AS "maLoai", l.TenLoai AS "tenLoai", g.DuongDanFile AS "duongDanFile"
            FROM GiayToDinhKem g
            JOIN LoaiGiayTo l ON g.MaLoai = l.MaLoai
            WHERE g.MaHoSo = $1;
        `;
        const giayToResult = await pool.query(giayToQuery, [id]);

        res.status(200).json({
            message: 'Lấy chi tiết hồ sơ thành công.',
            data: { thongTinChung: hoSoResult.rows[0], giayToMinhChung: giayToResult.rows }
        });
    } catch (error) {
        console.error('Lỗi tại getApplicationDetails:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
    }
};

// [PUT] Duyệt hồ sơ
const reviewApplication = async (req, res) => {
    const { id } = req.params; 
    const { trangThai, lyDo } = req.body; 

    if (![2, 3].includes(trangThai)) {
        return res.status(400).json({ error: { code: 'INVALID_STATUS', message: 'Trạng thái không hợp lệ.' } });
    }

    try {
        const checkQuery = 'SELECT TrangThai, SBD FROM HoSoNhapHoc WHERE MaHoSo = $1';
        const checkResult = await pool.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy hồ sơ.' });
        if (checkResult.rows[0].trangthai !== 1) return res.status(400).json({ message: 'Hồ sơ này đã được xử lý trước đó.' });

        const updateQuery = `UPDATE HoSoNhapHoc SET TrangThai = $1 WHERE MaHoSo = $2 RETURNING MaHoSo, TrangThai;`;
        const updateResult = await pool.query(updateQuery, [trangThai, id]);

        const messageAlert = trangThai === 2 ? '✅ Đã PHÊ DUYỆT hồ sơ thành công.' : '❌ Đã TỪ CHỐI / Yêu cầu bổ sung hồ sơ.';

        res.status(200).json({
            message: messageAlert,
            data: { maHoSo: updateResult.rows[0].mahoso, trangThaiMoi: updateResult.rows[0].trangthai, lyDo: lyDo || null }
        });
    } catch (error) {
        console.error('Lỗi tại reviewApplication:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
    }
};

// ========================================================
// 2. NHÓM API XÉT TUYỂN & CẤP MSSV (UC 5 & UC 6)
// ========================================================

// [PUT] Thiết lập điểm chuẩn
const updateDiemChuan = async (req, res) => {
    const { idChiTieu, diemChuan } = req.body;
    try {
        const result = await pool.query(
            `UPDATE ChiTieuTuyenSinh SET DiemChuan = $1 WHERE ID = $2 RETURNING *`,
            [diemChuan, idChiTieu]
        );
        res.status(200).json({ message: "Cập nhật điểm chuẩn thành công", data: result.rows[0] });
    } catch (error) {
        console.error('Lỗi khi cập nhật điểm chuẩn:', error);
        res.status(500).json({ error: "Lỗi hệ thống khi cập nhật điểm chuẩn" });
    }
};

// [POST] Chạy thuật toán xét tuyển
const processAdmissions = async (req, res) => {
    try {
        const query = `
            UPDATE NguyenVong nv
            SET TrangThai = CASE 
                WHEN (nv.DiemTong + 
                    CASE ts.KhuVuc
                        WHEN 'KV1' THEN 0.75
                        WHEN 'KV2' THEN 0.25
                        WHEN 'KV2NT' THEN 0.5
                        WHEN 'KV3' THEN 0
                        ELSE 0
                    END
                ) >= ct.DiemChuan THEN 1
                ELSE 2
            END
            FROM ThiSinh ts, ChiTieuTuyenSinh ct, Nganh n
            WHERE nv.SBD = ts.SBD 
              AND nv.ID_ChiTieu = ct.ID
              AND ct.MaNganh = n.MaNganh
            RETURNING 
                nv.SBD AS "sbd", 
                ts.HoTen AS "hoTen", 
                n.TenNganh AS "tenNganh",
                nv.DiemTong AS "diemTong", 
                nv.TrangThai AS "trangThai";
        `;
        const result = await pool.query(query);
        res.status(200).json({ 
            message: "Đã hoàn tất quá trình xét tuyển", 
            processedCount: result.rowCount,
            details: result.rows 
        });
    } catch (error) {
        console.error('Lỗi khi chạy thuật toán xét tuyển:', error);
        res.status(500).json({ error: "Lỗi hệ thống khi chạy thuật toán xét tuyển", detail: error.message });
    }
};

// [GET] Lấy danh sách thí sinh trúng tuyển
const getAdmittedStudents = async (req, res) => {
    try {
        const query = `
            SELECT 
                ts.sbd as "sbd", ts.hoten as "hoTen", n.manganh as "maNganh",
                n.tennganh as "tenNganh", sv.mssv as "mssv",
                CASE WHEN sv.mssv IS NOT NULL THEN 1 ELSE 0 END as "daCapMa"
            FROM nguyenvong nv
            JOIN thisinh ts ON nv.sbd = ts.sbd
            JOIN chitieutuyensinh ct ON nv.id_chitieu = ct.id
            JOIN nganh n ON ct.manganh = n.manganh
            LEFT JOIN hosonhaphoc hs ON ts.sbd = hs.sbd
            LEFT JOIN sinhvien sv ON hs.mahoso = sv.mahoso 
            WHERE nv.trangthai = 1
            ORDER BY n.manganh ASC, ts.sbd ASC;
        `;
        const result = await pool.query(query);
        res.status(200).json({ data: result.rows });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách trúng tuyển:', error);
        res.status(500).json({ error: "Lỗi hệ thống khi lấy danh sách trúng tuyển" });
    }
};

// [POST] Cấp mã MSSV hàng loạt
const generateStudentIds = async (req, res) => {
    const client = await pool.connect(); 
    try {
        await client.query('BEGIN');
        const pendingQuery = `
            SELECT hs.MaHoSo, ts.SBD, ct.MaNganh 
            FROM HoSoNhapHoc hs
            JOIN ThiSinh ts ON hs.SBD = ts.SBD
            JOIN NguyenVong nv ON ts.SBD = nv.SBD AND nv.TrangThai = 1
            JOIN ChiTieuTuyenSinh ct ON nv.ID_ChiTieu = ct.ID
            WHERE hs.TrangThai = 2 
              AND NOT EXISTS (SELECT 1 FROM SinhVien sv WHERE sv.MaHoSo = hs.MaHoSo)
        `;
        const pendingStudents = await client.query(pendingQuery);

        let generatedCount = 0;
        for (let student of pendingStudents.rows) {
            const yearPrefix = new Date().getFullYear().toString().slice(-2); 
            const seqQuery = `
                SELECT COUNT(*) + 1 as next_seq FROM SinhVien sv
                JOIN HoSoNhapHoc h ON sv.MaHoSo = h.MaHoSo
                JOIN NguyenVong n ON h.SBD = n.SBD AND n.TrangThai = 1
                JOIN ChiTieuTuyenSinh c ON n.ID_ChiTieu = c.ID
                WHERE c.MaNganh = $1
            `;
            const seqResult = await client.query(seqQuery, [student.manganh]);
            const nextSeq = seqResult.rows[0].next_seq.toString().padStart(4, '0');
            const newMSSV = `${yearPrefix}${student.manganh}${nextSeq}`; 

            await client.query(`INSERT INTO SinhVien (MSSV, MaHoSo) VALUES ($1, $2)`, [newMSSV, student.mahoso]);
            generatedCount++;
        }
        await client.query('COMMIT');
        res.status(200).json({ message: `Cấp mã MSSV thành công cho ${generatedCount} sinh viên.` });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Lỗi cấp MSSV:', error);
        res.status(500).json({ error: "Lỗi cấp MSSV. Đã rollback dữ liệu." });
    } finally {
        client.release();
    }
};

// [GET] Lấy danh sách chỉ tiêu và điểm chuẩn hiện tại
const getAllCriteria = async (req, res) => {
    try {
        const query = `
            SELECT ct.ID as "idChiTieu", ct.MaNganh as "maNganh", n.TenNganh as "tenNganh", ct.SoLuong as "soLuong", ct.DiemChuan as "diemChuan"
            FROM ChiTieuTuyenSinh ct
            JOIN Nganh n ON ct.MaNganh = n.MaNganh
            ORDER BY ct.MaNganh ASC;
        `;
        const result = await pool.query(query);
        res.status(200).json({ data: result.rows });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách chỉ tiêu:', error);
        res.status(500).json({ error: "Lỗi hệ thống khi lấy danh sách chỉ tiêu" });
    }
};

// [GET] Thống kê dữ liệu cho trang Dashboard (UC 7)
const getDashboardStats = async (req, res) => {
    try {
        const tongThiSinhRes = await pool.query('SELECT COUNT(*) FROM ThiSinh');
        const tongThiSinh = parseInt(tongThiSinhRes.rows[0].count);

        const tongHoSoRes = await pool.query('SELECT COUNT(*) FROM HoSoNhapHoc');
        const tongHoSo = parseInt(tongHoSoRes.rows[0].count);

        const chuaNop = tongThiSinh - tongHoSo; 

        const trangThaiRes = await pool.query(`SELECT TrangThai, COUNT(*) as count FROM HoSoNhapHoc GROUP BY TrangThai`);
        let hoSoChoDuyet = 0;
        const bieuDoTrangThai = trangThaiRes.rows.map(row => {
            const count = parseInt(row.count);
            let name = 'Khác';
            if (row.trangthai === 0) name = 'Đang chuẩn bị (Nháp)';
            if (row.trangthai === 1) { name = 'Chờ phê duyệt'; hoSoChoDuyet = count; }
            if (row.trangthai === 2) name = 'Đã phê duyệt (Đủ)';
            if (row.trangthai === 3) name = 'Yêu cầu bổ sung';
            return { name, value: count, trangThai: row.trangthai };
        });

        const trungTuyenRes = await pool.query('SELECT COUNT(*) FROM NguyenVong WHERE TrangThai = 1');
        const trungTuyen = parseInt(trungTuyenRes.rows[0].count);

        const mssvRes = await pool.query('SELECT COUNT(*) FROM SinhVien');
        const daCapMssv = parseInt(mssvRes.rows[0].count);

        const lichSuRes = await pool.query(`
            SELECT hs.MaHoSo, ts.SBD, ts.HoTen, hs.TrangThai, hs.NgayNop
            FROM HoSoNhapHoc hs JOIN ThiSinh ts ON hs.SBD = ts.SBD
            ORDER BY hs.NgayNop DESC LIMIT 8
        `);

        res.status(200).json({
            data: {
                metrics: { tongThiSinh, tongHoSo, chuaNop, hoSoChoDuyet, trungTuyen, daCapMssv },
                charts: { trangThai: bieuDoTrangThai },
                activities: lichSuRes.rows
            }
        });
    } catch (error) {
        console.error('Lỗi lấy thống kê dashboard:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
    }
};

// ========================================================
// 3. BỔ SUNG: CÁC UC ĐỘC QUYỀN CHO ADMIN (UC 8, 9, 10)
// ========================================================

// --- UC08: QUẢN LÝ TÀI KHOẢN CÁN BỘ ---
// Lấy danh sách tất cả Cán bộ (MaNhom = 2)
const getAllOfficers = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT MaNhanVien AS "id", HoTen AS "name", Email AS "email", IsLocked AS "isLocked" 
             FROM NhanVien WHERE MaNhom = 2 ORDER BY MaNhanVien ASC`
        );
        res.status(200).json({ data: result.rows });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi không thể lấy danh sách cán bộ.' });
    }
};

// Admin tạo tài khoản Cán bộ mới
const createOfficer = async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ họ tên, email và mật khẩu.' });
    }
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const result = await pool.query(
            `INSERT INTO NhanVien (HoTen, Email, MatKhau, MaNhom) VALUES ($1, $2, $3, 2) RETURNING MaNhanVien, HoTen, Email`,
            [name, email, hashedPassword]
        );
        res.status(201).json({ message: 'Tạo tài khoản cán bộ thành công!', data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') return res.status(400).json({ message: 'Email này đã tồn tại trên hệ thống.' });
        res.status(500).json({ message: 'Lỗi máy chủ khi tạo tài khoản.' });
    }
};

// Admin đóng/mở khóa tài khoản Cán bộ (Toggle Lock)
const toggleLockOfficer = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `UPDATE NhanVien SET IsLocked = NOT IsLocked WHERE MaNhanVien = $1 RETURNING MaNhanVien, IsLocked`,
            [id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
        res.status(200).json({ message: 'Cập nhật trạng thái khóa tài khoản thành công.', data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi hệ thống khi cập nhật khóa tài khoản.' });
    }
};

// --- UC09: QUẢN LÝ DANH MỤC NGÀNH/KHOA ---
const createNganhCatalog = async (req, res) => {
    const { maNganh, tenNganh, maKhoa } = req.body;
    try {
        await pool.query(
            `INSERT INTO Nganh (MaNganh, TenNganh, MaKhoa) VALUES ($1, $2, $3)`,
            [maNganh, tenNganh, maKhoa]
        );
        res.status(201).json({ message: 'Thêm ngành học vào danh mục thành công.' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi hệ thống khi thêm ngành danh mục.' });
    }
};

// --- UC10: QUẢN LÝ ĐỢT TUYỂN SINH VÀ CHỈ TIÊU ---
const createDotTuyenSinh = async (req, res) => {
    const { tenDot, namHoc } = req.body;
    try {
        // Tự động tắt đợt cũ nếu mở đợt mới
        await pool.query(`UPDATE DotTuyenSinh SET IsActive = FALSE`);
        const result = await pool.query(
            `INSERT INTO DotTuyenSinh (TenDot, NamHoc, IsActive) VALUES ($1, $2, TRUE) RETURNING *`,
            [tenDot, namHoc]
        );
        res.status(201).json({ message: 'Khởi tạo đợt tuyển sinh mới thành công.', data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi khởi tạo đợt tuyển sinh.' });
    }
};

const addChiTieu = async (req, res) => {
    const { maDot, maNganh, soLuong } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO ChiTieuTuyenSinh (MaDot, MaNganh, SoLuong) VALUES ($1, $2, $3) RETURNING *`,
            [maDot, maNganh, soLuong]
        );
        res.status(201).json({ message: 'Cấu hình chỉ tiêu cho ngành thành công.', data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi cấu hình chỉ tiêu.' });
    }
};
const resetOfficerPassword = async (req, res) => {
    const { id } = req.params; // ID của cán bộ cần reset

    try {
        // Băm mật khẩu cố định '123456'
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash('123456', saltRounds);

        const updateQuery = 'UPDATE NhanVien SET MatKhau = $1 WHERE MaNhanVien = $2 RETURNING *';
        const result = await pool.query(updateQuery, [hashedPassword, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy tài khoản cán bộ.' });
        }

        res.status(200).json({ message: 'Đặt lại mật khẩu thành công (Mật khẩu mới: 123456).' });
    } catch (error) {
        console.error('Lỗi tại resetOfficerPassword:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
    }
};

module.exports = {
    getPendingApplications,
    getApplicationDetails,
    reviewApplication,
    getAllCriteria,
    updateDiemChuan,
    processAdmissions,
    generateStudentIds,
    getAdmittedStudents,
    getDashboardStats,
    // Xuất bản thêm các hàm Admin độc quyền
    getAllOfficers,
    createOfficer,
    toggleLockOfficer,
    createNganhCatalog,
    createDotTuyenSinh,
    addChiTieu,
    resetOfficerPassword
};