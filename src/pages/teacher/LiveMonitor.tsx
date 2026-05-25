import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { ShieldAlert, Users, Clock, ArrowLeft, Loader2, CheckCircle2, AlertTriangle, Activity } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface StudentStatus {
  userId: string;
  userName: string;
  currentQuestion: number;
  answered: number;
  violations: number;
  isSubmitted: boolean;
  score?: number;
  lastUpdated: number;
}

interface LogEvent {
  id: string;
  time: string;
  userId: string;
  userName: string;
  type: string;
}

const LiveMonitor = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAppStore();

  const [session, setSession] = useState<any>(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // States quản lý Realtime
  const [students, setStudents] = useState<Record<string, StudentStatus>>({});
  const [logs, setLogs] = useState<LogEvent[]>([]);
  
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInitialData();
  }, [sessionId]);

  // Cuộn tự động xuống Log mới nhất
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const fetchInitialData = async () => {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      // 1. Lấy thông tin Ca thi và Đề thi
      const { data: sessionData } = await supabase
        .from('live_sessions')
        .select('*, exams(title, time_limit)')
        .eq('id', sessionId)
        .single();
      
      if (sessionData) {
        setSession(sessionData);
        // Lấy tổng số câu hỏi của đề này
        const { count } = await supabase
          .from('exam_questions')
          .select('*', { count: 'exact', head: true })
          .eq('exam_id', sessionData.exam_id);
        setTotalQuestions(count || 1);

        // 2. Lấy danh sách HS đã nộp bài (để hiển thị thẻ xanh)
        const { data: attempts } = await supabase
          .from('exam_attempts')
          .select('user_id, score, users(full_name)')
          .eq('exam_id', sessionData.exam_id);
        
        // 3. Lấy lịch sử vi phạm cũ trong phiên
        const { data: pastViolations } = await supabase
          .from('exam_violations')
          .select('user_id, violation_type, created_at, users(full_name)')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });

        // Tái tạo State Students từ DB
        const initialStudents: Record<string, StudentStatus> = {};
        
        // Đếm vi phạm
        if (pastViolations) {
          const initialLogs: LogEvent[] = [];
          pastViolations.forEach((v: any, index) => {
            const uId = v.user_id;
            const uName = v.users?.full_name || 'N/A';
            
            if (!initialStudents[uId]) {
              initialStudents[uId] = { userId: uId, userName: uName, currentQuestion: 0, answered: 0, violations: 0, isSubmitted: false, lastUpdated: Date.now() };
            }
            initialStudents[uId].violations += 1;
            
            initialLogs.push({
              id: `db_${index}`,
              time: new Date(v.created_at).toLocaleTimeString('vi-VN'),
              userId: uId,
              userName: uName,
              type: v.violation_type
            });
          });
          setLogs(initialLogs);
        }

        // Đánh dấu đã nộp bài
        if (attempts) {
          attempts.forEach((a: any) => {
            const uId = a.user_id;
            if (!initialStudents[uId]) {
              initialStudents[uId] = { userId: uId, userName: a.users?.full_name || 'N/A', currentQuestion: 0, answered: totalQuestions, violations: 0, isSubmitted: true, score: a.score, lastUpdated: Date.now() };
            } else {
              initialStudents[uId].isSubmitted = true;
              initialStudents[uId].score = a.score;
              initialStudents[uId].answered = totalQuestions;
            }
          });
        }
        
        setStudents(initialStudents);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // SUBSCRIBE KÊNH REALTIME
  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase.channel(`live_exam_${sessionId}`);

    channel.on('broadcast', { event: 'progress_update' }, (payload) => {
      const data = payload.payload;
      setStudents((prev) => {
        const existing = prev[data.userId] || { violations: 0, isSubmitted: false };
        if (existing.isSubmitted) return prev; // Đã nộp thì ko cập nhật tiến độ nữa
        return {
          ...prev,
          [data.userId]: {
            ...existing,
            userId: data.userId,
            userName: data.userName,
            currentQuestion: data.currentQuestion,
            answered: data.answered,
            lastUpdated: Date.now()
          }
        };
      });
    });

    channel.on('broadcast', { event: 'cheat_alert' }, (payload) => {
      const data = payload.payload;
      
      // Thêm vào Log
      setLogs((prev) => [...prev, { id: Date.now().toString(), time: data.time, userId: data.userId, userName: data.userName, type: data.type }]);
      
      // Tăng số đếm vi phạm
      setStudents((prev) => {
        const existing = prev[data.userId] || { currentQuestion: 0, answered: 0, isSubmitted: false };
        return {
          ...prev,
          [data.userId]: {
            ...existing,
            userId: data.userId,
            userName: data.userName,
            violations: (existing.violations || 0) + 1,
            lastUpdated: Date.now()
          }
        };
      });
    });

    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  if (isLoading) return <div className="fixed inset-0 flex items-center justify-center bg-[#f0f4f9]"><Loader2 className="animate-spin text-[#0052cc]" size={48} /></div>;

  const studentList = Object.values(students).sort((a, b) => b.lastUpdated - a.lastUpdated);
  const cheatingCount = studentList.filter(s => s.violations > 0).length;
  const submittedCount = studentList.filter(s => s.isSubmitted).length;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#f0f4f9] dark:bg-slate-950 flex flex-col font-sans overflow-hidden">
      
      {/* 1. TOP HEADER CHIẾN DỊCH */}
      <div className="h-16 bg-[#0052cc] text-white flex items-center justify-between px-6 shrink-0 shadow-md z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/live-sessions')} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><ArrowLeft size={20}/></button>
          <div className="w-px h-6 bg-white/20"></div>
          <div>
            <h1 className="font-black text-sm tracking-wider uppercase flex items-center gap-2">
              <Activity size={16} className="animate-pulse text-green-300"/> TRUNG TÂM GIÁM SÁT CA THI
            </h1>
            <div className="text-[10px] text-blue-200 font-medium truncate max-w-md">{session?.exams?.title}</div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 bg-white/10 px-4 py-1.5 rounded-lg border border-white/10">
            <div className="text-center">
              <div className="text-[10px] text-blue-200 uppercase font-bold tracking-widest">Đang Thi</div>
              <div className="font-black text-lg leading-none">{studentList.length - submittedCount}</div>
            </div>
            <div className="w-px h-6 bg-white/20"></div>
            <div className="text-center">
              <div className="text-[10px] text-green-300 uppercase font-bold tracking-widest">Đã Nộp</div>
              <div className="font-black text-lg leading-none text-green-300">{submittedCount}</div>
            </div>
            <div className="w-px h-6 bg-white/20"></div>
            <div className="text-center">
              <div className="text-[10px] text-red-300 uppercase font-bold tracking-widest">Cảnh Cáo</div>
              <div className="font-black text-lg leading-none text-red-300">{cheatingCount}</div>
            </div>
          </div>
          <div className="bg-white text-[#0052cc] font-black tracking-[0.2em] px-4 py-1.5 rounded-lg border-2 border-transparent shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            PIN: {session?.access_code}
          </div>
        </div>
      </div>

      {/* 2. KHU VỰC MAIN: CHIA ĐÔI */}
      <div className="flex-1 flex min-h-0">
        
        {/* LEFT: GRID HỌC SINH */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          {studentList.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Users size={64} className="mb-4 opacity-50" />
              <h2 className="text-xl font-bold mb-1">Đang chờ học sinh truy cập...</h2>
              <p className="text-sm">Hãy cung cấp mã PIN <strong className="text-slate-600">{session?.access_code}</strong> cho học sinh.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {studentList.map(student => {
                const progressPct = Math.min(100, Math.round((student.answered / totalQuestions) * 100));
                const isCheater = student.violations > 0;
                
                return (
                  <div key={student.userId} className={`bg-white dark:bg-slate-900 rounded-2xl p-4 border-2 transition-all relative shadow-sm ${student.isSubmitted ? 'border-green-400 bg-green-50/30' : isCheater ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-slate-200 dark:border-slate-800'}`}>
                    
                    {/* Badge Vi phạm */}
                    {isCheater && !student.isSubmitted && (
                      <div className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-black shadow-md animate-bounce border-2 border-white z-10">
                        {student.violations}
                      </div>
                    )}
                    {/* Badge Nộp bài */}
                    {student.isSubmitted && (
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 shadow-md border-2 border-white z-10">
                        <CheckCircle2 size={16} />
                      </div>
                    )}

                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold text-sm border-2 ${student.isSubmitted ? 'bg-green-100 text-green-700 border-green-200' : isCheater ? 'bg-red-100 text-red-700 border-red-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                        {student.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-800 dark:text-white truncate text-sm" title={student.userName}>{student.userName}</div>
                        <div className="text-[10px] font-medium text-slate-500 uppercase">
                          {student.isSubmitted ? `Điểm: ${student.score}/10` : `Đang xem câu: ${student.currentQuestion + 1}`}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <span>Tiến độ</span>
                        <span className={student.isSubmitted ? 'text-green-600' : isCheater ? 'text-red-600' : 'text-blue-600'}>{student.answered}/{totalQuestions}</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-500 ${student.isSubmitted ? 'bg-green-500' : isCheater ? 'bg-red-500' : 'bg-[#0052cc]'}`} style={{ width: `${progressPct}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: BẢNG LOG BÁO CÁO GIAN LẬN */}
        <div className="w-[320px] lg:w-[380px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 shadow-[-10px_0_20px_rgba(0,0,0,0.02)] z-10">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
            <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider">
              <ShieldAlert size={16} className="text-red-500"/> NHẬT KÝ HOẠT ĐỘNG
            </h3>
            <span className="bg-red-100 text-red-700 font-bold text-[10px] px-2 py-1 rounded-md">{logs.length} Cảnh báo</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-50/50 dark:bg-slate-950/50">
            {logs.length === 0 ? (
              <div className="text-center text-slate-400 text-xs font-medium py-10">
                Phòng thi đang ổn định.<br/>Chưa có vi phạm nào.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border-l-4 border-red-500 shadow-sm text-sm animate-in slide-in-from-right-4 fade-in">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-slate-800 dark:text-white truncate max-w-[180px]">{log.userName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{log.time}</span>
                  </div>
                  <div className="text-red-600 dark:text-red-400 font-medium text-xs leading-relaxed flex items-start gap-1.5 mt-1">
                    <AlertTriangle size={12} className="shrink-0 mt-0.5" /> {log.type}
                  </div>
                </div>
              ))
            )}
            {/* Thẻ cắm cờ để Auto-scroll xuống cuối */}
            <div ref={logsEndRef} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default LiveMonitor;