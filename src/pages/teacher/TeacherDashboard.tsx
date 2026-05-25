import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Database, FileText, Send, CheckSquare, 
  BrainCircuit, PlusCircle, Sparkles, TrendingUp,
  Clock, FileSignature, Library, Trophy, Flame, CalendarDays,
  MessageSquare, Paperclip, Smile, Calculator, Atom, Beaker, Dna, Laptop, Lock
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { supabase } from '../../config/supabase';

// CẤU HÌNH THEME ĐỘNG THEO MÔN HỌC (Cố định class để Tailwind không xóa nhầm)
const SUBJECT_CONFIG: Record<string, any> = {
  math: { name: 'Toán Học', brand: 'F-Math', icon: <Calculator size={18}/>, gradient: 'from-blue-500 to-cyan-400', text: 'text-blue-600', bg: 'bg-blue-50', hover: 'hover:border-blue-300', darkBg: 'dark:bg-blue-900/20', shadow: 'shadow-blue-500/30', border: 'border-blue-100 dark:border-blue-800/50', theme: 'blue' },
  physics: { name: 'Vật Lý', brand: 'F-Physics', icon: <Atom size={18}/>, gradient: 'from-indigo-500 to-blue-500', text: 'text-indigo-600', bg: 'bg-indigo-50', hover: 'hover:border-indigo-300', darkBg: 'dark:bg-indigo-900/20', shadow: 'shadow-indigo-500/30', border: 'border-indigo-100 dark:border-indigo-800/50', theme: 'indigo' },
  chemistry: { name: 'Hóa Học', brand: 'F-Chem', icon: <Beaker size={18}/>, gradient: 'from-emerald-500 to-teal-400', text: 'text-emerald-600', bg: 'bg-emerald-50', hover: 'hover:border-emerald-300', darkBg: 'dark:bg-emerald-900/20', shadow: 'shadow-emerald-500/30', border: 'border-emerald-100 dark:border-emerald-800/50', theme: 'emerald' },
  biology: { name: 'Sinh Học', brand: 'F-Bio', icon: <Dna size={18}/>, gradient: 'from-rose-500 to-pink-500', text: 'text-rose-600', bg: 'bg-rose-50', hover: 'hover:border-rose-300', darkBg: 'dark:bg-rose-900/20', shadow: 'shadow-rose-500/30', border: 'border-rose-100 dark:border-rose-800/50', theme: 'rose' },
  it: { name: 'Tin Học', brand: 'F-IT', icon: <Laptop size={18}/>, gradient: 'from-purple-500 to-fuchsia-400', text: 'text-purple-600', bg: 'bg-purple-50', hover: 'hover:border-purple-300', darkBg: 'dark:bg-purple-900/20', shadow: 'shadow-purple-500/30', border: 'border-purple-100 dark:border-purple-800/50', theme: 'purple' },
};

const TeacherDashboard = () => {
  const { currentUser } = useAppStore();
  const navigate = useNavigate(); 
  
  // Xác định bộ môn và Theme
  const currentSubject = currentUser.subject || 'unknown';
  const activeTheme = SUBJECT_CONFIG[currentSubject] || {
    name: 'Chưa phân môn', brand: 'F-Prep', icon: <Lock size={18}/>, gradient: 'from-slate-500 to-slate-400', text: 'text-slate-600', bg: 'bg-slate-50', hover: 'hover:border-slate-300', darkBg: 'dark:bg-slate-800/20', shadow: 'shadow-slate-500/30', border: 'border-slate-100 dark:border-slate-700', theme: 'slate'
  };
  
  const [stats, setStats] = useState({ students: 0, questions: 0, exams: 0, classes: 0 });
  const [topStudents, setTopStudents] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // MOCK CHAT STATE
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'Admin', role: 'admin', text: 'Chào mừng quý thầy cô đến với phòng nghỉ giáo viên F-Prep! ☕', time: '08:00' },
    { id: 2, sender: 'Cô Mai', role: 'teacher', text: 'Đề thi Thử Đại học môn Lý đã sẵn sàng trên kho nhé mọi người.', time: '09:15' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser?.id) return;
      try {
        const { count: studentCount } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student');
        const { count: questionCount } = await supabase.from('exercises').select('*', { count: 'exact', head: true });
        const { count: examCount } = await supabase.from('exams').select('*', { count: 'exact', head: true });
        const { count: classCount } = await supabase.from('classes').select('*', { count: 'exact', head: true });

        setStats({ students: studentCount || 0, questions: questionCount || 0, exams: examCount || 0, classes: classCount || 0 });

        const { data: topData } = await supabase.from('users').select('id, full_name, xp, avatar_url').eq('role', 'student').order('xp', { ascending: false }).limit(3);
        if (topData) setTopStudents(topData);
      } catch (error) { console.error(error); }
    };
    fetchDashboardData();
  }, [currentUser]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const newMsg = {
      id: Date.now(),
      sender: currentUser.name || 'Giáo viên',
      role: currentUser.role,
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages([...chatMessages, newMsg]);
    setChatInput('');
  };

  const timeString = currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full bg-[#F8FAFC] dark:bg-[#0B0F19] overflow-hidden transition-colors">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 pb-32">
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* HERO BANNER THEO ẢNH MẪU */}
          <div className="bg-white dark:bg-[#111827] rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col lg:flex-row group hover:shadow-md transition-shadow">
            
            {/* NỬA TRÁI: THÔNG TIN LỜI CHÀO */}
            <div className="flex-1 p-8 md:p-10 relative z-10">
              <div className={`inline-flex items-center gap-2 ${activeTheme.bg} ${activeTheme.darkBg} ${activeTheme.text} px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest mb-6 border ${activeTheme.border} shadow-sm w-fit`}>
                {activeTheme.icon} BỘ MÔN {activeTheme.name.toUpperCase()}
              </div>
              
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4 leading-tight tracking-tight">
                Xin chào, {currentUser.name || 'Thầy/Cô'} <span className="inline-block origin-[70%_70%] hover:animate-pulse">✌️</span>
              </h1>
              
              <p className="text-slate-500 dark:text-slate-400 font-medium text-[15px] max-w-xl leading-relaxed mb-8">
                Hệ thống có <strong className="text-slate-700 dark:text-slate-200">{stats.classes}</strong> lớp học và <strong className="text-slate-700 dark:text-slate-200">{stats.exams}</strong> đề thi. Chúc thầy cô một ngày làm việc hiệu quả!
              </p>
              
              <button onClick={() => navigate('/exam-creator')} className={`bg-gradient-to-r ${activeTheme.gradient} text-white px-6 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg ${activeTheme.shadow} transition-transform hover:-translate-y-1 text-sm w-fit`}>
                <PlusCircle size={20} strokeWidth={2.5} /> TẠO ĐỀ THI MỚI
              </button>
            </div>

            {/* NỬA PHẢI: ĐỒNG HỒ */}
            <div className="relative z-10 flex flex-col items-center justify-center shrink-0 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-800 p-8 md:p-10 bg-slate-50/50 dark:bg-slate-800/20 lg:w-[380px]">
              <div className="text-5xl md:text-[54px] font-black tracking-tighter text-slate-800 dark:text-white mb-4 font-mono drop-shadow-sm">
                {timeString}
              </div>
              <div className={`${activeTheme.text} bg-white dark:bg-slate-800 font-bold text-sm flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm`}>
                <CalendarDays size={18} className={activeTheme.text} /> {dateString}
              </div>
            </div>
          </div>

          {/* BẢNG VÀNG SERVER */}
          <div className="bg-white dark:bg-[#111827] rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <Trophy className="text-orange-500" size={20} /> Bảng Vàng Server
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {topStudents.map((student, idx) => (
                <div key={student.id} className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-sm ${idx === 0 ? 'bg-yellow-400 text-yellow-900' : idx === 1 ? 'bg-slate-300 text-slate-700' : 'bg-amber-600 text-amber-100'}`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-slate-800 dark:text-white truncate">{student.full_name}</div>
                    <div className="text-xs font-black text-orange-500 flex items-center gap-1 mt-0.5"><Flame size={12}/> {student.xp} XP</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MAIN ACTIONS & CHAT BOX KHU VỰC CỐ ĐỊNH */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[500px]">
            
            {/* THAO TÁC NGHIỆP VỤ - CHIA ĐÔI ĐỀU NHAU */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              
              {/* CARD 1: Ngân hàng câu hỏi */}
              <div className={`bg-white dark:bg-[#111827] p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm group transition-all duration-300 flex flex-col h-full hover:shadow-xl ${activeTheme.hover}`}>
                <div className={`w-14 h-14 bg-gradient-to-br ${activeTheme.gradient} text-white rounded-[20px] flex items-center justify-center mb-6 shadow-md`}>
                  <Database size={26} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Ngân hàng Câu hỏi</h3>
                <p className="text-slate-500 font-medium text-[15px] mb-6 flex-1">Quản lý kho bài tập trắc nghiệm, tự luận và giáo án lý thuyết môn {activeTheme.name}.</p>
                
                <div className="mt-auto space-y-3 shrink-0">
                  <button onClick={() => navigate('/question-bank')} className={`w-full bg-slate-50 hover:${activeTheme.bg} dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3.5 rounded-2xl transition-colors flex justify-center items-center gap-2 text-sm border border-slate-100 dark:border-slate-700`}>
                    <PlusCircle size={18} className={activeTheme.text}/> Thêm Câu hỏi / Bài tập
                  </button>
                  <button onClick={() => navigate('/question-bank')} className={`w-full bg-slate-50 hover:${activeTheme.bg} dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3.5 rounded-2xl transition-colors flex justify-center items-center gap-2 text-sm border border-slate-100 dark:border-slate-700`}>
                    <FileSignature size={18} className={activeTheme.text}/> Soạn Lý thuyết mới
                  </button>
                </div>
              </div>

              {/* CARD 2: Giao bài & Khảo thí */}
              <div className={`bg-white dark:bg-[#111827] p-8 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm group transition-all duration-300 flex flex-col h-full hover:shadow-xl ${activeTheme.hover}`}>
                <div className={`w-14 h-14 bg-gradient-to-br ${activeTheme.gradient} text-white rounded-[20px] flex items-center justify-center mb-6 shadow-md`}>
                  <Send size={26} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3">Giao bài & Khảo thí</h3>
                <p className="text-slate-500 font-medium text-[15px] mb-6 flex-1">Tổ hợp đề thi, giao bài tập về nhà và tạo phòng thi FEP trực tuyến.</p>
                
                <div className="mt-auto space-y-3 shrink-0">
                  <button onClick={() => navigate('/exam-bank')} className={`w-full bg-gradient-to-r ${activeTheme.gradient} text-white font-black py-3.5 rounded-2xl transition-all hover:opacity-90 flex justify-center items-center gap-2 text-sm shadow-md hover:-translate-y-0.5`}>
                    <Send size={18}/> GIAO BÀI CHO LỚP
                  </button>
                  <button onClick={() => navigate('/class-manager')} className="w-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3.5 rounded-2xl transition-colors flex justify-center items-center gap-2 text-sm border border-slate-100 dark:border-slate-700">
                    <Users size={18} className="text-slate-500"/> Quản lý lớp học
                  </button>
                </div>
              </div>

            </div>

            {/* KHUNG CHAT GIÁO VIÊN - CỐ ĐỊNH CHIỀU CAO */}
            <div className="bg-white dark:bg-[#111827] rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden h-[500px] lg:h-full">
              
              {/* Header Chat */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3 shrink-0 z-10 shadow-sm">
                <div className={`w-10 h-10 rounded-2xl ${activeTheme.bg} ${activeTheme.darkBg} ${activeTheme.text} flex items-center justify-center`}><MessageSquare size={20}/></div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white">Phòng chờ Giáo viên</h3>
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Online</p>
                </div>
              </div>
              
              {/* Khu vực tin nhắn có thanh trượt */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-slate-50 dark:bg-[#0B0F19]">
                {chatMessages.map(msg => {
                  const isMe = msg.sender === currentUser.name;
                  return (
                    <div key={msg.id} className={`flex flex-col w-full ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-end gap-2 max-w-[85%]">
                        {!isMe && (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 shadow-sm ${msg.role === 'admin' ? 'bg-red-500' : 'bg-slate-400 dark:bg-slate-700'}`}>
                            {msg.sender.charAt(0)}
                          </div>
                        )}
                        <div className={`px-4 py-3 text-[14px] font-medium shadow-sm leading-relaxed ${isMe ? `bg-gradient-to-r ${activeTheme.gradient} text-white rounded-2xl rounded-br-sm` : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl rounded-bl-sm'}`}>
                          {!isMe && <div className="text-[11px] font-black text-slate-400 mb-1">{msg.sender}</div>}
                          {msg.text}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Khu vực nhập liệu */}
              <div className="p-4 bg-white dark:bg-[#111827] border-t border-slate-100 dark:border-slate-800 shrink-0 z-10">
                <div className={`flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-2 py-1.5 focus-within:ring-2 focus-within:ring-slate-500/50 transition-shadow`}>
                  <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><Smile size={20}/></button>
                  <input 
                    type="text" 
                    value={chatInput} 
                    onChange={e => setChatInput(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                    placeholder="Thảo luận nội bộ..." 
                    className="flex-1 bg-transparent border-none outline-none text-sm dark:text-white font-medium placeholder:text-slate-400"
                  />
                  <button onClick={handleSendChat} disabled={!chatInput.trim()} className={`p-2 bg-gradient-to-r ${activeTheme.gradient} text-white rounded-xl disabled:opacity-50 hover:opacity-90 transition-colors shadow-md`}><Send size={18}/></button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;