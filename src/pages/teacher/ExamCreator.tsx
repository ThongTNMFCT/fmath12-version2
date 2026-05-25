import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Save, Database, Trash2, Loader2, ArrowLeft, 
  LayoutTemplate, PlusCircle, CheckCircle2, Filter,
  Clock, FileText, Lock
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import { supabase } from '../../config/supabase';
import { useAppStore } from '../../store/useAppStore';

const SUBJECT_CONFIG: Record<string, any> = {
  math: { name: 'Toán Học', brand: 'F-Math', text: 'text-blue-600', gradient: 'from-blue-600 to-cyan-500', theme: 'blue' },
  physics: { name: 'Vật Lý', brand: 'F-Physics', text: 'text-indigo-600', gradient: 'from-indigo-600 to-blue-500', theme: 'indigo' },
  chemistry: { name: 'Hóa Học', brand: 'F-Chem', text: 'text-emerald-600', gradient: 'from-emerald-500 to-teal-400', theme: 'emerald' },
  biology: { name: 'Sinh Học', brand: 'F-Bio', text: 'text-rose-600', gradient: 'from-rose-500 to-pink-500', theme: 'rose' },
  it: { name: 'Tin Học', brand: 'F-IT', text: 'text-purple-600', gradient: 'from-purple-600 to-fuchsia-500', theme: 'purple' },
};

const TABS = ['Đề theo bài', 'Chuyên đề', 'Đề luyện thi', 'ĐGNL', 'VSAT'];

const ExamCreator = () => {
  const navigate = useNavigate();
  const { currentUser } = useAppStore();
  
  // LOGIC NHẬN DIỆN PHÂN MÔN CHUẨN XÁC
  const rawDbSubject = (currentUser.subject || '').toLowerCase().trim();
  const isValidDbSubject = Object.keys(SUBJECT_CONFIG).includes(rawDbSubject);
  const fallbackSubject = isValidDbSubject ? rawDbSubject : 'math';
  
  const [adminSubject, setAdminSubject] = useState(fallbackSubject);
  const currentSubject = currentUser.role === 'admin' ? adminSubject : fallbackSubject;
  const activeTheme = SUBJECT_CONFIG[currentSubject] || SUBJECT_CONFIG['math'];

  // STATES DỮ LIỆU
  const [chapters, setChapters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // STATES BỘ LỌC (FILTERS)
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");
  const [selectedLessonId, setSelectedLessonId] = useState<string>("");

  // STATES ĐỀ THI
  const [examConfig, setExamConfig] = useState({ title: '', type: 'Đề luyện thi', timeLimit: 45 });
  const [selectedQuestions, setSelectedQuestions] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // LẤY DỮ LIỆU
  useEffect(() => {
    const fetchBank = async () => {
      setIsLoading(true);
      setSelectedQuestions([]); 
      setSelectedChapterId(""); 
      setSelectedLessonId("");
      
      const { data } = await supabase
        .from('chapters')
        .select(`id, title, sort_order, lessons (id, title, sort_order, exercises (id, content, options, correct_answer, level, type))`)
        .eq('subject_id', currentSubject)
        .order('sort_order', { ascending: true });

      if (data) {
        const sortedData = data.map(chapter => ({
          ...chapter,
          lessons: chapter.lessons.sort((a: any, b: any) => a.sort_order - b.sort_order)
        }));
        setChapters(sortedData);
      }
      setIsLoading(false);
    };

    fetchBank();
  }, [currentSubject]);

  // LỌC CÂU HỎI THEO BÀI HỌC ĐANG CHỌN
  const activeExercises = useMemo(() => {
    if (!selectedChapterId) {
      let allEx: any[] = [];
      chapters.forEach(c => c.lessons.forEach((l:any) => { allEx = [...allEx, ...(l.exercises || [])] }));
      return allEx.slice(0, 50);
    }
    
    const chapter = chapters.find(c => c.id === selectedChapterId);
    if (!chapter) return [];

    if (!selectedLessonId) {
      let chapEx: any[] = [];
      chapter.lessons.forEach((l:any) => { chapEx = [...chapEx, ...(l.exercises || [])] });
      return chapEx;
    }

    const lesson = chapter.lessons.find((l:any) => l.id === selectedLessonId);
    return lesson?.exercises || [];
  }, [chapters, selectedChapterId, selectedLessonId]);

  if (currentUser.role === 'teacher' && !isValidDbSubject) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] w-full bg-[#F8FAFC] dark:bg-[#0B0F19]">
        <div className="bg-white dark:bg-[#111827] p-10 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md text-center">
          <Lock size={48} className="text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-black mb-2 dark:text-white">Chưa phân công môn</h2>
          <p className="text-slate-500 font-medium">Tài khoản của bạn chưa được gắn bộ môn hợp lệ. Vui lòng liên hệ Admin.</p>
        </div>
      </div>
    );
  }

  const handleAddQuestion = (q: any) => {
    if (!selectedQuestions.find(item => item.id === q.id)) {
      setSelectedQuestions(prev => [...prev, q]);
    }
  };

  const handleRemoveQuestion = (id: string) => {
    setSelectedQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleSaveExam = async () => {
    if (!examConfig.title.trim()) return alert("Vui lòng nhập Tên đề thi!");
    if (selectedQuestions.length === 0) return alert("Vui lòng chọn ít nhất 1 câu hỏi vào đề!");
    
    setIsSaving(true);
    try {
      const { data: newExam, error: examError } = await supabase
        .from('exams')
        .insert({
          teacher_id: currentUser?.id, 
          title: examConfig.title, 
          type: examConfig.type,
          time_limit: examConfig.timeLimit * 60, 
          status: 'active', 
          group_name: activeTheme.name, 
          subject_id: currentSubject,
          tags: [examConfig.type, `${selectedQuestions.length} câu`, 'Ghép tay']
        })
        .select()
        .single();

      if (examError) throw examError;

      // Chia nhỏ lưu đề để tránh quá tải
      const examQuestionsData = selectedQuestions.map((q, index) => ({ 
        exam_id: newExam.id, exercise_id: q.id, sort_order: index + 1 
      }));
      
      const chunkSize = 20;
      for (let i = 0; i < examQuestionsData.length; i += chunkSize) {
        const chunk = examQuestionsData.slice(i, i + chunkSize);
        const { error: chunkErr } = await supabase.from('exam_questions').insert(chunk);
        if (chunkErr) throw chunkErr;
      }

      alert("Lưu Đề thi thành công!");
      navigate('/exam-bank'); 
    } catch (error: any) { 
      alert("Lỗi: " + error.message); 
    } finally { 
      setIsSaving(false); 
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full bg-[#F8FAFC] dark:bg-[#0B0F19] overflow-hidden font-sans">
      
      {/* THANH TOPBAR CỐ ĐỊNH */}
      <div className="bg-white dark:bg-[#111827] border-b border-slate-200 dark:border-slate-800 px-6 py-4 shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 z-20 shadow-sm">
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button onClick={() => navigate('/exam-bank')} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors">
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex-1 flex items-center gap-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 w-full md:w-[350px]">
            <FileText size={18} className={activeTheme.text} />
            <input 
              type="text" 
              value={examConfig.title} 
              onChange={e => setExamConfig({...examConfig, title: e.target.value})} 
              placeholder="Nhập tên Đề thi..."
              className="bg-transparent border-none outline-none font-bold text-sm text-slate-800 dark:text-white w-full placeholder:font-medium placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
          <select 
            value={examConfig.type} 
            onChange={e => setExamConfig({...examConfig, type: e.target.value})} 
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl px-3 py-2.5 outline-none font-bold text-sm cursor-pointer shrink-0"
          >
            {TABS.map(tab => <option key={tab} value={tab}>{tab}</option>)}
          </select>
          
          <div className="flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 w-28 shrink-0">
            <Clock size={16} className="text-orange-500 mr-2" />
            <input 
              type="number" 
              value={examConfig.timeLimit} 
              onChange={e => setExamConfig({...examConfig, timeLimit: Number(e.target.value)})} 
              className="bg-transparent border-none outline-none font-bold text-sm text-slate-800 dark:text-white w-full text-center"
            />
          </div>

          <button 
            onClick={handleSaveExam} 
            disabled={isSaving} 
            className={`shrink-0 bg-gradient-to-r ${activeTheme.gradient} text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md flex items-center gap-2 hover:opacity-90 disabled:opacity-50`}
          >
            {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} XUẤT BẢN ĐỀ THI
          </button>
        </div>

      </div>

      <div className="px-6 py-3 bg-slate-100 dark:bg-[#0B0F19] border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <LayoutTemplate size={18} className={activeTheme.text}/>
          <span className="font-bold text-sm text-slate-600 dark:text-slate-300 uppercase tracking-widest">
            Ghép đề thủ công từ Kho ({activeTheme.brandName})
          </span>
        </div>
        {currentUser.role === 'admin' && (
          <select 
            value={adminSubject} 
            onChange={(e) => setAdminSubject(e.target.value)} 
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1 outline-none font-bold text-xs shadow-sm cursor-pointer text-slate-700 dark:text-slate-200"
          >
            {Object.keys(SUBJECT_CONFIG).map(key => <option key={key} value={key}>{SUBJECT_CONFIG[key].name}</option>)}
          </select>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        <div className="w-1/2 md:w-[60%] h-full bg-white dark:bg-[#111827] flex flex-col border-r border-slate-200 dark:border-slate-800">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex gap-3 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
              <Filter size={16} className="text-slate-400" />
            </div>
            
            <select 
              value={selectedChapterId} 
              onChange={(e) => { setSelectedChapterId(e.target.value); setSelectedLessonId(""); }}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none"
            >
              <option value="">-- Tất cả Chương --</option>
              {chapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>

            <select 
              value={selectedLessonId} 
              onChange={(e) => setSelectedLessonId(e.target.value)}
              disabled={!selectedChapterId}
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none disabled:opacity-50"
            >
              <option value="">-- Tất cả Bài học --</option>
              {chapters.find(c => c.id === selectedChapterId)?.lessons.map((l:any) => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500"/></div>
            ) : activeExercises.length === 0 ? (
              <div className="text-center py-20 text-slate-400 font-medium flex flex-col items-center gap-3">
                <Database size={48} strokeWidth={1}/>
                Chưa có câu hỏi nào trong mục này.
              </div>
            ) : (
              activeExercises.map((q: any) => {
                const isSelected = selectedQuestions.some(sq => sq.id === q.id);
                return (
                  <div key={q.id} className={`p-4 rounded-2xl border transition-all ${isSelected ? 'border-slate-300 bg-slate-100 dark:bg-slate-800 opacity-60' : 'border-slate-200 bg-white dark:bg-[#0B0F19] dark:border-slate-800 hover:shadow-md'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded text-[10px] font-black uppercase tracking-widest">{q.type} | {q.level}</span>
                      {!isSelected ? (
                        <button 
                          onClick={() => handleAddQuestion(q)} 
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-${activeTheme.theme}-50 text-${activeTheme.theme}-600 hover:bg-${activeTheme.theme}-100 dark:bg-${activeTheme.theme}-900/30 dark:hover:bg-${activeTheme.theme}-900/50 transition-colors`}
                        >
                          <PlusCircle size={14}/> Thêm vào đề
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                          <CheckCircle2 size={14}/> Đã thêm
                        </span>
                      )}
                    </div>
                    <div className="markdown-body text-[13px] text-slate-800 dark:text-slate-300">
                      <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{q.content}</ReactMarkdown>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="w-1/2 md:w-[40%] h-full bg-slate-50 dark:bg-[#0B0F19] flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-[#111827] shrink-0">
            <h3 className="font-black text-slate-800 dark:text-white flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg bg-${activeTheme.theme}-100 dark:bg-${activeTheme.theme}-900/50 text-${activeTheme.theme}-600 flex items-center justify-center`}>
                {selectedQuestions.length}
              </div>
              Câu hỏi trong đề
            </h3>
            {selectedQuestions.length > 0 && (
              <button onClick={() => setSelectedQuestions([])} className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">Xóa tất cả</button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
            {selectedQuestions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                <LayoutTemplate size={48} className="mb-4" strokeWidth={1}/>
                <p className="text-sm font-medium">Bấm "Thêm vào đề" ở cột bên trái <br/>để xây dựng cấu trúc đề thi.</p>
              </div>
            ) : (
              selectedQuestions.map((q, i) => (
                <div key={q.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] flex gap-3 shadow-sm group relative">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[10px] text-white bg-${activeTheme.theme}-500 shrink-0 mt-0.5`}>
                    {i + 1}
                  </div>
                  <div className="markdown-body text-[13px] flex-1 line-clamp-4 dark:text-slate-300">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{q.content}</ReactMarkdown>
                  </div>
                  <button 
                    onClick={() => handleRemoveQuestion(q.id)} 
                    className="absolute top-2 right-2 text-slate-300 hover:text-red-500 bg-white dark:bg-[#111827] p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="Bỏ khỏi đề"
                  >
                    <Trash2 size={16}/>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ExamCreator;