// CHECK CODE MỚI/src/pages/student/QuizList.tsx
import React, { useState, useEffect } from 'react';
import { 
  PlayCircle, Clock, Users, BookOpen, GraduationCap, 
  Folder, ChevronDown, ChevronRight, Loader2, Target, 
  CheckCircle2, ListChecks, Calculator, Atom, Beaker, Dna, Laptop, Sparkles
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { examService } from '../../services/examService';

// CẤU HÌNH MÀU SẮC THANH LỊCH
const SUBJECT_CONFIG: Record<string, any> = {
  math: { id: 'math', name: 'Toán Học', icon: <Calculator size={18}/>, bg: 'bg-blue-50', text: 'text-blue-600', primaryBtn: 'bg-blue-600 hover:bg-blue-700 text-white', border: 'border-blue-200' },
  physics: { id: 'physics', name: 'Vật Lý', icon: <Atom size={18}/>, bg: 'bg-indigo-50', text: 'text-indigo-600', primaryBtn: 'bg-indigo-600 hover:bg-indigo-700 text-white', border: 'border-indigo-200' },
  chemistry: { id: 'chemistry', name: 'Hóa Học', icon: <Beaker size={18}/>, bg: 'bg-emerald-50', text: 'text-emerald-600', primaryBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white', border: 'border-emerald-200' },
  biology: { id: 'biology', name: 'Sinh Học', icon: <Dna size={18}/>, bg: 'bg-rose-50', text: 'text-rose-600', primaryBtn: 'bg-rose-600 hover:bg-rose-700 text-white', border: 'border-rose-200' },
  it: { id: 'it', name: 'Tin Học', icon: <Laptop size={18}/>, bg: 'bg-purple-50', text: 'text-purple-600', primaryBtn: 'bg-purple-600 hover:bg-purple-700 text-white', border: 'border-purple-200' },
};

const TABS = ['Đề luyện thi', 'ĐGNL', 'VSAT', 'Chuyên đề'];

// Thẻ Badge thiết kế nhạt (Pastel) cho thanh thoát
const getCardBadgeTheme = (type: string) => {
  switch(type) {
    case 'VSAT': return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'ĐGNL': return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'Chuyên đề': return 'bg-orange-50 text-orange-700 border-orange-200';
    default: return 'bg-blue-50 text-blue-700 border-blue-200';
  }
};

const QuizList = () => {
  const { currentUser } = useAppStore();
  const location = useLocation();
  
  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('Đề luyện thi');
  const [activeSubject, setActiveSubject] = useState<string>('math');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchExams = async () => {
      if (!currentUser?.id) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const data = await examService.getActiveExams(currentUser.id);
        setExams(data || []);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách đề thi:", error);
      } finally {
        setIsLoading(false);
      }

      if (location.state && (location.state as any).activeTab) {
        setActiveTab((location.state as any).activeTab);
      }
    };
    
    fetchExams();
  }, [currentUser?.id, location.key]); // <--- CHỈ THEO DÕI ID ĐỂ CHỐNG LỖI ERR_CONNECTION_CLOSED DO SPAM API

  const activeTheme = SUBJECT_CONFIG[activeSubject] || SUBJECT_CONFIG['math'];

  const filteredExams = exams.filter(exam => {
    const isSubjectMatch = (exam.subject_id === activeSubject) || (!exam.subject_id && activeSubject === 'math');
    return exam.type === activeTab && isSubjectMatch;
  });

  const groupedExams = filteredExams.reduce((acc, exam) => {
    const group = exam.group_name?.trim() || 'Khác (Chưa phân nhóm)';
    if (!acc[group]) acc[group] = [];
    acc[group].push(exam);
    return acc;
  }, {} as Record<string, any[]>);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupName]: prev[groupName] === false ? true : false }));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full relative animate-in fade-in overflow-hidden bg-slate-50 dark:bg-[#0B1120] font-sans">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 pb-32">
        <div className="max-w-6xl mx-auto w-full">
          
          {/* HEADER SECTION */}
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-3 tracking-tight flex items-center gap-3">
                <Target className={activeTheme.text} size={32}/> Phòng Luyện Đề
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                Thử sức với các bộ đề thi chuẩn cấu trúc mới nhất, bứt phá điểm 9+.
              </p>
            </div>
          </div>

          {/* MÔN HỌC (SUBJECT SWITCHER) */}
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-4 mb-6">
            {Object.values(SUBJECT_CONFIG).map((subject: any) => (
              <button
                key={subject.id}
                onClick={() => setActiveSubject(subject.id)}
                className={`shrink-0 px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 border ${
                  activeSubject === subject.id
                    ? `${subject.bg} ${subject.border} ${subject.text} shadow-sm`
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {subject.icon} {subject.name}
              </button>
            ))}
          </div>

          {/* PHÂN LOẠI ĐỀ (TYPE TABS) */}
          <div className="flex items-center gap-3 overflow-x-auto custom-scrollbar pb-4 mb-8 border-b border-slate-200 dark:border-slate-800">
            {TABS.map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 px-2 py-3 font-bold text-sm transition-all flex items-center justify-center gap-2 border-b-2 ${
                  activeTab === tab 
                    ? `border-slate-800 text-slate-800 dark:border-white dark:text-white` 
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {tab === 'Đề luyện thi' ? <Target size={16} /> : <BookOpen size={16} />}{tab}
              </button>
            ))}
          </div>

          {/* DANH SÁCH ĐỀ THI */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-blue-600">
              <Loader2 className="animate-spin mb-4" size={40}/>
              <p className="font-bold text-sm">Đang tải danh sách đề...</p>
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="text-center py-20 text-slate-400 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl bg-white/50 dark:bg-slate-900/50">
              <Target size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg font-bold text-slate-600 dark:text-slate-300">Chưa có đề thi nào.</p>
              <p className="text-sm mt-1">Hệ thống chưa có {activeTab} cho môn học này.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedExams).map(([groupName, groupExams]) => {
                const isExpanded = expandedGroups[groupName] !== false;
                
                return (
                  <div key={groupName} className="bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm">
                    {/* FOLDER HEADER */}
                    <div 
                      onClick={() => toggleGroup(groupName)}
                      className="flex items-center justify-between cursor-pointer pb-4 border-b border-slate-100 dark:border-slate-700/50 hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl ${activeTheme.bg} flex items-center justify-center ${activeTheme.text}`}>
                          <Folder size={20} />
                        </div>
                        <div>
                          <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white leading-tight mb-1">
                            {groupName}
                          </h3>
                          <span className="text-xs font-semibold text-slate-500">{groupExams.length} đề thi</span>
                        </div>
                      </div>
                      {isExpanded ? <ChevronDown className="text-slate-400"/> : <ChevronRight className="text-slate-400"/>}
                    </div>

                    {/* QUIZ GRID */}
                    {isExpanded && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                        {groupExams.map(exam => {
                          const badgeClass = getCardBadgeTheme(exam.type);
                          
                          return (
                            <div key={exam.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col p-5 group hover:-translate-y-1">
                              
                              {/* BADGES */}
                              <div className="flex justify-between items-center mb-4">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase border ${badgeClass}`}>
                                  {exam.type}
                                </span>
                                
                                {exam.myAttemptCount > 0 && (
                                  <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-md text-[10px] font-bold">
                                    <CheckCircle2 size={12}/> Đã làm ({exam.myAttemptCount})
                                  </div>
                                )}
                              </div>
                              
                              {/* TITLE */}
                              <h3 className="text-[17px] font-bold text-slate-800 dark:text-white mb-2 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors h-12">
                                {exam.title}
                              </h3>
                              
                              {/* LƯỢT THI */}
                              <div className="text-xs text-slate-400 font-medium mb-5 flex items-center gap-1.5">
                                <Users size={14}/> {exam.participants || 0} lượt tham gia
                              </div>

                              {/* GỘP THÔNG TIN (SỐ CÂU & THỜI GIAN) */}
                              <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 font-medium mt-auto mb-5 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-1.5">
                                  <ListChecks size={16} className={activeTheme.text}/> {exam.questionsCount || 40} câu
                                </div>
                                <div className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
                                <div className="flex items-center gap-1.5">
                                  <Clock size={16} className="text-orange-500"/> {Math.floor(exam.time_limit/60)} phút
                                </div>
                              </div>

                              {/* HÀNH ĐỘNG */}
                              <div className="flex items-stretch gap-3">
                                <Link 
                                  to={`/quiz/${exam.id}`} 
                                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${activeTheme.primaryBtn}`}
                                >
                                  <PlayCircle size={18} /> {exam.myAttemptCount > 0 ? 'Làm lại' : 'Bắt đầu'}
                                </Link>
                                
                                {exam.myAttemptCount > 0 && (
                                  <div className="px-4 bg-emerald-50 border border-emerald-100 dark:bg-slate-800 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center min-w-[70px]">
                                    <span className="text-[9px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase">Điểm</span>
                                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{exam.myHighestScore || 0}</span>
                                  </div>
                                )}
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizList;