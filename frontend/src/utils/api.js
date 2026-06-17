import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:3000/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => {
        return response; 
    },
    (error) => {
        // Xử lý lỗi 401 (Hết hạn Token tự nhiên)
        if (error.response && error.response.status === 401) {
            const requestUrl = error.config.url;
            if (requestUrl === '/auth/admin/login') {
                return Promise.reject(error);
            }
            console.warn("Token đã hết hạn, tự động đăng xuất.");
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('user');
            window.location.href = '/officer/login';
        }
        
        // --- LOGIC MỚI: BẮT LỖI 403 BỊ KHÓA TÀI KHOẢN ---
        if (error.response && error.response.status === 403) {
            const errorMsg = error.response.data?.error;
            const isLockedOut = error.response.data?.isLockedOut;
            
            if (isLockedOut || errorMsg === 'Quản trị viên đã khóa tài khoản của bạn, liên hệ để mở lại') {
                // Hiển thị thông báo bắt buộc
                window.alert('Quản trị viên đã khóa tài khoản của bạn, liên hệ để mở lại');
                
                // Xóa sạch phiên làm việc
                localStorage.removeItem('token');
                localStorage.removeItem('role');
                localStorage.removeItem('user');
                
                // Đá văng ra màn hình đăng nhập
                window.location.href = '/officer/login';
            }
        }
        // ------------------------------------------------

        return Promise.reject(error);
    }
);

export default apiClient;