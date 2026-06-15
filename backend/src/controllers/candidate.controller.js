const { pool } = require('../config/database');
const cloudinary = require('../config/cloudinary');
// [GET] Lấy kết quả xét tuyển của thí sinh đang đăng nhập
const getAdmissionResult = async (req, res) => {
    // SBD này được lấy ra từ JWT Token đã giải mã ở Middleware, bảo mật tuyệt đối
    const sbd = req.user.sbd; 

    try {
        // Query kết hợp nhiều bảng: ThiSinh, NguyenVong, Nganh, ChiTieuTuyenSinh
        const query = `
            SELECT 
                ts.HoTen AS "hoTen",
                n.TenNganh AS "nganhTrungTuyen",
                nv.DiemTong AS "diemCuaBan",
                cx.DiemSan AS "diemChuan",
                nv.TrangThai AS "trangThaiKetQua",
                hs.TrangThai AS "trangThaiHoSo"
            FROM ThiSinh ts
            LEFT JOIN NguyenVong nv ON ts.SBD = nv.SBD
            LEFT JOIN ChiTieuTuyenSinh ct ON nv.ID_ChiTieu = ct.ID
            LEFT JOIN Nganh n ON ct.MaNganh = n.MaNganh
            LEFT JOIN CauTrucXetTuyen cx ON cx.MaNganh = n.MaNganh AND cx.MaToHop = nv.MaToHop
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

        // Thêm câu truy vấn lấy điểm chi tiết
        const chiTietQuery = `
            SELECT m.TenMon AS "mon", c.Diem AS "diem" 
            FROM ChiTietDiem c 
            JOIN MonHoc m ON c.MaMon = m.MaMon 
            WHERE c.SBD = $1;
        `;
        const resultDiem = await pool.query(chiTietQuery, [sbd]);

        // Format lại dữ liệu trả về cho Frontend
        res.status(200).json({
            data: {
                hoTen: data.hoTen,
                nganhTrungTuyen: data.nganhTrungTuyen || 'Chưa có kết quả',
                diemChuan: data.diemChuan,
                diemCuaBan: data.diemCuaBan,
                trangThai: data.trangThaiKetQua === 1 ? 'TRUNG_TUYEN' : 'KHONG_TRUNG_TUYEN',
                daXacNhanNhapHoc: data.trangThaiHoSo !== null, // Nếu đã có record trong bảng HoSoNhapHoc nghĩa là đã xác nhận
                diemChiTiet: resultDiem.rows
            }
        });

    } catch (error) {
        console.error('Lỗi tại getAdmissionResult:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
    }
};
const confirmEnrollment = async (req, res) => {
    const sbd = req.user.sbd; // Lấy SBD từ Token
    const { daXacNhanNhapHoc } = req.body;

    // Kiểm tra payload gửi lên
    if (daXacNhanNhapHoc !== true) {
        return res.status(400).json({ 
            error: { code: 'INVALID_ACTION', message: 'Vui lòng xác nhận đồng ý nhập học.' } 
        });
    }

    try {
        // Theo nguyên tắc, hệ thống sẽ kiểm tra thí sinh có Trúng tuyển không ở đây.
        // Tuy nhiên, do chúng ta đang dùng dữ liệu mẫu (chưa có điểm chuẩn), 
        // ta sẽ tiến hành khởi tạo trực tiếp Hồ sơ nhập học nháp cho thí sinh.

        const insertQuery = `
            INSERT INTO HoSoNhapHoc (SBD, TrangThai) 
            VALUES ($1, 0) 
            ON CONFLICT (SBD) DO NOTHING -- Tránh lỗi nếu thí sinh bấm xác nhận 2 lần
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
        // 1. Lấy MaHoSo của thí sinh (Chỉ những ai đã Xác nhận nhập học mới có)
        const hoSoQuery = 'SELECT MaHoSo FROM HoSoNhapHoc WHERE SBD = $1';
        const hoSoResult = await pool.query(hoSoQuery, [sbd]);

        if (hoSoResult.rows.length === 0) {
            return res.status(403).json({ 
                error: { code: 'NOT_CONFIRMED', message: 'Bạn chưa xác nhận nhập học hoặc chưa có hồ sơ trên hệ thống.' } 
            });
        }
        const maHoSo = hoSoResult.rows[0].mahoso;

        // 2. Mã hóa file từ RAM và đẩy lên Cloudinary
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        const dataURI = "data:" + req.file.mimetype + ";base64," + b64;
        
        const cloudRes = await cloudinary.uploader.upload(dataURI, {
            folder: `HoSoTuyenSinh/${sbd}`, // Tạo thư mục riêng cho từng SBD trên Cloud
            resource_type: 'auto' // Tự động nhận diện ảnh hoặc PDF
        });

        // 3. Lưu đường dẫn URL trả về vào Database
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
const submitApplication = async (req, res) => {
    const sbd = req.user.sbd;

    try {
        // 1. Kiểm tra hồ sơ có tồn tại và đang ở trạng thái Nháp (0) không
        const hoSoQuery = 'SELECT MaHoSo, TrangThai FROM HoSoNhapHoc WHERE SBD = $1';
        const hoSoResult = await pool.query(hoSoQuery, [sbd]);

        if (hoSoResult.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy hồ sơ. Bạn cần xác nhận nhập học trước.' });
        }

        const hoSo = hoSoResult.rows[0];

        if (hoSo.trangthai !== 0) {
            return res.status(400).json({ message: 'Hồ sơ này đã được nộp hoặc đang được xử lý.' });
        }

        // 2. ÁP DỤNG BR-005: Kiểm tra xem đã nộp đủ các loại giấy tờ Bắt Buộc chưa
        // Câu query này tìm các loại giấy tờ Bắt Buộc (BatBuoc = true) NHƯNG CHƯA CÓ trong bảng GiayToDinhKem của hồ sơ này
        const checkMissingDocsQuery = `
            SELECT l.MaLoai, l.TenLoai
            FROM LoaiGiayTo l
            WHERE l.BatBuoc = true
            AND l.MaLoai NOT IN (
                SELECT g.MaLoai FROM GiayToDinhKem g WHERE g.MaHoSo = $1
            );
        `;
        const missingDocsResult = await pool.query(checkMissingDocsQuery, [hoSo.mahoso]);

        // Nếu danh sách thiếu lớn hơn 0 -> Chặn gửi và báo lỗi
        if (missingDocsResult.rows.length > 0) {
            return res.status(400).json({
                error: {
                    code: 'MISSING_REQUIRED_DOCS',
                    message: 'Bạn chưa tải lên đầy đủ giấy tờ bắt buộc. Vui lòng bổ sung.',
                    danhSachThieu: missingDocsResult.rows // Trả về danh sách thiếu để FE hiển thị đỏ lên
                }
            });
        }

        // 3. Đủ giấy tờ -> Cập nhật trạng thái sang "Chờ duyệt" (1)
        const updateQuery = 'UPDATE HoSoNhapHoc SET TrangThai = 1 WHERE MaHoSo = $1';
        await pool.query(updateQuery, [hoSo.mahoso]);

        res.status(200).json({ 
            message: 'Nộp hồ sơ thành công; trạng thái: Chờ duyệt' // Response theo đúng API Design 
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