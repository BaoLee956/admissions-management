import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UserCheck, CreditCard, 
  FileText, Clock, AlertCircle, 
  Activity, CheckCircle2, FileQuestion
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import apiClient from '../../utils/api';

const StatCard = ({ title, value, icon: Icon, colorClass, bgColorClass }) => (
  <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 flex items-center gap-5 hover:shadow-[0_4px_20px_rgb(0,0,0,0.06)] transition-shadow duration-300">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${bgColorClass} ${colorClass}`}>
      <Icon size={28} strokeWidth={2} />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
    </div>
  </div>
);

const OfficerDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Màu sắc cho biểu đồ PieChart
  const COLORS = ['#94a3b8', '#f59e0b', '#10b981', '#ef4444']; 

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Thay đổi URL nếu route prefix của bạn khác
        const response = await apiClient.get('/officer/dashboard/stats'); 
        setStats(response.data.data);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!stats) return <div className="p-4 text-red-500">Không thể tải dữ liệu thống kê.</div>;

  const { metrics, charts, activities } = stats;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tổng quan Hệ thống</h1>
        <p className="text-gray-500 mt-1">
          Theo dõi số liệu trực tuyến và tiến độ xét duyệt hồ sơ sinh viên.
        </p>
      </div>

      {/* Row 1: Thống kê số lượng tổng quát (4 Cột) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Tổng lượng thí sinh"
          value={metrics.tongThiSinh}
          icon={Users}
          colorClass="text-blue-600"
          bgColorClass="bg-blue-50"
        />
        <StatCard
          title="Đã trúng tuyển"
          value={metrics.trungTuyen}
          icon={CheckCircle2}
          colorClass="text-green-600"
          bgColorClass="bg-green-50"
        />
        <StatCard
          title="Chưa nộp hồ sơ"
          value={metrics.chuaNop}
          icon={FileQuestion}
          colorClass="text-gray-600"
          bgColorClass="bg-gray-100"
        />
        <StatCard
          title="Đã cấp MSSV"
          value={metrics.daCapMssv}
          icon={CreditCard}
          colorClass="text-purple-600"
          bgColorClass="bg-purple-50"
        />
      </div>

      {/* Row 2: Thống kê Hồ sơ & Cần hành động */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="Tổng hồ sơ đã tạo (Đã xác nhận)"
          value={metrics.tongHoSo}
          icon={FileText}
          colorClass="text-indigo-600"
          bgColorClass="bg-indigo-50"
        />
        <div 
          onClick={() => navigate('/officer/applications')} 
          className="bg-orange-50 border border-orange-100 rounded-2xl p-6 shadow-sm flex items-center justify-between cursor-pointer hover:bg-orange-100 hover:shadow-md hover:-translate-y-1 hover:border-orange-200 transition-all duration-300 group"
          title="Nhấn để đi đến trang Quản lý hồ sơ"
        >
          <div>
            <p className="text-sm font-medium text-orange-800 mb-1">Hồ sơ cần bạn phê duyệt ngay</p>
            <h3 className="text-3xl font-bold text-orange-600">{metrics.hoSoChoDuyet} <span className="text-base font-normal text-orange-500">hồ sơ</span></h3>
          </div>
          <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center animate-pulse">
            <Clock size={28} className="text-orange-600" />
          </div>
        </div>
      </div>

      {/* Row 3: Biểu đồ & Lịch sử hoạt động */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Biểu đồ trạng thái hồ sơ */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <PieChart size={20} className="mr-2 text-gray-500"/> Phân bổ trạng thái hồ sơ
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.trangThai}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {charts.trangThai.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.trangThai % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} hồ sơ`, 'Số lượng']} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lịch sử hoạt động (Timeline) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              <Activity size={20} className="mr-2 text-red-500"/> Lịch sử tương tác gần đây
            </h3>
          </div>
          
          <div className="space-y-0">
            {activities.length > 0 ? activities.map((act, index) => {
              // Map trạng thái ra hành động tương ứng
              let actionText = "đã cập nhật hồ sơ";
              let iconColor = "text-gray-400";
              let dotColor = "bg-gray-200";

              if (act.trangthai === 0) { actionText = "vừa xác nhận nhập học"; iconColor = "text-blue-500"; dotColor = "bg-blue-500"; }
              if (act.trangthai === 1) { actionText = "vừa nộp giấy tờ minh chứng, đang chờ duyệt"; iconColor = "text-orange-500"; dotColor = "bg-orange-500"; }
              if (act.trangthai === 2) { actionText = "đã được Cán bộ phê duyệt hồ sơ hợp lệ"; iconColor = "text-green-500"; dotColor = "bg-green-500"; }
              if (act.trangthai === 3) { actionText = "bị yêu cầu bổ sung lại giấy tờ bị lỗi"; iconColor = "text-red-500"; dotColor = "bg-red-500"; }

              const date = new Date(act.ngaynop).toLocaleString('vi-VN', { hour: '2-digit', minute:'2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });

              return (
                <div key={index} className="relative pl-6 pb-6 last:pb-0 group">
                  {/* Timeline Line */}
                  {index !== activities.length - 1 && (
                    <div className="absolute left-[11px] top-3 bottom-[-1rem] w-[2px] bg-gray-100 group-hover:bg-gray-200 transition-colors"></div>
                  )}
                  {/* Timeline Dot */}
                  <div className={`absolute left-0 top-1.5 w-[24px] h-[24px] rounded-full border-4 border-white ${dotColor} shadow-sm z-10`}></div>
                  
                  {/* Content */}
                  <div className="bg-gray-50/50 hover:bg-gray-50 p-3 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                    <p className="text-sm text-gray-800">
                      Thí sinh <span className="font-bold">{act.hoten}</span> ({act.sbd}) <span className="text-gray-600">{actionText}</span>.
                    </p>
                    <span className="text-xs text-gray-400 mt-1 flex items-center mt-1">
                      <Clock size={12} className="mr-1" /> {date}
                    </span>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-10 text-gray-400 italic">Chưa có hoạt động nào được ghi nhận.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default OfficerDashboard;