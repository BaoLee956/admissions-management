const nodemailer = require('nodemailer');
require('dotenv').config();

// Khởi tạo transporter (Người vận chuyển) sử dụng cấu hình Gmail từ .env
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // Dùng port 587 thì secure = false
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // Mật khẩu ứng dụng 16 ký tự
    },
});

// Hàm dùng chung để gửi email
const sendMail = async (to, subject, htmlContent) => {
    try {
        const mailOptions = {
            from: `"Hệ Thống Tuyển Sinh" <${process.env.SMTP_USER}>`,
            to: to,
            subject: subject,
            html: htmlContent, // Cho phép gửi giao diện HTML đẹp mắt thay vì text khô khan
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✉️ Đã gửi email thành công đến: ${to} (Message ID: ${info.messageId})`);
        return true;
    } catch (error) {
        console.error('❌ Lỗi khi gửi email:', error.message);
        return false;
    }
};

module.exports = {
    sendMail,
};