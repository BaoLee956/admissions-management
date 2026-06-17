import React, { useEffect, useCallback } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UsersRound, 
  Settings2, 
  Database,
  LogOut,
  ShieldCheck
} from 'lucide-react';

const AdminLayout = () => {
  const navigate = useNavigate();
  
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : { fullName: 'Quản trị viên' };

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    navigate('/officer/login'); // Có thể dùng chung trang login hoặc tạo trang login riêng cho admin
  }, [navigate]);

  // Cơ chế tự động Logout khi AFK (15 phút)
  useEffect(() => {
    let timeoutId;
    const AFK_TIME_LIMIT = 15 * 60 * 1000; 

    const resetAfkTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        alert("Phiên làm việc đã hết hạn do AFK. Vui lòng đăng nhập lại.");
        handleLogout();
      }, AFK_TIME_LIMIT);
    };

    const activeEvents = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
    activeEvents.forEach(event => window.addEventListener(event, resetAfkTimer));
    resetAfkTimer();

    return () => {
      clearTimeout(timeoutId);
      activeEvents.forEach(event => window.removeEventListener(event, resetAfkTimer));
    };
  }, [handleLogout]);

  // MENU ĐỘC QUYỀN CỦA ADMIN
  const menuItems = [
    {
      path: '/admin/dashboard',
      name: 'Tổng quan Hệ thống',
      icon: <LayoutDashboard size={20} />
    },
    {
      path: '/admin/officers',
      name: 'Quản lý Cán bộ',
      icon: <UsersRound size={20} />
    },
    {
      path: '/admin/admissions-config',
      name: 'Cấu hình tuyển sinh',
      icon: <Settings2 size={20} />
    },
    {
      path: '/admin/categories',
      name: 'Danh mục Ngành học',
      icon: <Database size={20} />
    }
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900">
      {/* Sidebar - Sử dụng tone màu Slate/Indigo đậm chất Quản trị */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl relative z-10">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2 text-white">
            <ShieldCheck size={28} className="text-indigo-500" />
            <span className="font-bold text-lg tracking-tight">PTIT Admin</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5">
          <p className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Bảng điều khiển
          </p>
          
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`
              }
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user.fullName || 'Admin'}
              </p>
              <p className="text-xs text-indigo-400 truncate">
                Quản trị viên hệ thống
              </p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 justify-center px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-xl hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-colors"
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;