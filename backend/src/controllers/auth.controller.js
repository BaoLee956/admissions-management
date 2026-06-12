const { pool } = require('../config/database');
const { sendMail } = require('../utils/email.service');

// Hàm hỗ trợ random mã OTP 6 số
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const requestCandidateOTP = async (req, res) => {
    const { sbd, cccd } = req.body;

    try {
        // 1. Kiểm tra SBD và CCCD có tồn tại và khớp nhau không (BR-001)
        const checkUserQuery = 'SELECT * FROM ThiSinh WHERE SBD = $1 AND CCCD = $2';
        const userResult = await pool.query(checkUserQuery, [sbd, cccd]);

        if (userResult.rows.length === 0) {
            return res.status(400).json({ 
                error: { code: 'INVALID_CREDENTIALS', message: 'Số báo danh hoặc CCCD không hợp lệ.' } 
            });
        }

        const candidate = userResult.rows[0];
        const otpCode = generateOTP();
        
        // 2. Thiết lập thời gian hết hạn: 3 phút tính từ thời điểm hiện tại (BR-010)
        const expiredAt = new Date(Date.now() + 3 * 60000);

        // 3. Cập nhật OTP và thời gian hết hạn vào bảng ThiSinh
        const updateOTPQuery = 'UPDATE ThiSinh SET OTP_code = $1, OTP_ExpiredAt = $2 WHERE SBD = $3';
        await pool.query(updateOTPQuery, [otpCode, expiredAt, sbd]);

        // 4. Gửi mã OTP qua Email của Thí sinh
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #2c3e50;">Xác thực đăng nhập Hệ thống Tuyển sinh</h2>
                <p>Chào ${candidate.hoten},</p>
                <p>Mã xác thực OTP của bạn là: <b style="font-size: 24px; color: #e74c3c;">${otpCode}</b></p>
                <p>Mã này có hiệu lực trong vòng <b>3 phút</b>. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
            </div>
        `;
        
        const mailSent = await sendMail(candidate.email, 'Mã xác thực đăng nhập (OTP)', htmlContent);

        if (!mailSent) {
            return res.status(500).json({ message: 'Không thể gửi email OTP lúc này. Vui lòng thử lại sau.' });
        }

        // 5. Trả về response thành công theo đúng API Design
        res.status(200).json({ message: `Mã OTP đã được gửi về email ${candidate.email.replace(/(.{2})(.*)(?=@)/, "$1***")}` });

    } catch (error) {
        console.error('Lỗi tại requestCandidateOTP:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
    }
};

module.exports = {
    requestCandidateOTP
};