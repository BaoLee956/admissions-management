const { Pool } = require('pg');
require('dotenv').config(); // Tải các biến môi trường từ file .env

// Khởi tạo một Connection Pool
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    
    // Nếu bạn sử dụng chuỗi kết nối DATABASE_URL thay vì các biến rời, hãy comment các dòng trên và uncomment dòng dưới:
    // connectionString: process.env.DATABASE_URL,
    
    // Cấu hình tối ưu (có thể tùy chỉnh theo cấu hình server)
    max: 20, // Số lượng kết nối tối đa trong Pool
    idleTimeoutMillis: 30000, // Đóng kết nối nếu không hoạt động sau 30 giây
    connectionTimeoutMillis: 2000, // Thời gian chờ tối đa khi cố gắng kết nối
});

// Hàm kiểm tra kết nối để gọi khi khởi động Server
const testConnection = async () => {
    try {
        // Cố gắng lấy một kết nối (client) từ pool
        const client = await pool.connect();
        
        // Truy vấn thử một câu lệnh SQL cơ bản để xác nhận
        const res = await client.query('SELECT NOW() AS current_time');
        
        console.log('✅ Kết nối đến Cơ sở dữ liệu PostgreSQL thành công!');
        console.log('🕒 Thời gian DB:', res.rows[0].current_time);
        
        // Trả lại kết nối cho pool sau khi dùng xong
        client.release();
    } catch (error) {
        console.error('❌ Lỗi kết nối đến PostgreSQL:');
        console.error(error.message);
        
        // Nếu không kết nối được DB quan trọng, có thể cân nhắc dừng server
        // process.exit(1); 
    }
};

// Lắng nghe các lỗi phát sinh bất ngờ từ pool
pool.on('error', (err, client) => {
    console.error('Lỗi Unexpected (Bất ngờ) trên idle client', err);
    process.exit(-1);
});

module.exports = {
    pool, // Export pool để các file trong thư mục services/models sử dụng để thực thi SQL
    testConnection // Export hàm test để gọi ở server.js
};