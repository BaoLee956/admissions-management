const jwt = require('jsonwebtoken');

// Middleware 1: Kiểm tra xem Request có Token hợp lệ không
const verifyToken = (req, res, next) => {
    // Lấy token từ header 'Authorization' (Định dạng: Bearer <token>)
    const authHeader = req.header('Authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            error: { code: 'NO_TOKEN', message: 'Truy cập bị từ chối. Vui lòng đăng nhập.' } 
        });
    }

    try {
        // Giải mã token bằng chữ ký bí mật
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Gắn thông tin người dùng (SBD, Role) vào request để các Controller phía sau sử dụng
        req.user = decoded; 
        next(); // Cho phép đi tiếp
    } catch (error) {
        return res.status(401).json({ 
            error: { code: 'INVALID_TOKEN', message: 'Token không hợp lệ hoặc đã hết hạn.' } 
        });
    }
};

// Middleware 2: Kiểm tra phân quyền (Role)
const checkRole = (role) => {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).json({ 
                error: { code: 'FORBIDDEN', message: 'Bạn không có quyền thực hiện hành động này.' } 
            });
        }
        next();
    };
};

module.exports = { verifyToken, checkRole };