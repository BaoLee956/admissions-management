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
        return response; // Nếu API gọi thành công, cho đi qua bình thường
    },
    (error) => {
        // Nếu Backend báo lỗi 401 (Chưa đăng nhập / Token hết hạn)
        if (error.response && error.response.status === 401) {
            console.warn("Token đã hết hạn, tự động đăng xuất.");
            // Xóa sạch dữ liệu phiên cũ
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('user');
            // Bắt buộc chuyển hướng về trang Login
            window.location.href = '/officer/login';
        }
        return Promise.reject(error);
    }
);

export default apiClient;