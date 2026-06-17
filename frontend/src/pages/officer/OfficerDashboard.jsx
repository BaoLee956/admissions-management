import React, { useState, useEffect } from 'react';
import { 
    Users, CheckCircle, FileQuestion, CreditCard, 
    FileText, Clock, CircleDot, X, Loader2 
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../utils/api';

const OfficerDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // State quản lý Popup hiển thị chi tiết
    const [modal, setModal] = useState({ isOpen: false, title: '', type: '', list: [] });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // ĐÃ SỬA TẠI ĐÂY: Gọi đúng API của Officer thay vì Admin
                const res = await api.get('/officer/dashboard/stats');
                setData(res.data.data);
            } catch (error) {
                console.error("Lỗi lấy dữ liệu Dashboard:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    // Hàm mở Popup khi click vào Card
    const handleCardClick = (title, type, listData) => {
        if (!listData || listData.length === 0) {
            alert('Chưa có dữ liệu chi tiết cho mục này.');
            return;
        }
        setModal({ isOpen: true, title, type, list: listData });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full text-[#b71a22]">
                <Loader2 className="animate-spin" size={40}/>
            </div>
        );
    }
    
    if (!data) return null;

    const { metrics, charts, activities, details } = data;

    // Cấu hình màu cho biểu đồ Pie
    const COLORS = ['#9ca3af', '#f59e0b', '#10b981', '#ef4444']; 

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Tiêu đề */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Tổng quan Hệ thống</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Theo dõi số liệu trực tuyến và tiến độ xét duyệt hồ sơ sinh viên. Nhấp vào các thẻ để xem chi tiết.
                </p>
            </div>

            {/* KHỐI 1: CÁC THẺ THỐNG KÊ (CLICKABLE) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div 
                    onClick={() => handleCardClick('Danh sách Tổng lượng thí sinh', 'DEFAULT', details?.tongThiSinh)}
                    className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:-translate-y-1 hover:border-blue-200 transition-all duration-300"
                >
                    <div className="flex justify-between items-start">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                            <Users size={20}/>
                        </div>
                    </div>
                    <p className="text-sm font-medium text-gray-500 mt-4">Tổng lượng thí sinh</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-1">{metrics.tongThiSinh}</h3>
                </div>

                <div 
                    onClick={() => handleCardClick('Danh sách Đã trúng tuyển', 'DEFAULT', details?.trungTuyen)}
                    className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:-translate-y-1 hover:border-green-200 transition-all duration-300"
                >
                    <div className="flex justify-between items-start">
                        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-500">
                            <CheckCircle size={20}/>
                        </div>
                    </div>
                    <p className="text-sm font-medium text-gray-500 mt-4">Đã trúng tuyển</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-1">{metrics.trungTuyen}</h3>
                </div>

                <div 
                    onClick={() => handleCardClick('Danh sách Chưa nộp hồ sơ', 'DEFAULT', details?.chuaNop)}
                    className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:-translate-y-1 hover:border-gray-300 transition-all duration-300"
                >
                    <div className="flex justify-between items-start">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500">
                            <FileQuestion size={20}/>
                        </div>
                    </div>
                    <p className="text-sm font-medium text-gray-500 mt-4">Chưa nộp hồ sơ</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-1">{metrics.chuaNop}</h3>
                </div>

                <div 
                    onClick={() => handleCardClick('Danh sách Đã cấp MSSV', 'MSSV', details?.daCapMssv)}
                    className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:-translate-y-1 hover:border-purple-200 transition-all duration-300"
                >
                    <div className="flex justify-between items-start">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500">
                            <CreditCard size={20}/>
                        </div>
                    </div>
                    <p className="text-sm font-medium text-gray-500 mt-4">Đã cấp MSSV</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-1">{metrics.daCapMssv}</h3>
                </div>

                <div 
                    onClick={() => handleCardClick('Danh sách Tổng hồ sơ đã tạo', 'HOSO', details?.tongHoSo)}
                    className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 md:col-span-2 lg:col-span-2 flex items-center justify-between cursor-pointer hover:shadow-md hover:-translate-y-1 hover:border-indigo-200 transition-all duration-300"
                >
                    <div>
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 mb-3">
                            <FileText size={20}/>
                        </div>
                        <p className="text-sm font-medium text-gray-500">Tổng hồ sơ đã tạo (Đã xác nhận)</p>
                    </div>
                    <h3 className="text-4xl font-bold text-gray-900">{metrics.tongHoSo}</h3>
                </div>

                <div 
                    onClick={() => handleCardClick('Danh sách Hồ sơ Cần phê duyệt ngay', 'HOSO', details?.hoSoChoDuyet)}
                    className="bg-orange-50 p-5 rounded-2xl shadow-sm border border-orange-100 md:col-span-2 lg:col-span-2 flex items-center justify-between cursor-pointer hover:shadow-md hover:-translate-y-1 hover:border-orange-300 transition-all duration-300"
                >
                    <div>
                        <p className="text-sm font-bold text-orange-800 mb-2">Hồ sơ cần bạn phê duyệt ngay</p>
                        <h3 className="text-4xl font-bold text-orange-600 flex items-baseline gap-2">
                            {metrics.hoSoChoDuyet} <span className="text-base font-medium">hồ sơ</span>
                        </h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
                        <Clock size={24}/>
                    </div>
                </div>
            </div>

            {/* KHỐI 2: BIỂU ĐỒ & LỊCH SỬ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Biểu đồ Pie */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-base font-bold text-gray-900 mb-4">Phân bổ trạng thái hồ sơ</h3>
                    <div className="h-64">
                        {charts.trangThai && charts.trangThai.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={charts.trangThai} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {charts.trangThai.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-sm text-gray-400">
                                Chưa có dữ liệu hồ sơ
                            </div>
                        )}
                    </div>
                </div>

                {/* Lịch sử hoạt động */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <ActivityIcon /> Lịch sử tương tác gần đây
                    </h3>
                    
                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                        {activities && activities.length > 0 ? activities.map((act, index) => {
                            let dotColor = "text-gray-400";
                            let statusText = "vừa xác nhận nhập học.";
                            if (act.trangthai === 1) { dotColor = "text-orange-500"; statusText = "vừa nộp giấy tờ minh chứng, đang chờ duyệt."; }
                            if (act.trangthai === 2) { dotColor = "text-green-500"; statusText = "đã được Cán bộ phê duyệt hồ sơ hợp lệ."; }
                            if (act.trangthai === 3) { dotColor = "text-red-500"; statusText = "bị Cán bộ yêu cầu bổ sung hồ sơ."; }

                            return (
                                <div key={index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${dotColor}`}>
                                        <CircleDot size={18} />
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-gray-50 p-4 rounded-xl border border-gray-100 shadow-sm">
                                        <p className="text-sm text-gray-700">
                                            Thí sinh <span className="font-bold text-gray-900">{act.hoten}</span> (SBD: {act.sbd}) {statusText}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                            <Clock size={12}/> {new Date(act.ngaynop).toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="text-center text-gray-400 py-10 italic">
                                Chưa có hoạt động nào được ghi nhận.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* POPUP HIỂN THỊ DANH SÁCH CHI TIẾT */}
            {modal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                        
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <h3 className="text-xl font-bold text-gray-900">{modal.title} <span className="text-gray-500 text-base font-normal">({modal.list.length} người)</span></h3>
                            <button 
                                onClick={() => setModal({ isOpen: false, title: '', type: '', list: [] })}
                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                            >
                                <X size={22} />
                            </button>
                        </div>

                        {/* Modal Body (Table) */}
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="py-3 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider border-b">SBD</th>
                                        <th className="py-3 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider border-b">Họ Tên</th>
                                        {modal.type === 'MSSV' && <th className="py-3 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider border-b">MSSV</th>}
                                        <th className="py-3 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider border-b">Email liên hệ</th>
                                        {modal.type === 'HOSO' && <th className="py-3 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider border-b">Trạng Thái</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-gray-50/30">
                                    {modal.list.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                                            <td className="py-3 px-6 text-sm font-bold text-gray-700">{item.sbd}</td>
                                            <td className="py-3 px-6 text-sm font-medium text-gray-900">{item.hoTen}</td>
                                            
                                            {modal.type === 'MSSV' && (
                                                <td className="py-3 px-6 text-sm font-bold text-green-600">{item.mssv}</td>
                                            )}
                                            
                                            <td className="py-3 px-6 text-sm text-gray-500">{item.email || item.sdt || 'N/A'}</td>
                                            
                                            {modal.type === 'HOSO' && (
                                                <td className="py-3 px-6 text-sm font-medium">
                                                    {item.trangThai === 0 ? <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded">Nháp</span> : 
                                                     item.trangThai === 1 ? <span className="text-orange-600 bg-orange-100 px-2 py-1 rounded">Chờ duyệt</span> : 
                                                     item.trangThai === 2 ? <span className="text-green-600 bg-green-100 px-2 py-1 rounded">Đã duyệt</span> : 
                                                     <span className="text-red-600 bg-red-100 px-2 py-1 rounded">Cần bổ sung</span>}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

// Component phụ cho Icon Timeline
const ActivityIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" className="text-red-500">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
);

export default OfficerDashboard;