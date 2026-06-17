import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, ShieldAlert } from 'lucide-react';
import api from '../../utils/api';

const OfficerLogin = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // States dành cho Popup ép đổi mật khẩu
  const [showForceChangePass, setShowForceChangePass] = useState(false);
  const [tempAuthData, setTempAuthData] = useState(null); // Giữ Token tạm thời
  const [newPasswords, setNewPasswords] = useState({ newPass: '', confirmPass: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  // Hàm chuyển hướng sau khi mọi thứ hợp lệ
  const proceedLogin = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', user?.role || 'OFFICER');
    localStorage.setItem('user', JSON.stringify(user));

    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    if (user.role === 'ADMIN') {
      navigate('/admin/dashboard');
    } else {
      navigate('/officer/dashboard');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/admin/login', formData);
      const { token, user, requirePasswordChange } = response.data;
      
      // LƯỚI LỌC: NẾU DÙNG MẬT KHẨU MẶC ĐỊNH -> ÉP MỞ POPUP ĐỔI MẬT KHẨU
      if (requirePasswordChange) {
        setTempAuthData({ token, user, oldPassword: formData.password });
        setShowForceChangePass(true);
        setLoading(false);
        return; // Chặn quá trình đăng nhập tại đây
      }

      // Nếu không dùng mật khẩu mặc định, cho qua bình thường
      proceedLogin(token, user);
    } catch (err) {
      setError(
        err.response?.data?.error || 
        err.response?.data?.message || 
        'Tài khoản hoặc mật khẩu không chính xác. Vui lòng thử lại.'
      );
      setLoading(false);
    }
  };

  // Hàm xử lý nút Submit trên Popup đổi mật khẩu
  const handleForceChangePass = async (e) => {
    e.preventDefault();
    if (newPasswords.newPass !== newPasswords.confirmPass) {
      setError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }
    if (newPasswords.newPass === '123456') {
      setError('Mật khẩu mới không được giống với mật khẩu mặc định.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Gắn Token tạm vào header để có quyền đổi mật khẩu
      const config = { headers: { Authorization: `Bearer ${tempAuthData.token}` } };
      
      await api.post('/auth/change-password', {
        oldPassword: tempAuthData.oldPassword,
        newPassword: newPasswords.newPass
      }, config);

      // Đổi thành công, cho phép login qua màn hình chính
      alert('Cập nhật mật khẩu thành công! Hệ thống sẽ chuyển hướng ngay.');
      setShowForceChangePass(false);
      proceedLogin(tempAuthData.token, tempAuthData.user);

    } catch (err) {
      setError(err.response?.data?.error || 'Lỗi hệ thống khi cập nhật mật khẩu.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 relative">
      {/* Cột trái - Banner */}
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

      {/* Cột phải - Form đăng nhập */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-[#b71a22] mb-4">
              <Lock size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Đăng nhập Nội bộ</h2>
            <p className="text-gray-500 mt-2 text-sm">Vui lòng đăng nhập để tiếp tục</p>
          </div>

          {error && !showForceChangePass && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-[#b71a22] text-sm text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu</label>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-[#b71a22] hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-[#b71a22] disabled:opacity-70 disabled:cursor-not-allowed transition-all"
            >
              {loading && !showForceChangePass ? <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" /> : 'Đăng nhập'}
            </button>
          </form>
        </div>
      </div>

      {/* POPUP YÊU CẦU ĐỔI MẬT KHẨU MẶC ĐỊNH */}
      {showForceChangePass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
                <ShieldAlert size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Cập nhật mật khẩu bảo mật</h3>
              <p className="text-sm text-gray-500 mt-2">
                Tài khoản của bạn đang sử dụng mật khẩu mặc định. Vui lòng thiết lập mật khẩu mới trước khi truy cập hệ thống.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-xl bg-red-50 text-[#b71a22] text-sm text-center font-medium border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleForceChangePass} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPasswords.newPass}
                  onChange={(e) => { setNewPasswords({...newPasswords, newPass: e.target.value}); setError(''); }}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#b71a22] focus:border-[#b71a22] bg-gray-50 focus:bg-white text-sm outline-none"
                  placeholder="Nhập mật khẩu mới"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  required
                  value={newPasswords.confirmPass}
                  onChange={(e) => { setNewPasswords({...newPasswords, confirmPass: e.target.value}); setError(''); }}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#b71a22] focus:border-[#b71a22] bg-gray-50 focus:bg-white text-sm outline-none"
                  placeholder="Nhập lại mật khẩu"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForceChangePass(false);
                    setTempAuthData(null);
                    setFormData({ email: '', password: '' });
                  }}
                  className="w-1/3 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-2/3 flex justify-center py-2.5 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-[#b71a22] hover:bg-red-800 focus:ring-2 focus:ring-[#b71a22] disabled:opacity-70 transition-all"
                >
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Lưu và Đăng nhập'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficerLogin;