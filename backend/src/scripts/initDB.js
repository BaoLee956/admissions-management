require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database'); // Gọi pool kết nối từ file bạn vừa test thành công

const initDatabase = async () => {
    try {
        console.log('⏳ Đang tiến hành đọc file schema.sql...');
        
        // Trỏ đường dẫn tới file schema.sql
        const sqlFilePath = path.join(__dirname, '../database/schema.sql');
        
        // Đọc nội dung file SQL
        const sqlQuery = fs.readFileSync(sqlFilePath, { encoding: 'utf-8' });
        
        console.log('⏳ Đang thực thi truy vấn tạo bảng vào PostgreSQL...');
        
        // Chạy toàn bộ câu lệnh SQL trong file
        await pool.query(sqlQuery);
        
        console.log('✅ Khởi tạo Cơ sở dữ liệu thành công! Toàn bộ bảng đã được nạp.');
        
    } catch (error) {
        console.error('❌ Lỗi khi khởi tạo Cơ sở dữ liệu:');
        console.error(error.message);
    } finally {
        // Đóng kết nối pool sau khi chạy xong để script tự động thoát
        await pool.end();
        console.log('👋 Đã đóng kết nối Database.');
    }
};

// Gọi hàm thực thi
initDatabase();