require('dotenv').config();
const jwt = require('jsonwebtoken');

// Tự động ký một Token với role là ADMIN thay vì CANDIDATE
const adminPayload = {
    username: 'admin_tuyensinh',
    role: 'ADMIN'
};

const token = jwt.sign(adminPayload, process.env.JWT_SECRET, { expiresIn: '1d' });

console.log('=============================================');
console.log('🔑 ADMIN TOKEN CỦA BẠN ĐÂY (Copy dòng bên dưới):');
console.log('=============================================');
console.log(token);
console.log('=============================================');