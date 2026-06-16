const jwt = require('jsonwebtoken');

// 1. Middleware kiểm tra và giải mã Token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({ message: 'Không tìm thấy Token xác thực trong Header.' });
    }

    const token = authHeader.split(' ')[1]; // Tách lấy chuỗi token sau chữ "Bearer "
    if (!token) {
        return res.status(401).json({ message: 'Token không hợp lệ.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Lưu thông tin giải mã được (id, email, role) vào req.user
        next(); // Cho đi tiếp
    } catch (error) {
        return res.status(403).json({ message: 'Token đã hết hạn hoặc không hợp lệ.' });
    }
};

// 2. Middleware kiểm tra Quyền (Role)
// LƯU Ý: Phải nhận vào tham số 'roles' là một mảng, ví dụ ['ADMIN', 'OFFICER']
const checkRole = (roles) => {
    return (req, res, next) => {
        // Kiểm tra xem user có tồn tại và role của user có nằm trong mảng cho phép không
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                error: {
                    code: 'FORBIDDEN',
                    message: `Bạn không có quyền thực hiện hành động này. Yêu cầu quyền: ${roles.join(' hoặc ')}`
                }
            });
        }
        next(); // Đủ quyền thì cho đi tiếp vào Controller
    };
};

module.exports = {
    verifyToken,
    checkRole
};