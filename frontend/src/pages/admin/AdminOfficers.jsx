import React, { useState, useEffect } from 'react';
import { 
  UserPlus, Lock, Unlock, Shield, 
  Mail, User, Key, AlertCircle, 
  CheckCircle2, Loader2, Search
} from 'lucide-react';
import apiClient from '../../utils/api';

const AdminOfficers = () => {
  // --- States ---
  const [officers, setOfficers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form state cho cán bộ mới
  const [newOfficer, setNewOfficer] = useState({
    name: '',
    email: '',
    password: ''
  });

  // --- Tải danh sách cán bộ ---
  const fetchOfficers = async () => {
    try {
      const res = await apiClient.get('/admin/officers');
      setOfficers(res.data.data || []);
    } catch (error) {
      console.error("Lỗi lấy danh sách cán bộ:", error);
      setMessage({ type: 'error', text: 'Không thể kết nối máy chủ để lấy danh sách nhân viên.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficers();
  }, []);

  // --- Xử lý Form nhập liệu ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewOfficer(prev => ({ ...prev, [name]: value }));
  };

  // --- API: Tạo tài khoản mới ---
  const handleCreateOfficer = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await apiClient.post('/admin/officers', newOfficer);
      setMessage({ type: 'success', text: res.data.message || 'Tạo tài khoản cán bộ thành công!' });
      setShowAddModal(false);
      setNewOfficer({ name: '', email: '', password: '' }); // Reset form
      fetchOfficers(); // Tải lại bảng dữ liệu
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Quá trình tạo tài khoản thất bại.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- API: Khóa / Mở khóa tài khoản ---
  const handleToggleLock = async (id, name, currentLockStatus) => {
    const action = currentLockStatus ? 'MỞ KHÓA' : 'KHÓA';
    if (!window.confirm(`Bạn có chắc chắn muốn ${action} tài khoản của cán bộ ${name}?`)) return;

    try {
      await apiClient.put(`/admin/officers/${id}/toggle-lock`);
      // Cập nhật nhanh trạng thái trên UI không cần tải lại toàn bộ danh sách
      setOfficers(prev => prev.map(off => 
        off.id === id ? { ...off, isLocked: !off.isLocked } : off
      ));
      setMessage({ type: 'success', text: `Đã thay đổi trạng thái tài khoản của ${name} thành công.` });
    } catch (error) {
      setMessage({ type: 'error', text: 'Thao tác khóa/mở khóa tài khoản thất bại.' });
    }
  };

  // --- API: Đặt lại mật khẩu (Reset Password) ---
  const handleResetPassword = async (id, name) => {
    const confirmReset = window.confirm(
      `Bạn có chắc chắn muốn đặt lại mật khẩu của cán bộ "${name}" về mặc định "123456" không?`
    );
    if (!confirmReset) return;

    try {
      const response = await apiClient.put(`/admin/users/${id}/reset-password`);
      setMessage({ type: 'success', text: response.data.message || 'Đặt lại mật khẩu thành công (Mật khẩu mới: 123456).' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Lỗi hệ thống khi đặt lại mật khẩu.' });
    }
  };

  // Lọc tìm kiếm theo Tên hoặc Email
  const filteredOfficers = officers.filter(off => 
    off.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    off.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Tiêu đề điều khiển */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Quản lý Cán bộ Tuyển sinh</h1>
          <p className="text-sm text-slate-500">Phân quyền, cấp tài khoản và kiểm soát trạng thái hoạt động của nhân viên nghiệp vụ.</p>
        </div>
        <button
          onClick={() => { setShowAddModal(true); setMessage({type:'', text:''}); }}
          className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm transition-colors text-sm"
        >
          <UserPlus size={18} />
          Cấp tài khoản mới
        </button>
      </div>

      {/* Thông báo hệ thống */}
      {message.text && (
        <div className={`p-4 rounded-xl flex items-start text-sm border animate-in fade-in ${
          message.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'
        }`}>
          {message.type === 'error' ? <AlertCircle size={18} className="mr-2 shrink-0 mt-0.5" /> : <CheckCircle2 size={18} className="mr-2 shrink-0 mt-0.5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Thanh tìm kiếm */}
      <div className="bg-white p-4 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-slate-100 flex items-center px-4 gap-3">
        <Search className="text-slate-400 shrink-0" size={20} />
        <input 
          type="text" 
          placeholder="Tìm kiếm cán bộ theo tên hoặc email tác nghiệp..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-sm outline-none bg-transparent text-slate-800 placeholder-slate-400"
        />
      </div>

      {/* Bảng danh sách cán bộ */}
      <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <Loader2 className="animate-spin text-indigo-600" size={36} />
            <p className="text-sm">Đang kết nối danh sách nhân viên...</p>
          </div>
        ) : filteredOfficers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium">
                  <th className="p-4 pl-6">Mã NV</th>
                  <th className="p-4">Họ và Tên</th>
                  <th className="p-4">Email tác nghiệp</th>
                  <th className="p-4 text-center">Vai trò</th>
                  <th className="p-4 text-center">Trạng thái</th>
                  <th className="p-4 pr-6 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700 font-normal">
                {filteredOfficers.map((off) => (
                  <tr key={off.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 pl-6 font-mono text-slate-400">#00{off.id}</td>
                    <td className="p-4 font-semibold text-slate-900">{off.name}</td>
                    <td className="p-4 text-slate-500">{off.email}</td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-md">
                        <Shield size={12} /> Cán bộ nghiệp vụ
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {off.isLocked ? (
                        <span className="bg-red-50 text-red-600 border border-red-100 text-xs font-semibold px-2.5 py-1 rounded-full">
                          Đang khóa
                        </span>
                      ) : (
                        <span className="bg-green-50 text-green-600 border border-green-100 text-xs font-semibold px-2.5 py-1 rounded-full">
                          Đang hoạt động
                        </span>
                      )}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Nút Reset Mật Khẩu */}
                        <button
                          onClick={() => handleResetPassword(off.id, off.name)}
                          title="Đặt lại mật khẩu về 123456"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border bg-white text-amber-600 border-amber-200 hover:bg-amber-50 transition-colors"
                        >
                          <Key size={14} /> Reset Pass
                        </button>

                        {/* Nút Khóa / Mở Khóa */}
                        <button
                          onClick={() => handleToggleLock(off.id, off.name, off.isLocked)}
                          className={`inline-flex items-center justify-center min-w-[100px] gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                            off.isLocked 
                              ? 'bg-white text-green-600 border-green-200 hover:bg-green-50' 
                              : 'bg-white text-red-600 border-red-200 hover:bg-red-50'
                          }`}
                        >
                          {off.isLocked ? (
                            <>
                              <Unlock size={14} /> Mở khóa
                            </>
                          ) : (
                            <>
                              <Lock size={14} /> Khóa
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400 italic">
            Không tìm thấy dữ liệu cán bộ tuyển sinh phù hợp.
          </div>
        )}
      </div>

      {/* MODAL: Thêm tài khoản mới (Chỉ mở ra khi bấm nút) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-100 animate-in zoom-in-95">
            <h2 className="text-lg font-bold text-slate-950 mb-4 flex items-center gap-2">
              <UserPlus className="text-indigo-600" size={22} /> Cấp tài khoản mới
            </h2>
            <form onSubmit={handleCreateOfficer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Họ tên Cán bộ</label>
                <div className="relative flex items-center">
                  <User size={16} className="absolute left-3 text-slate-400" />
                  <input 
                    type="text" 
                    name="name"
                    required
                    value={newOfficer.name}
                    onChange={handleInputChange}
                    placeholder="Nhập tên đầy đủ"
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl outline-none text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Email cơ quan</label>
                <div className="relative flex items-center">
                  <Mail size={16} className="absolute left-3 text-slate-400" />
                  <input 
                    type="email" 
                    name="email"
                    required
                    value={newOfficer.email}
                    onChange={handleInputChange}
                    placeholder="viethung@ptit.edu.vn"
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl outline-none text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Mật khẩu khởi tạo</label>
                <div className="relative flex items-center">
                  <Key size={16} className="absolute left-3 text-slate-400" />
                  <input 
                    type="password" 
                    name="password"
                    required
                    minLength={6}
                    value={newOfficer.password}
                    onChange={handleInputChange}
                    placeholder="Mật khẩu tối thiểu 6 ký tự"
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl outline-none text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
                  disabled={isSubmitting}
                >
                  Hủy thao tác
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors flex items-center justify-center min-w-[100px]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Kích hoạt cấp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOfficers;