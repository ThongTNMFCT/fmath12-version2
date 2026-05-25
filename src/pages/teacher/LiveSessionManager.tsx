import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { useAppStore } from '../../store/useAppStore';
import { Plus, Users, Clock, Key, Search, FileJson, Database, Globe, Play, BookOpen, ShieldAlert, Loader2, Copy, CheckCircle2 } from 'lucide-react';

const LiveSessionManager = () => {
  const { currentUser } = useAppStore();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedPin, setCopiedPin] = useState<string | null>(null);

  // Form States
  const [examSource, setExamSource] = useState<'bank' | 'json'>('bank');
  const [selectedExamId, setSelectedExamId] = useState('');
  const [jsonExam, setJsonExam] = useState('');
  
  const [audience, setAudience] = useState<'class' | 'list' | 'public'>('public');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [studentList, setStudentList] = useState('');
  
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, [currentUser]);

  const fetchInitialData = async () => {
    if (!currentUser?.id) return;
    setIsLoading(true);
    try {
      // 1. Lấy danh sách các ca thi đã tạo
      const { data: sessionsData, error: sessionErr } = await supabase
        .from('live_sessions')
        .select('*, exams(title)')
        .eq('created_by', currentUser.id)
        .order('created_at', { ascending: false });
      
      if (sessionErr) console.error("Lỗi tải live_sessions:", sessionErr);
      if (sessionsData) setSessions(sessionsData);

      // 2. Lấy danh sách đề thi (ĐÃ SỬA LỖI 400: Dùng teacher_id thay vì created_by)
      // NẾU VẪN LỖI, HÃY THAY 'teacher_id' BẰNG TÊN CỘT ĐÚNG TRONG BẢNG exams CỦA BẠN (VD: 'author_id', 'user_id')
      const { data: examsData, error: examErr } = await supabase
        .from('exams')
        .select('id, title, time_limit')
        .eq('teacher_id', currentUser.id); 
        
      if (examErr) console.error("Lỗi tải exams:", examErr);
      if (examsData) setExams(examsData);

      // 3. Lấy danh sách lớp học
      const { data: classesData } = await supabase
        .from('classes')
        .select('id, name')
        .eq('teacher_id', currentUser.id);
      if (classesData) setClasses(classesData);

    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generatePin = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let pin = '';
    for (let i = 0; i < 6; i++) {
      pin += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pin;
  };

  const handleCreateSession = async () => {
    if (!startTime || !endTime) {
      alert("Vui lòng chọn thời gian bắt đầu và kết thúc!");
      return;
    }
    
    setIsSaving(true);
    try {
      let finalExamId = selectedExamId;

      // XỬ LÝ NẾU NHẬP JSON TẠO ĐỀ MỚI TRỰC TIẾP
      if (examSource === 'json') {
        try {
          const parsedExam = JSON.parse(jsonExam);
          // Tạo đề tạm trong DB (Lưu ý cột teacher_id)
          const { data: newExam, error: examErr } = await supabase.from('exams').insert({
            title: parsedExam.title || 'Đề thi Live tạo từ JSON',
            time_limit: parsedExam.time_limit || 2700,
            teacher_id: currentUser?.id, // Sửa ở đây cho đồng bộ
            status: 'published'
          }).select().single();
          
          if (examErr) throw examErr;
          finalExamId = newExam.id;

        } catch (err) {
          alert("Lỗi định dạng JSON đề thi!");
          setIsSaving(false);
          return;
        }
      }

      if (!finalExamId) {
        alert("Vui lòng chọn hoặc nhập đề thi!");
        setIsSaving(false);
        return;
      }

      const accessCode = generatePin();

      // TẠO CA THI
      const { error } = await supabase.from('live_sessions').insert({
        exam_id: finalExamId,
        created_by: currentUser?.id,
        access_code: accessCode,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        is_active: true,
        allowed_classes: audience === 'class' ? [selectedClassId] : null,
        allowed_students: audience === 'list' ? studentList.split('\n').map(s=>s.trim()).filter(Boolean) : null,
        is_public: audience === 'public'
      });

      if (error) throw error;

      setIsCreating(false);
      fetchInitialData(); // Refresh list

    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra khi tạo ca thi!");
    } finally {
      setIsSaving(false);
    }
  };

  const getSessionStatus = (start: string, end: string, isActive: boolean) => {
    if (!isActive) return { label: 'Đã đóng', color: 'bg-slate-100 text-slate-500 border-slate-200' };
    const now = new Date().getTime();
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    if (now < s) return { label: 'Sắp diễn ra', color: 'bg-blue-50 text-blue-600 border-blue-200' };
    if (now >= s && now <= e) return { label: 'Đang diễn ra', color: 'bg-green-50 text-green-600 border-green-200 animate-pulse' };
    return { label: 'Đã kết thúc', color: 'bg-slate-100 text-slate-500 border-slate-200' };
  };

  const handleCopy = (pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(pin);
    setTimeout(() => setCopiedPin(null), 2000);
  };

  if (isLoading) return <div className="flex items-center justify-center h-full min-h-[400px]"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  return (
    <div className="p-6 lg:p-10 font-sans max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-blue-950 dark:text-white uppercase tracking-tight">Quản lý Khảo thí</h1>
          <p className="text-slate-500 font-medium mt-1">Tổ chức và giám sát các kỳ thi trực tuyến theo thời gian thực.</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all">
          <Plus size={20} /> TẠO CA THI MỚI
        </button>
      </div>

      {/* CREATE MODAL */}
      {isCreating && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
              <h2 className="text-xl font-black text-blue-950 dark:text-white uppercase">Cài đặt Ca thi mới</h2>
              <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-red-500 transition-colors"><ShieldAlert size={24} className="rotate-45" /></button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* NGUỒN ĐỀ THI */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 border-l-4 border-blue-500 pl-3 uppercase text-sm">1. Nguồn đề thi</h3>
                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <button onClick={() => setExamSource('bank')} className={`flex-1 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${examSource === 'bank' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}><Database size={16}/> Ngân hàng đề</button>
                  <button onClick={() => setExamSource('json')} className={`flex-1 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${examSource === 'json' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}><FileJson size={16}/> Mã JSON</button>
                </div>
                {examSource === 'bank' ? (
                  <select value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} className="w-full p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 bg-white dark:bg-slate-800 font-medium">
                    <option value="">-- Chọn đề thi đã soạn --</option>
                    {exams.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                  </select>
                ) : (
                  <textarea value={jsonExam} onChange={e => setJsonExam(e.target.value)} placeholder="Dán mã JSON đề thi vào đây..." className="w-full h-32 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 bg-slate-50 dark:bg-slate-800 font-mono text-sm custom-scrollbar" />
                )}
              </div>

              {/* ĐỐI TƯỢNG THAM GIA */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 border-l-4 border-blue-500 pl-3 uppercase text-sm">2. Đối tượng tham gia</h3>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setAudience('public')} className={`p-3 rounded-xl border-2 font-bold text-xs flex flex-col items-center justify-center gap-2 transition-all ${audience === 'public' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}><Globe size={20}/> Tự do (Dùng PIN)</button>
                  <button onClick={() => setAudience('class')} className={`p-3 rounded-xl border-2 font-bold text-xs flex flex-col items-center justify-center gap-2 transition-all ${audience === 'class' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}><BookOpen size={20}/> Chọn Lớp</button>
                  <button onClick={() => setAudience('list')} className={`p-3 rounded-xl border-2 font-bold text-xs flex flex-col items-center justify-center gap-2 transition-all ${audience === 'list' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}><Users size={20}/> Nhập danh sách</button>
                </div>
                {audience === 'class' && (
                  <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="w-full p-4 rounded-xl border-2 border-slate-200 outline-none focus:border-blue-500 bg-white font-medium">
                    <option value="">-- Chọn lớp học --</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
                {audience === 'list' && (
                  <textarea value={studentList} onChange={e => setStudentList(e.target.value)} placeholder="Nhập mã HS hoặc Email (Mỗi người 1 dòng)..." className="w-full h-24 p-4 rounded-xl border-2 border-slate-200 outline-none focus:border-blue-500 bg-slate-50 font-mono text-sm custom-scrollbar" />
                )}
              </div>

              {/* THỜI GIAN */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2 border-l-4 border-blue-500 pl-3 uppercase text-sm">3. Thời gian</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Bắt đầu mở phòng</label>
                    <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full p-4 rounded-xl border-2 border-slate-200 outline-none focus:border-blue-500 bg-white font-medium"/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Tự động đóng phòng</label>
                    <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full p-4 rounded-xl border-2 border-slate-200 outline-none focus:border-blue-500 bg-white font-medium"/>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-b-3xl flex gap-3">
              <button onClick={() => setIsCreating(false)} className="flex-1 py-4 font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">HỦY BỎ</button>
              <button disabled={isSaving} onClick={handleCreateSession} className="flex-1 py-4 font-bold text-white bg-blue-600 rounded-xl shadow-md hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                {isSaving ? <Loader2 className="animate-spin" size={20}/> : <CheckCircle2 size={20}/>} XÁC NHẬN TẠO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DANH SÁCH CA THI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {sessions.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
            <Database size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-500 mb-2">Chưa có Ca thi nào</h3>
            <p className="text-slate-400 text-sm">Bấm "Tạo ca thi mới" để bắt đầu tổ chức thi trực tuyến.</p>
          </div>
        ) : (
          sessions.map(session => {
            const status = getSessionStatus(session.start_time, session.end_time, session.is_active);
            return (
              <div key={session.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col hover:shadow-xl transition-shadow relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-full h-1.5 ${status.label === 'Đang diễn ra' ? 'bg-green-500' : status.label === 'Sắp diễn ra' ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                
                <div className="flex justify-between items-start mb-4 mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${status.color}`}>
                    {status.label}
                  </span>
                  <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                    <Key size={14} className="text-slate-400" />
                    <span className="font-black text-xl tracking-[0.2em] text-blue-950 dark:text-white">{session.access_code}</span>
                    <button onClick={() => handleCopy(session.access_code)} className="text-blue-600 hover:bg-blue-100 p-1.5 rounded-lg transition-colors">
                      {copiedPin === session.access_code ? <CheckCircle2 size={16} className="text-green-500"/> : <Copy size={16}/>}
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 line-clamp-2" title={session.exams?.title}>
                  {session.exams?.title || 'Đề thi không xác định'}
                </h3>

                <div className="space-y-2 mb-6 flex-1">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                    <Clock size={16} className="text-slate-400"/>
                    Bắt đầu: {new Date(session.start_time).toLocaleString('vi-VN', {hour: '2-digit', minute:'2-digit', day:'2-digit', month:'2-digit', year:'numeric'})}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                    <ShieldAlert size={16} className="text-slate-400"/>
                    Bảo mật: {session.is_public ? 'Công khai (Mở bằng PIN)' : 'Chỉ định đối tượng'}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                  <button 
                    onClick={() => navigate(`/live-monitor/${session.id}`)}
                    className="flex-1 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Play size={18} /> VÀO GIÁM SÁT
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LiveSessionManager;