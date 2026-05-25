import React from 'react';
import { ArrowLeft, LayoutList, ChevronDown, ChevronRight, Lock, CheckCircle2, PlayCircle, FileText, Target, Loader2 } from 'lucide-react';

interface Props {
  activeTheme: any;
  chapters: any[];
  isLoading: boolean;
  expandedChapterId: string | number | null;
  setExpandedChapterId: (id: any) => void;
  onSelectLesson: (lesson: any) => void;
  onBack: () => void;
}

export const TheoryCurriculum: React.FC<Props> = ({ activeTheme, chapters, isLoading, expandedChapterId, setExpandedChapterId, onSelectLesson, onBack }) => {
  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full bg-[#F8FAFC] dark:bg-[#0B0F19] overflow-hidden">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-6 py-4 shrink-0 flex items-center gap-4 z-10 shadow-sm">
        <button onClick={onBack} className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Lộ trình Khóa học</div>
          <h2 className={`text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r ${activeTheme.gradient}`}>{activeTheme.name}</h2>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
         <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4">
            
            <div className={`bg-gradient-to-r ${activeTheme.gradient} rounded-[32px] p-8 md:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden`}>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
              <div className="relative z-10 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-black mb-2">Chinh phục {activeTheme.name}</h1>
                <p className="font-medium text-white/80 max-w-md">Lộ trình bám sát kiến thức trọng tâm, giúp bạn đạt điểm tối đa trong các kỳ thi sắp tới.</p>
              </div>
              <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-[24px] text-center min-w-[140px] shadow-lg">
                 <div className="text-white/80 text-xs font-bold uppercase tracking-widest mb-1">Chương Trình</div>
                 <div className="text-3xl font-black">{chapters.length} <span className="text-sm font-medium">Chương</span></div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-indigo-500"><Loader2 className="animate-spin mb-4" size={40}/><p className="font-bold">Đang biên dịch lộ trình học...</p></div>
            ) : chapters.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[32px] text-slate-500 bg-white/50 dark:bg-slate-900/50">
                <LayoutList size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-bold text-lg">Giáo viên chưa tải lên nội dung cho môn này.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {chapters.map((chapter, idx) => {
                  const isExpanded = expandedChapterId === chapter.id;
                  const lessons = chapter.lessons || [];
                  const completedLessons = lessons.filter((l:any) => l.isCompleted).length;
                  const progress = lessons.length === 0 ? 0 : Math.round((completedLessons / lessons.length) * 100);

                  return (
                    <div key={chapter.id} className="bg-white dark:bg-[#111827] rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      <button onClick={() => setExpandedChapterId(isExpanded ? null : chapter.id)} className="w-full flex items-center justify-between p-6 md:p-8 bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                         <div className="text-left flex-1 pr-6">
                           <div className={`text-[11px] font-black uppercase tracking-[0.2em] mb-2 ${activeTheme.text}`}>Chương {idx + 1}</div>
                           <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white leading-tight">{chapter.title}</h3>
                         </div>
                         <div className="flex items-center gap-6 shrink-0">
                           <div className="hidden sm:block text-right">
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tiến độ ({progress}%)</div>
                              <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className={`h-full bg-gradient-to-r ${activeTheme.gradient} rounded-full`} style={{width: `${progress}%`}}></div>
                              </div>
                           </div>
                           <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                              {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                           </div>
                         </div>
                      </button>
                      
                      {isExpanded && (
                        <div className="border-t border-slate-100 dark:border-slate-800/50 bg-white dark:bg-[#111827]">
                          {lessons.map((lesson: any, lIdx: number) => {
                             const isLocked = lIdx > 0 && !chapter.lessons[lIdx - 1].isCompleted && !lesson.isCompleted;
                             return (
                               <div 
                                 key={lesson.id} 
                                 onClick={() => { if(!isLocked) onSelectLesson(lesson); }}
                                 className={`flex items-center gap-5 p-5 md:px-8 border-b border-slate-50 dark:border-slate-800/50 last:border-0 transition-all ${isLocked ? 'opacity-50 bg-slate-50/30 dark:bg-slate-900/30 cursor-not-allowed' : 'hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer group'}`}
                               >
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform ${lesson.isCompleted ? 'bg-emerald-100 text-emerald-600' : isLocked ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : `${activeTheme.bg}/10 ${activeTheme.text} group-hover:scale-110`}`}>
                                    {isLocked ? <Lock size={20}/> : lesson.isCompleted ? <CheckCircle2 size={24}/> : <PlayCircle size={24}/>}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-base text-slate-800 dark:text-white truncate">{lIdx + 1}. {lesson.title}</h4>
                                    <div className="text-xs text-slate-500 font-medium mt-1.5 flex items-center gap-3">
                                      <span className="flex items-center gap-1.5"><FileText size={14}/> Lý thuyết</span>
                                      <span className="flex items-center gap-1.5"><Target size={14}/> {lesson.exercises?.length || 0} Bài tập</span>
                                    </div>
                                  </div>
                                  {!isLocked && !lesson.isCompleted && (
                                    <div className="shrink-0 text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">Vào học ngay &rarr;</div>
                                  )}
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