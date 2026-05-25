// CHECK CODE MỚI/src/pages/admin/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  Users, Server, Activity, BookOpen, UserCheck, Shield, Clock, 
  Database, Library, ChevronLeft, ChevronRight, 
  Cpu, Globe, Zap, AlertTriangle, CheckCircle2, Search, Settings, 
  Network, HardDrive, Edit3, Ban, Unlock, Trash2, Download, RefreshCcw, Power
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { supabase } from '../../config/supabase';

const AdminDashboard = () => {
  const { currentUser } = useAppStore();
  
  // UI States
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'iam' | 'classes' | 'database' | 'settings'>('overview');
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'>('CONNECTING');
  const [isLoading, setIsLoading] = useState(false);

  // Data States
  const [stats, setStats] = useState({ users: 0, teachers: 0, classes: 0, lessons: 0, exams: 0, attempts: 0 });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  
  // States cho Tab IAM & Classes
  const [usersList, setUsersList] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [searchUser, setSearchUser] = useState("");

  // ==========================================
  // FETCH DỮ LIỆU (REAL DATA)
  // ==========================================
  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, teachersRes, classRes, lessonRes, examRes, attemptRes] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
        supabase.from('classes').select('*', { count: 'exact', head: true }),
        supabase.from('lessons').select('*', { count: 'exact', head: true }),
        supabase.from('exams').select('*', { count: 'exact', head: true }),
        supabase.from('exam_attempts').select('*', { count: 'exact', head: true })
      ]);
      
      setStats({
        users: usersRes.count || 0,
        teachers: teachersRes.count || 0,
        classes: classRes.count || 0,
        lessons: lessonRes.count || 0,
        exams: examRes.count || 0,
        attempts: attemptRes.count || 0
      });

      const { data: logs } = await supabase
        .from('exam_attempts')
        .select('id, created_at, score, users(full_name, role), exams(title)')
        .order('created_at', { ascending: false })
        .limit(15);
      if (logs) setRecentLogs(logs);

      const { data: users } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      if (users) setUsersList(users);

      const { data: cls } = await supabase.from('classes').select('*, users(full_name), class_members(count)').order('created_at', { ascending: false });
      if (cls) setClassesList(cls);

    } catch (error) {
      console.error("Lỗi lấy dữ liệu Admin:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();

    const channel = supabase.channel('admin_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exam_attempts' }, () => {
        fetchAllData(); 
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        fetchAllData(); 
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, () => {
        fetchAllData(); 
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setConnectionStatus('CONNECTED');
        else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') setConnectionStatus('DISCONNECTED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ==========================================
  // HÀNH ĐỘNG QUẢN TRỊ VIÊN (IAM & CLASSES)
  // ==========================================
  const handleUpdateUserStatus = async (userId: string, newStatus: 'active' | 'banned') => {
    if (!window.confirm(`Xác nhận ${newStatus === 'active' ? 'mở khóa' : 'khóa'} tài khoản này?`)) return;
    const { error } = await supabase.from('users').update({ status: newStatus }).eq('id', userId);
    if (!error) setUsersList(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
  };

  const handleChangeRole = async (userId: string, currentRole: string) => {
    const roles = ['student', 'teacher', 'admin'];
    const newRole = window.prompt(`Sửa quyền (student / teacher / admin):\nQuyền hiện tại: ${currentRole}`, currentRole);
    if (!newRole || !roles.includes(newRole) || newRole === currentRole) return;
    const { error } = await supabase.from('users').update({ role: newRole }).eq('id', userId);
    if (!error) setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const handleDeleteClass = async (classId: string) => {
    if (!window.confirm('Cảnh báo: Xóa lớp học sẽ xóa toàn bộ thành viên trong lớp. Tiếp tục?')) return;
    const { error } = await supabase.from('classes').delete().eq('id', classId);
    if (!error) setClassesList(prev => prev.filter(c => c.id !== classId));
  };

  const exportUserData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(usersList, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "users_export.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // ==========================================
  // HÀNH ĐỘNG HỆ THỐNG (BROADCAST SỬA LỖI SPAM)
  // ==========================================
  const handleForceReloadAll = async () => {
    if (!window.confirm("NGUY HIỂM: Hành động này sẽ ép TOÀN BỘ người dùng đang online (kể cả những bạn đang làm bài) bị tải lại trang và văng ra ngoài. Bạn có chắc chắn muốn thực hiện?")) return;

    // Yêu cầu server trả về 'ack' để đảm bảo tin nhắn gửi thành công
    const channel = supabase.channel('system_events', {
      config: {
        broadcast: { ack: true }
      }
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const resp = await channel.send({
          type: 'broadcast',
          event: 'force_redirect',
          payload: { timestamp: Date.now() }
        });
        
        if (resp === 'ok') {
          alert("Đã gửi lệnh đá tất cả người dùng về trang chủ để làm mới phiên bản!");
        } else {
          alert("Cảnh báo: Có thể có lỗi mạng, tín hiệu có thể chưa tới được người dùng.");
        }

        // CHỜ 2 GIÂY RỒI MỚI HỦY KÊNH (Tránh việc hủy kênh trước khi tín hiệu kịp gửi)
        setTimeout(() => {
          supabase.removeChannel(channel);
        }, 2000);
      }
    });
  };

  // ==========================================
  // RENDER HELPERS
  // ==========================================
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const filteredUsers = usersList.filter(u => 
    (u.full_name || '').toLowerCase().includes(searchUser.toLowerCase()) || 
    (u.email || '').toLowerCase().includes(searchUser.toLowerCase())
  );

  const internalMenu = [
    { id: 'overview', icon: <Activity size={20}/>, label: 'Tổng quan Hệ thống' },
    { id: 'iam', icon: <Users size={20}/>, label: 'Định danh & Quyền (IAM)' },
    { id: 'classes', icon: <Network size={20}/>, label: 'Quản lý Phiên Lớp học' },
    { id: 'database', icon: <Database size={20}/>, label: 'Cơ sở Dữ liệu (DB)' },
    { id: 'settings', icon: <Settings size={20}/>, label: 'Cấu hình Môi trường' },
  ];

  return (
    <div className="flex h-[calc(100vh-80px)] w-full bg-slate-50 dark:bg-[#0B1120] overflow-hidden font-sans">
      
      {/* --- MENU NỘI BỘ (ALL-IN-ONE SIDEBAR) --- */}
      <div className={`transition-all duration-300 ease-in-out ${isMenuCollapsed ? 'w-16' : 'w-64'} bg-white dark:bg-[#0F172A] border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 z-20 relative`}>
        <div className="h-14 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          {!isMenuCollapsed && <span className="font-black text-sm text-slate-800 dark:text-slate-200 uppercase tracking-widest">Admin Console</span>}
          <button onClick={() => setIsMenuCollapsed(!isMenuCollapsed)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors ml-auto">
            {isMenuCollapsed ? <ChevronRight size={18}/> : <ChevronLeft size={18}/>}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-2 px-3 custom-scrollbar">
          {internalMenu.map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all text-sm font-bold ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
              title={isMenuCollapsed ? item.label : undefined}
            >
              <div className="shrink-0">{item.icon}</div>
              {!isMenuCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </div>

        {/* Global Connection Status */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div className={`flex items-center gap-2 ${isMenuCollapsed ? 'justify-center' : ''}`}>
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              connectionStatus === 'CONNECTED' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse' : 
              connectionStatus === 'CONNECTING' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></span>
            {!isMenuCollapsed && (
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {connectionStatus === 'CONNECTED' ? `Đã đồng bộ Realtime` : connectionStatus}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* --- KHU VỰC HIỂN THỊ CHÍNH (MAIN AREA) --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 dark:bg-[#0B1120]">
        
        {/* Top Bar Header */}
        <div className="h-14 bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>FMath12 Core</span> <ChevronRight size={14}/> 
            <span className="text-blue-600 dark:text-blue-400 font-black">
              {internalMenu.find(m => m.id === activeTab)?.label}
            </span>
          </div>
          <button onClick={fetchAllData} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">
            <RefreshCcw size={16} className={isLoading ? "animate-spin" : ""}/> Làm mới
          </button>
        </div>

        {/* NỘI DUNG CÁC TAB */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
          <div className="max-w-7xl mx-auto">

            {/* ========================================================= */}
            {/* TAB 1: OVERVIEW (TỔNG QUAN) */}
            {/* ========================================================= */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                
                <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                  Giám sát Sức khỏe Hệ thống
                  {connectionStatus === 'CONNECTED' && <span className="bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 px-2 py-0.5 rounded text-[10px] uppercase tracking-widest"><Zap size={10} className="inline mr-1 mb-0.5"/> Đang hoạt động</span>}
                </h1>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { label: 'Tài khoản', value: stats.users, icon: <Users size={20}/>, color: 'blue' },
                    { label: 'Giáo viên', value: stats.teachers, icon: <UserCheck size={20}/>, color: 'purple' },
                    { label: 'Lớp học', value: stats.classes, icon: <Network size={20}/>, color: 'green' },
                    { label: 'Đề thi', value: stats.exams, icon: <Library size={20}/>, color: 'orange' },
                    { label: 'Bài giảng', value: stats.lessons, icon: <BookOpen size={20}/>, color: 'pink' },
                    { label: 'Lượt nộp bài', value: stats.attempts, icon: <Activity size={20}/>, color: 'red' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-sm flex flex-col justify-center items-center text-center">
                      <div className={`p-3 rounded-xl bg-${stat.color}-50 dark:bg-${stat.color}-500/10 text-${stat.color}-600 dark:text-${stat.color}-400 mb-3`}>{stat.icon}</div>
                      <div className="text-2xl font-black text-slate-800 dark:text-white">{stat.value.toLocaleString()}</div>
                      <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Nhật ký hoạt động bình thường */}
                  <div className="lg:col-span-2 bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-[500px]">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                      <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><Clock size={18} className="text-blue-500"/> Hoạt động nộp bài Realtime</h3>
                      <span className="text-xs font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded-lg">{recentLogs.length} bản ghi</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-50/30 dark:bg-transparent">
                      {recentLogs.length === 0 ? (
                        <div className="text-center text-slate-500 font-medium py-10">Đang chờ sự kiện nộp bài...</div>
                      ) : (
                        recentLogs.map((log) => (
                          <div key={log.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center font-bold shrink-0">
                                {log.users?.full_name?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                  <strong className="text-blue-950 dark:text-white">{log.users?.full_name || 'Học sinh'}</strong> đã nộp bài <span className="font-bold text-blue-600 dark:text-blue-400">{log.exams?.title}</span>
                                </p>
                                <p className="text-xs text-slate-400 font-medium mt-1">{formatTime(log.created_at)}</p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className={`text-lg font-black ${log.score >= 8 ? 'text-green-500' : log.score >= 5 ? 'text-orange-500' : 'text-red-500'}`}>
                                {log.score} <span className="text-xs font-bold text-slate-400 uppercase">Điểm</span>
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Cột Tình trạng & Phím tắt */}
                  <div className="flex flex-col gap-6">
                    <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
                      <h3 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-5 flex items-center gap-2">
                        <Cpu size={18} className="text-purple-500"/> Tình trạng Server
                      </h3>
                      <div className="space-y-5">
                        <div>
                          <div className="flex justify-between text-xs font-bold mb-2">
                            <span className="text-slate-500 dark:text-slate-400">PostgreSQL Database</span>
                            <span className="text-green-500">Tốt</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full w-[25%]"></div></div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs font-bold mb-2">
                            <span className="text-slate-500 dark:text-slate-400">Groq AI API Load</span>
                            <span className="text-blue-500">Bình thường</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full w-[45%]"></div></div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs font-bold mb-2">
                            <span className="text-slate-500 dark:text-slate-400">Cloudinary Storage</span>
                            <span className="text-yellow-500">Đã dùng 68%</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-yellow-500 rounded-full w-[68%]"></div></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 2: IAM (QUẢN LÝ TÀI KHOẢN BÊN TRONG DASHBOARD) */}
            {/* ========================================================= */}
            {activeTab === 'iam' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                {/* ... GIỮ NGUYÊN NHƯ CŨ ... */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3"><Shield className="text-blue-500"/> Quản lý Tài khoản (IAM)</h1>
                  <button onClick={exportUserData} className="bg-slate-800 hover:bg-slate-900 text-white dark:bg-blue-600 dark:hover:bg-blue-700 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-colors text-sm">
                    <Download size={16}/> Xuất JSON User
                  </button>
                </div>

                <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm flex flex-col overflow-hidden h-[600px]">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="relative max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                      <input type="text" placeholder="Tìm kiếm Email hoặc Tên..." value={searchUser} onChange={e => setSearchUser(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 outline-none focus:border-blue-500 dark:text-white transition-colors text-sm font-medium"/>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10 shadow-sm">
                        <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          <th className="p-4">Tài khoản</th>
                          <th className="p-4">Vai trò</th>
                          <th className="p-4">Trạng thái</th>
                          <th className="p-4 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredUsers.map((u) => (
                          <tr key={u.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${u.status === 'banned' ? 'opacity-60 bg-red-50/30 dark:bg-red-900/10' : ''}`}>
                            <td className="p-4">
                              <div className="font-bold text-slate-800 dark:text-white">{u.full_name || 'Chưa cập nhật'}</div>
                              <div className="text-sm text-slate-500">{u.email}</div>
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${u.role === 'admin' ? 'bg-red-100 text-red-700' : u.role === 'teacher' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${u.status === 'active' ? 'bg-green-50 border-green-200 text-green-600' : 'bg-red-50 border-red-200 text-red-600'}`}>
                                {u.status === 'active' ? 'Hoạt động' : 'Bị Khóa'}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => handleChangeRole(u.id, u.role)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-600 rounded-lg transition-colors" title="Đổi quyền"><Edit3 size={16}/></button>
                                {u.status === 'banned' ? (
                                  <button onClick={() => handleUpdateUserStatus(u.id, 'active')} className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100 rounded-lg transition-colors" title="Mở khóa"><Unlock size={16}/></button>
                                ) : (
                                  <button onClick={() => handleUpdateUserStatus(u.id, 'banned')} className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Khóa tài khoản"><Ban size={16}/></button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 3: CLASSES (QUẢN LÝ LỚP HỌC) */}
            {/* ========================================================= */}
            {activeTab === 'classes' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="flex justify-between items-center">
                  <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3"><Network className="text-green-500"/> Phiên Lớp học (Instances)</h1>
                </div>
                
                <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden h-[600px] flex flex-col">
                  <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10 shadow-sm">
                        <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          <th className="p-4">Tên Lớp học</th>
                          <th className="p-4">Giáo viên quản lý</th>
                          <th className="p-4 text-center">Sĩ số</th>
                          <th className="p-4 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {classesList.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="p-4">
                              <div className="font-bold text-slate-800 dark:text-white text-lg">{c.name}</div>
                              <div className="text-xs text-slate-500 mt-1 font-mono">Mã Join: {c.join_code}</div>
                            </td>
                            <td className="p-4 text-sm font-medium text-slate-600 dark:text-slate-400">{c.users?.full_name || 'Không rõ'}</td>
                            <td className="p-4 text-center"><span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1 rounded-lg font-black">{c.class_members?.[0]?.count || 0} HS</span></td>
                            <td className="p-4 text-right">
                              <button onClick={() => handleDeleteClass(c.id)} className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Xóa lớp học"><Trash2 size={16}/></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB 4 & 5: DATABASE & SETTINGS */}
            {/* ========================================================= */}
            {activeTab === 'database' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                 <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3 mb-6"><Database className="text-orange-500"/> Kiến trúc Dữ liệu</h1>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl p-10 shadow-sm text-center">
                      <HardDrive size={64} className="mx-auto text-blue-500 mb-6 opacity-30"/>
                      <h3 className="text-5xl font-black text-slate-800 dark:text-white mb-2">{stats.exams}</h3>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Bộ Đề Thi Tồn Tại</p>
                    </div>
                    <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl p-10 shadow-sm text-center">
                      <Library size={64} className="mx-auto text-purple-500 mb-6 opacity-30"/>
                      <h3 className="text-5xl font-black text-slate-800 dark:text-white mb-2">{stats.lessons}</h3>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Bài Giảng Lý Thuyết</p>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                 <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3 mb-6"><Settings className="text-slate-500"/> Cấu hình Môi trường</h1>
                 
                 <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 rounded-2xl p-6 shadow-sm mb-6">
                    <h3 className="font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                      <AlertTriangle size={18}/> Danger Zone (Khu vực nguy hiểm)
                    </h3>
                    <p className="text-sm text-red-500 dark:text-red-400/80 mb-4 font-medium">Các thao tác dưới đây sẽ ảnh hưởng trực tiếp đến toàn bộ người dùng đang truy cập hệ thống.</p>
                    <button
                      onClick={handleForceReloadAll}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-md transition-all"
                    >
                      <Power size={18} /> Ép toàn bộ User tải lại trang (Force Update)
                    </button>
                 </div>

                 <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-4 bg-slate-50 dark:bg-[#0F172A] border-b border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2"><Globe size={16}/> Environment Variables (Read-Only)</div>
                    <div className="p-8 space-y-6 font-mono text-sm">
                      <div>
                        <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">VITE_SUPABASE_URL</div>
                        <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 break-all">{import.meta.env.VITE_SUPABASE_URL || 'Not config'}</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">VITE_CLOUDINARY_CLOUD_NAME</div>
                        <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 break-all">{import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'Not config'}</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">VITE_GROQ_MODEL</div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-400 font-black shadow-inner">llama-3.3-70b-versatile (Active)</div>
                      </div>
                    </div>
                 </div>
              </div>
            )}

          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;