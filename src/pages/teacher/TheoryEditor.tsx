import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Save, Image as ImageIcon, Bold, Italic, 
  Heading, List, Sigma, Loader2, LayoutTemplate, SplitSquareHorizontal 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm'; // <-- THÊM IMPORT NÀY
import 'katex/dist/katex.min.css';
import { supabase } from '../../config/supabase';

const TheoryEditor = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  
  const [lesson, setLesson] = useState<any>(null);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchLesson = async () => {
      if (!lessonId) return;
      setIsLoading(true);
      const { data, error } = await supabase
        .from('lessons')
        .select('id, title, theory_content, chapters(title)')
        .eq('id', lessonId)
        .single();

      if (data) {
        setLesson(data);
        setContent(data.theory_content || "");
      } else {
        alert("Không tìm thấy bài học!");
        navigate('/question-bank');
      }
      setIsLoading(false);
    };
    fetchLesson();
  }, [lessonId, navigate]);

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('lessons')
      .update({ theory_content: content })
      .eq('id', lessonId);

    setIsSaving(false);
    if (error) {
      alert("Lỗi lưu bài: " + error.message);
    } else {
      alert("Lưu lý thuyết thành công!");
      navigate('/question-bank');
    }
  };

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);
    
    setContent(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME; 
      const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET; 
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { 
        method: 'POST', 
        body: formData 
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error?.message);
      
      const imageUrl = data.secure_url;
      insertText(`![Hình ảnh](${imageUrl})`, '');
      
    } catch (error: any) {
      alert('Lỗi Upload ảnh: ' + error.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-blue-600 bg-slate-50 dark:bg-slate-950">
        <Loader2 size={48} className="animate-spin mb-4" />
        <p className="font-bold">Đang tải trình soạn thảo...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      
      <div className="h-16 glass border-b border-slate-200 dark:border-slate-800 flex justify-between items-center px-6 shrink-0 relative z-10">
        <div className="flex items-center gap-4">
          <Link to="/question-bank" className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="text-[10px] font-black uppercase text-blue-600 tracking-wider">Chỉnh sửa Lý thuyết</div>
            <h2 className="font-bold text-slate-800 dark:text-white truncate max-w-sm">{lesson?.title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} 
            Lưu nội dung
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-2 flex gap-2 px-6 shrink-0 items-center">
        <button onClick={() => insertText('**', '**')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg tooltip" title="In đậm"><Bold size={18}/></button>
        <button onClick={() => insertText('*', '*')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg tooltip" title="In nghiêng"><Italic size={18}/></button>
        <button onClick={() => insertText('### ', '')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg tooltip" title="Tiêu đề 3"><Heading size={18}/></button>
        <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-2"></div>
        <button onClick={() => insertText('- ', '')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg tooltip" title="Danh sách"><List size={18}/></button>
        <button onClick={() => insertText('$$ ', ' $$')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg tooltip" title="Công thức Toán (Khối)"><Sigma size={18}/></button>
        <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-2"></div>
        
        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
        <button 
          onClick={() => fileInputRef.current?.click()} 
          disabled={isUploading}
          className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg font-bold text-sm transition-colors"
        >
          {isUploading ? <Loader2 size={16} className="animate-spin"/> : <ImageIcon size={16}/>}
          Tải ảnh lên
        </button>

        <div className="ml-auto flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
          <SplitSquareHorizontal size={14}/> Chia đôi màn hình
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        <div className="flex-1 border-r border-slate-200 dark:border-slate-800 flex flex-col min-h-0 bg-slate-900">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Bắt đầu soạn thảo lý thuyết bằng Markdown và LaTeX..."
            className="flex-1 w-full p-6 bg-transparent text-green-400 font-mono text-sm leading-loose outline-none resize-none custom-scrollbar"
            spellCheck={false}
          />
        </div>

        <div className="flex-1 bg-white dark:bg-slate-900 overflow-y-auto custom-scrollbar p-8">
          {content.trim() ? (
            <div className="markdown-body text-slate-800 dark:text-slate-200 max-w-3xl mx-auto">
              {/* ĐÃ THÊM remarkGfm VÀO ĐÂY ĐỂ HỖ TRỢ KẺ BẢNG */}
              <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
              <LayoutTemplate size={64} className="mb-4" />
              <p className="font-bold">Bản xem trước sẽ hiển thị tại đây</p>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
};

export default TheoryEditor;