import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, BookOpen, PenTool, Trophy, 
  User, Users, LogOut, ShieldCheck, Database, Library, Shield, Activity, Sigma, Menu, X
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isFptStudent, currentUser } = useAppStore();
  const role = currentUser.role;

  // State quản lý việc đóng/mở menu trên Mobile
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Cấu hình menu động theo Role với màu sắc Pastel thanh lịch
  const allMenuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Tổng quan', path: '/dashboard', roles: ['student', 'teacher', 'admin'], theme: 'indigo' },
    
    // Dành cho Học sinh
    { icon: <BookOpen size={20} />, label: 'Học thuyết', path: '/theory', roles: ['student'], theme: 'emerald' },
    { icon: <PenTool size={20} />, label: 'Luyện đề', path: '/quiz', roles: ['student'], theme: 'orange' },
    { icon: <Activity size={20} />, label: 'Phòng thi FEP', path: '/join-live', roles: ['student'], theme: 'rose' },
    ...(isFptStudent ? [{ icon: <Users size={20} />, label: 'Lớp học', path: '/classroom', roles: ['student'], theme: 'blue' }] : []),
    { icon: <Trophy size={20} />, label: 'Bảng xếp hạng', path: '/leaderboard', roles: ['student'], theme: 'orange' },
    
    // Dành cho Giáo viên / Admin
    { icon: <ShieldCheck size={20} />, label: 'Quản lý Lớp học', path: '/class-manager', roles: ['teacher', 'admin'], theme: 'emerald' },
    { icon: <Database size={20} />, label: 'Kho Câu hỏi', path: '/question-bank', roles: ['teacher', 'admin'], theme: 'orange' },
    { icon: <Library size={20} />, label: 'Kho Đề thi', path: '/exam-bank', roles: ['teacher', 'admin'], theme: 'blue' },

    // Dành riêng cho Admin
    { icon: <Shield size={20} />, label: 'Tài khoản (IAM)', path: '/user-management', roles: ['admin'], theme: 'rose' },

    // Dành cho mọi người
    { icon: <User size={20} />, label: 'Hồ sơ', path: '/profile', roles: ['student', 'teacher', 'admin'], theme: 'purple' },
  ];

  const menuItems = allMenuItems.filter(item => item.roles.includes(role));

  // HÀM ĐĂNG XUẤT ĐÃ ĐƯỢC FIX LỖI TỰ ĐỘNG ĐĂNG NHẬP LẠI
  const handleLogout = async () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?')) {
      try {
        await signOut(auth); // Hủy session trên Firebase
        navigate('/login');
      } catch (error) {
        alert("Có lỗi xảy ra khi đăng xuất. Vui lòng thử lại!");
      }
    }
  };

  // Helper tạo class màu sắc thanh lịch (Màu nền nhạt, chữ đậm màu)
  const getThemeStyles = (theme: string, isActive: boolean) => {
    if (!isActive) {
      return 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50 border-transparent';
    }

    switch(theme) {
      case 'emerald': return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50';
      case 'orange': return 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/50';
      case 'rose': return 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800/50';
      case 'purple': return 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800/50';
      case 'blue': return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50';
      default: return 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800/50';
    }
  };

  return (
    <>
      {/* --- NÚT TOGGLE MENU TRÊN MOBILE (Nút nổi góc phải dưới) --- */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed bottom-6 right-6 z-[60] p-4 bg-indigo-600 text-white rounded-full shadow-2xl hover:scale-105 transition-transform"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* --- LỚP PHỦ MỜ (BACKDROP) CHO MOBILE --- */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[40] animate-in fade-in duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* --- SIDEBAR CHÍNH --- */}
      <aside 
        className={`fixed inset-y-0 left-0 z-[50] w-72 md:w-64 bg-white dark:bg-[#0B1121] border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:static shrink-0 ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        
        {/* LOGO AREA */}
        <div className="h-20 flex items-center px-6 shrink-0 border-b border-slate-100 dark:border-slate-800/80">
          <Link to="/dashboard" onClick={() => setIsMobileOpen(false)} className="flex items-center gap-3 group">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white w-9 h-9 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Sigma size={20} strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              F-Prep<span className="text-orange-500">.</span>
            </h1>
          </Link>
        </div>

        {/* NAVIGATION MENU */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-6 px-4 flex flex-col gap-1.5">
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const themeStyle = getThemeStyles(item.theme, isActive);

            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={() => setIsMobileOpen(false)} // Đóng menu khi bấm trên Mobile
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-semibold text-[14.5px] transition-all duration-200 border ${themeStyle} ${
                  !isActive && 'hover:translate-x-1'
                }`}
              >
                <div className={`transition-transform duration-300 ${!isActive ? 'opacity-70 group-hover:opacity-100' : ''}`}>
                  {item.icon}
                </div>
                <span className="tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* LOGOUT AREA */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 shrink-0">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
          >
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>

      </aside>
    </>
  );
};

export default Sidebar;