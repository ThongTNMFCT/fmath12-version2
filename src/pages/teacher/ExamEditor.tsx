import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  ArrowLeft, Clock, Save, Copy, FileText, 
  Database, Loader2, LayoutPanelLeft, Check, Image as ImageIcon, AlertCircle,
  BrainCircuit, Edit3, X, Calculator, Atom, Beaker, Dna, Laptop, CheckCircle2, Circle,
  FileQuestion, Code // Đã bổ sung import Code và các icon khác đầy đủ
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAppStore } from '../../store/useAppStore';
import { uploadImageToCloudinary } from '../../config/cloudinary';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';

// CẤU HÌNH THEME ĐỘNG THEO MÔN HỌC
const SUBJECT_CONFIG: Record<string, any> = {
  math: { id: 'math', name: 'Toán Học', brand: 'F-Math', icon: <Calculator size={20}/>, gradient: 'from-blue-600 to-cyan-500', text: 'text-blue-600', bg: 'bg-blue-50', hover: 'hover:border-blue-400', darkBg: 'dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', shadow: 'shadow-blue-500/30', btn: 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-400', theme: 'blue' },
  physics: { id: 'physics', name: 'Vật Lý', brand: 'F-Physics', icon: <Atom size={20}/>, gradient: 'from-indigo-600 to-blue-500', text: 'text-indigo-600', bg: 'bg-indigo-50', hover: 'hover:border-indigo-400', darkBg: 'dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800', shadow: 'shadow-indigo-500/30', btn: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-400', theme: 'indigo' },
  chemistry: { id: 'chemistry', name: 'Hóa Học', brand: 'F-Chem', icon: <Beaker size={20}/>, gradient: 'from-emerald-500 to-teal-400', text: 'text-emerald-600', bg: 'bg-emerald-50', hover: 'hover:border-emerald-400', darkBg: 'dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', shadow: 'shadow-emerald-500/30', btn: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400', theme: 'emerald' },
  biology: { id: 'biology', name: 'Sinh Học', brand: 'F-Bio', icon: <Dna size={20}/>, gradient: 'from-rose-500 to-pink-500', text: 'text-rose-600', bg: 'bg-rose-50', hover: 'hover:border-rose-400', darkBg: 'dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-800', shadow: 'shadow-rose-500/30', btn: 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/40 dark:text-rose-400', theme: 'rose' },
  it: { id: 'it', name: 'Tin Học', brand: 'F-IT', icon: <Laptop size={20}/>, gradient: 'from-purple-600 to-fuchsia-500', text: 'text-purple-600', bg: 'bg-purple-50', hover: 'hover:border-purple-400', darkBg: 'dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', shadow: 'shadow-purple-500/30', btn: 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-400', theme: 'purple' },
};

const getAiPrompt = (subjectName: string) => `Bạn là chuyên gia môn ${subjectName} của F-Prep. Đọc đề thi môn ${subjectName} và trích xuất thành mảng JSON tuyệt đối. 
Hỗ trợ 3 định dạng câu hỏi (Chuẩn BGD 2025):
1. Trắc nghiệm (mcq): { "type": "mcq", "level": "Nhận biết", "content": "...", "options": [ {"id": "A", "text": "..."} ], "correct_answer": "A", "explanation": "..." }
2. Đúng/Sai (tf): { "type": "tf", "level": "Thông hiểu", "content": "...", "options": [ {"id": "a", "text": "..."}, {"id": "b", "text": "..."}, {"id": "c", "text": "..."}, {"id": "d", "text": "..."} ], "correct_answer": {"a": true, "b": false, "c": true, "d": false}, "explanation": "..." }
3. Trả lời ngắn (saq): { "type": "saq", "level": "Vận dụng", "content": "...", "correct_answer": "12.5", "explanation": "..." }

QUY TẮC:
- Dùng dấu $ cho công thức ngắn và $$ cho khối công thức.
- Tại vị trí có hình ảnh đồ thị/bảng biểu, HÃY ĐIỀN CHÍNH XÁC CHUỖI "[CẦN CHÈN ẢNH]" VÀO JSON.
TRẢ VỀ DUY NHẤT MẢNG JSON BẮT ĐẦU BẰNG [ VÀ KẾT THÚC BẰNG ]. KHÔNG NÓI GÌ THÊM.
ĐỀ THI BÊN DƯỚI:
[DÁN ĐỀ VÀO ĐÂY]`;

const safeText = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.join('\n\n');
  if (typeof val === 'object') {
    return Object.entries(val).map(([k, v]) => `**Ý ${k}**: ${v === true ? 'Đúng' : v === false ? 'Sai' : v}`).join('\n\n');
  }
  return String(val);
};

const parseTFAnswerForEdit = (ans: any) => {
  if (typeof ans === 'string') {
    try { return JSON.parse(ans); } catch { return {}; }
  }
  return ans || {};
};

// COMPONENT NÚT UPLOAD ẢNH NỘI TUYẾN
const InlineUploadButton = ({ onUploadSuccess }: { onUploadSuccess: (url: string) => void }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadImageToCloudinary(file);
      onUploadSuccess(url);
    } catch (error: any) {
      alert('Lỗi Upload ảnh: ' + error.message);
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="my-6 p-6 border-2 border-dashed border-orange-300 bg-orange-50 dark:bg-orange-900/20 rounded-3xl flex flex-col items-center justify-center text-center shadow-sm">
      <div className="w-12 h-12 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mb-3">
        <ImageIcon size={24} />
      </div>
      <p className="text-sm font-bold text-orange-700 dark:text-orange-400 mb-3">Phát hiện vị trí cần chèn ảnh minh họa</p>
      <input type="file" ref={fileRef} onChange={handleFileChange} accept="image/*" className="hidden" />
      <button 
        onClick={() => fileRef.current?.click()}
        disabled={isUploading}
        className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition-all shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {isUploading ? <Loader2 size={18} className="animate-spin"/> : <ImageIcon size={18}/>}
        {isUploading ? 'Đang tải lên mây...' : 'Tải ảnh lên vị trí này'}
      </button>
    </div>
  );
};


const ExamEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editExamId = location.state?.examId; 

  const { currentUser } = useAppStore();
  const rawDbSubject = (currentUser.subject || '').toLowerCase().trim();
  const isValidDbSubject = Object.keys(SUBJECT_CONFIG).includes(rawDbSubject);
  const currentSubject = currentUser.role === 'admin' ? (isValidDbSubject ? rawDbSubject : 'math') : (isValidDbSubject ? rawDbSubject : 'math');
  const activeTheme = SUBJECT_CONFIG[currentSubject] || SUBJECT_CONFIG['math'];
  
  const [content, setContent] = useState("");
  const [parsedData, setParsedData] = useState<any[] | null>(null);
  const [jsonError, setJsonError] = useState(false);

  const [title, setTitle] = useState('');
  const [timeLimit, setTimeLimit] = useState<number>(45);
  
  const [isLoadingExam, setIsLoadingExam] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>(null);

  const fileInputEditRef = useRef<HTMLInputElement>(null);
  const [uploadTargetEdit, setUploadTargetEdit] = useState<{field: string, optId?: string} | null>(null);
  const [isUploadingEdit, setIsUploadingEdit] = useState(false);

  // LOAD ĐỀ CŨ
  useEffect(() => {
    const loadExistingExam = async () => {
      if (!editExamId) return;
      setIsLoadingExam(true);
      
      const { data: examData } = await supabase.from('exams').select('*').eq('id', editExamId).single();
      if (examData) {
        setTitle(examData.title);
        setTimeLimit(Math.floor(examData.time_limit / 60));
      }

      const { data: eqData } = await supabase.from('exam_questions').select('sort_order, exercises(*)').eq('exam_id', editExamId).order('sort_order', { ascending: true });

      if (eqData) {
        const loadedQuestions = eqData.map((eq: any) => eq.exercises).filter(Boolean);
        setParsedData(loadedQuestions);
      }
      setIsLoadingExam(false);
    };
    loadExistingExam();
  }, [editExamId]);

  // PARSE JSON 
  useEffect(() => {
    if (editExamId) return; 
    const timerId = setTimeout(() => {
      if (!content.trim()) {
        setParsedData(null); setJsonError(false); return;
      }
      try {
        let cleanStr = content.replace(/```json/gi, '').replace(/```/g, '').trim();
        const firstBracket = cleanStr.indexOf('['); const lastBracket = cleanStr.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1) cleanStr = cleanStr.substring(firstBracket, lastBracket + 1);
        cleanStr = cleanStr.replace(/,\s*([\]}])/g, '$1');

        const data = JSON.parse(cleanStr);
        let extractedQuestions: any[] = [];
        if (Array.isArray(data)) {
          if (data.length > 0 && data[0].questions) {
            data.forEach((section: any) => { if (Array.isArray(section.questions)) extractedQuestions.push(...section.questions); });
          } else extractedQuestions = data;
        }
        setParsedData(extractedQuestions);
        setJsonError(false);
      } catch (e) { setJsonError(true); }
    }, 500); 
    return () => clearTimeout(timerId);
  }, [content, editExamId]);

  const handleInlineUploadSuccess = (url: string, qIndex: number, field: string, localIndex: number) => {
    if (!parsedData) return;
    const newData = [...parsedData];
    let currentFieldText = newData[qIndex][field] || "";
    let matchCount = 0;
    newData[qIndex][field] = currentFieldText.replace(/\[CẦN CHÈN ẢNH\]|CẦN CHÈN ẢNH/g, (match: string) => {
      if (matchCount === localIndex) { matchCount++; return `![Hình minh họa](${url})`; }
      matchCount++; return match;
    });
    setParsedData(newData);
    if (!editExamId) setContent(JSON.stringify(newData, null, 2));
  };

  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetEdit) return;
    setIsUploadingEdit(true);
    try {
      const imageUrl = await uploadImageToCloudinary(file);
      const imgMarkdown = `\n![Hình minh họa](${imageUrl})\n`;
      
      setEditForm((prev: any) => {
        const newData = { ...prev };
        if (uploadTargetEdit.field === 'content') {
          if (newData.content?.includes('[CẦN CHÈN ẢNH]')) newData.content = newData.content.replace('[CẦN CHÈN ẢNH]', imgMarkdown);
          else newData.content = (newData.content || '') + imgMarkdown;
        } else if (uploadTargetEdit.field === 'explanation') {
          if (newData.explanation?.includes('[CẦN CHÈN ẢNH]')) newData.explanation = newData.explanation.replace('[CẦN CHÈN ẢNH]', imgMarkdown);
          else newData.explanation = (newData.explanation || '') + imgMarkdown;
        } else if (uploadTargetEdit.field === 'option' && uploadTargetEdit.optId) {
          const optIdx = newData.options.findIndex((o:any) => o.id === uploadTargetEdit.optId);
          if (optIdx !== -1) {
              const newOptions = [...newData.options];
              if (newOptions[optIdx].text?.includes('[CẦN CHÈN ẢNH]')) newOptions[optIdx].text = newOptions[optIdx].text.replace('[CẦN CHÈN ẢNH]', imgMarkdown);
              else newOptions[optIdx].text = (newOptions[optIdx].text || '') + imgMarkdown;
              newData.options = newOptions;
          }
        }
        return newData;
      });
    } catch(err: any) { alert("Lỗi tải ảnh: " + err.message); } 
    finally { setIsUploadingEdit(false); setUploadTargetEdit(null); if (fileInputEditRef.current) fileInputEditRef.current.value = ''; }
  };

  const handleCopyPrompt = () => { navigator.clipboard.writeText(getAiPrompt(activeTheme.name)); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); };

  const handleSaveInlineEdit = async () => {
    if (editingIndex === null || !parsedData) return;
    setIsSavingEdit(true);
    const newData = [...parsedData];
    const updatedQuestion = { ...editForm };

    if (editExamId && updatedQuestion.id) {
      const { error } = await supabase.from('exercises').update({
        content: updatedQuestion.content, options: updatedQuestion.options,
        correct_answer: updatedQuestion.type === 'tf' && typeof updatedQuestion.correct_answer === 'object' ? JSON.stringify(updatedQuestion.correct_answer) : updatedQuestion.correct_answer,
        explanation: updatedQuestion.explanation
      }).eq('id', updatedQuestion.id);

      if (error) { alert("Lỗi khi lưu câu hỏi lên hệ thống: " + error.message); setIsSavingEdit(false); return; }
    }

    newData[editingIndex] = updatedQuestion;
    setParsedData(newData);
    if (!editExamId) setContent(JSON.stringify(newData, null, 2));
    
    setEditingIndex(null);
    setIsSavingEdit(false);
  };

  const handlePublishExam = async () => {
    if (editExamId) { navigate('/exam-bank'); return; }

    if (!title.trim()) return alert("Vui lòng nhập Tên đề thi!");
    if (!parsedData || parsedData.length === 0) return alert("Dữ liệu đề thi đang trống hoặc JSON không hợp lệ!");
    if (content.includes("CẦN CHÈN ẢNH")) return alert("Vui lòng tải ảnh lên tại tất cả các vị trí 'CẦN CHÈN ẢNH' trước khi lưu!");
    if (editingIndex !== null) return alert("Vui lòng Lưu câu hỏi đang chỉnh sửa trước khi xuất bản!");

    setIsSaving(true);
    try {
      const { data: newExam, error: examError } = await supabase.from('exams').insert({
        teacher_id: currentUser?.id, title: title, type: 'Đề luyện thi', time_limit: timeLimit * 60, status: 'active', subject_id: currentSubject,
        tags: ['Đề luyện thi', `${parsedData.length} câu`, "Chuẩn 2025"]
      }).select().single();
      if (examError) throw examError;

      let chapId;
      const { data: existingChap } = await supabase.from('chapters').select('id').eq('title', 'Kho Đề Thi (AI)').eq('subject_id', currentSubject).maybeSingle();
      if (existingChap) chapId = existingChap.id;
      else { const { data: newChap } = await supabase.from('chapters').insert({ title: 'Kho Đề Thi (AI)', sort_order: 999, subject_id: currentSubject }).select().single(); chapId = newChap?.id; }

      const { data: newLesson } = await supabase.from('lessons').insert({ chapter_id: chapId, title: `[Đề thi] ${title}`, sort_order: Date.now() }).select().single();

      const insertPayload = parsedData.map((q: any, index: number) => ({
        lesson_id: newLesson?.id, content: q.content, type: q.type || 'mcq', level: q.level || 'Nhận biết',
        options: q.options || [], correct_answer: q.type === 'tf' && typeof q.correct_answer === 'object' ? JSON.stringify(q.correct_answer) : q.correct_answer || 'A', explanation: q.explanation || '', sort_order: index + 1
      }));

      const chunkSize = 10;
      let insertedExs: any[] = [];
      for (let i = 0; i < insertPayload.length; i += chunkSize) {
        const { data: chunkData, error: chunkErr } = await supabase.from('exercises').insert(insertPayload.slice(i, i + chunkSize)).select();
        if (chunkErr) throw chunkErr;
        if (chunkData) insertedExs.push(...chunkData);
      }

      const eqPayload = insertedExs.map((ex, i) => ({ exam_id: newExam.id, exercise_id: ex.id, sort_order: i + 1 }));
      for (let i = 0; i < eqPayload.length; i += chunkSize) {
        await supabase.from('exam_questions').insert(eqPayload.slice(i, i + chunkSize));
      }

      alert(`Xuất bản thành công Đề thi với ${insertedExs.length} câu hỏi!`);
      navigate('/exam-bank', { state: { activeTab: 'Đề luyện thi' } });

    } catch (error: any) { alert("Lỗi xuất bản: " + error.message); } 
    finally { setIsSaving(false); }
  };

  const renderContentWithUploads = (textContent: string, qIndex: number, fieldName: string) => {
    if (!textContent) return null;
    const parts = textContent.split(/\[CẦN CHÈN ẢNH\]|CẦN CHÈN ẢNH/);
    
    return parts.map((part, index) => (
      <React.Fragment key={index}>
        {part.trim() && (
          <div className="markdown-body text-slate-800 dark:text-slate-200 text-[15px] mb-4 overflow-x-auto font-medium">
            <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]} components={{ img: ({node, src, alt, ...props}) => (<img src={src} alt={alt} className="max-w-[80%] h-auto mx-auto rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 my-6 block" {...props} />) }}>
              {part}
            </ReactMarkdown>
          </div>
        )}
        {index < parts.length - 1 && <InlineUploadButton onUploadSuccess={(url) => handleInlineUploadSuccess(url, qIndex, fieldName, index)} />}
      </React.Fragment>
    ));
  };

  if (isLoadingExam) return <div className="flex h-screen items-center justify-center text-blue-600"><Loader2 size={40} className="animate-spin mb-4"/></div>

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      
      {/* Input file ẩn dùng chung cho các nút Upload trong lúc chỉnh sửa */}
      <input type="file" ref={fileInputEditRef} onChange={handleEditImageUpload} accept="image/*" className="hidden" />

      {/* HEADER CONTROL BAR */}
      <div className="glass border-b border-slate-200 dark:border-slate-800 p-4 shrink-0 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#111827]">
        <div className="flex items-center gap-4 flex-1">
          <Link to="/exam-bank" className="p-2 text-slate-500 hover:bg-slate-100 dark:bg-slate-800 rounded-xl transition-colors"><ArrowLeft size={20} /></Link>
          <div className="flex-1 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-xl flex-1 max-w-md border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
              <FileQuestion size={18} className="text-blue-500 shrink-0"/>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} disabled={!!editExamId} placeholder="Nhập tên Đề thi..." className="bg-transparent border-none outline-none font-bold text-slate-800 dark:text-white w-full disabled:opacity-70 text-sm"/>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 w-32 shrink-0 focus-within:ring-2 focus-within:ring-orange-500/50 transition-all">
              <Clock size={18} className="text-orange-500 shrink-0"/>
              <input type="number" value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))} disabled={!!editExamId} placeholder="Phút" className="bg-transparent border-none outline-none font-bold text-slate-800 dark:text-white w-full disabled:opacity-70 text-sm text-center"/>
            </div>
          </div>
        </div>

        <button onClick={handlePublishExam} disabled={isSaving || (jsonError && !editExamId) || !parsedData} className={`bg-gradient-to-r ${activeTheme.gradient} hover:opacity-90 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50 shrink-0 text-sm`}>
          {isSaving ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>} {editExamId ? 'Lưu Đề Thi' : 'Xuất bản Đề thi'}
        </button>
      </div>

      {/* SUB-HEADER COPY PROMPT */}
      {!editExamId && (
        <div className="bg-white dark:bg-[#111827] border-b border-slate-200 dark:border-slate-800 py-3 px-6 shrink-0 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={handleCopyPrompt} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${isCopied ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}>
              {isCopied ? <><Check size={16}/> Đã Copy Prompt</> : <><Copy size={16}/> Copy Prompt AI ({activeTheme.name})</>}
            </button>
            {jsonError && content.trim() && (
               <span className="text-sm font-bold text-rose-600 flex items-center gap-1.5 bg-rose-50 px-3 py-2 rounded-lg border border-rose-200 dark:bg-rose-900/20 dark:border-rose-800/50"><AlertCircle size={16}/> Lỗi cú pháp JSON. Vui lòng kiểm tra lại mã nguồn.</span>
            )}
            {!jsonError && parsedData && parsedData.length > 0 && (
               <span className="text-sm font-bold text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50"><CheckCircle2 size={16}/> Nhận diện thành công {parsedData.length} câu hỏi.</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
            <LayoutPanelLeft size={16}/> Trái: Mã JSON / Phải: Chỉnh sửa trực tiếp
          </div>
        </div>
      )}

      {/* SPLIT PANE WORKSPACE */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">
        
        {/* JSON EDITOR (Chỉ hiện khi tạo mới) */}
        {!editExamId && (
          <div className="w-full md:w-[45%] border-r border-slate-800 flex flex-col min-h-0 bg-[#0B1120] relative z-10 shadow-2xl">
            <div className="absolute top-0 right-0 p-2 opacity-50 pointer-events-none"><Code size={64} className="text-slate-700"/></div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Dán toàn bộ kết quả JSON từ AI vào đây..."
              className="flex-1 w-full p-8 pb-20 bg-transparent text-emerald-400 font-mono text-[13px] leading-loose outline-none resize-none custom-scrollbar relative z-20 placeholder:text-slate-600"
              spellCheck={false}
            />
          </div>
        )}

        {/* VISUAL EDITOR / PREVIEW AREA */}
        <div className={`flex-1 bg-slate-50/80 dark:bg-[#0B0F19] overflow-y-auto custom-scrollbar p-6 md:p-10 relative ${editExamId ? 'w-full max-w-4xl mx-auto' : ''}`}>
          {parsedData && parsedData.length > 0 ? (
            <div className="space-y-8 max-w-3xl mx-auto pb-20">
              {parsedData.map((q: any, i: number) => {
                
                // MÀN HÌNH EDIT FORM CHO TỪNG CÂU
                if (editingIndex === i) {
                  return (
                    <div key={i} className={`bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[32px] shadow-2xl border-2 ${activeTheme.border} ring-4 ring-${activeTheme.theme}-500/10 relative animate-in fade-in zoom-in-95 duration-200 z-50`}>
                      <div className={`flex items-center gap-2 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800`}>
                        <div className={`w-10 h-10 rounded-xl ${activeTheme.bg} ${activeTheme.text} flex items-center justify-center`}><Edit3 size={20}/></div>
                        <span className="font-black text-xl text-slate-800 dark:text-white">Đang sửa Câu {i + 1}</span>
                      </div>

                      <div className="space-y-6">
                        {/* CONTENT EDIT */}
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nội dung câu hỏi (Hỗ trợ Markdown + LaTeX)</label>
                            <button type="button" onClick={() => { setUploadTargetEdit({field: 'content'}); fileInputEditRef.current?.click(); }} disabled={isUploadingEdit} className="text-[11px] bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 hover:bg-orange-200 transition-colors disabled:opacity-50">
                              {isUploadingEdit && uploadTargetEdit?.field === 'content' ? <Loader2 size={14} className="animate-spin"/> : <ImageIcon size={14}/>} Tải ảnh nội tuyến
                            </button>
                          </div>
                          <textarea 
                            value={editForm.content} 
                            onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                            className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 min-h-[120px] text-[15px] font-mono custom-scrollbar dark:text-slate-200 transition-all"
                            placeholder="Soạn nội dung..."
                          />
                        </div>

                        {/* MCQ EDIT */}
                        {editForm.type === 'mcq' && editForm.options && (
                          <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Các phương án (Chọn đáp án đúng)</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {editForm.options.map((opt: any, optIdx: number) => {
                                const isCorrect = editForm.correct_answer === opt.id;
                                return (
                                  <div key={opt.id} className={`rounded-2xl border-2 transition-all overflow-hidden flex flex-col ${isCorrect ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10 shadow-sm' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'}`}>
                                    <div className={`flex justify-between items-center px-4 py-2.5 border-b ${isCorrect ? 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-100/50 dark:bg-emerald-900/30' : 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/50'}`}>
                                      <button onClick={() => setEditForm({...editForm, correct_answer: opt.id})} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${isCorrect ? 'bg-emerald-500 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'}`}>
                                        {isCorrect ? <CheckCircle2 size={16}/> : <Circle size={16}/>} Đáp án {opt.id}
                                      </button>
                                      <button type="button" onClick={() => { setUploadTargetEdit({field: 'option', optId: opt.id}); fileInputEditRef.current?.click(); }} disabled={isUploadingEdit} className="text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 px-2.5 py-1 rounded flex items-center gap-1 hover:bg-slate-50 transition-colors disabled:opacity-50 font-bold">
                                        <ImageIcon size={12}/> Ảnh
                                      </button>
                                    </div>
                                    <textarea 
                                      value={opt.text}
                                      onChange={(e) => {
                                        const newOpts = [...editForm.options];
                                        newOpts[optIdx].text = e.target.value;
                                        setEditForm({...editForm, options: newOpts});
                                      }}
                                      className="w-full flex-1 p-3 bg-transparent outline-none text-[15px] font-mono custom-scrollbar dark:text-slate-300 min-h-[80px]"
                                      placeholder="Nội dung đáp án..."
                                    />
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* TF EDIT */}
                        {editForm.type === 'tf' && editForm.options && (
                          <div className="flex flex-col gap-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Các mệnh đề (Chọn Đúng/Sai)</label>
                            {editForm.options.map((opt: any, optIdx: number) => {
                              const optId = String(opt.id).toLowerCase();
                              const parsedAns = parseTFAnswerForEdit(editForm.correct_answer);
                              const isTrue = parsedAns?.[optId] === true;
                              const isFalse = parsedAns?.[optId] === false;
                              
                              return (
                                <div key={opt.id} className="border-2 border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 flex flex-col md:flex-row items-stretch md:items-center overflow-hidden transition-all focus-within:border-blue-400">
                                  <div className="flex flex-col justify-center px-4 py-3 bg-slate-100 dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 w-full md:w-32 shrink-0">
                                    <span className="font-black text-slate-700 dark:text-slate-300 text-sm mb-2 text-center">Ý {opt.id}</span>
                                    <div className="flex bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700 shadow-sm mx-auto">
                                      <button onClick={() => { const newAns = { ...parsedAns, [optId]: true }; setEditForm({ ...editForm, correct_answer: newAns }); }} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${isTrue ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>ĐÚNG</button>
                                      <button onClick={() => { const newAns = { ...parsedAns, [optId]: false }; setEditForm({ ...editForm, correct_answer: newAns }); }} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${isFalse ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>SAI</button>
                                    </div>
                                  </div>
                                  <div className="flex-1 relative flex">
                                    <textarea 
                                      value={opt.text}
                                      onChange={(e) => {
                                        const newOpts = [...editForm.options];
                                        newOpts[optIdx].text = e.target.value;
                                        setEditForm({...editForm, options: newOpts});
                                      }}
                                      className="w-full flex-1 p-4 bg-transparent outline-none text-[15px] font-mono custom-scrollbar dark:text-slate-200"
                                      rows={2}
                                      placeholder="Nội dung mệnh đề..."
                                    />
                                    <button type="button" onClick={() => { setUploadTargetEdit({field: 'option', optId: opt.id}); fileInputEditRef.current?.click(); }} disabled={isUploadingEdit} className="absolute bottom-2 right-2 text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded flex items-center gap-1 hover:bg-slate-50 transition-colors disabled:opacity-50 text-slate-500 font-bold shadow-sm">
                                      <ImageIcon size={12}/> Ảnh
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* SAQ EDIT */}
                        {editForm.type === 'saq' && (
                          <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Đáp án đúng (Điền khuyết)</label>
                            <input 
                              type="text" 
                              value={editForm.correct_answer} 
                              onChange={(e) => setEditForm({...editForm, correct_answer: e.target.value})}
                              className="w-full md:max-w-xs p-4 rounded-2xl border-2 border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 outline-none focus:ring-4 focus:ring-emerald-500/20 font-black text-xl text-center shadow-inner transition-all"
                              placeholder="VD: 12.5"
                            />
                          </div>
                        )}

                        {/* EXPLANATION EDIT */}
                        <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-2xl border border-purple-200 dark:border-purple-800/50">
                          <div className="flex justify-between items-center mb-3">
                            <label className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase flex items-center gap-1.5"><BrainCircuit size={16}/> Lời giải chi tiết</label>
                            <button type="button" onClick={() => { setUploadTargetEdit({field: 'explanation'}); fileInputEditRef.current?.click(); }} disabled={isUploadingEdit} className="text-[11px] bg-white border border-purple-200 text-purple-700 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 hover:bg-purple-100 transition-colors shadow-sm disabled:opacity-50">
                              {isUploadingEdit && uploadTargetEdit?.field === 'explanation' ? <Loader2 size={14} className="animate-spin"/> : <ImageIcon size={14}/>} Tải ảnh
                            </button>
                          </div>
                          <textarea 
                            value={editForm.explanation} 
                            onChange={(e) => setEditForm({...editForm, explanation: e.target.value})}
                            className="w-full p-4 rounded-xl border border-purple-200 dark:border-purple-700/50 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-purple-400 min-h-[100px] text-[15px] font-mono custom-scrollbar dark:text-slate-200 transition-all"
                            placeholder="Giải thích chi tiết các bước làm..."
                          />
                        </div>

                        {/* ACTIONS */}
                        <div className="flex gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                          <button onClick={() => setEditingIndex(null)} className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3.5 rounded-xl transition-colors text-sm">Hủy bỏ</button>
                          <button onClick={handleSaveInlineEdit} disabled={isSavingEdit} className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-2 disabled:opacity-50 text-sm hover:-translate-y-0.5">
                            {isSavingEdit ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>} Lưu thay đổi
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                // ==========================================
                // MÀN HÌNH PREVIEW VIEW 
                // ==========================================
                let typeLabel = "Trắc nghiệm 4 đáp án";
                if (q.type === 'tf') typeLabel = "Trắc nghiệm Đúng/Sai";
                if (q.type === 'saq') typeLabel = "Trả lời ngắn";

                return (
                  <div key={i} className={`bg-white dark:bg-[#111827] p-6 md:p-8 rounded-[32px] shadow-sm border-2 border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all group relative ${editingIndex !== null ? 'opacity-40 pointer-events-none grayscale-[30%]' : ''}`}>
                    <button 
                      onClick={() => { setEditingIndex(i); setEditForm(JSON.parse(JSON.stringify(q))); }} 
                      className={`absolute top-6 right-6 ${activeTheme.bg} ${activeTheme.text} hover:opacity-80 px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-sm z-20 flex items-center gap-2 font-bold text-sm`}
                      title="Sửa trực tiếp câu hỏi này"
                    >
                      <Edit3 size={16}/> Sửa câu hỏi
                    </button>

                    <div className="flex flex-wrap items-center gap-3 mb-6 pr-32">
                      <span className={`px-4 py-1.5 ${activeTheme.gradient} bg-gradient-to-r text-white text-sm font-black uppercase rounded-xl shadow-md`}>Câu {i + 1}</span>
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">{q.level}</span>
                      <span className="text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-lg border border-orange-200 dark:border-orange-800/50">{typeLabel}</span>
                    </div>

                    {renderContentWithUploads(q.content, i, 'content')}

                    {q.type === 'mcq' && q.options && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 mt-6">
                        {q.options.map((opt: any, oIdx: number) => {
                          const rawOptId = opt.id || ['A', 'B', 'C', 'D'][oIdx] || String(oIdx);
                          const isCorrect = rawOptId === q.correct_answer;
                          return (
                            <div key={opt.id} className={`p-4 rounded-2xl border-2 flex items-start gap-4 transition-all ${isCorrect ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 shadow-sm' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50'}`}>
                              <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-black shadow-sm ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-700 text-slate-500 border border-slate-200 dark:border-slate-600'}`}>{rawOptId}</div>
                              <div className="markdown-body flex-1 text-[15px] mt-1 overflow-x-auto"><ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{opt.text}</ReactMarkdown></div>
                              {isCorrect && <CheckCircle2 className="text-emerald-500 shrink-0" size={20}/>}
                              {opt.text?.includes('CẦN CHÈN ẢNH') && <InlineUploadButton onUploadSuccess={(url) => handleInlineUploadSuccess(url, i, 'option', oIdx)} />}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {q.type === 'tf' && q.options && (
                      <div className="flex flex-col gap-3 mb-4 mt-6">
                        {q.options.map((opt: any, oIdx: number) => {
                          const rawOptId = opt.id || ['a', 'b', 'c', 'd'][oIdx] || String(oIdx);
                          const optId = String(rawOptId).toLowerCase().trim();
                          const parsedCorrect = parseTFAnswerForEdit(q.correct_answer);
                          const isTrue = parsedCorrect[optId] === true;

                          return (
                            <div key={opt.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-start md:items-center gap-4 bg-slate-50 dark:bg-slate-800/50">
                              <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-black bg-white dark:bg-slate-700 text-slate-500 border border-slate-200 dark:border-slate-600 shadow-sm">{optId}</div>
                              <div className="markdown-body flex-1 text-[15px] mt-1 overflow-x-auto min-w-0"><ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>{opt.text}</ReactMarkdown></div>
                              <div className={`shrink-0 px-4 py-2 rounded-xl text-xs font-black shadow-sm ${isTrue ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-rose-100 text-rose-700 border border-rose-200'}`}>
                                {isTrue ? 'ĐÚNG' : 'SAI'}
                              </div>
                              {opt.text?.includes('CẦN CHÈN ẢNH') && <div className="w-full mt-2"><InlineUploadButton onUploadSuccess={(url) => handleInlineUploadSuccess(url, i, 'option', oIdx)} /></div>}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {q.type === 'saq' && (
                      <div className="mb-6 mt-6">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Đáp án đúng điền khuyết:</div>
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border-2 border-emerald-400 rounded-2xl font-black text-emerald-700 dark:text-emerald-400 text-2xl inline-block min-w-[150px] text-center shadow-inner">
                          {q.correct_answer}
                        </div>
                      </div>
                    )}

                    {q.explanation && (
                      <div className="mt-8 p-6 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-200 dark:border-purple-800/50 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-400"></div>
                        <div className="flex items-center gap-2 mb-3 text-purple-700 dark:text-purple-400 font-black text-sm uppercase tracking-wider">
                          <BrainCircuit size={18} /> Giải chi tiết:
                        </div>
                        {renderContentWithUploads(q.explanation, i, 'explanation')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60 animate-in fade-in zoom-in duration-500">
              <Database size={80} className="mb-6 drop-shadow-md" strokeWidth={1}/>
              <p className="font-black text-2xl mb-2 text-slate-500">Khu vực Trống</p>
              <p className="text-sm max-w-sm text-center leading-relaxed font-medium">Hãy dán JSON từ F-Prep AI vào khung bên trái để hệ thống tự động sinh đề thi tuyệt đẹp nhé.</p>
            </div>
          )}
        </div>
      </div>

      {/* LOADER TRÀN MÀN HÌNH KHI ĐANG UPLOAD */}
      {isUploadingEdit && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
          <Loader2 size={48} className="animate-spin mb-4" />
          <p className="font-bold">Đang xử lý hình ảnh...</p>
        </div>
      )}
    </div>
  );
};

export default ExamEditor;