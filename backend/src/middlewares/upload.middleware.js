const multer = require('multer');

// Sử dụng RAM (MemoryStorage) để lưu file tạm thời trước khi đẩy thẳng lên Cloudinary
const storage = multer.memoryStorage();

// Bộ lọc định dạng file (Chỉ nhận JPG, PNG, PDF)
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'image/jpeg', 
        'image/jpg', 
        'image/png', 
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // File .xlsx
        'application/vnd.ms-excel' // File .xls
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('INVALID_FILE_TYPE'), false);
    }
};

// Khởi tạo middleware Multer
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn kích thước tối đa 5MB
    fileFilter: fileFilter
});

// Hàm xử lý bắt lỗi của Multer để trả về JSON đẹp thay vì sập server
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: { code: 'FILE_TOO_LARGE', message: 'Dung lượng file vượt quá 5MB.' } });
        }
    } else if (err) {
        if (err.message === 'INVALID_FILE_TYPE') {
            return res.status(400).json({ error: { code: 'INVALID_FILE_TYPE', message: 'Chỉ chấp nhận file định dạng .jpg, .png, hoặc .pdf.' } });
        }
        return res.status(500).json({ message: 'Lỗi không xác định khi tải file.' });
    }
    next();
};

module.exports = {
    upload,
    handleUploadError
};