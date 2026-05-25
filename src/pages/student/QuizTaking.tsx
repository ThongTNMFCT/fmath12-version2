import React, { useState, useEffect, useRef } from 'react';
import { Clock, ArrowLeftCircle, Database, Loader2, ArrowLeft, ArrowRight, BrainCircuit, CheckSquare, RefreshCcw, Trophy, Flame, Calendar, CheckCircle2, XCircle, MessageSquare, Send, X, ShieldAlert, AlertTriangle, Sigma, Ban, PlayCircle } from 'lucide-react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import { supabase } from '../../config/supabase';
import { useAppStore } from '../../store/useAppStore';
import { askGroqAI } from '../../services/groqAI';

// === BỔ SUNG HÀM BỊ THIẾU ===
const safeText = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.join('\n\n');
  if (typeof val === 'object') {
    return Object.entries(val).map(([k, v]) => `**Ý ${k}**: ${v === true ? 'Đúng' : v === false ? 'Sai' : v}`).join('\n\n');
  }
  return String(val);
};

const getQuestionType = (q: any) => {
  if (!q) return 'mcq';
  if (typeof q.correct_answer === 'object' && q.correct_answer !== null) return 'tf';
  if (typeof q.correct_answer === 'string') {
    const cleanCA = q.correct_answer.toLowerCase().trim();
    if (cleanCA.includes('true') || cleanCA.includes('false')) return 'tf';
  }
  const typeStr = String(q.type || '').toLowerCase().trim();
  if (['mcq', 'tf', 'saq'].includes(typeStr)) return typeStr;
  const hasOptions = Array.isArray(q.options) && q.options.length > 0;
  if (!hasOptions) return 'saq';
  return 'mcq';
};

const parseTFAnswer = (ans: any) => {
  let parsed: any = {};
  if (typeof ans === 'string') { try { parsed = JSON.parse(ans); } catch { return {}; } } 
  else if (typeof ans === 'object' && ans !== null) { parsed = ans; }
  
  let normalized: any = {};
  Object.keys(parsed).forEach(k => {
    normalized[String(k).toLowerCase().trim()] = parsed[k];
  });
  return normalized;
};

const isMcqCorrect = (userAns: any, correctAns: any) => {
  if (userAns == null || correctAns == null) return false;
  return String(userAns).trim().toLowerCase() === String(correctAns).trim().toLowerCase();
};

const isSaqCorrect = (userAns: any, correctAns: any) => {
  if (userAns == null || correctAns == null) return false;
  return String(userAns).trim().replace(/,/g, '.').toLowerCase() === String(correctAns).trim().replace(/,/g, '.').toLowerCase();
};

const QuizTaking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const liveSessionId = searchParams.get('liveSession');
  
  const { currentUser, setUser } = useAppStore();
  
  const [hasStarted, setHasStarted] = useState(false);
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [aiReview, setAiReview] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);

  const [channel, setChannel] = useState<any>(null);
  const [violationAlert, setViolationAlert] = useState<{show: boolean, message: string, count: number} | null>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const warningCountRef = useRef(0);
  const [isSpamResult, setIsSpamResult] = useState(false);

  const [chatInputs, setChatInputs] = useState<Record<string, string>>({});
  const [chatHistory, setChatHistory] = useState<Record<string, {role: string, content: string}[]>>({});
  const [isAiReplying, setIsAiReplying] = useState<Record<string, boolean>>({});
  const [openChatId, setOpenChatId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;

    if (!currentUser?.id) {
      const timer = setTimeout(() => { setIsLoading(false); }, 3000); 
      return () => clearTimeout(timer);
    }

    const fetchExamData = async () => {
      setIsLoading(true);
      try {
        const { data: attemptData } = await supabase.from('exam_attempts').select('score, time_spent').eq('exam_id', id).eq('user_id', currentUser.id).maybeSingle();
        const { data: examData } = await supabase.from('exams').select('*').eq('id', id).single();
        
        let loadedQuestions: any[] = [];
        const { data: eqData } = await supabase.from('exam_questions').select('sort_order, exercises(*)').eq('exam_id', id).order('sort_order', { ascending: true });
        if (eqData) {
          loadedQuestions = eqData.map((item: any) => item.exercises).filter(Boolean);
          setQuestions(loadedQuestions);
        }

        if (examData) {
          setExam(examData);
          if (attemptData) {
            setScore(attemptData.score);
            setIsSubmitted(true);
          } else {
            let restoredTime = examData.time_limit;
            const draftStr = localStorage.getItem(`fmath_draft_${currentUser.id}_${examData.id}`);
            if (draftStr) {
              try {
                const draft = JSON.parse(draftStr);
                if (draft.answers) setAnswers(draft.answers);
                if (draft.timeLeft !== undefined && draft.timeLeft > 0) restoredTime = draft.timeLeft;
              } catch(e) { console.error("Lỗi đọc file nháp", e); }
            }
            setTimeLeft(restoredTime);
          }
        }
      } catch (error) { console.error("Lỗi tải đề thi:", error); } 
      finally { setIsLoading(false); }
    };
    fetchExamData();
  }, [id, currentUser?.id]);

  useEffect(() => {
    if (exam?.id && currentUser?.id && !isSubmitted && questions.length > 0 && hasStarted) {
      localStorage.setItem(`fmath_draft_${currentUser.id}_${exam.id}`, JSON.stringify({ answers, timeLeft }));
    }
  }, [answers, timeLeft, exam?.id, currentUser?.id, isSubmitted, questions.length, hasStarted]);

  useEffect(() => {
    if (!liveSessionId || !currentUser?.id) return;
    const ch = supabase.channel(`live_exam_${liveSessionId}`);
    ch.subscribe();
    setChannel(ch);
    return () => { supabase.removeChannel(ch); };
  }, [liveSessionId, currentUser]);

  useEffect(() => {
    if (!liveSessionId || !channel || isSubmitted || !hasStarted) return;

    const antiCheatStyle = document.createElement('style');
    antiCheatStyle.id = 'fmath-anti-cheat-css';
    antiCheatStyle.innerHTML = `
      body > *:not(#root):not(script):not(style):not(link):not(noscript) { display: none !important; opacity: 0 !important; pointer-events: none !important; z-index: -999999 !important; }
      html > *:not(head):not(body) { display: none !important; }
      * { user-select: none !important; -webkit-user-select: none !important; }
    `;
    document.head.appendChild(antiCheatStyle);

    const reportViolation = async (type: string) => {
      warningCountRef.current += 1;
      const currentCount = warningCountRef.current;
      const time = new Date().toLocaleTimeString('vi-VN');
      
      channel.send({ type: 'broadcast', event: 'cheat_alert', payload: { userId: currentUser.id, userName: currentUser.name, type, time } });
      await supabase.from('exam_violations').insert({ session_id: liveSessionId, user_id: currentUser.id, violation_type: type });
      
      if (currentCount >= 3) {
        setViolationAlert({ show: true, message: `BẠN ĐÃ VI PHẠM QUY CHẾ LẦN THỨ 3.\nHành vi: "${type}"\nHệ thống đang tự động thu bài...`, count: currentCount });
        setTimeout(() => { executeSubmit(); setViolationAlert(null); }, 3000);
      } else {
        setViolationAlert({ show: true, message: `Phát hiện hành vi gian lận: "${type}"\nHành động này đã được báo cáo trực tiếp cho Giám thị!`, count: currentCount });
      }
    };

    const handleVisibilityChange = () => { if (document.hidden) reportViolation('Chuyển Tab / Ẩn trình duyệt'); };
    const handleWindowBlur = () => { reportViolation('Mất tiêu điểm (Nghi vấn bật Snipping Tool hoặc Click AI ngoài)'); };
    const handleCopy = (e: ClipboardEvent) => { e.preventDefault(); reportViolation('Sao chép nội dung đề thi'); };
    const handleContextMenu = (e: MouseEvent) => { e.preventDefault(); reportViolation('Mở Menu chuột phải'); };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || ((e.ctrlKey || e.metaKey) && e.shiftKey && ['s', '3', '4', '5'].includes(e.key.toLowerCase()))) { e.preventDefault(); reportViolation('Sử dụng phím tắt chụp màn hình'); }
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'p', 'x'].includes(e.key.toLowerCase())) { e.preventDefault(); reportViolation(`Sử dụng phím tắt cấm`); }
      if (e.key === 'F12') { if (showSubmitConfirm || violationAlert?.show) return; e.preventDefault(); reportViolation('Mở công cụ F12'); }
    };

    const sweepInterval = setInterval(() => {
      const allowedInBody = ['root', 'vite-legacy-container'];
      const allowedTags = ['script', 'style', 'link', 'noscript'];
      Array.from(document.body.children).forEach(node => { const el = node as HTMLElement; if (!allowedInBody.includes(el.id) && !allowedTags.includes(el.tagName.toLowerCase())) el.remove(); });
      const styleEl = document.getElementById('fmath-anti-cheat-css');
      if (styleEl) document.head.appendChild(styleEl);
    }, 500);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(sweepInterval);
      const styleEl = document.getElementById('fmath-anti-cheat-css');
      if (styleEl) styleEl.remove();
    };
  }, [liveSessionId, channel, isSubmitted, currentUser, hasStarted, showSubmitConfirm, violationAlert]);

  useEffect(() => {
    if (!liveSessionId || !channel || !currentUser || !hasStarted) return;
    channel.send({ type: 'broadcast', event: 'progress_update', payload: { userId: currentUser.id, userName: currentUser.name, currentQuestion: currentIdx, answered: Object.keys(answers).length } });
  }, [answers, currentIdx, liveSessionId, channel, hasStarted]);

  useEffect(() => {
    if (!hasStarted || isSubmitted || timeLeft <= 0 || isLoading || questions.length === 0) {
      if (hasStarted && timeLeft <= 0 && !isSubmitted && questions.length > 0) executeSubmit();
      return;
    }
    const timerId = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, isSubmitted, isLoading, questions, hasStarted]);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [currentIdx, isSubmitted]);

  const maxScore = questions.reduce((acc, q) => {
    const qType = getQuestionType(q);
    if (qType === 'tf') return acc + 1.0;
    if (qType === 'saq') return acc + 0.5;
    return acc + 0.25;
  }, 0);

  const handleAnswerMCQ = (questionId: string, optionId: string) => { if(!isSubmitted) setAnswers(prev => ({ ...prev, [questionId]: String(optionId).toLowerCase().trim() })); };
  const handleAnswerTF = (questionId: string, subId: string, value: boolean) => { if(!isSubmitted) { const normSubId = String(subId).toLowerCase().trim(); setAnswers(prev => ({ ...prev, [questionId]: { ...(prev[questionId] || {}), [normSubId]: value } })); }};
  const handleAnswerSAQ = (questionId: string, value: string) => { if(!isSubmitted) setAnswers(prev => ({ ...prev, [questionId]: value })); };

  const isQuestionAnswered = (q: any) => {
    const qType = getQuestionType(q);
    const ans = answers[q.id];
    if (ans == null) return false;
    if (qType === 'tf') return Object.keys(ans).length === (q.options?.length || 4);
    if (qType === 'saq') return String(ans).trim() !== "";
    return true;
  };

  const triggerSubmit = () => {
    const answeredCount = Object.keys(answers).length;
    const timeSpent = exam?.time_limit ? exam.time_limit - timeLeft : 0;
    
    if (exam?.time_limit && timeLeft > 0) {
      const isTimeConditionMet = timeSpent >= (exam.time_limit / 3);
      const isAnswerConditionMet = questions.length > 0 ? answeredCount >= Math.ceil(questions.length / 2) : true;

      if (!isTimeConditionMet && !isAnswerConditionMet) {
        alert(`⛔ HỆ THỐNG CHỐNG SPAM BẢO VỆ ĐỀ THI:\n\nBạn đang nộp bài quá sớm! Để được nộp bài, bạn cần thỏa mãn 1 trong 2 điều kiện:\n1. Đã làm tối thiểu 50% số câu hỏi (Hiện tại: ${answeredCount}/${questions.length})\n2. Thời gian làm bài trên 33% (Đã dùng: ${Math.floor(timeSpent/60)} phút / ${Math.floor((exam.time_limit/3)/60)} phút)\n\nHãy đọc kỹ đề và làm bài nghiêm túc!`);
        return;
      }
    }
    if (timeLeft > 0 && warningCountRef.current < 3) { setShowSubmitConfirm(true); } 
    else { executeSubmit(); }
  };

  const executeSubmit = async () => {
    setShowSubmitConfirm(false);
    setIsSaving(true);
    
    if (currentUser?.id && exam?.id) localStorage.removeItem(`fmath_draft_${currentUser.id}_${exam.id}`);

    let totalScore = 0;
    let cCount = 0;

    questions.forEach(q => {
      const userAns = answers[q.id];
      if (userAns == null) return;
      
      const qType = getQuestionType(q);
      let isQCorrect = false;

      if (qType === 'tf') {
        let correctCount = 0;
        const parsedCorrect = parseTFAnswer(q.correct_answer);
        q.options?.forEach((opt: any, idx: number) => { 
          const optId = String(opt.id || ['a', 'b', 'c', 'd'][idx] || idx).toLowerCase().trim();
          if (userAns[optId] === parsedCorrect[optId]) correctCount++; 
        });
        if (correctCount === 4) isQCorrect = true;
        if (correctCount === 1) totalScore += 0.1;
        else if (correctCount === 2) totalScore += 0.25;
        else if (correctCount === 3) totalScore += 0.5;
        else if (correctCount === 4) totalScore += 1.0;
      } 
      else if (qType === 'saq') {
        if (isSaqCorrect(userAns, q.correct_answer)) { isQCorrect = true; totalScore += 0.5; }
      } 
      else {
        if (isMcqCorrect(userAns, q.correct_answer)) { isQCorrect = true; totalScore += 0.25; }
      }
      if (isQCorrect) cCount++;
    });

    totalScore = Math.round(totalScore * 100) / 100;
    const timeSpent = exam?.time_limit ? exam.time_limit - timeLeft : 0;

    let spamFlag = false;
    if (exam?.time_limit && questions.length > 0) {
        const timeRatio = timeSpent / exam.time_limit;
        const correctRatio = cCount / questions.length;
        if (timeRatio < 0.15 && correctRatio < 0.25) spamFlag = true;
    }
    setIsSpamResult(spamFlag);
    setScore(totalScore);
    setIsSubmitted(true);
    setCurrentIdx(0); 

    try {
      let prompt = `Học sinh nộp bài Toán "${exam?.title}". Điểm: ${totalScore}/${maxScore}. Hãy nhận xét 2-3 câu động viên. Không in đậm in nghiêng.`;
      if(spamFlag) prompt = `Học sinh nộp bài điểm ${totalScore}/${maxScore} nhưng làm rất cẩu thả và nộp quá nhanh. Trách móc và khuyên làm bài đàng hoàng. Ngắn gọn 2 câu.`;
      const aiResponse = await askGroqAI("Bạn là FMath AI.", prompt);
      setAiReview(aiResponse);
    } catch (e) {
      setAiReview("Hệ thống AI hiện đang xử lý chậm. Kết quả của bạn đã được ghi nhận thành công!");
    }

    if (currentUser?.id && exam?.id) {
      await supabase.from('exam_attempts').insert({ exam_id: exam.id, user_id: currentUser.id, score: totalScore, time_spent: timeSpent > 0 ? timeSpent : 0 });
      const earnedXP = Math.round(totalScore * 10); 
      if (earnedXP > 0 && !spamFlag) {
        const newXP = (currentUser.xp || 0) + earnedXP;
        const newLevel = Math.floor(newXP / 100) + 1;
        const newStreak = (currentUser.streak || 0) + 1;
        const { data: updatedUser } = await supabase.from('users').update({ xp: newXP, level: newLevel, streak: newStreak }).eq('id', currentUser.id).select('*').single();
        if (updatedUser) setUser(updatedUser);
      }
    }
    setIsSaving(false);
    setShowRewardModal(true);
  };

  const handleAskQuestionAI = async (q: any) => {
    const input = chatInputs[q.id];
    if (!input?.trim() || isAiReplying[q.id]) return;
    
    const newHistory = [...(chatHistory[q.id] || []), { role: 'user', content: input }];
    setChatHistory(prev => ({ ...prev, [q.id]: newHistory }));
    setChatInputs(prev => ({ ...prev, [q.id]: "" }));
    setIsAiReplying(prev => ({ ...prev, [q.id]: true }));

    try {
      const sysPrompt = `Bạn là FMath AI - Gia sư Toán học. Học sinh đang hỏi về câu hỏi: "${q.content}". Đáp án: ${q.correct_answer}. Hãy trả lời học sinh dễ hiểu, dùng LaTeX $...$ cho công thức toán.`;
      const aiReply = await askGroqAI(sysPrompt, input);
      setChatHistory(prev => ({ ...prev, [q.id]: [...(prev[q.id] || []), { role: 'ai', content: aiReply }] }));
    } catch (error) {
      setChatHistory(prev => ({ ...prev, [q.id]: [...(prev[q.id] || []), { role: 'ai', content: "Xin lỗi em, FMath AI đang tải. Em thử hỏi lại nhé!" }] }));
    } finally {
      setIsAiReplying(prev => ({ ...prev, [q.id]: false }));
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2,'0');
    const s = (sec % 60).toString().padStart(2,'0');
    return `${m}:${s}`;
  };

  const MarkdownComponents = {
    img: ({ node, ...props }: any) => <img {...props} className="max-w-full h-auto rounded-xl shadow-md my-6 mx-auto border border-slate-200 dark:border-slate-700 block" alt={props.alt || "Ảnh minh họa"} loading="lazy" />,
    a: ({ node, ...props }: any) => <a {...props} className="text-blue-600 hover:underline font-medium" target="_blank" rel="noopener noreferrer" />
  };

  if (isLoading) return <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] text-blue-600"><Loader2 size={48} className="animate-spin mb-4" /><p className="font-bold">Đang tải dữ liệu phòng thi trực tuyến...</p></div>;
  if (!exam || questions.length === 0) return <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] text-slate-500 p-8"><Database size={64} className="mb-6 opacity-30" /><h3 className="text-2xl font-black text-blue-950 dark:text-white mb-2">Đề thi trống</h3><button onClick={() => navigate('/quiz')} className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-xl transition-all flex items-center gap-2"><ArrowLeft size={18} /> Chọn đề thi khác</button></div>;

  if (!hasStarted && !isSubmitted) {
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-center p-4 font-sans backdrop-blur-sm">
        <div className="glass bg-white/90 dark:bg-slate-900/90 p-10 rounded-[32px] shadow-xl max-w-[480px] w-full text-center border border-slate-200 dark:border-slate-800">
          <ShieldAlert size={64} className="mx-auto text-blue-600 dark:text-blue-400 mb-6" strokeWidth={1.5} />
          <h2 className="text-[22px] font-black text-blue-950 dark:text-white mb-5 uppercase tracking-wide">{exam?.title || "BÀI THI"}</h2>
          <div className="flex items-center justify-center gap-4 text-[15px] font-bold text-slate-500 dark:text-slate-400 mb-8">
            <span className="bg-slate-100 dark:bg-slate-800 px-5 py-2 rounded-xl">{questions.length} Câu hỏi</span>
            <span className="bg-slate-100 dark:bg-slate-800 px-5 py-2 rounded-xl">{Math.floor((exam?.time_limit || 5400) / 60)} Phút</span>
          </div>
          <button onClick={() => setHasStarted(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-md flex items-center justify-center gap-2 uppercase tracking-wide transition-all text-sm">
            <PlayCircle size={20} /> BẮT ĐẦU LÀM BÀI
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentIdx];
  const qType = getQuestionType(q);
  let typeLabel = qType === 'tf' ? "Đúng/Sai" : qType === 'saq' ? "Trả lời ngắn" : "Trắc nghiệm";

  return (
    <div className="flex flex-col lg:flex-row gap-4 md:gap-6 h-[calc(100vh-80px)] w-full p-4 md:p-8 pb-6 md:pb-10 relative animate-in fade-in overflow-hidden bg-slate-50/50 dark:bg-slate-900/50 font-sans">
      
      {/* CẢNH BÁO VI PHẠM */}
      {violationAlert?.show && (
        <div className="fixed inset-0 z-[99999] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] max-w-md w-full text-center border border-slate-200 dark:border-slate-800 shadow-2xl scale-in-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-xl font-black text-red-600 dark:text-red-400 mb-2 uppercase tracking-wider">Cảnh cáo vi phạm!</h2>
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-6 uppercase tracking-widest">Cảnh cáo lần {violationAlert.count}/3</div>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 p-4 rounded-xl text-left text-sm text-red-700 dark:text-red-400 mb-8 whitespace-pre-line leading-relaxed">
              <strong className="block mb-2 font-black">HỆ THỐNG PHÁT HIỆN:</strong>
              {violationAlert.message}
            </div>
            {violationAlert.count < 3 ? (
              <button onClick={() => setViolationAlert(null)} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-sm transition-all uppercase text-sm tracking-wide">
                TÔI ĐÃ HIỂU VÀ SẼ KHÔNG TÁI PHẠM
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 text-red-600 font-bold bg-red-100 dark:bg-red-900/20 p-4 rounded-xl"><Loader2 className="animate-spin" size={20} /> Đang tự động thu bài...</div>
            )}
          </div>
        </div>
      )}

      {/* CẢNH BÁO XÁC NHẬN NỘP BÀI */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-[99999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] max-w-sm w-full text-center shadow-2xl border border-slate-200 dark:border-slate-800 scale-in-center">
            <CheckCircle2 size={56} className="mx-auto text-orange-500 mb-4" />
            <h2 className="text-2xl font-black text-blue-950 dark:text-white mb-2">Xác nhận nộp bài</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium">Bạn đã trả lời {Object.keys(answers).length}/{questions.length} câu hỏi. Bạn không thể làm lại sau khi nộp.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowSubmitConfirm(false)} className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3.5 rounded-xl transition-all">Làm tiếp</button>
              <button onClick={executeSubmit} className="flex-1 bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white font-bold py-3.5 rounded-xl shadow-md transition-all">Nộp ngay</button>
            </div>
          </div>
        </div>
      )}

      {/* KHU VỰC TRÁI: CÂU HỎI */}
      <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
        <div className="glass bg-white/90 dark:bg-slate-900/90 px-6 py-4 rounded-[24px] shadow-sm flex items-center justify-between shrink-0">
          <div className="min-w-0 pr-4 flex items-center gap-3">
            <div className="bg-[#0052cc] text-white font-black text-lg w-8 h-8 flex items-center justify-center rounded-md shrink-0">Σ</div>
            <div>
              <div className="text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider mb-1 truncate">{exam.type || "Đề luyện thi"}</div>
              <h2 className="text-base font-black text-blue-950 dark:text-white truncate uppercase">{exam.title}</h2>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(i => i-1)} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 disabled:opacity-50 hover:bg-slate-200 transition-colors"><ArrowLeft size={18}/></button>
            <button disabled={currentIdx === questions.length-1} onClick={() => setCurrentIdx(i => i+1)} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 disabled:opacity-50 hover:bg-slate-200 transition-colors"><ArrowRight size={18}/></button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 glass bg-white/90 dark:bg-slate-900/90 p-6 md:p-8 rounded-[30px] shadow-sm overflow-y-auto custom-scrollbar scroll-smooth pb-12">
          <div className="max-w-3xl mx-auto relative">
            
            {/* THÔNG BÁO SHADOW BAN HOẶC NHẬN XÉT CỦA AI */}
            {isSubmitted && currentIdx === 0 && (
              isSpamResult ? (
                <div className="mb-10 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-[24px] p-6 md:p-8 text-red-700 dark:text-red-400 shadow-md animate-in slide-in-from-top-4">
                  <h3 className="text-xl font-black mb-2 flex items-center gap-2 uppercase tracking-tight"><Ban size={24}/> Cảnh báo SPAM</h3>
                  <p className="font-medium">Hệ thống phát hiện dấu hiệu đánh lụi lấy đáp án (Nộp bài quá nhanh và tỉ lệ làm bài thấp). Để bảo vệ bản quyền đề thi, <b>toàn bộ đáp án và lời giải chi tiết đã bị ẩn.</b> Vui lòng làm bài nghiêm túc ở lần thử tiếp theo!</p>
                </div>
              ) : (
                <div className="mb-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-[24px] p-6 md:p-8 text-white shadow-lg relative overflow-hidden animate-in slide-in-from-top-4">
                  <div className="relative z-10 flex items-center gap-6">
                    <div className="shrink-0 w-16 h-16 bg-white/20 rounded-full flex items-center justify-center border border-white/30"><Trophy size={32} className="text-yellow-300" /></div>
                    <div>
                      <h3 className="text-xl font-black mb-2">Đánh Giá Năng Lực (FMath AI)</h3>
                      <p className="text-blue-100 font-medium leading-relaxed">{aiReview}</p>
                    </div>
                  </div>
                  <BrainCircuit className="absolute -bottom-8 -right-8 w-40 h-40 text-white/10 -rotate-12 pointer-events-none" />
                </div>
              )
            )}

            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800 relative">
              <span className="px-4 py-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-sm font-black uppercase rounded-lg shadow-sm tracking-wide">Câu {currentIdx + 1}</span>
              <span className="text-xs font-bold text-slate-500 uppercase bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-md tracking-wide">{q.level || 'Nhận biết'}</span>
              
              <div className="absolute left-1/2 -translate-x-1/2 hidden md:block">
                 <button onClick={() => navigate('/quiz')} className="w-10 h-10 bg-slate-600 hover:bg-slate-700 text-white rounded-full flex items-center justify-center transition-colors shadow-sm">
                    <X size={18} strokeWidth={2.5} />
                 </button>
              </div>

              <span className="text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-4 py-1.5 rounded-md ml-auto border border-orange-100 dark:border-orange-800/50 tracking-wide">{typeLabel}</span>
            </div>

            <div className="mb-8 markdown-body text-lg font-medium text-blue-950 dark:text-slate-200 overflow-x-auto transform-gpu select-none pointer-events-none">
              <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={MarkdownComponents}>{q.content}</ReactMarkdown>
            </div>

            {/* RENDER ĐÁP ÁN */}
            <div className="mb-8 pointer-events-auto relative z-10">
              
              {/* MCQ */}
              {qType === 'mcq' && q.options && q.options.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {q.options.map((opt:any, idx: number) => {
                    const rawOptId = opt.id || ['A', 'B', 'C', 'D'][idx] || String(idx);
                    const optId = String(rawOptId).toLowerCase().trim();
                    const displayId = String(rawOptId).toUpperCase().trim();

                    const isSelected = String(answers[q.id] || '').toLowerCase().trim() === optId;
                    const isCorrect = isMcqCorrect(optId, q.correct_answer);
                    let btnClass = "border-slate-200 hover:border-blue-400 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer";
                    
                    if (isSubmitted) {
                      if (isSpamResult) {
                        if (isSelected) btnClass = "opacity-80 border-slate-400 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300";
                        else btnClass = "opacity-50 border-slate-200 dark:border-slate-700 text-slate-500";
                      } else {
                        if (isCorrect) btnClass = "border-green-500 bg-green-50 dark:bg-green-900/20 ring-2 ring-green-500 text-green-700 dark:text-green-300";
                        else if (isSelected && !isCorrect) btnClass = "border-red-500 bg-red-50 dark:bg-red-900/20 ring-2 ring-red-500 text-red-700 dark:text-red-300";
                        else btnClass = "opacity-50 border-slate-200 dark:border-slate-700 text-slate-500";
                      }
                    } else if (isSelected) btnClass = "border-blue-600 bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-600 text-blue-800 dark:text-blue-200 cursor-pointer";

                    return (
                      <div key={optId} onClick={() => { if(!isSubmitted) handleAnswerMCQ(q.id, optId) }} className={`w-full p-5 rounded-2xl border-2 text-left flex items-start gap-4 transition-all ${btnClass}`}>
                        <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${(isSubmitted && !isSpamResult && isCorrect) ? 'bg-green-500 text-white' : (isSubmitted && !isSpamResult && isSelected && !isCorrect) ? 'bg-red-500 text-white' : (isSubmitted && isSpamResult && isSelected) ? 'bg-slate-400 text-white' : isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{displayId}</div>
                        <div className="markdown-body mt-1.5 overflow-x-auto flex-1 pointer-events-none select-none"><ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={MarkdownComponents}>{safeText(opt.text)}</ReactMarkdown></div>
                        {isSubmitted && !isSpamResult && isCorrect && <CheckCircle2 className="text-green-500 shrink-0 mt-1" size={24}/>}
                        {isSubmitted && !isSpamResult && isSelected && !isCorrect && <XCircle className="text-red-500 shrink-0 mt-1" size={24}/>}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TF */}
              {qType === 'tf' && q.options && q.options.length > 0 && (
                <div className="flex flex-col gap-4">
                  {q.options.map((opt:any, idx: number) => {
                    const rawOptId = opt.id || ['a', 'b', 'c', 'd'][idx] || String(idx);
                    const optId = String(rawOptId).toLowerCase().trim();

                    const userVal = answers[q.id]?.[optId];
                    const parsedCorrect = parseTFAnswer(q.correct_answer);
                    const isCorrectVal = parsedCorrect[optId];
                    const isUserCorrect = userVal === isCorrectVal;
                    
                    let rowClass = "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-400";
                    if (isSubmitted) {
                       if (isSpamResult) {
                           rowClass = "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50";
                       } else {
                           if (isUserCorrect) rowClass = "border-green-300 bg-green-50/50 dark:bg-green-900/10";
                           else rowClass = "border-red-300 bg-red-50/50 dark:bg-red-900/10";
                       }
                    }

                    return (
                      <div key={optId} className={`p-5 rounded-2xl border-2 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${rowClass}`}>
                        <div className="flex items-start gap-4 flex-1 overflow-x-auto pointer-events-none select-none">
                          <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm bg-slate-100 dark:bg-slate-700 text-slate-500 uppercase">{rawOptId}</div>
                          <div className="markdown-body mt-1"><ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={MarkdownComponents}>{safeText(opt.text)}</ReactMarkdown></div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 self-end md:self-center bg-slate-50 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 pointer-events-auto">
                          <button disabled={isSubmitted} onClick={() => handleAnswerTF(q.id, optId, true)} className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-colors ${userVal === true ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>Đúng</button>
                          <button disabled={isSubmitted} onClick={() => handleAnswerTF(q.id, optId, false)} className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-colors ${userVal === false ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>Sai</button>
                        </div>
                        {isSubmitted && !isSpamResult && <div className="shrink-0 flex items-center">
                          {isUserCorrect ? <CheckCircle2 className="text-green-500" size={24}/> : <XCircle className="text-red-500" size={24}/>}
                          {!isUserCorrect && <div className="text-xs font-bold text-red-500 bg-red-100 px-2 py-1 rounded ml-2">Đ.án: {isCorrectVal ? 'Đúng' : 'Sai'}</div>}
                        </div>}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* SAQ */}
              {qType === 'saq' && (
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                  <label className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 block">Nhập đáp án của bạn (Dùng dấu "." cho số thập phân)</label>
                  <input 
                    type="text" 
                    value={answers[q.id] || ""} 
                    onChange={(e) => handleAnswerSAQ(q.id, e.target.value)} 
                    disabled={isSubmitted} 
                    className={`w-full max-w-sm px-6 py-4 mx-auto rounded-xl font-bold text-2xl outline-none transition-all shadow-inner text-center ${isSubmitted ? (!isSpamResult && isSaqCorrect(answers[q.id], q.correct_answer) ? 'bg-green-100 text-green-700 border-2 border-green-500' : 'bg-slate-100 text-slate-700 border-2 border-slate-300 dark:bg-slate-800 dark:text-slate-300') : 'bg-white dark:bg-slate-900 border-2 border-blue-200 dark:border-blue-800 focus:border-blue-600 dark:text-white'}`} 
                    placeholder="VD: 12.5"
                  />
                  {isSubmitted && !isSpamResult && !isSaqCorrect(answers[q.id], q.correct_answer) && (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl inline-block">
                      <span className="text-sm font-bold text-slate-500 block mb-1">Đáp án đúng là:</span>
                      <span className="font-black text-xl text-green-600 dark:text-green-400">{q.correct_answer}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* LỜI GIẢI (Bị Ẩn Nếu Spam) */}
            {isSubmitted && q.explanation && !isSpamResult && (
              <div className="mt-8 bg-purple-50 dark:bg-purple-900/10 p-6 rounded-2xl border border-purple-200 dark:border-slate-800/50 animate-in slide-in-from-bottom-4 shadow-sm overflow-x-auto mb-6">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-4 border-b border-purple-200/50 dark:border-purple-800/50 pb-3">
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-black text-lg">
                    <BrainCircuit size={24} /> Lời Giải Chi Tiết
                  </div>
                  <button onClick={() => setOpenChatId(openChatId === q.id ? null : q.id)} className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm ${openChatId === q.id ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 hover:bg-purple-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-purple-200 dark:border-purple-800/50'}`}>
                    <MessageSquare size={16} /> {openChatId === q.id ? 'Đóng hộp thoại AI' : 'Hỏi AI thêm về câu này'}
                  </button>
                </div>
                <div className="markdown-body text-sm text-slate-700 dark:text-slate-300 mb-2 transform-gpu">
                  <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={MarkdownComponents}>{safeText(q.explanation)}</ReactMarkdown>
                </div>

                {openChatId === q.id && (
                  <div className="mt-6 bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-inner border border-purple-100 dark:border-purple-800/50 animate-in slide-in-from-top-2">
                    <div className="space-y-4 mb-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                      {(!chatHistory[q.id] || chatHistory[q.id].length === 0) ? (
                        <div className="text-center text-slate-400 text-xs italic">Nhập thắc mắc của em. FMath AI sẽ giải thích ngay!</div>
                      ) : (
                        chatHistory[q.id].map((msg, idx) => (
                          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl p-3 shadow-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white text-[13px] font-medium rounded-tr-sm' : 'bg-purple-50 dark:bg-purple-900/20 text-purple-900 dark:text-purple-100 rounded-tl-sm border border-purple-200 dark:border-purple-800/50'}`}>
                              {msg.role === 'user' ? msg.content : <div className="markdown-body !text-[13px] md:!text-[13px] [&_p]:!mb-1.5 [&_p:last-child]:!mb-0 [&_.katex-display]:!my-1.5 [&_ul]:!mb-1.5 [&_ul]:!pl-4 [&_li]:!mb-0.5"><ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={MarkdownComponents}>{msg.content}</ReactMarkdown></div>}
                            </div>
                          </div>
                        ))
                      )}
                      {isAiReplying[q.id] && <div className="flex justify-start"><div className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 p-3 rounded-2xl rounded-tl-sm w-16 flex justify-center items-center"><Loader2 size={16} className="animate-spin" /></div></div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="text" value={chatInputs[q.id] || ""} onChange={(e) => setChatInputs(prev => ({...prev, [q.id]: e.target.value}))} onKeyDown={(e) => e.key === 'Enter' && handleAskQuestionAI(q)} placeholder="Hỏi AI tại đây..." className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-900 text-sm dark:text-white" disabled={isAiReplying[q.id]}/>
                      <button onClick={() => handleAskQuestionAI(q)} disabled={isAiReplying[q.id] || !chatInputs[q.id]?.trim()} className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-xl shadow-md transition-colors disabled:opacity-50 shrink-0"><Send size={18} /></button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CỘT PHẢI: BẢNG ĐIỀU KHIỂN */}
      <div className="w-full lg:w-[350px] shrink-0 flex flex-col gap-4 h-full min-h-0">
        <div className={`glass p-6 rounded-[24px] shadow-sm flex flex-col items-center gap-2 transition-colors duration-500 shrink-0 ${isSubmitted ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500 text-purple-700 dark:text-purple-400' : 'bg-white/90 dark:bg-slate-900/90 text-blue-950 dark:text-white'}`}>
          {isSubmitted ? (
            <><div className="text-[11px] font-black uppercase tracking-widest mb-1">Kết quả</div><div className="text-[48px] font-black">{score}<span className="text-2xl text-purple-400 ml-1">/{maxScore}</span></div></>
          ) : (
            <><div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2"><Clock size={14}/> Thời gian</div><div className={`text-[42px] font-black font-mono tracking-widest ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-orange-500'}`}>{formatTime(timeLeft)}</div></>
          )}
        </div>

        <div className="glass bg-white/90 dark:bg-slate-900/90 p-6 rounded-[24px] shadow-sm flex-1 flex flex-col overflow-hidden">
          <div className="font-bold uppercase text-[11px] mb-4 text-blue-950 dark:text-white tracking-widest flex justify-between">
             <span>Ma trận</span>
             <span className="text-slate-400">Đã làm: {Object.keys(answers).length}/{questions.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
            <div className="grid grid-cols-5 gap-3">
              {questions.map((fq, i) => {
                const done = isQuestionAnswered(fq);
                const active = currentIdx === i;
                let btn = "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700";
                
                if (isSubmitted) {
                  if (isSpamResult) {
                     btn = "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"; 
                  } else {
                     let isFullyCorrect = false;
                     const fqType = getQuestionType(fq);
                     const userAns = answers[fq.id];
                     
                     if (fqType === 'tf') {
                       let cCount = 0;
                       const parsedCorrect = parseTFAnswer(fq.correct_answer);
                       fq.options?.forEach((o:any, idx: number) => { 
                         const optId = String(o.id || ['a', 'b', 'c', 'd'][idx] || idx).toLowerCase().trim();
                         if(userAns?.[optId] === parsedCorrect[optId]) cCount++; 
                       });
                       isFullyCorrect = cCount === (fq.options?.length || 4); 
                     } else if (fqType === 'saq') {
                       isFullyCorrect = isSaqCorrect(userAns, fq.correct_answer);
                     } else {
                       isFullyCorrect = isMcqCorrect(userAns, fq.correct_answer);
                     }

                     if (isFullyCorrect) btn = "bg-green-500 text-white font-bold";
                     else if (done) btn = "bg-red-500 text-white font-bold";
                     else btn = "bg-slate-200 dark:bg-slate-700 opacity-50 text-slate-400";
                  }
                  if (active) btn += " ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-slate-900 scale-105 z-10";
                } else if (active) {
                  btn = "bg-blue-600 text-white scale-110 shadow-md z-10 font-bold";
                } else if (done) {
                  btn = "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 font-bold";
                }

                return (
                  <button key={fq.id} onClick={() => setCurrentIdx(i)} className={`relative w-full aspect-square flex items-center justify-center rounded-lg text-sm transition-all outline-none ${btn}`}>
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-5 border-t border-slate-100 dark:border-slate-800 shrink-0 mt-2">
            {!isSubmitted ? (
              <button disabled={isSaving} onClick={triggerSubmit} className="w-full bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white font-black py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wider text-sm">
                {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Send size={20}/>} NỘP BÀI THI
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <button onClick={() => navigate('/quiz')} className="w-full bg-[#0052cc] hover:bg-[#0042a3] text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wide shadow-md"><ArrowLeftCircle size={18}/> Về danh sách đề</button>
                <button onClick={() => {
                  setAnswers({}); 
                  setIsSubmitted(false); 
                  setTimeLeft(exam.time_limit); 
                  setCurrentIdx(0);
                  setIsSpamResult(false);
                  if(currentUser?.id && exam?.id) localStorage.removeItem(`fmath_draft_${currentUser.id}_${exam.id}`);
                }} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold py-4 rounded-xl hover:bg-slate-200 transition-all flex justify-center items-center gap-2 text-sm uppercase tracking-wide"><RefreshCcw size={16}/> Luyện lại</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL CHÚC MỪNG MỚI */}
      {showRewardModal && !isSpamResult && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-in fade-in px-4">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] max-w-sm w-full text-center shadow-2xl border border-slate-200 dark:border-slate-800 scale-in-center">
            <Trophy size={64} className="mx-auto text-yellow-400 mb-4 animate-bounce" />
            <h2 className="text-2xl font-black text-blue-950 dark:text-white mb-2">Nộp bài thành công!</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium">Kết quả của bạn là <strong className="text-[#0052cc] text-xl ml-1">{score}/{maxScore}</strong>.</p>
            
            {score > 0 ? (
              <div className="flex justify-center gap-4 mb-8">
                <div className="flex-1 bg-orange-50 dark:bg-orange-900/30 p-4 rounded-2xl border border-orange-100 dark:border-orange-800 shadow-inner">
                  <Flame size={28} className="mx-auto text-orange-500 mb-2" />
                  <div className="text-2xl font-black text-orange-600 dark:text-orange-400">+{Math.round(score * 10)}</div>
                  <div className="text-[10px] font-bold text-orange-500/70 uppercase mt-1">Kinh nghiệm</div>
                </div>
                <div className="flex-1 bg-blue-50 dark:bg-blue-900/30 p-4 rounded-2xl border border-blue-100 dark:border-blue-800 shadow-inner">
                  <Calendar size={28} className="mx-auto text-blue-500 mb-2" />
                  <div className="text-2xl font-black text-blue-600 dark:text-blue-400">+1</div>
                  <div className="text-[10px] font-bold text-blue-500/70 uppercase mt-1">Chuỗi ngày</div>
                </div>
              </div>
            ) : (
              <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl text-red-500 text-sm font-bold">
                Bạn chưa làm được câu nào nên không nhận được XP. Hãy xem lại giải thích và thử lại nhé!
              </div>
            )}
            
            <button onClick={() => setShowRewardModal(false)} className="w-full bg-[#0052cc] hover:bg-[#0042a3] text-white font-black py-4 rounded-xl transition-all shadow-md">
              XEM ĐÁP ÁN CHI TIẾT
            </button>
          </div>
        </div>
      )}

      {/* MODAL CẢNH BÁO SPAM */}
      {showRewardModal && isSpamResult && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-in fade-in px-4">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] max-w-sm w-full text-center shadow-2xl border border-slate-200 dark:border-slate-800 scale-in-center">
            <Ban size={64} className="mx-auto text-red-500 mb-4 drop-shadow-md" />
            <h2 className="text-2xl font-black text-red-600 mb-2 uppercase tracking-wide">Cảnh báo SPAM!</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium text-sm">Hệ thống phát hiện dấu hiệu đánh lụi/nộp bài nhanh để lấy đáp án. Điểm của bạn: <strong className="text-red-600 text-xl ml-1">{score}/{maxScore}</strong>.</p>
            <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-400 text-sm font-bold leading-relaxed shadow-inner">
              Để bảo vệ bản quyền đề thi, toàn bộ <b>Đáp Án & Lời Giải Chi Tiết</b> đã bị ẩn trong lượt xem này.
            </div>
            <button onClick={() => setShowRewardModal(false)} className="w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-4 rounded-xl transition-all shadow-sm">
              ĐÃ HIỂU
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default QuizTaking;