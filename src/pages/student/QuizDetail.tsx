import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Clock, ListChecks, PlayCircle, Trophy, 
  History, Medal, Target, Loader2, Calendar 
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { examService } from '../../services/examService';

const QuizDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAppStore();

  const [exam, setExam] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id || !currentUser?.id) return;
      setIsLoading(true);
      
      // Gọi API song song 
      const [examData, historyData, leaderboardData] = await Promise.all([
        examService.getExamById(id),
        examService.getExamHistory(id, currentUser.id),
        examService.getExamLeaderboard(id)
      ]);

      setExam(examData);
      setHistory(historyData);
      setLeaderboard(leaderboardData);
      setIsLoading(false);
    };

    fetchData();
  }, [id, currentUser]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-slate-950">
        <Loader2 size={48} className="animate-spin mb-4" />
        <p className="font-bold">Đang tải thông tin đề thi...</p>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] text-slate-500 bg-slate-50 dark:bg-slate-950">
        <Target size={64} className="mb-6 opacity-30" />
        <p className="font-bold text-xl mb-2 text-slate-800 dark:text-white">Không tìm thấy đề thi</p>
        <p className="text-sm">Đề thi này có thể không tồn tại hoặc đã bị giáo viên thu hồi.</p>
        <Link to="/quiz" className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-md">
          Quay lại kho đề
        </Link>
      </div>
    );
  }

  // Parse tags an toàn
  const tags = Array.isArray(exam.tags) ? exam.tags : (typeof exam.tags === 'string' ? JSON.parse(exam.tags) : []);
  const questionCount = exam.exam_questions?.length || 0;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full relative animate-in fade-in overflow-hidden font-sans bg-slate-50 dark:bg-[#0B0F19]">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 pb-32">
        <div className="max-w-6xl mx-auto w-full">
          
          {/* Nút Quay Lại */}
          <div className="mb-6 shrink-0">
            <Link to="/quiz" className="inline-flex items-center gap-2 text-slate-500 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 font-bold text-sm transition-colors">
              <ArrowLeft size={16} /> Danh sách đề
            </Link>
          </div>
          
          {/* BANNER THÔNG TIN ĐỀ THI */}
          <div className="bg-white dark:bg-[#111827] p-8 md:p-10 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm mb-8 relative overflow-hidden group">
            {/* Background Blur Tráng Trí */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-blue-500 to-indigo-500 opacity-[0.08] rounded-full blur-[80px] translate-x-1/3 -translate-y-1/4 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col lg:flex-row gap-10 justify-between items-start lg:items-center">
              <div className="flex-1 max-w-3xl">
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <span className="px-4 py-1.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-orange-500/20">
                    {exam.type || 'Luyện tập'}
                  </span>
                  {tags.map((tag: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-sm">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-6 leading-tight tracking-tight">
                  {exam.title}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-[15px] leading-relaxed mb-8 max-w-2xl">
                  Đề thi được biên soạn chuẩn cấu trúc Bộ GD&ĐT 2025. Hãy chuẩn bị giấy nháp, bút và một không gian yên tĩnh trước khi bắt đầu bài làm để đạt kết quả tốt nhất.
                </p>
                
                <div className="flex flex-wrap gap-4 text-sm font-bold text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <ListChecks className="text-blue-500" size={18}/> 
                    <span>{questionCount} câu hỏi</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <Clock className="text-orange-500" size={18}/> 
                    <span>{Math.floor(exam.time_limit / 60)} phút</span>
                  </div>
                </div>
              </div>

              {/* CARD PLAY BUTTON */}
              <div className="w-full lg:w-[320px] shrink-0 bg-blue-50/50 dark:bg-blue-900/10 p-8 rounded-[32px] border border-blue-100 dark:border-blue-800/50 flex flex-col items-center justify-center gap-6 shadow-inner">
                <div className="text-center">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Trạng thái</div>
                  <div className="text-xl font-black text-blue-600 dark:text-blue-400 flex items-center justify-center gap-2">
                    <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span></span>
                    Sẵn sàng làm bài
                  </div>
                </div>
                <button 
                  onClick={() => navigate(`/quiz/${exam.id}/take`)}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                >
                  <PlayCircle size={26} strokeWidth={2.5}/> VÀO PHÒNG THI
                </button>
              </div>
            </div>
          </div>

          {/* SPLIT LAYOUT: HISTORY & LEADERBOARD */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* CỘT TRÁI: LỊCH SỬ LÀM BÀI */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="flex items-center gap-3 text-slate-900 dark:text-white font-black text-xl md:text-2xl px-2">
                <History className="text-blue-500" size={28} /> Lịch sử làm bài
              </div>

              {history.length === 0 ? (
                <div className="bg-white dark:bg-[#111827] p-12 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm text-center flex flex-col items-center justify-center text-slate-500 h-[300px]">
                  <History size={64} className="mb-6 opacity-20" strokeWidth={1.5} />
                  <p className="font-bold text-lg text-slate-600 dark:text-slate-300 mb-2">Chưa có dữ liệu</p>
                  <p className="text-sm font-medium">Bạn chưa thực hiện đề thi này lần nào.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((hist, index) => {
                    const date = new Date(hist.created_at).toLocaleString('vi-VN');
                    const timeSpentMins = Math.floor(hist.time_spent / 60);
                    const timeSpentSecs = hist.time_spent % 60;
                    
                    return (
                      <div key={hist.id} className="bg-white dark:bg-[#111827] p-6 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 hover:shadow-md transition-shadow group">
                        <div className="flex items-center gap-5">
                          <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 group-hover:scale-105 transition-transform">
                            L{history.length - index}
                          </div>
                          <div>
                            <div className="font-black text-slate-800 dark:text-white text-lg mb-1">Lần làm thứ {history.length - index}</div>
                            <div className="text-sm font-medium text-slate-500 flex flex-wrap items-center gap-3">
                              <span><Calendar size={14} className="inline mr-1 -mt-0.5"/>{date}</span> 
                              <span className="hidden sm:inline text-slate-300">•</span>
                              <span><Clock size={14} className="inline mr-1 -mt-0.5"/>{timeSpentMins} phút {timeSpentSecs} giây</span>
                            </div>
                          </div>
                        </div>
                        <div className="w-full sm:w-auto bg-slate-50 dark:bg-slate-900/50 px-6 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 text-right shrink-0">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng điểm</div>
                          <div className="text-3xl font-black text-emerald-500 dark:text-emerald-400">{hist.score}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* CỘT PHẢI: BẢNG XẾP HẠNG TOP 5 */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3 text-slate-900 dark:text-white font-black text-xl md:text-2xl px-2">
                <Trophy className="text-orange-500" size={28} /> Bảng Vàng (Top 5)
              </div>

              <div className="bg-white dark:bg-[#111827] p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3 min-h-[300px]">
                {leaderboard.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 opacity-60">
                     <Trophy size={48} className="mb-4 opacity-50"/>
                     <p className="text-sm font-bold text-center">Chưa có ai hoàn thành đề này. Hãy là người đầu tiên!</p>
                  </div>
                ) : (
                  leaderboard.map((rank, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                      
                      {/* Xếp hạng */}
                      <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center font-black text-sm shrink-0 shadow-sm ${
                        idx === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900 border border-yellow-200' :
                        idx === 1 ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800 border border-slate-300' :
                        idx === 2 ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-amber-50 border border-amber-600' : 
                        'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                      }`}>
                        {idx === 0 ? <Medal size={20}/> : `#${idx + 1}`}
                      </div>
                      
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 shrink-0 overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm flex items-center justify-center font-black text-sm">
                        {rank.users?.avatar_url ? (
                          <img src={rank.users.avatar_url} alt="Ava" className="w-full h-full object-cover" />
                        ) : (
                          rank.users?.full_name?.charAt(0) || 'U'
                        )}
                      </div>

                      {/* Thông tin */}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-slate-800 dark:text-white truncate mb-0.5">{rank.users?.full_name || 'Học sinh ẩn danh'}</div>
                        <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                          <Clock size={12}/> {Math.floor(rank.time_spent / 60)}p {rank.time_spent % 60}s
                        </div>
                      </div>

                      {/* Điểm số */}
                      <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-black text-lg px-3 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-800/50 shrink-0">
                        {rank.score}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default QuizDetail;