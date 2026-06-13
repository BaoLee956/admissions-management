require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/database');
const authRoutes = require('./routes/auth.routes');
const candidateRoutes = require('./routes/candidate.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Các Middlewares cơ bản
app.use(cors()); // Cho phép Frontend (React) gọi API xuống Backend
app.use(express.json()); // Giúp server đọc được dữ liệu JSON
app.use(express.urlencoded({ extended: true }));
app.use('/api/v1/auth', authRoutes); // Đăng ký các API Routes chính thức
app.use('/api/v1/candidates', candidateRoutes); // Đăng ký các API Routes cho thí sinh
app.use('/api/v1/admin', adminRoutes); // Đăng ký các API Routes cho admin

// API Test mặc định để kiểm tra server có sống không
app.get('/', (req, res) => {
    res.json({ message: 'Chào mừng đến với API Hệ thống Quản lý Tuyển sinh' });
});
const { sendMail } = require('./utils/email.service');
// Hàm khởi động Server
const startServer = async () => {
    // Chạy thử hàm kết nối DB trước khi mở port
    await testConnection();
    // await sendMail(
    //     'baog96005@gmail.com', 
    //     'Test Hệ Thống Tuyển Sinh', 
    //     '<h1>Thành công!</h1><p>Dịch vụ gửi mail đã hoạt động.</p>'
    // );
    // Mở port để server bắt đầu lắng nghe request
    app.listen(PORT, () => {
        console.log(`🚀 Server Backend đang chạy tại: http://localhost:${PORT}`);
    });
};

startServer();