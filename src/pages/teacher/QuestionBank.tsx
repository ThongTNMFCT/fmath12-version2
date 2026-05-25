import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  BookOpen, PlusCircle, ChevronDown, ChevronRight, FileText, 
  Database, FileJson, Plus, Loader2, Save, X, LayoutList, 
  Trash2, CheckCircle2, Edit3, Image as ImageIcon, Lock,
  Calculator, Atom, Beaker, Dna, Laptop, HelpCircle, Lightbulb, Sparkles, Code
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import { supabase } from '../../config/supabase';
import { useAppStore } from '../../store/useAppStore';

// CẤU HÌNH THEME ĐỘNG BẢO ĐẢM TAILWIND KHÔNG XÓA CLASS
const SUBJECT_CONFIG: Record<string, any> = {
  math: { id: 'math', name: 'Toán Học', brand: 'F-Math', icon: <Calculator size={20}/>, gradient: 'from-blue-600 to-cyan-500', text: 'text-blue-600', bg: 'bg-blue-50', hover: 'hover:border-blue-300', darkBg: 'dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', btn: 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-400' },
  physics: { id: 'physics', name: 'Vật Lý', brand: 'F-Physics', icon: <Atom size={20}/>, gradient: 'from-indigo-600 to-blue-500', text: 'text-indigo-600', bg: 'bg-indigo-50', hover: 'hover:border-indigo-300', darkBg: 'dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800', btn: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-400' },
  chemistry: { id: 'chemistry', name: 'Hóa Học', brand: 'F-Chem', icon: <Beaker size={20}/>, gradient: 'from-emerald-500 to-teal-400', text: 'text-emerald-600', bg: 'bg-emerald-50', hover: 'hover:border-emerald-300', darkBg: 'dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', btn: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400' },
  biology: { id: 'biology', name: 'Sinh Học', brand: 'F-Bio', icon: <Dna size={20}/>, gradient: 'from-rose-500 to-pink-500', text: 'text-rose-600', bg: 'bg-rose-50', hover: 'hover:border-rose-300', darkBg: 'dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-800', btn: 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/40 dark:text-rose-400' },
  it: { id: 'it', name: 'Tin Học', brand: 'F-IT', icon: <Laptop size={20}/>, gradient: 'from-purple-600 to-fuchsia-500', text: 'text-purple-600', bg: 'bg-purple-50', hover: 'hover:border-purple-300', darkBg: 'dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', btn: 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-400' },
};

const QuestionBank = () => {
  const { currentUser } = useAppStore();
  
  const rawDbSubject = (currentUser.subject || '').toLowerCase().trim();
  const isValidDbSubject = Object.keys(SUBJECT_CONFIG).includes(rawDbSubject);
  const fallbackSubject = isValidDbSubject ? rawDbSubject : 'math';

  const [adminSubject, setAdminSubject] = useState(fallbackSubject);
  const currentSubject = currentUser.role === 'admin' ? adminSubject : fallbackSubject;
  const activeTheme = SUBJECT_CONFIG[currentSubject] || SUBJECT_CONFIG['math'];
  
  // STATES DỮ LIỆU
  const [chapters, setChapters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'theory' | 'practice'>('theory'); 
  const [exercises, setExercises] = useState<any[]>([]);
  const [isFetchingEx, setIsFetchingEx] = useState(false);

  // STATES THÊM MỚI
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [targetChapterId, setTargetChapterId] = useState("");
  const [isSavingEntity, setIsSavingEntity] = useState(false);

  // STATES LÝ THUYẾT
  const [theoryInput, setTheoryInput] = useState("");
  const [isEditingTheory, setIsEditingTheory] = useState(false);
  const [isSavingTheory, setIsSavingTheory] = useState(false);
  const theoryTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const theoryFileInputRef = useRef<HTMLInputElement>(null);

  // STATES ẢNH BÀI TẬP
  const [isUploadingQuestionImg, setIsUploadingQuestionImg] = useState(false);
  const questionFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<{ id: string, field: 'content' | 'explanation' | 'option', optId?: string } | null>(null);

  // STATES JSON MODAL
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // STATES HƯỚNG DẪN (GUIDE)
  const [showGuideModal, setShowGuideModal] = useState(false);

  const fetchCurriculum = async () => {
    setIsLoading(true);
    setActiveChapterId(null); setActiveLesson(null); setExercises([]);
    
    const { data: chaptersData } = await supabase
      .from('chapters')
      .select('*, lessons(*)')
      .eq('subject_id', currentSubject)
      .order('sort_order', { ascending: true });
      
    if (chaptersData) {
      const sortedChapters = chaptersData.map(chapter => {
        if (chapter.lessons && chapter.lessons.length > 0) {
          chapter.lessons.sort((a: any, b: any) => a.sort_order - b.sort_order);
        }
        return chapter;
      });

      setChapters(sortedChapters);
      if (sortedChapters.length > 0) {
        setActiveChapterId(sortedChapters[0].id);
        if (sortedChapters[0].lessons?.length > 0) handleSelectLesson(sortedChapters[0].lessons[0]);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => { 
    fetchCurriculum(); 
  }, [currentSubject]);

  const fetchExercises = async (lesson: any) => {
    setIsFetchingEx(true);
    const { data } = await supabase.from('exercises').select('*').eq('lesson_id', lesson.id).order('sort_order', { ascending: true });
    if (data) setExercises(data);
    setIsFetchingEx(false);
  };

  const handleSelectLesson = (lesson: any) => {
    setActiveLesson(lesson);
    setTheoryInput(lesson.theory_content || "");
    setIsEditingTheory(false);
    fetchExercises(lesson);
  };

  const handleAddChapter = async () => {
    if (!newChapterTitle.trim()) return;
    setIsSavingEntity(true);
    const { data, error } = await supabase.from('chapters').insert({
      title: newChapterTitle, subject_id: currentSubject, sort_order: chapters.length + 1
    }).select().single();
    setIsSavingEntity(false);

    if (error) return alert(error.message);
    if (data) {
      setChapters([...chapters, { ...data, lessons: [] }]);
      setShowAddChapter(false); setNewChapterTitle("");
    }
  };

  const handleAddLesson = async () => {
    if (!newLessonTitle.trim() || !targetChapterId) return;
    setIsSavingEntity(true);
    const targetChap = chapters.find(c => c.id === targetChapterId);
    const sortOrder = targetChap?.lessons?.length ? targetChap.lessons.length + 1 : 1;

    const { data, error } = await supabase.from('lessons').insert({
      chapter_id: targetChapterId, title: newLessonTitle, sort_order: sortOrder
    }).select().single();
    setIsSavingEntity(false);

    if (error) return alert(error.message);
    if (data) {
      setChapters(chapters.map(c => c.id === targetChapterId ? { ...c, lessons: [...(c.lessons||[]), data] } : c));
      setShowAddLesson(false); setNewLessonTitle(""); setTargetChapterId("");
      handleSelectLesson(data);
    }
  };

  const handleDeleteChapter = async (e: React.MouseEvent, chapId: string) => {
    e.stopPropagation();
    if (!window.confirm("Xóa chương này và toàn bộ bài học bên trong?")) return;
    await supabase.from('chapters').delete().eq('id', chapId);
    setChapters(prev => prev.filter(c => c.id !== chapId));
    if (activeChapterId === chapId) { setActiveChapterId(null); setActiveLesson(null); }
  };

  const handleDeleteLesson = async (e: React.MouseEvent, lessonId: string) => {
    e.stopPropagation();
    if (!window.confirm("Xóa bài học này?")) return;
    await supabase.from('lessons').delete().eq('id', lessonId);
    setChapters(prev => prev.map(c => ({ ...c, lessons: c.lessons?.filter((l:any) => l.id !== lessonId) })));
    if (activeLesson?.id === lessonId) setActiveLesson(null);
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      return data.secure_url;
    } catch (err) {
      return new Promise((resolve) => { const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = () => resolve(reader.result as string); });
    }
  };

  const insertMarkdown = (prefix: string, suffix: string) => {
    if (!theoryTextareaRef.current) return;
    const textarea = theoryTextareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = theoryInput;
    const selectedText = text.substring(start, end);
    const newText = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);
    setTheoryInput(newText);
    setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + prefix.length, end + prefix.length); }, 0);
  };

  const handleTheoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImg(true);
    const imageUrl = await uploadToCloudinary(file);
    const imgMarkdown = `\n![Ảnh minh họa](${imageUrl})\n`;
    if (theoryInput.includes('[CẦN CHÈN ẢNH]')) setTheoryInput(prev => prev.replace('[CẦN CHÈN ẢNH]', imgMarkdown));
    else insertMarkdown(imgMarkdown, '');
    setIsUploadingImg(false);
    if (e.target) e.target.value = '';
  };

  const handleQuestionImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;
    setIsUploadingQuestionImg(true);
    try {
      const imageUrl = await uploadToCloudinary(file);
      const imgMarkdown = `\n![Ảnh minh họa](${imageUrl})\n`;
      const qIndex = exercises.findIndex(q => q.id === uploadTarget.id);
      if (qIndex === -1) return;
      const qToUpdate = { ...exercises[qIndex] };

      if (uploadTarget.field === 'content') qToUpdate.content = qToUpdate.content.replace('[CẦN CHÈN ẢNH]', imgMarkdown);
      else if (uploadTarget.field === 'explanation') qToUpdate.explanation = qToUpdate.explanation.replace('[CẦN CHÈN ẢNH]', imgMarkdown);
      else if (uploadTarget.field === 'option') {
        const optIndex = qToUpdate.options.findIndex((o: any) => o.id === uploadTarget.optId);
        if (optIndex !== -1) qToUpdate.options[optIndex].text = qToUpdate.options[optIndex].text.replace('[CẦN CHÈN ẢNH]', imgMarkdown);
      }

      await supabase.from('exercises').update({ content: qToUpdate.content, explanation: qToUpdate.explanation, options: qToUpdate.options }).eq('id', qToUpdate.id);
      setExercises(prev => { const next = [...prev]; next[qIndex] = qToUpdate; return next; });
    } catch (err) { alert("Lỗi khi chèn ảnh."); } 
    finally { setIsUploadingQuestionImg(false); setUploadTarget(null); if (e.target) e.target.value = ''; }
  };

  const handleSaveTheory = async () => {
    if (!activeLesson) return;
    setIsSavingTheory(true);
    const { error } = await supabase.from('lessons').update({ theory_content: theoryInput }).eq('id', activeLesson.id);
    setIsSavingTheory(false);
    if (!error) {
      alert("Đã lưu nội dung lý thuyết thành công!");
      setActiveLesson({ ...activeLesson, theory_content: theoryInput });
      setIsEditingTheory(false);
      setChapters(prev => prev.map(c => ({ ...c, lessons: c.lessons?.map((l: any) => l.id === activeLesson.id ? { ...l, theory_content: theoryInput } : l) })));
    }
  };

  const handleParseAndSaveJSON = async () => {
    try {
      if (!jsonInput.trim()) throw new Error("Vui lòng dán kết quả từ AI vào.");
      let cleanStr = jsonInput.replace(/```json/gi, '').replace(/```/g, '').trim();
      const firstBracket = cleanStr.indexOf('['); const lastBracket = cleanStr.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1) cleanStr = cleanStr.substring(firstBracket, lastBracket + 1);
      cleanStr = cleanStr.replace(/,\s*([\]}])/g, '$1');
      
      const parsed = JSON.parse(cleanStr);
      let extractedQuestions: any[] = [];
      if (Array.isArray(parsed)) {
        if (parsed.length > 0 && parsed[0].questions) {
          parsed.forEach((section: any) => {
            if (Array.isArray(section.questions)) {
              extractedQuestions.push(...section.questions);
            }
          });
        } else {
          extractedQuestions = parsed;
        }
      }

      if (extractedQuestions.length === 0) throw new Error("JSON không chứa câu hỏi hợp lệ hoặc sai cấu trúc.");

      setIsSaving(true);
      const questionsToInsert = extractedQuestions.map((q, index) => ({
        lesson_id: activeLesson.id, 
        type: q.type || 'mcq', 
        level: q.level || 'Nhận biết', 
        content: q.content || q.question || '', 
        options: q.options || [], 
        correct_answer: typeof q.correct_answer === 'object' ? JSON.stringify(q.correct_answer) : q.correct_answer?.toString(),
        explanation: q.explanation || '', 
        sort_order: exercises.length + index + 1
      }));

      const chunkSize = 10;
      for (let i = 0; i < questionsToInsert.length; i += chunkSize) {
        const chunk = questionsToInsert.slice(i, i + chunkSize);
        const { error } = await supabase.from('exercises').insert(chunk);
        if (error) throw error;
      }

      alert(`Đã thêm thành công ${questionsToInsert.length} bài tập.`);
      setShowJsonModal(false); setJsonInput(""); fetchExercises(activeLesson); 
    } catch (error: any) { alert("Lỗi phân tích JSON: " + error.message); } 
    finally { setIsSaving(false); }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm("Xóa câu hỏi này?")) return;
    await supabase.from('exercises').delete().eq('id', id);
    setExercises(prev => prev.filter(q => q.id !== id));
  };

  const parseTFAnswer = (ans: any) => {
    if (typeof ans === 'string') { try { return JSON.parse(ans); } catch { return {}; } }
    return ans || {};
  };

  if (currentUser.role === 'teacher' && !isValidDbSubject) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] w-full bg-[#F8FAFC] dark:bg-[#0B0F19]">
        <div className="bg-white dark:bg-[#111827] p-10 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md text-center">
          <Lock size={48} className="text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-black mb-2 dark:text-white">Không gian bị khóa</h2>
          <p className="text-slate-500 font-medium">Tài khoản của bạn chưa được cấp bộ môn hợp lệ. Vui lòng liên hệ Admin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full relative animate-in fade-in overflow-hidden bg-[#F8FAFC] dark:bg-[#0B0F19] font-sans">
      <div className="flex-1 flex flex-col p-4 md:p-6 min-h-0 max-w-7xl mx-auto w-full">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 px-2 shrink-0">
          <div>
            <h2 className={`text-2xl md:text-3xl font-black ${activeTheme.text} flex items-center gap-3 tracking-tight`}>
              <Database size={28} /> {activeTheme.brandName} - Ngân hàng dữ liệu
            </h2>
            <p className="text-slate-600 dark:text-slate-400 font-medium mt-1">Quản lý Lý thuyết và Câu hỏi theo từng chương/bài học.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowGuideModal(true)}
              className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <HelpCircle size={18} /> Hướng dẫn
            </button>

            {currentUser.role === 'admin' && (
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Admin View:</span>
                <select 
                  value={adminSubject} 
                  onChange={(e) => setAdminSubject(e.target.value)}
                  className="bg-transparent border-none outline-none font-bold text-sm cursor-pointer dark:text-white"
                >
                  {Object.keys(SUBJECT_CONFIG).map(key => (
                    <option key={key} value={key}>{SUBJECT_CONFIG[key].name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
          
          <div className="w-full lg:w-80 shrink-0 bg-white dark:bg-[#111827] rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[40vh] lg:h-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
              <div className="font-bold text-slate-500 uppercase tracking-widest text-xs flex items-center gap-2">
                <BookOpen size={16}/> LỘ TRÌNH KIẾN THỨC
              </div>
              <button onClick={() => setShowAddChapter(true)} className={`p-1.5 rounded-lg ${activeTheme.btn} transition-colors`} title="Thêm chương mới"><Plus size={16}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
              {isLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500"/></div>
              ) : chapters.length === 0 ? (
                <div className="text-center text-slate-400 text-sm py-10 flex flex-col items-center gap-2"><LayoutList size={32} className="opacity-20"/>Chưa có chương nào. Hãy tạo mới.</div>
              ) : (
                chapters.map(chapter => {
                  const isExpanded = activeChapterId === chapter.id;
                  return (
                    <div key={chapter.id} className="mb-2">
                      <div className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-colors group ${isExpanded ? `${activeTheme.bg} ${activeTheme.text} dark:bg-slate-800` : 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                        <button onClick={() => setActiveChapterId(isExpanded ? null : chapter.id)} className="flex-1 flex items-center gap-2 font-bold text-sm text-left truncate"><span className="truncate">{chapter.title}</span></button>
                        <div className="flex items-center gap-2 shrink-0">
                           <button onClick={(e) => handleDeleteChapter(e, chapter.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"><Trash2 size={14}/></button>
                           <button onClick={() => setActiveChapterId(isExpanded ? null : chapter.id)} className="text-slate-400">{isExpanded ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}</button>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="mt-1 ml-2 space-y-1 border-l-2 border-slate-100 dark:border-slate-800 pl-2 py-2 animate-in slide-in-from-left-2">
                          {chapter.lessons?.map((lesson: any) => {
                            const isActive = activeLesson?.id === lesson.id;
                            return (
                              <div key={lesson.id} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-colors group/item ${isActive ? `${activeTheme.bg} border ${activeTheme.text} ${activeTheme.border} shadow-sm dark:bg-slate-800` : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent text-slate-600 dark:text-slate-400'}`}>
                                <button onClick={() => handleSelectLesson(lesson)} className={`flex-1 flex items-start gap-2 text-sm font-bold text-left ${isActive ? activeTheme.text : ''}`}><FileText size={14} className="shrink-0 mt-0.5"/> <span className="line-clamp-2">{lesson.title}</span></button>
                                <button onClick={(e) => handleDeleteLesson(e, lesson.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity p-1 shrink-0"><Trash2 size={14}/></button>
                              </div>
                            );
                          })}
                          <button onClick={() => { setTargetChapterId(chapter.id); setShowAddLesson(true); }} className={`w-full mt-2 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-700 bg-transparent border-2 border-dashed border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors`}><PlusCircle size={16}/> Thêm bài học</button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex-1 bg-white dark:bg-[#111827] rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden lg:h-full min-h-[600px]">
            {activeLesson ? (
              <>
                <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 shrink-0">
                  <div className={`text-[10px] font-black uppercase ${activeTheme.text} tracking-wider mb-2`}>BÀI HỌC HIỆN TẠI</div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white line-clamp-2">{activeLesson.title}</h3>
                </div>

                <div className="flex px-6 border-b border-slate-100 dark:border-slate-800 gap-6 shrink-0 bg-white dark:bg-[#111827]">
                  <button onClick={() => setActiveTab('theory')} className={`pb-4 pt-4 font-bold text-sm uppercase tracking-wide flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'theory' ? `${activeTheme.text} border-current` : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}><BookOpen size={16}/> Soạn Lý thuyết</button>
                  <button onClick={() => setActiveTab('practice')} className={`pb-4 pt-4 font-bold text-sm uppercase tracking-wide flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'practice' ? `${activeTheme.text} border-current` : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}><Database size={16}/> Bài tập ({exercises.length})</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar relative bg-slate-50/30 dark:bg-[#0B0F19]">
                  
                  {activeTab === 'theory' && (
                    <div className="animate-in fade-in h-full flex flex-col min-h-[400px]">
                      <div className="flex flex-wrap justify-between items-center mb-6 shrink-0 gap-4">
                        <h4 className="font-bold text-slate-700 dark:text-slate-300">Biên soạn bằng Markdown & LaTeX</h4>
                        {!isEditingTheory ? (
                          <button onClick={() => setIsEditingTheory(true)} className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition-colors ${activeTheme.btn}`}><Edit3 size={16}/> Chỉnh sửa nội dung</button>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            <input type="file" accept="image/*" ref={theoryFileInputRef} className="hidden" onChange={handleTheoryImageUpload} />
                            <button onClick={() => theoryFileInputRef.current?.click()} disabled={isUploadingImg} className="bg-orange-50 text-orange-600 border border-orange-200 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 disabled:opacity-50 hover:bg-orange-100 transition-colors shadow-sm">{isUploadingImg ? <Loader2 size={16} className="animate-spin"/> : <ImageIcon size={16}/>} Chèn ảnh</button>
                            <button onClick={() => { setIsEditingTheory(false); setTheoryInput(activeLesson.theory_content || ""); }} className="bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm">Hủy</button>
                            <button onClick={handleSaveTheory} disabled={isSavingTheory} className={`bg-gradient-to-r ${activeTheme.gradient} text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 disabled:opacity-50 shadow-md hover:opacity-90 transition-all`}><Save size={16}/> Lưu Bài</button>
                          </div>
                        )}
                      </div>
                      {isEditingTheory ? (
                        <textarea ref={theoryTextareaRef} value={theoryInput} onChange={e => setTheoryInput(e.target.value)} placeholder="Soạn nội dung giáo án tại đây...&#10;Dùng $...$ cho công thức toán." className="flex-1 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[24px] p-6 font-mono text-[15px] outline-none focus:ring-2 focus:ring-blue-500 custom-scrollbar dark:text-slate-200 shadow-inner resize-none" spellCheck="false" />
                      ) : (
                        <div className="flex-1 bg-white dark:bg-slate-900 p-8 rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm overflow-y-auto custom-scrollbar">
                          {activeLesson.theory_content ? <div className="markdown-body dark:text-slate-200"><ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{activeLesson.theory_content}</ReactMarkdown></div> : <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50"><BookOpen size={48} className="mb-4" /><p className="font-bold">Chưa có nội dung. Bấm "Chỉnh sửa" để bắt đầu.</p></div>}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'practice' && (
                    <div className="animate-in fade-in h-full">
                      <input type="file" accept="image/*" ref={questionFileInputRef} className="hidden" onChange={handleQuestionImageUpload} />
                      
                      <div className="flex justify-between items-center mb-6">
                        <h4 className="font-bold text-slate-700 dark:text-slate-300">Danh sách câu hỏi</h4>
                        <button onClick={() => setShowJsonModal(true)} className={`bg-gradient-to-r ${activeTheme.gradient} text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md hover:opacity-90 transition-all`}>
                          <FileJson size={16}/> Thêm từ AI (JSON)
                        </button>
                      </div>

                      {isFetchingEx ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-500"/></div> : exercises.length === 0 ? <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-700 rounded-[32px] shadow-sm"><Database size={48} className="mb-4 opacity-20" /><p className="font-bold">Chưa có câu hỏi.</p></div> : (
                        <div className="space-y-6">
                          {exercises.map((q, idx) => (
                            <div key={q.id} style={{ contentVisibility: 'auto', containIntrinsicSize: '400px' }} className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-sm relative group hover:shadow-md transition-shadow">
                              <div className="absolute top-6 right-6 flex gap-3"><span className="text-[10px] font-black uppercase px-2.5 py-1 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">{q.type} | {q.level}</span><button onClick={() => handleDeleteQuestion(q.id)} className="text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button></div>
                              <div className={`font-black mb-4 ${activeTheme.text}`}>Câu {idx + 1}:</div>
                              <div className="markdown-body !text-[15px] mb-4 dark:text-slate-200"><ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{q.content}</ReactMarkdown></div>
                              {q.content?.includes('[CẦN CHÈN ẢNH]') && <button onClick={() => { setUploadTarget({ id: q.id, field: 'content' }); questionFileInputRef.current?.click(); }} disabled={isUploadingQuestionImg} className="mb-6 bg-orange-100 text-orange-600 px-3 py-1.5 rounded-lg text-xs font-bold flex gap-1.5 animate-pulse w-fit"><ImageIcon size={14}/> Tải ảnh thay thế</button>}
                              
                              {q.type === 'mcq' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 mt-4">
                                  {q.options?.map((opt:any) => (
                                    <div key={opt.id} className={`p-4 rounded-xl border text-[14px] flex gap-3 shadow-sm ${opt.id === q.correct_answer ? 'border-green-400 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}><strong className={`shrink-0 ${opt.id === q.correct_answer ? 'text-green-600' : 'text-slate-500'}`}>{opt.id}.</strong><div className="markdown-body !text-[14px] overflow-x-auto"><ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{opt.text}</ReactMarkdown></div></div>
                                  ))}
                                </div>
                              )}

                              {q.type === 'tf' && (
                                <div className="space-y-3 mb-6 mt-4">
                                  {q.options?.map((opt:any) => {
                                    const isTrue = parseTFAnswer(q.correct_answer)[opt.id] === true;
                                    return (
                                      <div key={opt.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-[14px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                                        <div className="flex items-start gap-3 flex-1">
                                          <strong className="text-slate-500 shrink-0">{opt.id})</strong>
                                          <div className="markdown-body !text-[14px] dark:text-slate-200"><ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{opt.text}</ReactMarkdown></div>
                                        </div>
                                        <div className={`shrink-0 text-xs font-black px-4 py-1.5 rounded-lg border shadow-sm ${isTrue ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>{isTrue ? 'ĐÚNG' : 'SAI'}</div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}

                              {q.type === 'saq' && (
                                <div className="mb-6 mt-4 flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                  <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Đáp án điền khuyết: </span>
                                  <span className="font-black text-xl text-green-600">{q.correct_answer}</span>
                                </div>
                              )}

                              {q.explanation && (
                                <div className="bg-slate-50 dark:bg-slate-800/30 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                                  <span className="text-xs font-black text-slate-500 uppercase mb-2 flex items-center gap-1.5"><Lightbulb size={14}/> Lời giải hệ thống</span>
                                  <div className="markdown-body !text-[14px] text-slate-700 dark:text-slate-300 overflow-x-auto"><ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{q.explanation}</ReactMarkdown></div>
                                  {q.explanation.includes('[CẦN CHÈN ẢNH]') && <button onClick={() => { setUploadTarget({ id: q.id, field: 'explanation' }); questionFileInputRef.current?.click(); }} disabled={isUploadingQuestionImg} className="mt-3 bg-orange-100 text-orange-600 px-3 py-1.5 rounded-lg text-xs font-bold flex gap-1.5 hover:bg-orange-200 transition-colors animate-pulse w-fit"><ImageIcon size={14}/> Tải ảnh thay thế</button>}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-10 bg-slate-50/50 dark:bg-slate-900/50">
                <BookOpen size={64} className="mb-4 opacity-20"/>
                <p className="font-bold text-lg">Chọn một bài học ở menu bên trái để bắt đầu biên soạn.</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {showAddChapter && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#111827] w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative border border-slate-200 dark:border-slate-800">
            <button onClick={() => setShowAddChapter(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-white"><X size={20}/></button>
            <h3 className="text-xl font-black mb-6 dark:text-white">Thêm Chương mới</h3>
            <input autoFocus type="text" value={newChapterTitle} onChange={e => setNewChapterTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddChapter()} placeholder="Nhập tên chương..." className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold mb-6 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"/>
            <button onClick={handleAddChapter} disabled={!newChapterTitle.trim() || isSavingEntity} className={`w-full bg-gradient-to-r ${activeTheme.gradient} text-white font-black py-4 rounded-2xl shadow-lg disabled:opacity-50 flex justify-center items-center gap-2 hover:opacity-90`}><PlusCircle size={18}/> {isSavingEntity ? <Loader2 size={18} className="animate-spin"/> : 'TẠO CHƯƠNG'}</button>
          </div>
        </div>, document.body
      )}

      {showAddLesson && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#111827] w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative border border-slate-200 dark:border-slate-800">
            <button onClick={() => setShowAddLesson(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-white"><X size={20}/></button>
            <h3 className="text-xl font-black mb-6 dark:text-white">Thêm Bài học</h3>
            <input autoFocus type="text" value={newLessonTitle} onChange={e => setNewLessonTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddLesson()} placeholder="Nhập tên bài học..." className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold mb-6 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"/>
            <button onClick={handleAddLesson} disabled={!newLessonTitle.trim() || isSavingEntity} className={`w-full bg-gradient-to-r ${activeTheme.gradient} text-white font-black py-4 rounded-2xl shadow-lg disabled:opacity-50 flex justify-center items-center gap-2 hover:opacity-90`}><PlusCircle size={18}/> {isSavingEntity ? <Loader2 size={18} className="animate-spin"/> : 'TẠO BÀI HỌC'}</button>
          </div>
        </div>, document.body
      )}

      {showJsonModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#111827] w-full max-w-2xl rounded-[32px] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative flex flex-col max-h-[90vh]">
            <button onClick={() => setShowJsonModal(false)} className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"><X size={18}/></button>
            
            <h3 className={`text-2xl font-black mb-2 flex items-center gap-2 ${activeTheme.text}`}><FileJson size={24}/> Nhập JSON từ F-Prep AI</h3>
            <p className="text-sm font-bold text-slate-500 mb-6 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 w-fit">Bài: {activeLesson?.title}</p>

            <div className="relative flex-1 min-h-[300px] flex flex-col group">
               <textarea 
                  value={jsonInput}
                  onChange={e => setJsonInput(e.target.value)}
                  placeholder="Dán mã JSON của AI vào đây...&#10;Hệ thống sẽ tự động bóc tách và sửa lỗi định dạng nếu có."
                  className="flex-1 w-full bg-slate-900 dark:bg-black text-emerald-400 font-mono text-[13px] leading-relaxed p-6 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 resize-none custom-scrollbar shadow-inner"
                  spellCheck="false"
                />
            </div>

            <div className="mt-6 flex justify-end gap-3 shrink-0">
              <button onClick={() => setShowJsonModal(false)} className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors text-sm">Hủy</button>
              <button onClick={handleParseAndSaveJSON} disabled={isSaving} className={`px-8 py-3.5 bg-gradient-to-r ${activeTheme.gradient} disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all text-sm flex items-center gap-2`}><Save size={18}/> {isSaving ? <Loader2 size={18} className="animate-spin"/> : 'LƯU VÀO KHO'}</button>
            </div>
          </div>
        </div>, document.body
      )}

      {showGuideModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#111827] w-full max-w-2xl rounded-[32px] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative flex flex-col max-h-[90vh]">
            <button onClick={() => setShowGuideModal(false)} className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"><X size={18}/></button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-2xl bg-gradient-to-br ${activeTheme.gradient} text-white shadow-md`}>
                <HelpCircle size={24}/>
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Hướng dẫn sử dụng</h3>
                <p className={`text-sm font-bold uppercase tracking-widest mt-1 ${activeTheme.text}`}>Bộ môn {activeTheme.name}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2"><Sparkles size={16} className="text-amber-500"/> 1. Cấu trúc Quản lý</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Ngân hàng dữ liệu được chia làm 2 cấp: <strong>Chương</strong> và <strong>Bài học</strong>. Mỗi bài học sẽ bao gồm phần <em>Lý thuyết (Markdown)</em> và phần <em>Bài tập (JSON)</em>.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2"><BookOpen size={16} className="text-blue-500"/> 2. Soạn Lý thuyết (Hỗ trợ LaTeX)</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                  Hệ thống hỗ trợ cú pháp Markdown chuẩn và LaTeX. Phù hợp nhất cho đặc thù môn {activeTheme.name}.
                </p>
                <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2 list-disc pl-5 font-mono bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <li>Công thức nội tuyến: <span className="text-blue-600">$\int x dx$</span></li>
                  <li>Công thức khối: <span className="text-blue-600">$$ E = mc^2 $$</span></li>
                  <li>Để chèn ảnh, bấm nút <strong>Chèn ảnh</strong> trên thanh công cụ.</li>
                </ul>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2"><Code size={16} className="text-purple-500"/> 3. Nhập câu hỏi tự động bằng AI</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                  Để thêm câu hỏi nhanh chóng, thầy/cô hãy sử dụng ChatGPT, Claude hoặc Gemini với <strong>Prompt mẫu</strong> sau (Hỗ trợ 3 định dạng câu hỏi chuẩn Bộ GD&ĐT 2025):
                </p>
                <div className="bg-slate-900 text-green-400 p-4 rounded-xl text-[13px] font-mono relative group overflow-x-auto custom-scrollbar">
                  <div className="whitespace-pre-wrap leading-relaxed">
{`Bạn là chuyên gia môn ${activeTheme.name}. Hãy tạo câu hỏi về chủ đề [Tên_chủ_đề] dưới định dạng JSON mảng tuyệt đối. Hỗ trợ 3 định dạng sau:

1. Trắc nghiệm 4 đáp án (mcq):
{
  "type": "mcq",
  "level": "Nhận biết",
  "content": "Nội dung câu hỏi...",
  "options": [{"id": "A", "text": "Đáp án A"}, {"id": "B", "text": "Đáp án B"}, {"id": "C", "text": "Đáp án C"}, {"id": "D", "text": "Đáp án D"}],
  "correct_answer": "A",
  "explanation": "Giải thích chi tiết..."
}

2. Trắc nghiệm Đúng/Sai (tf):
{
  "type": "tf",
  "level": "Thông hiểu",
  "content": "Cho mệnh đề sau. Các phát biểu a, b, c, d đúng hay sai?",
  "options": [{"id": "a", "text": "Ý a..."}, {"id": "b", "text": "Ý b..."}, {"id": "c", "text": "Ý c..."}, {"id": "d", "text": "Ý d..."}],
  "correct_answer": {"a": true, "b": false, "c": true, "d": false},
  "explanation": "Giải thích chi tiết..."
}

3. Trả lời ngắn (saq):
{
  "type": "saq",
  "level": "Vận dụng",
  "content": "Nội dung câu hỏi điền khuyết...",
  "correct_answer": "12.5",
  "explanation": "Giải thích chi tiết..."
}`}
                  </div>
                  <button 
                    onClick={() => {
                      const promptText = `Bạn là chuyên gia môn ${activeTheme.name}. Hãy tạo câu hỏi về chủ đề [Tên_chủ_đề] dưới định dạng JSON mảng tuyệt đối. Hỗ trợ 3 định dạng sau:\n\n1. Trắc nghiệm 4 đáp án (mcq):\n{\n  "type": "mcq",\n  "level": "Nhận biết",\n  "content": "Nội dung câu hỏi...",\n  "options": [{"id": "A", "text": "Đáp án A"}, {"id": "B", "text": "Đáp án B"}, {"id": "C", "text": "Đáp án C"}, {"id": "D", "text": "Đáp án D"}],\n  "correct_answer": "A",\n  "explanation": "Giải thích chi tiết..."\n}\n\n2. Trắc nghiệm Đúng/Sai (tf):\n{\n  "type": "tf",\n  "level": "Thông hiểu",\n  "content": "Cho mệnh đề sau. Các phát biểu a, b, c, d đúng hay sai?",\n  "options": [{"id": "a", "text": "Ý a..."}, {"id": "b", "text": "Ý b..."}, {"id": "c", "text": "Ý c..."}, {"id": "d", "text": "Ý d..."}],\n  "correct_answer": {"a": true, "b": false, "c": true, "d": false},\n  "explanation": "Giải thích chi tiết..."\n}\n\n3. Trả lời ngắn (saq):\n{\n  "type": "saq",\n  "level": "Vận dụng",\n  "content": "Nội dung câu hỏi điền khuyết...",\n  "correct_answer": "12.5",\n  "explanation": "Giải thích chi tiết..."\n}`;
                      navigator.clipboard.writeText(promptText);
                      alert("Đã copy Prompt!");
                    }} 
                    className="absolute top-3 right-3 text-xs bg-white/20 text-white px-2 py-1 rounded hover:bg-white/30 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end shrink-0">
              <button onClick={() => setShowGuideModal(false)} className={`px-6 py-3.5 bg-gradient-to-r ${activeTheme.gradient} text-white font-bold rounded-xl shadow-md transition-all text-sm`}>Đã hiểu</button>
            </div>
          </div>
        </div>, document.body
      )}

    </div>
  );
};

export default QuestionBank;