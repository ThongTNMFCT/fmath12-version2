import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { 
  Calculator, Atom, Beaker, Dna, Laptop, 
  BrainCircuit, PlayCircle, ArrowRight, 
  Zap, Flame, Target, ChevronRight, Activity, BookOpen, ShieldCheck,
  Loader2, Trophy
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../../services/courseService';

const Overview = () => {
  const { currentUser } = useAppStore();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');
  
  const [chapters, setChapters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Chào buổi sáng');
    else if (hour < 18) setGreeting('Chào buổi chiều');
    else setGreeting('Chào buổi tối');
  }, []);

  useEffect(() => {
    const fetchProgress = async () => {
      setIsLoading(true);
      const data = await courseService.getCurriculum(currentUser.id);
      setChapters(data);
      setIsLoading(false);
    };
    if (currentUser?.id) fetchProgress();
  }, [currentUser.id]);

  // Cập nhật mảng subjects thêm brandName
  const subjects = [
    { id: 'math', brandName: 'F-Math', name: 'Toán Học', icon: <Calculator size={24}/>, color: 'text-blue-500', bg: 'bg-blue-50', border: 'hover:border-blue-500', progress: 75 },
    { id: 'physics', brandName: 'F-Physics', name: 'Vật Lý', icon: <Atom size={24}/>, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'hover:border-indigo-500', progress: 45 },
    { id: 'chemistry', brandName: 'F-Chem', name: 'Hóa Học', icon: <Beaker size={24}/>, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'hover:border-emerald-500', progress: 30 },
    { id: 'biology', brandName: 'F-Bio', name: 'Sinh Học', icon: <Dna size={24}/>, color: 'text-rose-500', bg: 'bg-rose-50', border: 'hover:border-rose-500', progress: 15 },
    { id: 'it', brandName: 'F-IT', name: 'Tin Học', icon: <Laptop size={24}/>, color: 'text-purple-500', bg: 'bg-purple-50', border: 'hover:border-purple-500', progress: 90 },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full bg-[#F8FAFC] dark:bg-[#0B0F19] overflow-hidden transition-colors duration-300">
      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-32 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* HERO BANNER */}
          <div className="relative rounded-[32px] md:rounded-[40px] bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-500 overflow-hidden shadow-lg shadow-indigo-500/20">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
            
            <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left flex-1">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
                  {greeting}, {currentUser.name?.split(' ').pop()}! 🚀
                </h1>
                <p className="text-indigo-100 font-medium text-base md:text-lg max-w-xl leading-relaxed">
                  Hôm nay là một ngày tuyệt vời để học tập. Hãy hoàn thành 1 bài tập để gia tăng chuỗi <strong className="text-yellow-300">Streak</strong> ngay nhé! 🔥
                </p>
              </div>

              <div className="flex gap-4 shrink-0">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-4 rounded-[24px] text-center min-w-[120px]">
                   <div className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-1">Cấp độ</div>
                   <div className="text-4xl font-black text-white">{currentUser.level || 1}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-4 rounded-[24px] text-center min-w-[140px]">
                   <div className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-1">Kinh nghiệm</div>
                   <div className="text-4xl font-black text-yellow-300 flex items-center justify-center gap-1">
                     {currentUser.xp?.toLocaleString() || 0} <span className="text-sm">XP</span>
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* MÔN HỌC (F-MATH, F-PHYSICS, ...) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                Lộ trình Khối môn học
              </h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
              {subjects.map((sub) => (
                <div 
                  key={sub.id} 
                  onClick={() => navigate(`/theory?subject=${sub.id}`)}
                  className={`group bg-white dark:bg-[#111827] border-2 border-transparent ${sub.border} rounded-[28px] p-6 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1`}
                >
                  <div className={`w-14 h-14 rounded-[20px] ${sub.bg} ${sub.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 dark:bg-opacity-10`}>
                    {sub.icon}
                  </div>
                  <h3 className="font-black text-slate-800 dark:text-white text-xl mb-0.5">{sub.brandName}</h3>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">by F-Prep</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span>Tiến độ</span>
                      <span className={sub.color}>{sub.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${sub.color.replace('text-', 'bg-')} rounded-full transition-all duration-1000`} style={{ width: `${sub.progress}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              <div className="bg-white dark:bg-[#111827] rounded-[32px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-black text-slate-800 dark:text-white text-xl flex items-center gap-2">
                    <Target className="text-blue-500" size={24} /> Tiến độ học tập
                  </h3>
                  <button onClick={() => navigate('/theory')} className="text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl flex items-center gap-1 transition-all">
                    Xem lộ trình <ArrowRight size={16}/>
                  </button>
                </div>
                
                {isLoading ? (
                  <div className="h-40 flex flex-col items-center justify-center text-blue-500"><Loader2 className="animate-spin mb-2" size={32}/> Đang đồng bộ...</div>
                ) : chapters.length === 0 ? (
                  <div className="h-40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 dark:bg-slate-800/50">
                    <p className="font-medium text-sm">Chưa có dữ liệu bài giảng. Hãy liên hệ Giáo viên của bạn.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {chapters.slice(0, 4).map((chap, idx) => {
                      const totalLessons = chap.lessons?.length || 0;
                      const completedLessons = chap.lessons?.filter((l:any) => l.isCompleted).length || 0;
                      const progress = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);
                      
                      return (
                        <div key={chap.id} className="group">
                          <div className="flex justify-between text-sm font-bold mb-2">
                            <span className="text-slate-700 dark:text-slate-300 truncate pr-4 group-hover:text-blue-600 transition-colors uppercase tracking-wide">{chap.title}</span>
                            <span className="text-blue-500">{progress}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out" style={{width: `${progress}%`}}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-slate-900 rounded-[32px] p-8 md:p-10 border border-slate-800 relative overflow-hidden group shadow-xl">
                <ShieldCheck size={200} className="absolute -right-10 -bottom-10 text-white/5 group-hover:scale-110 transition-transform duration-700 pointer-events-none -rotate-12" />
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                    <Activity size={12} className="animate-pulse" /> Live Platform
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-white mb-3">Phòng thi ảo FEP</h2>
                  <p className="text-slate-400 font-medium max-w-sm mb-8 text-sm leading-relaxed">
                    Trải nghiệm thi thử chuẩn Quốc gia với hệ thống giám sát AI 360°, chống gian lận tuyệt đối dành cho học sinh FPT.
                  </p>
                  <button onClick={() => navigate('/join-live')} className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-8 py-3.5 rounded-2xl flex items-center gap-3 shadow-lg hover:-translate-y-1 transition-all w-fit">
                    VÀO PHÒNG THI <PlayCircle size={20}/>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 md:p-8 shadow-sm flex-1">
                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2 tracking-tight">
                  <BrainCircuit className="text-purple-600" size={24} /> F-Prep AI Gợi ý
                </h3>
                <div className="space-y-4">
                  <div className="bg-purple-50 dark:bg-purple-900/10 p-5 rounded-[20px] border border-purple-100 dark:border-purple-800/50">
                    <div className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-2">Phân tích học lực</div>
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-medium">
                      {currentUser.xp && currentUser.xp > 0 
                        ? "Phong độ của bạn đang rất ổn định! Hãy thử sức với các đề thi ĐGNL để làm quen với áp lực phòng thi nhé."
                        : "Chào mừng tân binh! Hãy bắt đầu hành trình bằng việc hoàn thành bài Lý thuyết đầu tiên."}
                    </p>
                  </div>
                  
                  <div className="bg-orange-50 dark:bg-orange-900/10 p-5 rounded-[20px] border border-orange-100 dark:border-orange-800/50 relative overflow-hidden group/item">
                    <div className="relative z-10">
                      <div className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2">Thử thách ngày</div>
                      <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-medium">
                        Hoàn thành 1 bài tập trắc nghiệm bất kỳ hôm nay để nhận <strong>+50 XP</strong> thưởng Streak!
                      </p>
                    </div>
                    <Flame size={40} className="absolute -bottom-2 -right-2 text-orange-500/10 group-hover/item:scale-125 transition-transform" />
                  </div>
                </div>
                <button onClick={() => navigate('/quiz')} className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex justify-center items-center gap-2">
                  Luyện đề ngay <ArrowRight size={18}/>
                </button>
              </div>
              
              <div 
                onClick={() => navigate('/leaderboard')}
                className="bg-gradient-to-br from-amber-500 to-orange-500 p-8 rounded-[32px] text-white shadow-lg shadow-orange-500/20 flex items-center justify-between group cursor-pointer overflow-hidden relative"
              >
                <div className="relative z-10">
                  <div className="text-2xl font-black mb-1">Bảng Vàng</div>
                  <div className="text-xs font-bold opacity-90 uppercase tracking-widest">Đấu trường trí tuệ</div>
                </div>
                <Trophy size={48} className="relative z-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500 drop-shadow-md" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-md pointer-events-none"></div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;