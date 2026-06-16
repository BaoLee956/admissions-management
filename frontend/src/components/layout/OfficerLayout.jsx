import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileCheck2, 
  UserPlus, 
  LogOut,
  User as UserIcon,
  GraduationCap,
  FileText // BỔ SUNG: Import thêm icon cho Quản lý Hồ sơ
} from 'lucide-react';

const OfficerLayout = () => {
  const navigate = useNavigate();
  
  // Lấy thông tin user từ localStorage, xử lý an toàn
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : { fullName: 'Cán bộ Tuyển sinh' };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    navigate('/officer/login');
  };

  // BỔ SUNG: Thêm phần tử "Quản lý Hồ sơ" vào mảng danh mục menu
  const menuItems = [
    {
      path: '/officer/dashboard',
      name: 'Tổng quan',
      icon: <LayoutDashboard size={20} />
    },
    {
      path: '/officer/applications',
      name: 'Quản lý Hồ sơ',
      icon: <FileText size={20} />
    },
    {
      path: '/officer/admissions',
      name: 'Xét tuyển',
      icon: <FileCheck2 size={20} />
    },
    {
      path: '/officer/onboarding',
      name: 'Tiếp nhận sinh viên',
      icon: <UserPlus size={20} />
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm relative z-10">
        {/* Logo/Brand */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="flex items-center gap-2 text-[#b71a22]">
            <GraduationCap size={28} />
            <span className="font-bold text-lg tracking-tight">PTIT Portal</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5">
          <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Quản lý tuyển sinh
          </p>
          
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${
                  isActive
                    ? 'bg-red-50 text-[#b71a22]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 text-[#b71a22] flex items-center justify-center shrink-0">
              <UserIcon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user.fullName || user.email || 'Cán bộ'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.role === 'ADMIN' ? 'Quản trị viên' : 'Cán bộ tuyển sinh'}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 justify-center px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-red-50 hover:text-[#b71a22] hover:border-red-200 transition-colors"
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-gray-50/50">
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default OfficerLayout;