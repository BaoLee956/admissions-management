import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2 } from 'lucide-react';
import api from '../../utils/api';

const OfficerLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // POST request to authentication API
      const response = await api.post('/auth/admin/login', formData);
      const { token, user } = response.data;
      
      // Store token and user info in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('role', user?.role || 'OFFICER'); // Fallback if role is not returned explicitly
      localStorage.setItem('user', JSON.stringify(user));

      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      if (user.role === 'ADMIN') {
        // Nếu là Admin, đẩy sang cổng quản trị cấp cao
        navigate('/admin/dashboard');
      } else {
        // Nếu là Cán bộ bình thường, đẩy sang cổng nghiệp vụ tuyển sinh
        navigate('/officer/dashboard');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Tài khoản hoặc mật khẩu không chính xác. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left side - Banner/Image */}
      <div className="hidden lg:flex w-1/2 bg-red-800 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[#b71a22] opacity-90 mix-blend-multiply"></div>
        <img 
          src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
          alt="University Campus" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#b71a22] to-transparent opacity-80"></div>
        <div className="relative z-10 text-white text-center p-12">
          <h1 className="text-4xl font-bold mb-4 tracking-tight">Hệ thống Quản lý Tuyển sinh</h1>
          <p className="text-lg text-red-100 max-w-md mx-auto">
            Cổng thông tin nội bộ dành cho Cán bộ Tuyển sinh và Quản trị viên.
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-[#b71a22] mb-4">
              <Lock size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Đăng nhập Nội bộ</h2>
            <p className="text-gray-500 mt-2 text-sm">Vui lòng đăng nhập để tiếp tục</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-[#b71a22] text-sm text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#b71a22] focus:border-[#b71a22] transition-colors bg-gray-50 focus:bg-white sm:text-sm outline-none"
                  placeholder="admin@ptit.edu.vn"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#b71a22] focus:border-[#b71a22] transition-colors bg-gray-50 focus:bg-white sm:text-sm outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-[#b71a22] focus:ring-[#b71a22] border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                  Ghi nhớ đăng nhập
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-[#b71a22] hover:text-red-800 transition-colors">
                  Quên mật khẩu?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#b71a22] hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b71a22] disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Đang xử lý...
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OfficerLogin;
