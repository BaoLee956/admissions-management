import React, { useState, useEffect } from 'react';
import { BookOpen, PlusCircle, Save, Edit, Trash2, Loader2, X, Library } from 'lucide-react';
import apiClient from '../../utils/api';

const AdminMajors = () => {
  const [nganhList, setNganhList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quản lý trạng thái Form
  const [formData, setFormData] = useState({ maNganh: '', tenNganh: '', maKhoa: '' });
  const [isEditing, setIsEditing] = useState(false);

  // Lấy dữ liệu danh sách
  const fetchMajors = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/categories/nganh');
      setNganhList(res.data.data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách ngành:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMajors();
  }, []);

  // Xử lý Thêm / Cập nhật
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.maNganh || !formData.tenNganh) {
      alert('Vui lòng nhập đầy đủ Mã ngành và Tên ngành.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        // Cập nhật
        await apiClient.put(`/admin/categories/nganh/${formData.maNganh}`, formData);
        alert('Cập nhật thông tin ngành thành công!');
      } else {
        // Thêm mới
        await apiClient.post('/admin/categories/nganh', formData);
        alert('Thêm ngành mới thành công!');
      }
      resetForm();
      fetchMajors();
    } catch (err) {
      alert(err.response?.data?.error || 'Có lỗi xảy ra khi lưu dữ liệu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Khởi tạo chỉnh sửa
  const handleEdit = (nganh) => {
    setIsEditing(true);
    setFormData({
      maNganh: nganh.maNganh,
      tenNganh: nganh.tenNganh,
      maKhoa: nganh.maKhoa || ''
    });
  };

  // Xóa ngành
  const handleDelete = async (maNganh) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ngành học mang mã [${maNganh}] không?`)) return;
    try {
      await apiClient.delete(`/admin/categories/nganh/${maNganh}`);
      fetchMajors();
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi khi xóa dữ liệu ngành.');
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setFormData({ maNganh: '', tenNganh: '', maKhoa: '' });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Library className="text-indigo-600" /> Quản lý Danh mục Ngành học
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Thiết lập gốc danh mục các ngành và khoa trực thuộc phục vụ cho công tác tuyển sinh.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KHỐI TRÁI: FORM NHẬP LIỆU */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-fit">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              {isEditing ? <Edit size={18} className="text-amber-500" /> : <PlusCircle size={18} className="text-indigo-600" />}
              {isEditing ? 'Cập nhật Ngành học' : 'Thêm Ngành học mới'}
            </h2>
            {isEditing && (
              <button onClick={resetForm} className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1">
                <X size={14} /> Hủy
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Mã Ngành (Ký hiệu)</label>
              <input 
                type="text" 
                required 
                disabled={isEditing} // Khóa mã ngành khi đang chỉnh sửa
                value={formData.maNganh} 
                onChange={e => setFormData({ ...formData, maNganh: e.target.value.toUpperCase() })} 
                placeholder="VD: CNTT01"
                className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-mono focus:border-indigo-500 outline-none disabled:opacity-50" 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Tên Ngành xét tuyển</label>
              <input 
                type="text" 
                required 
                value={formData.tenNganh} 
                onChange={e => setFormData({ ...formData, tenNganh: e.target.value })} 
                placeholder="VD: Công nghệ thông tin"
                className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm focus:border-indigo-500 outline-none" 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Trực thuộc Khoa (Không bắt buộc)</label>
              <input 
                type="text" 
                value={formData.maKhoa} 
                onChange={e => setFormData({ ...formData, maKhoa: e.target.value })} 
                placeholder="VD: Khoa CNTT 1"
                className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm focus:border-indigo-500 outline-none" 
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className={`w-full text-white py-2 rounded-lg text-sm font-semibold transition flex justify-center items-center gap-2 ${isEditing ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : <Save size={16} />} 
              {isEditing ? 'Lưu thay đổi' : 'Thêm vào danh mục'}
            </button>
          </form>
        </div>

        {/* KHỐI PHẢI: BẢNG DANH SÁCH NGÀNH */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <BookOpen size={16} className="text-indigo-600" />
              DANH SÁCH NGÀNH HỌC HỆ THỐNG
            </h2>
            <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2.5 py-1 rounded-md">
              Tổng số: {nganhList.length} ngành
            </span>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-12 text-indigo-500"><Loader2 size={32} className="animate-spin" /></div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Mã Ngành</th>
                    <th className="px-4 py-3">Tên Ngành học</th>
                    <th className="px-4 py-3">Khoa QL</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {nganhList.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-8 text-slate-400 italic">Chưa có dữ liệu danh mục ngành.</td>
                    </tr>
                  ) : (
                    nganhList.map((item) => (
                      <tr key={item.maNganh} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-indigo-600">{item.maNganh}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{item.tenNganh}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{item.maKhoa || '--'}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleEdit(item)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-md transition-colors">
                              <Edit size={16} />
                            </button>
                            <button onClick={() => handleDelete(item.maNganh)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMajors;