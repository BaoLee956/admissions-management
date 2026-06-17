const jwt = require('jsonwebtoken');
const { pool } = require('../config/database'); // Đã thêm import này

// 1. Middleware kiểm tra và giải mã Token
const verifyToken = async (req, res, next) => { // Thêm async ở đây
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ message: 'Không tìm thấy Token xác thực trong Header.' });
    }

    const token = authHeader.split(' ')[1]; 
    if (!token) {
        return res.status(401).json({ message: 'Token không hợp lệ.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // --- LOGIC MỚI: KIỂM TRA TRẠNG THÁI KHÓA NGAY LẬP TỨC ---
        if (decoded.role === 'OFFICER' || decoded.role === 'ADMIN') {
            const checkQuery = 'SELECT islocked FROM NhanVien WHERE MaNhanVien = $1';
            const result = await pool.query(checkQuery, [decoded.id]);
            
            // Nếu phát hiện DB đổi thành true, chặn lại ngay và cấp cờ isLockedOut
            if (result.rows.length > 0 && result.rows[0].islocked) {
                return res.status(403).json({ 
                    error: 'Quản trị viên đã khóa tài khoản của bạn, liên hệ để mở lại',
                    isLockedOut: true 
                });
            }
        }
        // --------------------------------------------------------

        req.user = decoded; 
        next(); 
    } catch (error) {
        return res.status(403).json({ message: 'Token đã hết hạn hoặc không hợp lệ.' });
    }
};

// 2. Middleware kiểm tra Quyền (Role)
const checkRole = (roles) => {
    return (req, res, next) => {
        // TỰ ĐỘNG ÉP KIỂU: Nếu roles truyền vào là chuỗi ('ADMIN'), tự bọc nó thành mảng (['ADMIN'])
        const allowedRoles = Array.isArray(roles) ? roles : [roles];

        // Kiểm tra xem user có tồn tại và role của user có nằm trong danh sách cho phép không
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: `Bạn không có quyền thực hiện hành động này. Yêu cầu quyền: ${allowedRoles.join(' hoặc ')}`
                }
            });
        }
        next(); 
    };
};

module.exports = {
    verifyToken,
    checkRole
};