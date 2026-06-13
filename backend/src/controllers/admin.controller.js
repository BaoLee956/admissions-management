const { pool } = require('../config/database');

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
const getApplicationDetails = async (req, res) => {
    // Lấy mã hồ sơ từ trên thanh URL (params)
    const { id } = req.params; 

    try {
        // 1. Lấy thông tin chung của hồ sơ và thí sinh
        const hoSoQuery = `
            SELECT 
                hs.MaHoSo AS "maHoSo",
                hs.TrangThai AS "trangThai",
                ts.SBD AS "sbd",
                ts.HoTen AS "hoTen",
                ts.CCCD AS "cccd",
                ts.NgaySinh AS "ngaySinh",
                ts.GioiTinh AS "gioiTinh",
                ts.Email AS "email",
                ts.SDT AS "sdt",
                ts.KhuVuc AS "khuVuc"
            FROM HoSoNhapHoc hs
            JOIN ThiSinh ts ON hs.SBD = ts.SBD
            WHERE hs.MaHoSo = $1;
        `;
        const hoSoResult = await pool.query(hoSoQuery, [id]);

        // Nếu không tìm thấy mã hồ sơ này
        if (hoSoResult.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy hồ sơ yêu cầu.' });
        }

        // 2. Lấy danh sách giấy tờ minh chứng đã tải lên
        const giayToQuery = `
            SELECT 
                g.MaLoai AS "maLoai",
                l.TenLoai AS "tenLoai",
                g.DuongDanFile AS "duongDanFile"
            FROM GiayToDinhKem g
            JOIN LoaiGiayTo l ON g.MaLoai = l.MaLoai
            WHERE g.MaHoSo = $1;
        `;
        const giayToResult = await pool.query(giayToQuery, [id]);

        // 3. Đóng gói dữ liệu trả về cho Frontend
        const applicationData = {
            thongTinChung: hoSoResult.rows[0],
            giayToMinhChung: giayToResult.rows // Đây sẽ là một mảng chứa 3 link ảnh
        };

        res.status(200).json({
            message: 'Lấy chi tiết hồ sơ thành công.',
            data: applicationData
        });

    } catch (error) {
        console.error('Lỗi tại getApplicationDetails:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
    }
};
const reviewApplication = async (req, res) => {
    const { id } = req.params; // Lấy Mã Hồ Sơ từ URL
    const { trangThai, lyDo } = req.body; // Lấy quyết định từ Body (2: Duyệt, 3: Yêu cầu bổ sung/Từ chối)

    // 1. Validate dữ liệu đầu vào
    if (![2, 3].includes(trangThai)) {
        return res.status(400).json({ 
            error: { code: 'INVALID_STATUS', message: 'Trạng thái không hợp lệ. Chỉ chấp nhận 2 (Duyệt) hoặc 3 (Từ chối/Bổ sung).' } 
        });
    }

    try {
        // 2. Kiểm tra xem hồ sơ có tồn tại và đang ở trạng thái Chờ duyệt (1) không
        const checkQuery = 'SELECT TrangThai, SBD FROM HoSoNhapHoc WHERE MaHoSo = $1';
        const checkResult = await pool.query(checkQuery, [id]);

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy hồ sơ.' });
        }

        const hoSo = checkResult.rows[0];

        if (hoSo.trangthai !== 1) {
            return res.status(400).json({ message: 'Hồ sơ này đã được xử lý trước đó.' });
        }

        // 3. Tiến hành cập nhật trạng thái mới
        // Lưu ý: Nếu database của bạn có cột LyDo, bạn có thể update thêm cột đó vào đây
        const updateQuery = `
            UPDATE HoSoNhapHoc 
            SET TrangThai = $1 
            WHERE MaHoSo = $2
            RETURNING MaHoSo, TrangThai;
        `;
        const updateResult = await pool.query(updateQuery, [trangThai, id]);

        // (Tùy chọn nâng cao sau này: Gọi hàm sendMail gửi email thông báo kết quả cho thí sinh tại đây)

        const messageAlert = trangThai === 2 
            ? '✅ Đã PHÊ DUYỆT hồ sơ thành công.' 
            : '❌ Đã TỪ CHỐI / Yêu cầu bổ sung hồ sơ.';

        res.status(200).json({
            message: messageAlert,
            data: {
                maHoSo: updateResult.rows[0].mahoso,
                trangThaiMoi: updateResult.rows[0].trangthai,
                lyDo: lyDo || null
            }
        });

    } catch (error) {
        console.error('Lỗi tại reviewApplication:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
    }
};
module.exports = {
    getPendingApplications,
    getApplicationDetails,
    reviewApplication
};