const { pool } = require('../config/database');
const { sendMail } = require('../utils/email.service');
const jwt = require('jsonwebtoken'); 

// Hàm hỗ trợ random mã OTP 6 số
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ========================================================
// 1. HÀM YÊU CẦU GỬI OTP
// ========================================================
const requestCandidateOTP = async (req, res) => {
    const { sbd, cccd } = req.body;

    try {
        const checkUserQuery = 'SELECT * FROM ThiSinh WHERE SBD = $1 AND CCCD = $2';
        const userResult = await pool.query(checkUserQuery, [sbd, cccd]);

        if (userResult.rows.length === 0) {
            return res.status(400).json({ 
                error: { code: 'INVALID_CREDENTIALS', message: 'Số báo danh hoặc CCCD không hợp lệ.' } 
            });
        }

        const candidate = userResult.rows[0];
        const otpCode = generateOTP();
        const expiredAt = new Date(Date.now() + 3 * 60000);

        const updateOTPQuery = 'UPDATE ThiSinh SET OTP_code = $1, OTP_ExpiredAt = $2 WHERE SBD = $3';
        await pool.query(updateOTPQuery, [otpCode, expiredAt, sbd]);

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

        res.status(200).json({ message: `Mã OTP đã được gửi về email ${candidate.email.replace(/(.{2})(.*)(?=@)/, "$1***")}` });

    } catch (error) {
        console.error('Lỗi tại requestCandidateOTP:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
    }
};

// ========================================================
// 2. HÀM KIỂM TRA OTP VÀ CẤP TOKEN
// ========================================================
const verifyCandidateOTP = async (req, res) => {
    const { sbd, cccd, otp } = req.body;

    try {
        const checkQuery = 'SELECT * FROM ThiSinh WHERE SBD = $1 AND CCCD = $2 AND OTP_code = $3';
        const result = await pool.query(checkQuery, [sbd, cccd, otp]);

        if (result.rows.length === 0) {
            return res.status(400).json({ 
                error: { code: 'INVALID_OTP', message: 'Mã OTP không chính xác hoặc thông tin không hợp lệ.' } 
            });
        }

        const candidate = result.rows[0];

        const currentTime = new Date();
        const expiredTime = new Date(candidate.otp_expiredat);

        if (currentTime > expiredTime) {
            return res.status(400).json({ 
                error: { code: 'OTP_EXPIRED', message: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.' } 
            });
        }

        const payload = {
            sbd: candidate.sbd,
            role: 'CANDIDATE' 
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { 
            expiresIn: process.env.JWT_EXPIRES_IN 
        });

        const resetOTPQuery = 'UPDATE ThiSinh SET OTP_code = NULL, OTP_ExpiredAt = NULL WHERE SBD = $1';
        await pool.query(resetOTPQuery, [sbd]);

        res.status(200).json({
            message: 'Xác thực thành công.',
            token: token,
            user: {
                sbd: candidate.sbd,
                hoTen: candidate.hoten
            }
        });

    } catch (error) {
        console.error('Lỗi tại verifyCandidateOTP:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
    }
};

module.exports = {
    requestCandidateOTP,
    verifyCandidateOTP
};