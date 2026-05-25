// CHECK CODE MỚI/src/components/layout/DashboardLayout.tsx
import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAppStore } from '../../store/useAppStore';
import { auth } from '../../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { studentService } from '../../services/studentService';
import { Loader2, BellRing, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../config/supabase'; 
import ReactMarkdown from 'react-markdown';

const DashboardLayout = () => {
  const { isDark, setUser, currentUser } = useAppStore();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [popupNotifs, setPopupNotifs] = useState<any[]>([]);
  
  const location = useLocation();
  
  const hideMenu = 
    location.pathname.includes('/live-exam') || 
    location.pathname.includes('/live-monitor') ||
    location.pathname.endsWith('/take'); 

  // KIỂM TRA ĐĂNG NHẬP
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        try {
          let profile = await studentService.getProfileByEmail(firebaseUser.email);
          let currentUserId = ''; 
          const userEmail = firebaseUser.email.toLowerCase();
          
          let targetRole = 'student';
          if (userEmail === '5phutcungpy@gmail.com' || userEmail === 'tamtt48@fpt.edu.vn') targetRole = 'admin';
          else if (userEmail === 'aiquizfct@gmail.com' || userEmail.endsWith('@fpt.edu.vn')) targetRole = 'teacher'; 
          else if (userEmail.includes('fct')) targetRole = 'student'; 

          if (profile) {
            if (profile.role !== targetRole) {
              await supabase.from('users').update({ role: targetRole }).eq('id', profile.id);
              profile.role = targetRole;
            }
            setUser(profile);
            currentUserId = profile.id; 
          } else {
            const fallbackName = firebaseUser.displayName || firebaseUser.email.split('@')[0] || "Bạn mới";
            const { data } = await supabase.from('users').insert({
              email: firebaseUser.email, full_name: fallbackName, role: targetRole, avatar_url: firebaseUser.photoURL || null
            }).select().single();

            if (data) { setUser(data); currentUserId = data.id; } 
            else { currentUserId = firebaseUser.uid; }
          }

          await studentService.syncClassMembership(firebaseUser.email, currentUserId);
        } catch (error) { console.error("Lỗi đồng bộ dữ liệu Layout:", error); }
      }
      setIsAuthChecking(false);
    });

    return () => unsubscribe();
  }, [setUser]);

  // LẤY VÀ LẮNG NGHE THÔNG BÁO / LỆNH HỆ THỐNG
  useEffect(() => {
    if (!currentUser?.id) return;

    const fetchUnreadNotifs = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('is_read', false)
        .order('created_at', { ascending: true });
        
      if (!error && data && data.length > 0) {
        setPopupNotifs(data);
      }
    };
    fetchUnreadNotifs();

    const notifChannel = supabase.channel('realtime-notifs')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_id=eq.${currentUser.id}` 
      }, (payload) => {
        setPopupNotifs(prev => [...prev, payload.new]);
      })
      .subscribe();

    // BẮT SỰ KIỆN BROADCAST ÉP REPLOAD TỪ ADMIN
    const systemChannel = supabase.channel('system_events')
      .on('broadcast', { event: 'force_redirect' }, (payload) => {
        alert("Hệ thống đang được cập nhật lên phiên bản mới. Trình duyệt của bạn sẽ tự động tải lại!");
        // Chuyển hướng về trang chủ
        window.location.href = '/';
        // Đặt timeout nhỏ để đảm bảo lệnh href chạy trước, sau đó ép Hard Reload
        setTimeout(() => {
          window.location.reload();
        }, 500);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(systemChannel);
    };
  }, [currentUser?.id]);

  const handleAcknowledgePopup = async (notifId: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
    setPopupNotifs(prev => prev.filter(n => n.id !== notifId));
  };

  if (isAuthChecking) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${isDark ? 'bg-slate-950 text-blue-400' : 'bg-slate-50 text-blue-600'}`}>
        <Loader2 size={48} className="animate-spin mb-4" />
        <p className="font-bold uppercase tracking-wider text-sm">Đang đồng bộ phiên đăng nhập...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${isDark ? 'dark bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
      {!hideMenu && (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-transparent">
          <div className="math-pattern opacity-40 dark:opacity-20"></div>
        </div>
      )}
      
      {!hideMenu && <Sidebar />}
      
      <div className={`flex-1 flex flex-col min-w-0 z-10 relative ${hideMenu ? 'h-screen' : 'min-h-screen'}`}>
        {!hideMenu && <Header title="F-Prep Platform" />}
        <main className="flex-1 relative flex flex-col overflow-hidden">
          <Outlet />
        </main>
      </div>

      {popupNotifs.length > 0 && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] p-8 shadow-2xl border border-blue-500/30 dark:border-blue-500/30 relative overflow-hidden scale-in-center">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center rounded-2xl shadow-sm shrink-0 animate-bounce">
                <BellRing size={28}/>
              </div>
              <div>
                <h3 className="text-2xl font-black text-blue-950 dark:text-white leading-tight">
                  {popupNotifs[0].title}
                </h3>
                <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
                  THÔNG BÁO QUAN TRỌNG (1/{popupNotifs.length})
                </div>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 mb-8 max-h-[40vh] overflow-y-auto custom-scrollbar shadow-inner">
              <div className="markdown-body !text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
                <ReactMarkdown>
                  {popupNotifs[0].message}
                </ReactMarkdown>
              </div>
            </div>
            <button 
              onClick={() => handleAcknowledgePopup(popupNotifs[0].id)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg hover:shadow-blue-600/30 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={20} /> ĐÃ ĐỌC VÀ HIỂU RÕ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;