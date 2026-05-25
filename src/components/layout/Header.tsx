// CHECK CODE MỚI/src/components/layout/Header.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Bell, Sun, Moon, Info, BookOpen, AlertTriangle, Trophy, CheckCheck } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';

const Header = () => {
  const { isDark, toggleDark, isFptStudent, currentUser } = useAppStore();
  
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifs = async () => {
    if (!currentUser?.id) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });
        
      if (!error && data) setNotifications(data);
    } catch (e) {
      console.error("Lỗi lấy thông báo:", e);
    }
  };

  useEffect(() => {
    // Chỉ gọi hàm khi thực sự có ID, tránh lặp vô hạn gây lỗi ERR_CONNECTION_CLOSED
    if (!currentUser?.id) return;
    
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [currentUser?.id]); // <--- CHỈ THEO DÕI ID ĐỂ TRÁNH SPAM API

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setIsNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleMarkAllAsRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', currentUser.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getNotifIcon = (type: string) => {
    switch(type) {
      case 'system': return <div className="bg-indigo-100 text-indigo-600 p-2 rounded-full"><Info size={16} /></div>;
      case 'class': return <div className="bg-purple-100 text-purple-600 p-2 rounded-full"><BookOpen size={16} /></div>;
      case 'warning': return <div className="bg-red-100 text-red-600 p-2 rounded-full"><AlertTriangle size={16} /></div>;
      case 'achievement': return <div className="bg-yellow-100 text-yellow-600 p-2 rounded-full"><Trophy size={16} /></div>;
      default: return <div className="bg-slate-100 text-slate-600 p-2 rounded-full"><Bell size={16} /></div>;
    }
  };

  return (
    <header className="h-20 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-800/80 flex items-center justify-between px-8 shrink-0 relative z-50">
      <div className="flex items-center gap-4">
        {/* Chữ F-Prep Platform thay cho FMath12 */}
        <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">F-Prep <span className="text-indigo-600">Platform</span></h2>
      </div>

      <div className="flex items-center gap-6 relative">
        <div className="flex items-center gap-3">
          
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className={`relative p-2.5 transition-colors rounded-full ${isNotifOpen ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600' : 'text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 bg-slate-100 dark:bg-slate-800/50'}`}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute top-full right-0 mt-3 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] dark:shadow-black/50 border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-top-4 origin-top-right">
                
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                  <h3 className="font-bold text-slate-900 dark:text-white">Thông báo</h3>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllAsRead} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                      <CheckCheck size={14}/> Đánh dấu đã đọc
                    </button>
                  )}
                </div>

                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      <Bell size={32} className="mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-medium">Bạn chưa có thông báo nào.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {notifications.map((notif) => (
                        <div key={notif.id} className={`p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 group ${!notif.is_read ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                          {notif.link ? (
                            <Link to={notif.link} onClick={() => { handleMarkAsRead(notif.id); setIsNotifOpen(false); }} className="flex items-start gap-3">
                              <div className="shrink-0 mt-1">{getNotifIcon(notif.type)}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <div className={`text-sm font-bold truncate ${!notif.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{notif.title}</div>
                                  <div className="text-[10px] font-bold text-slate-400 whitespace-nowrap shrink-0">{formatTime(notif.created_at)}</div>
                                </div>
                                <p className={`text-xs leading-relaxed line-clamp-2 ${!notif.is_read ? 'text-slate-600 dark:text-slate-400' : 'text-slate-500 dark:text-slate-500'}`}>{notif.message}</p>
                              </div>
                              {!notif.is_read && <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2 shrink-0"></div>}
                            </Link>
                          ) : (
                            <div onClick={() => handleMarkAsRead(notif.id)} className="flex items-start gap-3 cursor-pointer">
                              <div className="shrink-0 mt-1">{getNotifIcon(notif.type)}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <div className={`text-sm font-bold truncate ${!notif.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{notif.title}</div>
                                  <div className="text-[10px] font-bold text-slate-400 whitespace-nowrap shrink-0">{formatTime(notif.created_at)}</div>
                                </div>
                                <p className={`text-xs leading-relaxed line-clamp-2 ${!notif.is_read ? 'text-slate-600 dark:text-slate-400' : 'text-slate-500 dark:text-slate-500'}`}>{notif.message}</p>
                              </div>
                              {!notif.is_read && <div className="w-2 h-2 rounded-full bg-indigo-600 mt-2 shrink-0"></div>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-center">
                  <button onClick={() => setIsNotifOpen(false)} className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Đóng</button>
                </div>
              </div>
            )}
          </div>

          <button onClick={toggleDark} className="p-2.5 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors bg-slate-100 dark:bg-slate-800/50 rounded-full">
            {isDark ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} />}
          </button>
        </div>

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <div className="font-bold text-sm text-slate-800 dark:text-white">{currentUser.name}</div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {currentUser.role === 'admin' ? 'Quản trị viên' : currentUser.role === 'teacher' ? 'Giáo viên' : isFptStudent ? `${currentUser.studentId} • FPT School` : 'Học sinh tự do'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-400 p-[2px] shadow-sm">
            <div className="w-full h-full bg-white dark:bg-slate-800 rounded-full flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 overflow-hidden">
               {currentUser.avatar_url ? <img src={currentUser.avatar_url} className="w-full h-full object-cover"/> : currentUser.name?.charAt(0) || 'U'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;