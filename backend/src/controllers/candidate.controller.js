const { pool } = require('../config/database');
const cloudinary = require('../config/cloudinary');

// [GET] Lấy kết quả xét tuyển của thí sinh đang đăng nhập
const getAdmissionResult = async (req, res) => {
    const sbd = req.user.sbd; 

    try {
        const query = `
            SELECT 
                ts.HoTen AS "hoTen",
                ts.KhuVuc AS "khuVuc",
                n.TenNganh AS "nganhTrungTuyen",
                nv.DiemTong AS "diemCuaBan",
                ct.DiemChuan AS "diemChuan",
                nv.TrangThai AS "trangThaiKetQua",
                hs.TrangThai AS "trangThaiHoSo",
                hs.GhiChu AS "ghiChu"
            FROM ThiSinh ts
            LEFT JOIN NguyenVong nv ON ts.SBD = nv.SBD
            LEFT JOIN ChiTieuTuyenSinh ct ON nv.ID_ChiTieu = ct.ID
            LEFT JOIN Nganh n ON ct.MaNganh = n.MaNganh
            LEFT JOIN HoSoNhapHoc hs ON ts.SBD = hs.SBD
            WHERE ts.SBD = $1 
            ORDER BY nv.ThuTuUuTien ASC
            LIMIT 1;
        `;
        
        const result = await pool.query(query, [sbd]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy dữ liệu xét tuyển của bạn.' });
        }

        const data = result.rows[0];

        // Logic quy đổi điểm ưu tiên khu vực
        const getDiemUuTien = (kv) => {
            if (kv === 'KV1') return 0.75;
            if (kv === 'KV2') return 0.25;
            return 0.00;
        };

        const chiTietQuery = `
            SELECT m.TenMon AS "mon", c.Diem AS "diem" 
            FROM ChiTietDiem c 
            JOIN MonHoc m ON c.MaMon = m.MaMon 
            WHERE c.SBD = $1;
        `;
        const resultDiem = await pool.query(chiTietQuery, [sbd]);

        res.status(200).json({
            data: {
                hoTen: data.hoTen,
                nganhTrungTuyen: data.nganhTrungTuyen || 'Chưa có kết quả',
                diemChuan: data.diemChuan || '---',
                diemCuaBan: data.diemCuaBan,
                diemUuTien: getDiemUuTien(data.khuVuc),
                trangThai: data.trangThaiKetQua === 1 ? 'TRUNG_TUYEN' : 'KHONG_TRUNG_TUYEN',
                daXacNhanNhapHoc: data.trangThaiHoSo !== null, 
                trangThaiHoSo: data.trangThaiHoSo,
                ghiChu: data.ghiChu,
                diemChiTiet: resultDiem.rows
            }
        });

    } catch (error) {
        console.error('Lỗi tại getAdmissionResult:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
    }
};

// [PUT] Xác nhận nhập học
const confirmEnrollment = async (req, res) => {
    const sbd = req.user.sbd; 
    const { daXacNhanNhapHoc } = req.body;

    if (daXacNhanNhapHoc !== true) {
        return res.status(400).json({ 
            error: { code: 'INVALID_ACTION', message: 'Vui lòng xác nhận đồng ý nhập học.' } 
        });
    }

    try {
        const insertQuery = `
            INSERT INTO HoSoNhapHoc (SBD, TrangThai) 
            VALUES ($1, 0) 
            ON CONFLICT (SBD) DO NOTHING 
            RETURNING MaHoSo;
        `;
        
        await pool.query(insertQuery, [sbd]);

        res.status(200).json({ 
            message: 'Xác nhận nhập học thành công. Bạn có thể bắt đầu nộp hồ sơ trực tuyến.' 
        });

    } catch (error) {
        console.error('Lỗi tại confirmEnrollment:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
    }
};

// [POST] Tải lên tài liệu minh chứng từng file
const uploadDocument = async (req, res) => {
    const sbd = req.user.sbd;
    const { maLoai } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: 'Vui lòng chọn file để tải lên.' });
    }

    if (!maLoai) {
        return res.status(400).json({ message: 'Vui lòng cung cấp mã loại giấy tờ (maLoai).' });
    }

    try {
        const hoSoQuery = 'SELECT MaHoSo, TrangThai FROM HoSoNhapHoc WHERE SBD = $1';
        const hoSoResult = await pool.query(hoSoQuery, [sbd]);

        if (hoSoResult.rows.length === 0) {
            return res.status(403).json({ 
                error: { code: 'NOT_CONFIRMED', message: 'Bạn chưa xác nhận nhập học hoặc chưa có hồ sơ trên hệ thống.' } 
            });
        }
        
        const hoSo = hoSoResult.rows[0];

        if (hoSo.trangthai !== 0 && hoSo.trangthai !== 3) { 
            return res.status(400).json({ 
                error: { 
                    code: 'APPLICATION_SUBMITTED', 
                    message: 'Hồ sơ của bạn đã được chốt nộp hoặc đang trong quá trình phê duyệt, không thể tải lên thêm giấy tờ mới.' 
                } 
            });
        }

        const maHoSo = hoSo.mahoso;

        const b64 = Buffer.from(req.file.buffer).toString("base64");
        const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
        
        const cloudRes = await cloudinary.uploader.upload(dataURI, {
            folder: `HoSoTuyenSinh/${sbd}`,
            resource_type: 'auto'
        });

        // ----------------------------------------------------------------------
        // FIX LỖI TÍCH LŨY FILE CŨ: Xóa file cũ của cùng mã loại trước khi thêm mới
        // ----------------------------------------------------------------------
        const deleteOldDocQuery = `
            DELETE FROM GiayToDinhKem 
            WHERE MaHoSo = $1 AND MaLoai = $2
        `;
        await pool.query(deleteOldDocQuery, [maHoSo, maLoai]);

        // Thêm file mới vào database
        const insertDocQuery = `
            INSERT INTO GiayToDinhKem (MaHoSo, MaLoai, DuongDanFile, TrangThaiFile)
            VALUES ($1, $2, $3, 1)
            RETURNING ID, DuongDanFile;
        `;
        const docResult = await pool.query(insertDocQuery, [maHoSo, maLoai, cloudRes.secure_url]);

        res.status(201).json({
            message: 'Tải file lên thành công.',
            data: {
                id: docResult.rows[0].id,
                duongDanFile: docResult.rows[0].duongdanfile
            }
        });

    } catch (error) {
        console.error('Lỗi uploadDocument:', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi xử lý file.' });
    }
};

// [POST] Chốt nộp hồ sơ tổng thể
const submitApplication = async (req, res) => {
    const sbd = req.user.sbd;

    try {
        const hoSoQuery = 'SELECT MaHoSo, TrangThai FROM HoSoNhapHoc WHERE SBD = $1';
        const hoSoResult = await pool.query(hoSoQuery, [sbd]);

        if (hoSoResult.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy hồ sơ. Bạn cần xác nhận nhập học trước.' });
        }

        const hoSo = hoSoResult.rows[0];

        if (hoSo.trangthai !== 0 && hoSo.trangthai !== 3) {
            return res.status(400).json({ message: 'Hồ sơ này đã được nộp hoặc đang được xử lý.' });
        }

        const checkMissingDocsQuery = `
            SELECT l.MaLoai, l.TenLoai
            FROM LoaiGiayTo l
            WHERE l.BatBuoc = true
            AND l.MaLoai NOT IN (
                SELECT g.MaLoai FROM GiayToDinhKem g WHERE g.MaHoSo = $1
            );
        `;
        const missingDocsResult = await pool.query(checkMissingDocsQuery, [hoSo.mahoso]);

        if (missingDocsResult.rows.length > 0) {
            return res.status(400).json({
                error: {
                    code: 'MISSING_REQUIRED_DOCS',
                    message: 'Bạn chưa tải lên đầy đủ giấy tờ bắt buộc. Vui lòng bổ sung.',
                    danhSachThieu: missingDocsResult.rows
                }
            });
        }

        const updateQuery = 'UPDATE HoSoNhapHoc SET TrangThai = 1 WHERE MaHoSo = $1';
        await pool.query(updateQuery, [hoSo.mahoso]);

        res.status(200).json({ 
            message: 'Nộp hồ sơ thành công; trạng thái: Chờ duyệt' 
        });

    } catch (error) {
        console.error('Lỗi tại submitApplication:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
    }
};

module.exports = {
    getAdmissionResult,
    confirmEnrollment,
    uploadDocument,
    submitApplication
};