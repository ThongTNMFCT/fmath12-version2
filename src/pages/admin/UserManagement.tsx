import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Search, ShieldCheck, User, Mail, GraduationCap, Loader2, 
  Trash2, Edit3, CheckCircle2, Ban, Unlock, BellRing, Send, X, 
  Bold, Italic, List, BookOpen, BookMarked
} from 'lucide-react';
import { supabase } from '../../config/supabase';

const SUBJECTS = [
  { id: 'math', name: 'F-Math (Toán)' },
  { id: 'physics', name: 'F-Physics (Lý)' },
  { id: 'chemistry', name: 'F-Chem (Hóa)' },
  { id: 'biology', name: 'F-Bio (Sinh)' },
  { id: 'it', name: 'F-IT (Tin)' }
];

const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // States cho Notifications
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [notifTarget, setNotifTarget] = useState<any>(null); 
  const [notifAudience, setNotifAudience] = useState<'all' | 'student' | 'teacher'>('all'); 
  const [notifForm, setNotifForm] = useState({ title: '', message: '', type: 'system' });
  const [isSendingNotif, setIsSendingNotif] = useState(false);
  const notifTextareaRef = useRef<HTMLTextAreaElement>(null);

  // States cho Phân quyền môn học
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subjectTarget, setSubjectTarget] = useState<any>(null);
  const [selectedSubject, setSelectedSubject] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('users')
      .select(`*, class_members (status, classes (name))`)
      .order('created_at', { ascending: false });

    if (data) {
      const formattedData = data.map(u => {
        const classInfo = u.class_members?.map((cm: any) => {
          if (!cm.classes?.name) return null;
          if (cm.status === 'joined') return cm.classes.name;
          if (cm.status === 'pending') return `${cm.classes.name} (Chờ duyệt)`;
          return null;
        }).filter(Boolean) || [];

        return {
          ...u, 
          status: u.status || 'active',
          joined_classes: classInfo.length > 0 ? classInfo.join(' • ') : 'Chưa vào lớp'
        };
      });
      setUsersList(formattedData);
    }
    setIsLoading(false);
  };

  const handleChangeRole = async (userId: string, currentRole: string) => {
    const roles = ['student', 'teacher', 'admin'];
    const newRole = window.prompt(`Cấp quyền (student / teacher / admin):\nQuyền hiện tại: ${currentRole}`, currentRole);
    
    if (!newRole || !roles.includes(newRole) || newRole === currentRole) return;
    
    const { error } = await supabase.from('users').update({ role: newRole }).eq('id', userId);
    if (!error) {
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
  };

  const handleUpdateStatus = async (userId: string, newStatus: 'active' | 'banned') => {
    if (!window.confirm(`Xác nhận ${newStatus === 'active' ? 'mở khóa' : 'khóa'} tài khoản này?`)) return;
    const { error } = await supabase.from('users').update({ status: newStatus }).eq('id', userId);
    if (!error) setUsersList(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Xóa toàn bộ dữ liệu của người dùng này vĩnh viễn?")) return;
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (!error) setUsersList(prev => prev.filter(u => u.id !== userId));
  };

  const handleOpenSubjectModal = (user: any) => {
    setSubjectTarget(user);
    setSelectedSubject(user.subject || '');
    setShowSubjectModal(true);
  };

  const handleAssignSubject = async () => {
    if (!subjectTarget) return;
    const { error } = await supabase.from('users').update({ subject: selectedSubject }).eq('id', subjectTarget.id);
    if (!error) {
      setUsersList(prev => prev.map(u => u.id === subjectTarget.id ? { ...u, subject: selectedSubject } : u));
      setShowSubjectModal(false);
      alert("Cập nhật bộ môn quản lý thành công!");
    } else {
      alert("Lỗi cập nhật: " + error.message);
    }
  };

  const handleSendNotification = async () => {
    if (!notifForm.title.trim() || !notifForm.message.trim()) return alert("Vui lòng điền đầy đủ tiêu đề và nội dung!");
    setIsSendingNotif(true);
    try {
      let targetUserIds: string[] = [];
      if (notifTarget) {
        targetUserIds = [notifTarget.id];
      } else {
        const filtered = usersList.filter(u => notifAudience === 'all' || u.role === notifAudience);
        targetUserIds = filtered.map(u => u.id);
      }

      if (targetUserIds.length === 0) {
         alert("Không có người dùng nào thuộc đối tượng này!");
         setIsSendingNotif(false);
         return;
      }

      const payloads = targetUserIds.map(uid => ({
        user_id: uid,
        title: notifForm.title,
        message: notifForm.message,
        type: notifForm.type,
        is_read: false
      }));

      const chunkSize = 100;
      for (let i = 0; i < payloads.length; i += chunkSize) {
         const { error } = await supabase.from('notifications').insert(payloads.slice(i, i + chunkSize));
         if (error) throw error;
      }

      alert("Đã gửi thông báo thành công!");
      setShowNotifModal(false);
      setNotifForm({ title: '', message: '', type: 'system' });
    } catch (err: any) {
      alert("Lỗi khi gửi thông báo: " + err.message + "\n(Vui lòng kiểm tra RLS bảng notifications)");
    } finally {
      setIsSendingNotif(false);
    }
  };

  const getSubjectName = (subId: string) => SUBJECTS.find(s => s.id === subId)?.name || 'Chưa phân công';

  const filteredUsers = usersList.filter(u => 
    (roleFilter === 'all' || u.role === roleFilter) &&
    ((u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-[#F8FAFC] dark:bg-[#0B0F19] relative animate-in fade-in overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 pb-10">
        <div className="max-w-7xl mx-auto w-full">
          
          <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2 flex items-center gap-3">
                <ShieldCheck className="text-indigo-600"/> F-Prep IAM (Quản trị)
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Kiểm soát trạng thái, phân công môn học cho Giáo viên và gửi thông báo.</p>
            </div>
            
            <button onClick={() => {setNotifTarget(null); setShowNotifModal(true);}} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-md transition-all hover:-translate-y-1 shrink-0">
              <BellRing size={18} /> Gửi thông báo Pop-up
            </button>
          </div>

          <div className="glass bg-white dark:bg-[#111827] p-4 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400"><Search size={18}/></div>
              <input type="text" placeholder="Tìm kiếm tài khoản..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-indigo-500 dark:text-white transition-colors text-sm font-medium"/>
            </div>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 px-4 rounded-xl outline-none focus:border-indigo-500 w-full md:w-auto text-sm">
              <option value="all">Tất cả vai trò</option>
              <option value="teacher">Chỉ Giáo viên</option>
              <option value="student">Chỉ Học sinh</option>
              <option value="admin">Quản trị viên</option>
            </select>
          </div>

          {isLoading ? (
             <div className="flex justify-center p-10"><Loader2 className="animate-spin text-indigo-600" size={40}/></div>
          ) : (
            <div className="bg-white dark:bg-[#111827] rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-5 border-b border-slate-200 dark:border-slate-800">Tài khoản</th>
                      <th className="p-5 border-b border-slate-200 dark:border-slate-800">Thông tin Hỗ trợ</th>
                      <th className="p-5 border-b border-slate-200 dark:border-slate-800 text-center">Vai trò</th>
                      <th className="p-5 border-b border-slate-200 dark:border-slate-800 text-center">Trạng thái</th>
                      <th className="p-5 border-b border-slate-200 dark:border-slate-800 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-5 flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white overflow-hidden shrink-0 ${user.role === 'admin' ? 'bg-red-600' : user.role === 'teacher' ? 'bg-emerald-600' : 'bg-indigo-600'}`}>
                            {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover"/> : (user.full_name?.charAt(0) || 'U')}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{user.full_name || 'Chưa cập nhật'}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{user.email}</div>
                          </div>
                        </td>
                        <td className="p-5">
                          {user.role === 'teacher' ? (
                            <div className="text-xs font-bold flex items-center gap-2">
                              <BookMarked size={14} className="text-emerald-500 shrink-0"/> 
                              <span className={user.subject ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                                {getSubjectName(user.subject)}
                              </span>
                            </div>
                          ) : user.role === 'student' ? (
                            <div className="text-xs font-bold flex items-start gap-2">
                              <BookOpen size={14} className="text-indigo-500 shrink-0 mt-0.5"/> 
                              <span className={`line-clamp-2 max-w-[200px] leading-snug ${user.joined_classes === 'Chưa vào lớp' ? 'text-slate-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                {user.joined_classes}
                              </span>
                            </div>
                          ) : (
                            <div className="text-xs font-medium text-slate-500">Toàn quyền hệ thống</div>
                          )}
                        </td>
                        <td className="p-5 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            user.role === 'admin' ? 'bg-red-100 text-red-700' : user.role === 'teacher' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
                          }`}>
                            {user.role === 'admin' ? <ShieldCheck size={12}/> : user.role === 'teacher' ? <CheckCircle2 size={12}/> : <User size={12}/>} 
                            {user.role === 'admin' ? 'Admin' : user.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
                          </span>
                        </td>
                        <td className="p-5 text-center">
                          <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                            user.status === 'active' ? 'bg-green-50 border-green-200 text-green-600' : 'bg-red-50 border-red-200 text-red-600'
                          }`}>
                            {user.status === 'active' ? 'Hoạt động' : 'Bị Khóa'}
                          </span>
                        </td>
                        <td className="p-5">
                          <div className="flex justify-end gap-1.5">
                            {user.role === 'teacher' && (
                              <button onClick={() => handleOpenSubjectModal(user)} className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors" title="Phân công bộ môn"><BookMarked size={16}/></button>
                            )}
                            <button onClick={() => {setNotifTarget(user); setShowNotifModal(true);}} className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors" title="Gửi thông báo riêng"><BellRing size={16}/></button>
                            {user.status === 'banned' ? (
                              <button onClick={() => handleUpdateStatus(user.id, 'active')} className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100 rounded-lg transition-colors" title="Mở khóa tài khoản"><Unlock size={16}/></button>
                            ) : (
                              <button onClick={() => handleUpdateStatus(user.id, 'banned')} className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Khóa tài khoản"><Ban size={16}/></button>
                            )}
                            <button onClick={() => handleChangeRole(user.id, user.role)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors" title="Đổi quyền"><Edit3 size={16}/></button>
                            <button onClick={() => handleDeleteUser(user.id)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-600 rounded-lg transition-colors" title="Xóa User"><Trash2 size={16}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal Gửi thông báo */}
          {showNotifModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white dark:bg-[#111827] w-full max-w-lg rounded-[32px] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
                <button onClick={() => setShowNotifModal(false)} className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-full text-slate-500"><X size={18}/></button>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2"><BellRing className="text-indigo-500"/> Gửi Thông báo</h3>
                <p className="text-sm font-medium text-slate-500 mb-6">
                  {notifTarget ? `Gửi riêng cho: ${notifTarget.full_name}` : 'Gửi thông báo hàng loạt'}
                </p>
                
                <div className="space-y-4 mb-6">
                  {!notifTarget && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Đối tượng nhận</label>
                      <select value={notifAudience} onChange={e => setNotifAudience(e.target.value as any)} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm dark:text-white">
                        <option value="all">Tất cả người dùng</option>
                        <option value="student">Chỉ Học sinh</option>
                        <option value="teacher">Chỉ Giáo viên</option>
                      </select>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Tiêu đề</label>
                    <input type="text" value={notifForm.title} onChange={e => setNotifForm({...notifForm, title: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm dark:text-white" placeholder="VD: Lịch thi tháng 10..."/>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Nội dung</label>
                    <textarea ref={notifTextareaRef} value={notifForm.message} onChange={e => setNotifForm({...notifForm, message: e.target.value})} className="w-full h-32 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 text-sm dark:text-white resize-none custom-scrollbar" placeholder="Nội dung thông báo (Hỗ trợ Markdown)..."/>
                  </div>
                </div>
                
                <button onClick={handleSendNotification} disabled={isSendingNotif || !notifForm.title || !notifForm.message} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-md transition-all disabled:opacity-50 flex justify-center items-center gap-2">
                  {isSendingNotif ? <Loader2 size={18} className="animate-spin"/> : <Send size={18}/>} GỬI THÔNG BÁO
                </button>
              </div>
            </div>
          )}

          {/* Modal Phân Môn Học */}
          {showSubjectModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white dark:bg-[#111827] w-full max-w-sm rounded-[32px] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
                <button onClick={() => setShowSubjectModal(false)} className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-full text-slate-500"><X size={18}/></button>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Phân công Bộ môn</h3>
                <p className="text-sm font-medium text-slate-500 mb-6">Giáo viên: <strong className="text-emerald-600">{subjectTarget?.full_name}</strong></p>
                <div className="space-y-4 mb-8">
                  <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm dark:text-white">
                    <option value="">Chưa phân công</option>
                    {SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <button onClick={handleAssignSubject} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-md transition-all hover:-translate-y-1">LƯU PHÂN CÔNG</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default UserManagement;