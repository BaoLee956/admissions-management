import React, { useState, useEffect } from 'react';
import { 
  BookOpen, PlusCircle, Save, Edit, Trash2, 
  Loader2, X, Library, Building, Layers 
} from 'lucide-react';
import apiClient from '../../utils/api';

const AdminMajors = () => {
  const [activeTab, setActiveTab] = useState('MAJORS'); // MAJORS hoặc DEPARTMENTS
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Master Data States
  const [nganhList, setNganhList] = useState([]);
  const [khoaList, setKhoaList] = useState([]);

  // Form States dành cho Ngành
  const [nganhForm, setNganhForm] = useState({ maNganh: '', tenNganh: '', maKhoa: '' });
  const [isEditingNganh, setIsEditingNganh] = useState(false);

  // Form States dành cho Khoa
  const [khoaForm, setKhoaForm] = useState({ maKhoa: '', tenKhoa: '' });
  const [isEditingKhoa, setIsEditingKhoa] = useState(false);

  // --- LẤY DỮ LIỆU TỪ BACKEND ---
  const fetchMajors = async () => {
    try {
      const res = await apiClient.get('/admin/categories/nganh');
      setNganhList(res.data.data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách ngành:', err);
    }
  };

  const fetchKhoa = async () => {
    try {
      const res = await apiClient.get('/admin/categories/khoa');
      setKhoaList(res.data.data || []);
    } catch (err) {
      console.error('Lỗi khi tải danh sách khoa:', err);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([fetchMajors(), fetchKhoa()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // --- HÀM XỬ LÝ CHO TAB NGÀNH HỌC ---
  const handleNganhSubmit = async (e) => {
    e.preventDefault();
    if (!nganhForm.maNganh || !nganhForm.tenNganh || !nganhForm.maKhoa) {
      alert('Vui lòng điền đầy đủ Mã ngành, Tên ngành và chọn Khoa quản lý.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditingNganh) {
        await apiClient.put(`/admin/categories/nganh/${nganhForm.maNganh}`, nganhForm);
        alert('Cập nhật ngành học thành công!');
      } else {
        await apiClient.post('/admin/categories/nganh', nganhForm);
        alert('Thêm ngành học mới vào danh mục thành công!');
      }
      resetNganhForm();
      fetchMajors();
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi xử lý dữ liệu Ngành học.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNganhDelete = async (maNganh) => {
    if (!window.confirm(`Xác nhận xóa ngành [${maNganh}] khỏi danh mục gốc?`)) return;
    try {
      await apiClient.delete(`/admin/categories/nganh/${maNganh}`);
      fetchMajors();
    } catch (err) {
      alert(err.response?.data?.error || 'Không thể xóa dữ liệu ngành.');
    }
  };

  const resetNganhForm = () => {
    setIsEditingNganh(false);
    setNganhForm({ maNganh: '', tenNganh: '', maKhoa: '' });
  };


  // --- HÀM XỬ LÝ CHO TAB KHOA TRỰC THUỘC ---
  const handleKhoaSubmit = async (e) => {
    e.preventDefault();
    if (!khoaForm.maKhoa || !khoaForm.tenKhoa) {
      alert('Vui lòng nhập đầy đủ Mã khoa và Tên khoa.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditingKhoa) {
        await apiClient.put(`/admin/categories/khoa/${khoaForm.maKhoa}`, khoaForm);
        alert('Cập nhật thông tin khoa thành công!');
      } else {
        await apiClient.post('/admin/categories/khoa', khoaForm);
        alert('Thêm khoa mới vào danh mục thành công!');
      }
      resetKhoaForm();
      fetchKhoa();
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi xử lý dữ liệu Khoa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKhoaDelete = async (maKhoa) => {
    if (!window.confirm(`Xác nhận xóa Khoa [${maKhoa}]? Thao tác này sẽ thất bại nếu khoa đang chứa ngành học.`)) return;
    try {
      await apiClient.delete(`/admin/categories/khoa/${maKhoa}`);
      fetchKhoa();
    } catch (err) {
      alert(err.response?.data?.error || 'Lỗi hệ thống khi xóa Khoa.');
    }
  };

  const resetKhoaForm = () => {
    setIsEditingKhoa(false);
    setKhoaForm({ maKhoa: '', tenKhoa: '' });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* TIÊU ĐỀ TRANG CƠ SỞ */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Library className="text-indigo-600" /> Quản lý Gốc Danh mục Đào tạo
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Quản trị dữ liệu lõi bao gồm cấu trúc các Khoa đào tạo và các chuyên ngành xét tuyển của Học viện.
        </p>
      </div>

      {/* THANH THẺ ĐIỀU HƯỚNG TABS CON */}
      <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1 w-full max-w-md">
        <button 
          onClick={() => { setActiveTab('MAJORS'); resetNganhForm(); resetKhoaForm(); }} 
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'MAJORS' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
        >
          <Layers size={16} /> Danh mục Ngành học
        </button>
        <button 
          onClick={() => { setActiveTab('DEPARTMENTS'); resetNganhForm(); resetKhoaForm(); }} 
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'DEPARTMENTS' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
        >
          <Building size={16} /> Danh mục Khoa quản lý
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-indigo-600"><Loader2 className="animate-spin" size={40} /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ======================================================== */}
          {/* GIAO DIỆN TAB 1: NGÀNH HỌC */}
          {/* ======================================================== */}
          {activeTab === 'MAJORS' && (
            <>
              {/* CỘT TRÁI: FORM NGÀNH */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-fit">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    {isEditingNganh ? <Edit size={16} className="text-amber-500" /> : <PlusCircle size={16} className="text-indigo-600" />}
                    {isEditingNganh ? 'Cập nhật Chuyên Ngành' : 'Khai báo Ngành mới'}
                  </h2>
                  {isEditingNganh && (
                    <button onClick={resetNganhForm} className="text-xs font-bold text-slate-400 hover:text-red-500 flex items-center gap-0.5">
                      <X size={14} /> Hủy
                    </button>
                  )}
                </div>

                <form onSubmit={handleNganhSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Mã Ngành tuyển sinh</label>
                    <input 
                      type="text" required disabled={isEditingNganh}
                      value={nganhForm.maNganh} 
                      onChange={e => setNganhForm({ ...nganhForm, maNganh: e.target.value.toUpperCase() })} 
                      placeholder="VD: ATTT01"
                      className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-mono font-bold text-indigo-600 focus:border-indigo-500 outline-none disabled:opacity-50 disabled:bg-slate-100" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Tên Chuyên Ngành</label>
                    <input 
                      type="text" required value={nganhForm.tenNganh} 
                      onChange={e => setNganhForm({ ...nganhForm, tenNganh: e.target.value })} 
                      placeholder="VD: An toàn thông tin"
                      className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-semibold outline-none focus:border-indigo-500" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Trực thuộc Khoa quản lý</label>
                    <select 
                      required value={nganhForm.maKhoa} 
                      onChange={e => setNganhForm({ ...nganhForm, maKhoa: e.target.value })} 
                      className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-medium text-slate-800 outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Chọn Khoa từ danh mục --</option>
                      {khoaList.map(k => (
                        <option key={k.maKhoa} value={k.maKhoa}>{k.tenKhoa} ({k.maKhoa})</option>
                      ))}
                    </select>
                  </div>

                  <button 
                    type="submit" disabled={isSubmitting} 
                    className={`w-full text-white py-2 rounded-lg text-sm font-bold transition flex justify-center items-center gap-2 ${isEditingNganh ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : <Save size={16} />} 
                    {isEditingNganh ? 'Cập nhật thông tin' : 'Thêm ngành học'}
                  </button>
                </form>
              </div>

              {/* CỘT PHẢI: BẢNG NGÀNH */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex justify-between items-center">
                  <h2 className="text-xs font-bold text-slate-700 flex items-center gap-2"><BookOpen size={16} className="text-indigo-600"/> DANH SÁCH NGÀNH TRÊN HỆ THỐNG</h2>
                  <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2 py-1 rounded-md">Tổng: {nganhList.length} ngành</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Mã Ngành</th>
                        <th className="px-4 py-3">Tên Ngành học</th>
                        <th className="px-4 py-3">Khoa quản lý</th>
                        <th className="px-4 py-3 text-right">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {nganhList.length === 0 ? (
                        <tr><td colSpan="4" className="text-center py-8 text-slate-400 italic">Chưa có dữ liệu danh mục ngành.</td></tr>
                      ) : (
                        nganhList.map((item) => (
                          <tr key={item.maNganh} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3 font-mono font-bold text-indigo-600">{item.maNganh}</td>
                            <td className="px-4 py-3 font-semibold text-slate-800">{item.tenNganh}</td>
                            <td className="px-4 py-3 font-medium text-slate-500 text-xs">
                              {khoaList.find(k => k.maKhoa === item.maKhoa)?.tenKhoa || item.maKhoa || '--'}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button onClick={() => { setIsEditingNganh(true); setNganhForm({ maNganh: item.maNganh, tenNganh: item.tenNganh, maKhoa: item.maKhoa || '' }); }} className="p-1 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-md"><Edit size={16}/></button>
                                <button onClick={() => handleNganhDelete(item.maNganh)} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md"><Trash2 size={16}/></button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ======================================================== */}
          {/* GIAO DIỆN TAB 2: KHOA ĐÀO TẠO */}
          {/* ======================================================== */}
          {activeTab === 'DEPARTMENTS' && (
            <>
              {/* CỘT TRÁI: FORM KHOA */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-fit">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                  <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    {isEditingKhoa ? <Edit size={16} className="text-amber-500" /> : <PlusCircle size={16} className="text-emerald-600" />}
                    {isEditingKhoa ? 'Cập nhật Khoa' : 'Thành lập Khoa mới'}
                  </h2>
                  {isEditingKhoa && (
                    <button onClick={resetKhoaForm} className="text-xs font-bold text-slate-400 hover:text-red-500 flex items-center gap-0.5">
                      <X size={14} /> Hủy
                    </button>
                  )}
                </div>

                <form onSubmit={handleKhoaSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Mã Khoa định danh</label>
                    <input 
                      type="text" required disabled={isEditingKhoa}
                      value={khoaForm.maKhoa} 
                      onChange={e => setKhoaForm({ ...khoaForm, maKhoa: e.target.value.toUpperCase() })} 
                      placeholder="VD: K_ATTT"
                      className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-mono font-bold text-emerald-600 focus:border-emerald-500 outline-none disabled:opacity-50 disabled:bg-slate-100" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Tên Khoa đào tạo</label>
                    <input 
                      type="text" required value={khoaForm.tenKhoa} 
                      onChange={e => setKhoaForm({ ...khoaForm, tenKhoa: e.target.value })} 
                      placeholder="VD: Khoa An toàn thông tin"
                      className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm font-semibold outline-none focus:border-emerald-500" 
                    />
                  </div>

                  <button 
                    type="submit" disabled={isSubmitting} 
                    className={`w-full text-white py-2 rounded-lg text-sm font-bold transition flex justify-center items-center gap-2 ${isEditingKhoa ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                  >
                    {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : <Save size={16} />} 
                    {isEditingKhoa ? 'Lưu thay đổi' : 'Kích hoạt thêm Khoa'}
                  </button>
                </form>
              </div>

              {/* CỘT PHẢI: BẢNG KHOA */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex justify-between items-center">
                  <h2 className="text-xs font-bold text-slate-700 flex items-center gap-2"><Building size={16} className="text-emerald-600"/> CÁC KHOA ĐÀO TẠO TRONG HỆ THỐNG</h2>
                  <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2 py-1 rounded-md">Tổng: {khoaList.length} khoa</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Mã Khoa</th>
                        <th className="px-4 py-3">Tên Khoa đào tạo</th>
                        <th className="px-4 py-3 text-right">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {khoaList.length === 0 ? (
                        <tr><td colSpan="3" className="text-center py-8 text-slate-400 italic">Chưa có dữ liệu danh mục khoa.</td></tr>
                      ) : (
                        khoaList.map((item) => (
                          <tr key={item.maKhoa} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3 font-mono font-bold text-emerald-600">{item.maKhoa}</td>
                            <td className="px-4 py-3 font-semibold text-slate-800">{item.tenKhoa}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button onClick={() => { setIsEditingKhoa(true); setKhoaForm({ maKhoa: item.maKhoa, tenKhoa: item.tenKhoa }); }} className="p-1 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-md"><Edit size={16}/></button>
                                <button onClick={() => handleKhoaDelete(item.maKhoa)} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md"><Trash2 size={16}/></button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

        </div>
      )}
    </div>
  );
};

export default AdminMajors;