import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, BrainCircuit, BookOpen, Target, Loader2, Sparkles, CheckCircle, 
  PlayCircle, FileText, CheckCircle2, XCircle, Flame, Trophy, X, Send, Lightbulb, ArrowRight, Check 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import { useAppStore } from '../../store/useAppStore';
import { supabase } from '../../config/supabase';
import { courseService } from '../../services/courseService';
import { askGroqAI } from '../../services/groqAI';
import { getQuestionType, parseTFAnswer, isMcqCorrect, isSaqCorrect } from './theoryUtils';

interface Props {
  activeLesson: any;
  setActiveLesson: (lesson: any) => void;
  activeTheme: any;
  onBack: () => void;
  setChapters: React.Dispatch<React.SetStateAction<any[]>>;
}

const MarkdownComponents = {
  img: ({ node, ...props }: any) => <img {...props} className="max-w-full h-auto rounded-xl shadow-md my-6 mx-auto border border-slate-200 dark:border-slate-700 block" alt="Hình minh họa" loading="lazy" />,
  a: ({ node, ...props }: any) => <a {...props} className="text-blue-600 hover:underline font-medium" target="_blank" rel="noreferrer" />
};

export const TheoryStudyRoom: React.FC<Props> = ({ activeLesson, setActiveLesson, activeTheme, onBack, setChapters }) => {
  const { currentUser, setUser } = useAppStore();
  const [activeTab, setActiveTab] = useState<'theory' | 'practice'>('theory');
  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submittedQuestions, setSubmittedQuestions] = useState<Record<string, boolean>>({});
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  
  // AI States
  const [aiChatHistory, setAiChatHistory] = useState<{role: string, content: string}[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null); 
  const contentScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initAI = async () => {
      setIsAiTyping(true); setAiChatHistory([]);
      try {
        const sysPrompt = `Bạn là F-Prep AI. Học sinh: ${currentUser.name}. Bài: "${activeLesson.title}". Viết 1 đoạn (2 câu) chào ${currentUser.name}, tóm tắt NHANH trọng tâm bài này. Dùng emoji.`;
        const greeting = await askGroqAI(sysPrompt, `Hãy chào và tóm tắt bài học "${activeLesson.title}".`);
        setAiChatHistory([{ role: 'ai', content: greeting }]);
      } catch (e) {
        setAiChatHistory([{ role: 'ai', content: `Chào ${currentUser.name}, thầy là F-Prep AI. Đọc lý thuyết có chỗ nào không hiểu thì cứ hỏi thầy nhé!` }]);
      } finally { setIsAiTyping(false); }
    };
    initAI();
  }, [activeLesson.id]);

  useEffect(() => { if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [aiChatHistory, isAiTyping]);

  const handleSendAiMessage = async () => {
    if (!aiInput.trim() || isAiTyping) return;
    const userMsg = aiInput;
    setAiInput(""); setAiChatHistory(prev => [...prev, { role: 'user', content: userMsg }]); setIsAiTyping(true);

    try {
      const sysPrompt = `Bạn là F-Prep AI - Gia sư Toán học. Học sinh: ${currentUser.name}. Bài: "${activeLesson.title}". Giải đáp ngắn gọn. Dùng LaTeX $...$ hoặc $$...$$ cho công thức.`;
      const aiReply = await askGroqAI(sysPrompt, userMsg);
      setAiChatHistory(prev => [...prev, { role: 'ai', content: aiReply }]);
    } catch (e) {
      setAiChatHistory(prev => [...prev, { role: 'ai', content: "Xin lỗi em, đường truyền đang chậm. Em đợi chút rồi hỏi lại nhé!" }]);
    } finally { setIsAiTyping(false); }
  };

  const currentExercise = activeLesson?.exercises?.[currentExIndex];
  const qType = getQuestionType(currentExercise);

  const handleCheckAnswer = () => {
    const qId = currentExercise.id;
    const userAns = answers[qId];
    if (userAns == null || submittedQuestions[qId]) return;

    setSubmittedQuestions(prev => ({ ...prev, [qId]: true }));
    let isCorrect = false;
    
    if (qType === 'tf') {
      let cCount = 0;
      const parsedCorrect = parseTFAnswer(currentExercise.correct_answer);
      currentExercise.options?.forEach((opt: any, idx: number) => {
        const optId = String(opt.id || ['a', 'b', 'c', 'd'][idx] || idx).toLowerCase().trim();
        if (userAns[optId] === parsedCorrect[optId]) cCount++;
      });
      isCorrect = cCount === (currentExercise.options?.length || 4);
    } 
    else if (qType === 'saq') isCorrect = isSaqCorrect(userAns, currentExercise.correct_answer);
    else isCorrect = isMcqCorrect(userAns, currentExercise.correct_answer);

    if (isCorrect && !activeLesson.isCompleted && currentUser.id) {
        const newXP = (currentUser.xp || 0) + 10;
        const newLevel = Math.floor(newXP / 100) + 1;
        supabase.from('users').update({ xp: newXP, level: newLevel }).eq('id', currentUser.id).select().single().then(({data}) => { if(data) setUser(data); });
    }
  };

  const handleCompleteLesson = () => {
    if (!currentUser?.id || activeLesson.isCompleted) return;
    courseService.markLessonCompleted(currentUser.id, activeLesson.id);
    const newXP = (currentUser.xp || 0) + 50;
    const newLevel = Math.floor(newXP / 100) + 1;
    supabase.from('users').update({ xp: newXP, level: newLevel, streak: (currentUser.streak || 0) + 1 }).eq('id', currentUser.id).select().single().then(({data}) => { if(data) setUser(data); });
    setChapters(prevChaps => prevChaps.map(c => ({...c, lessons: c.lessons.map((l: any) => l.id === activeLesson.id ? { ...l, isCompleted: true } : l)})));
    setActiveLesson((prev: any) => ({ ...prev, isCompleted: true }));
    setShowRewardModal(true);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full bg-[#F8FAFC] dark:bg-[#0B0F19] overflow-hidden relative">
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/80 px-4 md:px-8 pt-4 pb-0 shrink-0 z-20 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button onClick={onBack} className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors shrink-0">
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${activeTheme.text}`}>Khóa học {activeTheme.name}</div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white truncate">{activeLesson?.title}</h2>
            </div>
          </div>
          
          <button onClick={() => setIsAiPanelOpen(!isAiPanelOpen)} className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all ${isAiPanelOpen ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 shadow-none' : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:scale-105 animate-pulse'}`}>
            <BrainCircuit size={18} /><span className="hidden sm:inline">{isAiPanelOpen ? 'Đóng AI' : 'F-Prep AI Tutor'}</span>
          </button>
        </div>

        <div className="flex gap-8">
          <button onClick={() => setActiveTab('theory')} className={`pb-3 font-bold text-sm uppercase tracking-wide flex items-center gap-2 border-b-4 transition-colors ${activeTab === 'theory' ? `${activeTheme.text} border-current` : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}><BookOpen size={16} /> Lý thuyết</button>
          <button onClick={() => setActiveTab('practice')} className={`pb-3 font-bold text-sm uppercase tracking-wide flex items-center gap-2 border-b-4 transition-colors ${activeTab === 'practice' ? 'border-orange-500 text-orange-600 dark:border-orange-500 dark:text-orange-400' : 'border-transparent text-slate-500 hover:text-orange-500'}`}><Target size={16} /> Bài tập ({activeLesson?.exercises?.length || 0})</button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* MAIN CONTENT AREA */}
        <div ref={contentScrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar pb-32 scroll-smooth">
          <div className="max-w-4xl mx-auto">
            
            {activeTab === 'theory' && (
              <div className="bg-white dark:bg-[#111827] p-8 md:p-12 rounded-[32px] shadow-sm border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-4">
                <div className="markdown-body md:text-lg leading-loose font-medium text-slate-800 dark:text-slate-200 transform-gpu overflow-x-auto">
                   <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={MarkdownComponents}>
                     {activeLesson?.theory_content || "Giáo viên chưa cập nhật nội dung lý thuyết cho bài học này."}
                   </ReactMarkdown>
                </div>
                
                <div className="mt-16 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50 dark:bg-slate-800/30 p-6 rounded-3xl">
                  <div>
                    <h4 className="text-lg font-black text-slate-800 dark:text-white mb-1">Đã nắm vững lý thuyết?</h4>
                    <p className="text-slate-500 font-medium text-sm">{activeLesson?.exercises?.length > 0 ? `Chuyển sang làm bài tập vận dụng để nhận XP nhé!` : `Xác nhận hoàn thành bài học để nhận 50 XP nhé!`}</p>
                  </div>
                  {activeLesson?.exercises?.length > 0 ? (
                    <button onClick={() => setActiveTab('practice')} className={`w-full md:w-auto bg-gradient-to-r ${activeTheme.gradient} text-white font-bold py-3.5 px-8 rounded-xl shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2`}><ArrowRight size={20} /> Luyện tập ngay</button>
                  ) : (
                    <button onClick={handleCompleteLesson} disabled={activeLesson?.isCompleted} className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 px-8 rounded-xl shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"><CheckCircle2 size={20} /> {activeLesson?.isCompleted ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}</button>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'practice' && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                {(!activeLesson?.exercises || activeLesson.exercises.length === 0) ? (
                  <div className="text-center py-20 text-slate-500 bg-white/50 dark:bg-[#111827]/50 rounded-[32px] border-dashed border-2 border-slate-300 dark:border-slate-800"><Target size={48} className="mx-auto mb-4 opacity-30" /><p className="font-bold text-lg">Bài học này chưa có bài tập đính kèm.</p></div>
                ) : (
                  <div className="bg-white dark:bg-[#111827] p-6 md:p-10 rounded-[32px] shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-black px-4 py-2 rounded-xl text-sm tracking-wider uppercase">Câu hỏi {currentExIndex + 1} / {activeLesson.exercises.length}</span>
                      <span className="text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-lg border border-orange-100 dark:border-orange-800/50 flex items-center gap-1"><Flame size={14}/> +10 XP</span>
                    </div>

                    <div className="mb-8 markdown-body text-xl font-medium text-slate-800 dark:text-white transform-gpu overflow-x-auto">
                      <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={MarkdownComponents}>{currentExercise.content}</ReactMarkdown>
                    </div>

                    <div className="mb-8">
                      {qType === 'mcq' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {currentExercise.options.map((opt: any, idx: number) => {
                            const rawOptId = opt.id || ['A', 'B', 'C', 'D'][idx] || String(idx);
                            const optId = String(rawOptId).toLowerCase().trim();
                            
                            const isSubmitted = submittedQuestions[currentExercise.id];
                            const selectedOpt = String(answers[currentExercise.id] || '').toLowerCase().trim();
                            const isSelected = selectedOpt === optId;
                            const isCorrect = isMcqCorrect(optId, currentExercise.correct_answer);
                            
                            let optionClass = "border-slate-200 dark:border-slate-700 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300";
                            if (isSubmitted) {
                              if (isCorrect) optionClass = "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500";
                              else if (isSelected && !isCorrect) optionClass = "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 ring-2 ring-red-500";
                              else optionClass = "border-slate-200 dark:border-slate-700 opacity-50";
                            } else if (isSelected) {
                              optionClass = "border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 ring-2 ring-orange-500";
                            }

                            return (
                              <div key={optId} onClick={() => { if(!isSubmitted) setAnswers(prev => ({...prev, [currentExercise.id]: optId})) }} className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-3 cursor-pointer ${optionClass}`}>
                                <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${isSubmitted && isCorrect ? 'bg-emerald-500 text-white' : isSubmitted && isSelected && !isCorrect ? 'bg-red-500 text-white' : isSelected ? 'bg-orange-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{String(rawOptId).toUpperCase().trim()}</div>
                                <div className="markdown-body flex-1 mt-1 text-[15px] overflow-x-auto"><ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={MarkdownComponents}>{opt.text}</ReactMarkdown></div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {qType === 'tf' && (
                        <div className="flex flex-col gap-3">
                          {currentExercise.options.map((opt: any, idx: number) => {
                            const rawOptId = opt.id || ['a', 'b', 'c', 'd'][idx] || String(idx);
                            const optId = String(rawOptId).toLowerCase().trim();
                            
                            const isSubmitted = submittedQuestions[currentExercise.id];
                            const userVal = answers[currentExercise.id]?.[optId];
                            const parsedCorrect = parseTFAnswer(currentExercise.correct_answer);
                            const isCorrectVal = parsedCorrect[optId];
                            const isUserCorrect = userVal === isCorrectVal;

                            return (
                              <div key={optId} className={`p-4 rounded-2xl border-2 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${isSubmitted ? (isUserCorrect ? 'border-green-300 bg-green-50/50 dark:bg-green-900/10' : 'border-red-300 bg-red-50/50 dark:bg-red-900/10') : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                                <div className="flex items-start gap-3 flex-1 overflow-x-auto">
                                  <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm bg-slate-100 dark:bg-slate-700 text-slate-500">{rawOptId}</div>
                                  <div className="markdown-body mt-1"><ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={MarkdownComponents}>{opt.text}</ReactMarkdown></div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 self-end md:self-center bg-slate-50 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                                  <button disabled={isSubmitted} onClick={() => {
                                    if(!isSubmitted) setAnswers(prev => ({ ...prev, [currentExercise.id]: { ...(prev[currentExercise.id] || {}), [optId]: true } }));
                                  }} className={`px-5 py-2 rounded-lg font-bold text-sm transition-colors ${userVal === true ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>Đúng</button>
                                  <button disabled={isSubmitted} onClick={() => {
                                    if(!isSubmitted) setAnswers(prev => ({ ...prev, [currentExercise.id]: { ...(prev[currentExercise.id] || {}), [optId]: false } }));
                                  }} className={`px-5 py-2 rounded-lg font-bold text-sm transition-colors ${userVal === false ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>Sai</button>
                                </div>
                                {isSubmitted && <div className="shrink-0 flex items-center">
                                  {isUserCorrect ? <CheckCircle2 className="text-green-500" size={24}/> : <XCircle className="text-red-500" size={24}/>}
                                  {!isUserCorrect && <div className="text-xs font-bold text-red-500 bg-red-100 px-2 py-1 rounded ml-2">Đ.án: {isCorrectVal ? 'Đúng' : 'Sai'}</div>}
                                </div>}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {qType === 'saq' && (
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 md:p-8 rounded-[24px] border border-slate-200 dark:border-slate-700">
                          <label className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 block">Nhập đáp án (Dùng "." cho số thập phân)</label>
                          <input 
                            type="text" 
                            value={answers[currentExercise.id] || ""} 
                            onChange={(e) => {
                              if(!submittedQuestions[currentExercise.id]) setAnswers(prev => ({ ...prev, [currentExercise.id]: e.target.value }));
                            }} 
                            disabled={submittedQuestions[currentExercise.id]} 
                            className={`w-full max-w-sm px-6 py-4 rounded-xl font-bold text-2xl outline-none transition-all shadow-inner ${submittedQuestions[currentExercise.id] ? (isSaqCorrect(answers[currentExercise.id], currentExercise.correct_answer) ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500' : 'bg-red-100 text-red-700 border-2 border-red-500') : 'bg-white dark:bg-slate-900 border-2 border-indigo-200 focus:border-indigo-600 dark:text-white'}`} 
                            placeholder="VD: 12.5"
                          />
                        </div>
                      )}
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <div className="flex-1">
                        {submittedQuestions[currentExercise.id] && (
                          (qType === 'saq' ? isSaqCorrect(answers[currentExercise.id], currentExercise.correct_answer) : 
                           qType === 'tf' ? (function() {
                              let cCount = 0;
                              const parsedCorrect = parseTFAnswer(currentExercise.correct_answer);
                              currentExercise.options?.forEach((o:any, idx: number) => { 
                                const optId = String(o.id || ['a', 'b', 'c', 'd'][idx] || idx).toLowerCase().trim();
                                if(answers[currentExercise.id]?.[optId] === parsedCorrect[optId]) cCount++; 
                              });
                              return cCount === (currentExercise.options?.length || 4);
                           })() : isMcqCorrect(answers[currentExercise.id], currentExercise.correct_answer))
                          ? <div className="flex items-center gap-2 text-emerald-600 font-black animate-in slide-in-from-left-4"><CheckCircle2 size={24}/> Tuyệt vời! +10 XP</div> 
                          : <div className="flex items-center gap-2 text-red-500 font-black animate-in slide-in-from-left-4"><XCircle size={24}/> Rất tiếc, sai rồi!</div>
                        )}
                      </div>
                      <div className="shrink-0 flex gap-3">
                        {!submittedQuestions[currentExercise.id] ? (
                          <button disabled={!answers[currentExercise.id]} onClick={handleCheckAnswer} className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md">KIỂM TRA ĐÁP ÁN</button>
                        ) : (currentExIndex < activeLesson.exercises.length - 1 ? (
                          <button onClick={() => setCurrentExIndex(prev => prev + 1)} className="bg-slate-800 hover:bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-md flex items-center gap-2">Câu tiếp theo <ArrowRight size={18}/></button>
                        ) : (
                          <button onClick={handleCompleteLesson} disabled={activeLesson.isCompleted} className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50"><Check size={18}/> HOÀN THÀNH</button>
                        ))}
                      </div>
                    </div>

                    {submittedQuestions[currentExercise.id] && currentExercise.explanation && (
                      <div className="mt-8 bg-indigo-50 dark:bg-indigo-900/10 p-6 md:p-8 rounded-[24px] border border-indigo-200 dark:border-indigo-800/50 animate-in slide-in-from-bottom-4">
                        <div className="flex items-center gap-2 mb-4 text-indigo-600 dark:text-indigo-400 font-black text-sm uppercase tracking-wider"><Lightbulb size={20} /> Lời giải hệ thống</div>
                        <div className="markdown-body text-[15px] md:text-base text-slate-700 dark:text-slate-300 transform-gpu overflow-x-auto"><ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={MarkdownComponents}>{currentExercise.explanation}</ReactMarkdown></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* AI TUTOR PANEL */}
        {isAiPanelOpen && (
          <div className="w-full md:w-80 lg:w-[380px] shrink-0 bg-white dark:bg-[#111827] border-l border-slate-200 dark:border-slate-800 flex flex-col z-30 absolute right-0 md:relative h-full shadow-2xl md:shadow-none animate-in slide-in-from-right-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md text-white"><BrainCircuit size={20} /></div>
                <div><div className="font-black text-sm text-slate-800 dark:text-white uppercase tracking-wider">F-Prep AI Tutor</div><div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Luôn trực tuyến</div></div>
              </div>
              <button onClick={() => setIsAiPanelOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-5 bg-slate-50/50 dark:bg-transparent">
              {aiChatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                  {msg.role === 'ai' && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shrink-0 mr-3 mt-auto shadow-sm"><BrainCircuit size={14} /></div>}
                  <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white text-sm font-medium rounded-br-sm' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-sm border border-slate-200 dark:border-slate-700'}`}>
                    {msg.role === 'user' ? msg.content : <div className="markdown-body !text-sm [&_p]:!mb-2 [&_p:last-child]:!mb-0"><ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={MarkdownComponents}>{msg.content}</ReactMarkdown></div>}
                  </div>
                </div>
              ))}
              {isAiTyping && (
                <div className="flex justify-start animate-in fade-in">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shrink-0 mr-3 mt-auto shadow-sm"><BrainCircuit size={14} /></div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl rounded-bl-sm flex items-center gap-1.5 shadow-sm h-12"><span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span><span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span><span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span></div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 bg-white dark:bg-[#111827] border-t border-slate-200 dark:border-slate-800 shrink-0">
              <div className="relative flex items-end bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-inner focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all p-1.5">
                <textarea rows={1} value={aiInput} onChange={(e) => setAiInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendAiMessage(); } }} placeholder="Hỏi AI bài này..." className="flex-1 max-h-24 bg-transparent outline-none px-3 py-2 text-sm font-medium dark:text-white resize-none custom-scrollbar" disabled={isAiTyping}/>
                <button onClick={handleSendAiMessage} disabled={isAiTyping || !aiInput.trim()} className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md disabled:opacity-50 shrink-0 mb-0.5 mr-0.5"><Send size={16} /></button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL HOÀN THÀNH BÀI HỌC */}
      {showRewardModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-in fade-in px-4">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[40px] max-w-sm w-full text-center shadow-2xl border border-slate-200 dark:border-slate-800 scale-in-center">
            <Trophy size={80} className="mx-auto text-yellow-400 mb-6 animate-bounce drop-shadow-lg" />
            <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2">Hoàn thành xuất sắc!</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium text-lg">Bạn đã vượt qua tất cả thử thách của bài học này.</p>
            <div className="flex justify-center gap-4 mb-8">
              <div className="bg-orange-50 dark:bg-orange-900/30 p-5 rounded-3xl border border-orange-100 dark:border-orange-800 shadow-inner w-full">
                <Flame size={32} className="mx-auto text-orange-500 mb-2" />
                <div className="text-3xl font-black text-orange-600 dark:text-orange-400">+50</div>
                <div className="text-xs font-bold text-orange-500/70 uppercase mt-1 tracking-widest">Kinh nghiệm</div>
              </div>
            </div>
            <button onClick={() => setShowRewardModal(false)} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/30 hover:-translate-y-1 text-lg">
              TIẾP TỤC HỌC
            </button>
          </div>
        </div>
      )}
    </div>
  );
};