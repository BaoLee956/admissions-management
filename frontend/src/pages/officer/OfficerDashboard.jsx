import React from 'react';
import { Users, UserCheck, CreditCard } from 'lucide-react';

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
  // Dữ liệu giả lập (mock data), sau này sẽ thay bằng API call
  const stats = [
    {
      id: 1,
      title: 'Hồ sơ chờ duyệt',
      value: '1,245',
      icon: Users,
      colorClass: 'text-orange-600',
      bgColorClass: 'bg-orange-50'
    },
    {
      id: 2,
      title: 'Thí sinh trúng tuyển',
      value: '850',
      icon: UserCheck,
      colorClass: 'text-green-600',
      bgColorClass: 'bg-green-50'
    },
    {
      id: 3,
      title: 'Đã cấp MSSV',
      value: '620',
      icon: CreditCard,
      colorClass: 'text-blue-600',
      bgColorClass: 'bg-blue-50'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tổng quan Hệ thống</h1>
        <p className="text-gray-500 mt-1">
          Theo dõi tiến độ tuyển sinh và tiếp nhận sinh viên mới.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <StatCard
            key={stat.id}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            colorClass={stat.colorClass}
            bgColorClass={stat.bgColorClass}
          />
        ))}
      </div>

      {/* Placeholder for future charts or lists */}
      <div className="bg-white rounded-2xl p-8 shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 min-h-[400px] flex items-center justify-center text-gray-400 border-dashed">
        <p>Khu vực hiển thị biểu đồ thống kê (Đang phát triển)</p>
      </div>
    </div>
  );
};

export default OfficerDashboard;
