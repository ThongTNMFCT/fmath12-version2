import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Library, PlusCircle, Clock, Users, PlayCircle, Edit3, Trash2, 
  Send, Loader2, BookOpen, GraduationCap, X, Save, CalendarClock, 
  History, Folder, ChevronDown, ChevronRight, FileJson, Target, Lock,
  Calculator, Atom, Beaker, Dna, Laptop, ListChecks
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { examService } from '../../services/examService';
import { supabase } from '../../config/supabase';

// CẤU HÌNH THEME ĐỘNG THEO MÔN HỌC
const SUBJECT_CONFIG: Record<string, any> = {
  math: { id: 'math', name: 'Toán Học', brand: 'F-Math', icon: <Calculator size={20}/>, gradient: 'from-blue-600 to-cyan-500', text: 'text-blue-600', bg: 'bg-blue-50', hover: 'hover:border-blue-400', darkBg: 'dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', shadow: 'shadow-blue-500/30', btn: 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-400', theme: 'blue' },
  physics: { id: 'physics', name: 'Vật Lý', brand: 'F-Physics', icon: <Atom size={20}/>, gradient: 'from-indigo-600 to-blue-500', text: 'text-indigo-600', bg: 'bg-indigo-50', hover: 'hover:border-indigo-400', darkBg: 'dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800', shadow: 'shadow-indigo-500/30', btn: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-400', theme: 'indigo' },
  chemistry: { id: 'chemistry', name: 'Hóa Học', brand: 'F-Chem', icon: <Beaker size={20}/>, gradient: 'from-emerald-500 to-teal-400', text: 'text-emerald-600', bg: 'bg-emerald-50', hover: 'hover:border-emerald-400', darkBg: 'dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', shadow: 'shadow-emerald-500/30', btn: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400', theme: 'emerald' },
  biology: { id: 'biology', name: 'Sinh Học', brand: 'F-Bio', icon: <Dna size={20}/>, gradient: 'from-rose-500 to-pink-500', text: 'text-rose-600', bg: 'bg-rose-50', hover: 'hover:border-rose-400', darkBg: 'dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-800', shadow: 'shadow-rose-500/30', btn: 'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/40 dark:text-rose-400', theme: 'rose' },
  it: { id: 'it', name: 'Tin Học', brand: 'F-IT', icon: <Laptop size={20}/>, gradient: 'from-purple-600 to-fuchsia-500', text: 'text-purple-600', bg: 'bg-purple-50', hover: 'hover:border-purple-400', darkBg: 'dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', shadow: 'shadow-purple-500/30', btn: 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-400', theme: 'purple' },
};

const getCardTheme = (type: string) => {
  switch(type) {
    case 'VSAT': return { badge: 'bg-teal-50 text-teal-700 border border-teal-200', text: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-900/20' };
    case 'ĐGNL': return { badge: 'bg-purple-50 text-purple-700 border border-purple-200', text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' };
    case 'Chuyên đề': return { badge: 'bg-orange-50 text-orange-700 border border-orange-200', text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' };
    default: return { badge: 'bg-blue-50 text-blue-700 border border-blue-200', text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' };
  }
};

const TABS = ['Đề luyện thi', 'ĐGNL', 'VSAT', 'Chuyên đề'];

const ExamBank = () => {
  const { currentUser } = useAppStore();
  const location = useLocation(); 
  const navigate = useNavigate(); 
  
  const rawDbSubject = (currentUser.subject || '').toLowerCase().trim();
  const isValidDbSubject = Object.keys(SUBJECT_CONFIG).includes(rawDbSubject);
  const fallbackSubject = isValidDbSubject ? rawDbSubject : 'math';

  const [adminSubject, setAdminSubject] = useState(fallbackSubject);
  const currentSubject = currentUser.role === 'admin' ? adminSubject : fallbackSubject;
  const activeTheme = SUBJECT_CONFIG[currentSubject] || SUBJECT_CONFIG['math'];

  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('Đề luyện thi');

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
  const [assignForm, setAssignForm] = useState({ classId: '', dueDate: '' });
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [editDates, setEditDates] = useState<Record<string, string>>({});

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const [showEditModal, setShowEditModal] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editingExam, setEditingExam] = useState({ id: '', title: '', type: 'Đề luyện thi', timeLimit: 45, group_name: '' });

  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [isSavingJson, setIsSavingJson] = useState(false);
  const [newExamConfig, setNewExamConfig] = useState({ title: '', timeLimit: 45, type: 'Đề luyện thi', group_name: 'Đề mới tạo' });

  const fetchData = async () => {
    setIsLoading(true);
    const [examsData, { data: classesData }] = await Promise.all([
      examService.getTeacherExams(currentUser?.id || '', currentSubject),
      supabase.from('classes').select('id, name').order('created_at', { ascending: false })
    ]);
    
    const examsWithCount = await Promise.all(examsData.map(async (ex: any) => {
      const { count } = await supabase.from('exam_questions').select('*', { count: 'exact', head: true }).eq('exam_id', ex.id);
      const { count: attemptsCount } = await supabase.from('exam_attempts').select('*', { count: 'exact', head: true }).eq('exam_id', ex.id);
      return { ...ex, questionsCount: count || 0, attemptsCount: attemptsCount || 0 };
    }));

    setExams(examsWithCount);
    setTeacherClasses(classesData || []);
    if (classesData && classesData.length > 0) setAssignForm(prev => ({...prev, classId: classesData[0].id}));
    setIsLoading(false);

    if (location.state && (location.state as any).activeTab) {
      setActiveTab((location.state as any).activeTab);
    }
  };

  useEffect(() => {
    if (currentUser?.id) fetchData();
  }, [currentUser?.id, currentSubject, location.key]); // <--- ĐÃ FIX LỖI SPAM EFFECT

  const formatToLocalDatetime = (isoString: string) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const loadAssignments = async (examId: string) => {
    setIsLoadingAssignments(true);
    const { data } = await supabase.from('class_exams').select(`class_id, due_date, classes (name)`).eq('exam_id', examId);
    
    if (data) {
      setAssignments(data);
      const initialDates: Record<string, string> = {};
      data.forEach(item => { initialDates[item.class_id] = formatToLocalDatetime(item.due_date); });
      setEditDates(initialDates);
    }
    setIsLoadingAssignments(false);
  };

  const handleOpenAssignModal = (exam: any) => {
    if (teacherClasses.length === 0) return alert("Hệ thống chưa có lớp học nào. Hãy tạo lớp trước!");
    setSelectedExam(exam);
    setShowAssignModal(true);
    loadAssignments(exam.id); 
  };

  const handleAssignExam = async () => {
    if (!assignForm.classId || !assignForm.dueDate) return alert("Vui lòng chọn Lớp và đặt Hạn chót!");
    if (assignments.some(a => a.class_id === assignForm.classId)) {
      return alert("Lớp này đã được giao đề rồi! Vui lòng chỉnh sửa hạn chót ở danh sách bên dưới.");
    }

    setIsAssigning(true);
    const { error } = await supabase.from('class_exams').insert({ 
      class_id: assignForm.classId, 
      exam_id: selectedExam.id, 
      due_date: new Date(assignForm.dueDate).toISOString() 
    });

    if (error) alert("Lỗi giao bài: " + error.message);
    else { alert("Giao bài tập thành công!"); loadAssignments(selectedExam.id); }
    setIsAssigning(false);
  };

  const handleUpdateAssignment = async (classId: string) => {
    const newDate = editDates[classId];
    if (!newDate) return;
    const { error } = await supabase.from('class_exams').update({ 
      due_date: new Date(newDate).toISOString() 
    }).eq('exam_id', selectedExam.id).eq('class_id', classId);
    
    if (error) alert("Lỗi cập nhật: " + error.message); 
    else alert("Đã cập nhật Hạn chót mới thành công!");
  };

  const handleDeleteAssignment = async (classId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn thu hồi đề thi khỏi lớp này? Các học sinh chưa làm sẽ không thấy đề nữa.")) return;
    const { error } = await supabase.from('class_exams').delete().eq('exam_id', selectedExam.id).eq('class_id', classId);
    if (error) alert("Lỗi thu hồi: " + error.message); else loadAssignments(selectedExam.id);
  };

  const handleDeleteExam = async (id: string) => {
    if (!window.confirm("CẢNH BÁO: Xóa đề thi này sẽ xóa sạch kết quả làm bài của học sinh. Chắc chắn xóa?")) return;
    const { error } = await supabase.from('exams').delete().eq('id', id);
    if (!error) setExams(prev => prev.filter(exam => exam.id !== id));
  };

  const openEditModal = (exam: any) => {
    setEditingExam({ id: exam.id, title: exam.title, type: exam.type, timeLimit: Math.floor(exam.time_limit / 60), group_name: exam.group_name || '' });
    setShowEditModal(true);
  };

  const handleUpdateExam = async () => {
    if (!editingExam.title.trim()) return alert("Vui lòng nhập tên đề thi!");
    setIsSavingEdit(true);
    
    const timeLimitInSeconds = Number(editingExam.timeLimit) * 60;
    
    const { error } = await supabase.from('exams').update({
      title: editingExam.title, 
      type: editingExam.type, 
      time_limit: timeLimitInSeconds, 
      group_name: editingExam.group_name
    }).eq('id', editingExam.id);

    if (!error) {
      setExams(prev => prev.map(e => e.id === editingExam.id ? { ...e, title: editingExam.title, type: editingExam.type, time_limit: timeLimitInSeconds, group_name: editingExam.group_name } : e));
      setShowEditModal(false);
      if (editingExam.type !== activeTab) setActiveTab(editingExam.type);
    } else {
      alert("Cập nhật thất bại: " + error.message);
    }
    setIsSavingEdit(false);
  };

  const handleImportJSON = async () => {
    if (!newExamConfig.title.trim() || !jsonInput.trim()) return alert("Vui lòng nhập Tên đề và dán nội dung JSON!");
    setIsSavingJson(true);

    try {
      let cleanStr = jsonInput.replace(/```json/gi, '').replace(/```/g, '').trim();
      const firstBracket = cleanStr.indexOf('['); 
      const lastBracket = cleanStr.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1) {
        cleanStr = cleanStr.substring(firstBracket, lastBracket + 1);
      }
      cleanStr = cleanStr.replace(/,\s*([\]}])/g, '$1'); 
      
      const parsed = JSON.parse(cleanStr);
      let extractedQuestions: any[] = [];
      if (Array.isArray(parsed)) {
        if (parsed.length > 0 && parsed[0].questions) {
          parsed.forEach((section: any) => { if (Array.isArray(section.questions)) extractedQuestions.push(...section.questions); });
        } else extractedQuestions = parsed;
      }

      if (extractedQuestions.length === 0) throw new Error("JSON không chứa câu hỏi hợp lệ hoặc sai cấu trúc.");

      const timeLimitInSeconds = Number(newExamConfig.timeLimit) * 60;

      const { data: newExam, error: examErr } = await supabase.from('exams').insert({
        title: newExamConfig.title, 
        type: newExamConfig.type, 
        time_limit: timeLimitInSeconds,
        group_name: newExamConfig.group_name, 
        teacher_id: currentUser?.id, 
        subject_id: currentSubject, 
        status: 'active',
        tags: [newExamConfig.type, `${extractedQuestions.length} câu`, 'AI Gen']
      }).select().single();

      if (examErr) throw examErr;

      let chapId;
      const { data: existingChap } = await supabase.from('chapters').select('id').eq('title', 'Kho Đề Thi (AI)').eq('subject_id', currentSubject).maybeSingle();
      if (existingChap) chapId = existingChap.id;
      else { 
        const { data: newChap } = await supabase.from('chapters').insert({ title: 'Kho Đề Thi (AI)', sort_order: 999, subject_id: currentSubject }).select().single(); 
        chapId = newChap?.id; 
      }
      const { data: newLesson } = await supabase.from('lessons').insert({ chapter_id: chapId, title: `[Đề] ${newExamConfig.title}`, sort_order: Date.now() }).select().single();

      const questionsToInsert = extractedQuestions.map((q:any, index:number) => ({
        lesson_id: newLesson?.id, 
        type: q.type || 'mcq', 
        content: q.content || q.question || '', 
        options: q.options || [], 
        correct_answer: typeof q.correct_answer === 'object' ? JSON.stringify(q.correct_answer) : q.correct_answer?.toString(),
        explanation: q.explanation || '', 
        sort_order: index + 1,
        level: q.level || 'Nhận biết'
      }));

      let insertedExs: any[] = [];
      const chunkSize = 10;
      for (let i = 0; i < questionsToInsert.length; i += chunkSize) {
        const { data: chunkData, error: chunkErr } = await supabase.from('exercises').insert(questionsToInsert.slice(i, i + chunkSize)).select();
        if (chunkErr) throw chunkErr; 
        if (chunkData) insertedExs.push(...chunkData);
      }

      const eqPayload = insertedExs.map((ex, i) => ({ exam_id: newExam!.id, exercise_id: ex.id, sort_order: i + 1 }));
      for (let i = 0; i < eqPayload.length; i += chunkSize) {
        const { error: linkErr } = await supabase.from('exam_questions').insert(eqPayload.slice(i, i + chunkSize)); 
        if (linkErr) throw linkErr;
      }

      alert(`Đã tạo đề thi thành công với ${insertedExs.length} câu hỏi!`); 
      setShowJsonModal(false); 
      setJsonInput(""); 
      fetchData(); 

    } catch (e: any) { 
      alert("Lỗi xử lý JSON: " + e.message); 
    } finally { 
      setIsSavingJson(false); 
    }
  };

  const filteredExams = exams.filter(exam => exam.type === activeTab);
  const groupedExams = filteredExams.reduce((acc, exam) => {
    const group = exam.group_name?.trim() || 'Khác (Chưa phân nhóm)';
    if (!acc[group]) acc[group] = []; 
    acc[group].push(exam); 
    return acc;
  }, {} as Record<string, any[]>);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupName]: prev[groupName] === false ? true : false }));
  };

  if (currentUser.role === 'teacher' && !isValidDbSubject) {
    return <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] w-full bg-[#F8FAFC] dark:bg-[#0B0F19] p-10"><Lock size={48} className="text-slate-400 mb-6"/><h2 className="text-2xl font-black dark:text-white">Không gian bị khóa</h2><p className="text-slate-500 font-medium">Tài khoản của bạn chưa được cấp bộ môn hợp lệ. Vui lòng liên hệ Admin.</p></div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full relative animate-in fade-in overflow-hidden font-sans bg-slate-50 dark:bg-[#0B0F19]">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 pb-32">
        <div className="max-w-6xl mx-auto w-full">
          
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
            <div>
              <div className={`inline-flex items-center gap-2 ${activeTheme.bg} ${activeTheme.darkBg} ${activeTheme.text} px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest mb-3 border ${activeTheme.border} shadow-sm`}>{activeTheme.icon} Kho Đề {activeTheme.name}</div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-3"><Library className={activeTheme.text}/> Ngân hàng Đề thi</h2>
              <p className="text-slate-600 dark:text-slate-400 font-medium">Tạo đề thi bằng JSON AI hoặc quản lý các đề có sẵn.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link to="/exam-editor" className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-5 py-3 rounded-xl font-bold flex gap-2 text-sm shadow-sm"><Edit3 size={18} /> Soạn đề AI</Link>
              <button onClick={() => setShowJsonModal(true)} className={`bg-gradient-to-r ${activeTheme.gradient} text-white px-6 py-3 rounded-xl font-bold flex gap-2 shadow-md text-sm`}><FileJson size={18} /> Nhập đề JSON nhanh</button>
            </div>
          </div>
          
          {/* CẬP NHẬT TABS VỚI GIAO DIỆN ĐẸP HƠN */}
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

          <div className="space-y-6">
            {Object.entries(groupedExams).map(([groupName, groupExams]) => (
              <div key={groupName} className="bg-white dark:bg-[#111827] rounded-[32px] border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow">
                <div onClick={() => toggleGroup(groupName)} className="flex items-center justify-between cursor-pointer pb-2 hover:opacity-80 transition-opacity">
                  <div className="flex items-center gap-3"><Folder className={`${activeTheme.text} opacity-50`} size={26}/><h3 className="text-xl font-black text-slate-900 dark:text-white">{groupName} <span className="text-sm font-medium text-slate-500 ml-2">({groupExams.length} đề)</span></h3></div>
                  {expandedGroups[groupName] === false ? <ChevronRight className="text-slate-400"/> : <ChevronDown className="text-slate-400"/>}
                </div>
                {expandedGroups[groupName] !== false && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/50">
                    {groupExams.map(exam => {
                      const badgeClass = getCardTheme(exam.type).badge;
                      return (
                        <div key={exam.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col p-5 group hover:-translate-y-1">
                          
                          <div className="flex justify-between items-center mb-4">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase ${badgeClass}`}>
                              {exam.type}
                            </span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => navigate('/exam-editor', { state: { examId: exam.id } })} className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Sửa nội dung đề thi"><ListChecks size={16}/></button>
                              <button onClick={() => openEditModal(exam)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Cấu hình tên/thời gian"><Edit3 size={16}/></button>
                              <button onClick={() => handleDeleteExam(exam.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Xóa đề thi"><Trash2 size={16}/></button>
                            </div>
                          </div>
                          
                          <h3 className="text-[17px] font-bold text-slate-800 dark:text-white mb-2 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors h-12">
                            {exam.title}
                          </h3>
                          
                          <div className="text-xs text-slate-400 font-medium mb-5 flex items-center gap-1.5">
                            <Users size={14}/> {exam.attemptsCount || 0} lượt tham gia
                          </div>

                          <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 font-medium mt-auto mb-5 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-1.5">
                              <ListChecks size={16} className={activeTheme.text}/> {exam.questionsCount || 40} câu
                            </div>
                            <div className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
                            <div className="flex items-center gap-1.5">
                              <Clock size={16} className="text-orange-500"/> {Math.floor(exam.time_limit/60)} phút
                            </div>
                          </div>

                          <div className="flex items-stretch gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <button onClick={() => handleOpenAssignModal(exam)} className={`flex-[2] mb-0 bg-gradient-to-r ${activeTheme.gradient} text-white font-bold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm hover:opacity-90`}>
                              <Send size={18} /> Giao đề
                            </button>
                            <Link to={`/quiz/${exam.id}`} className={`flex-1 ${activeTheme.btn} font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm border ${activeTheme.border}`}>
                              <PlayCircle size={16} /> Xem
                            </Link>
                          </div>

                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* MODAL NHẬP JSON VÀ CÁC MODAL KHÁC GIỮ NGUYÊN BÊN DƯỚI... */}
      {showJsonModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#111827] w-full max-w-3xl rounded-[32px] p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-start mb-6 shrink-0">
              <div><h3 className={`text-2xl font-black mb-1 flex items-center gap-2 ${activeTheme.text}`}><FileJson size={24}/> Tạo Đề Thi Nhanh (JSON)</h3><p className="text-sm font-medium text-slate-500">Hệ thống sẽ tự động tạo bài và liên kết câu hỏi.</p></div>
              <button onClick={() => setShowJsonModal(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"><X size={18}/></button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-500 uppercase ml-1">Tên Đề Thi</label><input type="text" value={newExamConfig.title} onChange={e => setNewExamConfig({...newExamConfig, title: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 font-bold dark:text-white text-sm" placeholder="VD: Đề thi thử số 1..."/></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-500 uppercase ml-1">Thuộc Nhóm</label><input type="text" value={newExamConfig.group_name} onChange={e => setNewExamConfig({...newExamConfig, group_name: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 font-bold dark:text-white text-sm" placeholder="VD: Ôn thi Đại học"/></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-500 uppercase ml-1">Loại đề</label><select value={newExamConfig.type} onChange={e => setNewExamConfig({...newExamConfig, type: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold dark:text-white text-sm">{TABS.map(tab => <option key={tab} value={tab}>{tab}</option>)}</select></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-500 uppercase ml-1">Thời gian (Phút)</label><input type="number" value={newExamConfig.timeLimit} onChange={e => setNewExamConfig({...newExamConfig, timeLimit: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center font-bold dark:text-white text-sm"/></div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex justify-between">
                  <span>Mã JSON từ AI</span>
                  <button onClick={() => { 
                    const p = `Bạn là chuyên gia môn ${activeTheme.name}. Tạo danh sách câu hỏi theo JSON mảng tuyệt đối. Gồm 3 loại:\n1. Trắc nghiệm (mcq):\n{ "type": "mcq", "level": "Nhận biết", "content": "...", "options": [{"id": "A", "text": "..."}, {"id": "B", "text": "..."}, {"id": "C", "text": "..."}, {"id": "D", "text": "..."}], "correct_answer": "A", "explanation": "..." }\n2. Đúng/Sai (tf):\n{ "type": "tf", "level": "Thông hiểu", "content": "Mệnh đề sau đúng hay sai?", "options": [{"id": "a", "text": "Ý a..."}, {"id": "b", "text": "Ý b..."}, {"id": "c", "text": "Ý c..."}, {"id": "d", "text": "Ý d..."}], "correct_answer": {"a": true, "b": false, "c": true, "d": false}, "explanation": "..." }\n3. Trả lời ngắn (saq):\n{ "type": "saq", "level": "Vận dụng", "content": "Nội dung điền khuyết...", "correct_answer": "12.5", "explanation": "..." }`; 
                    navigator.clipboard.writeText(p); 
                    alert("Đã copy Prompt hỗ trợ 3 định dạng!"); 
                  }} className={`${activeTheme.text} hover:underline`}>Copy Prompt Mẫu</button>
                </label>
                <textarea value={jsonInput} onChange={e => setJsonInput(e.target.value)} className="w-full h-48 bg-slate-900 dark:bg-black text-emerald-400 font-mono text-[13px] leading-relaxed p-4 rounded-xl outline-none shadow-inner custom-scrollbar" spellCheck="false" placeholder="Dán JSON vào đây..."/>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3 shrink-0 pt-4 border-t border-slate-100 dark:border-slate-800"><button onClick={() => setShowJsonModal(false)} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm transition-colors">Hủy</button><button onClick={handleImportJSON} disabled={isSavingJson} className={`px-8 py-3 bg-gradient-to-r ${activeTheme.gradient} text-white font-bold rounded-xl shadow-md text-sm flex gap-2 hover:opacity-90 disabled:opacity-50`}>{isSavingJson ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} XÁC NHẬN TẠO ĐỀ</button></div>
          </div>
        </div>, document.body
      )}

      {/* MODAL EDIT ĐỀ THI */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">Cấu hình đề thi</h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><X size={18}/></button>
            </div>
            <div className="space-y-4 mb-8">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400 ml-1">Tên đề thi</label>
                <input type="text" value={editingExam.title} onChange={e => setEditingExam({...editingExam, title: e.target.value})} className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 dark:text-slate-200"/>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400 ml-1">Thuộc Nhóm</label>
                <input type="text" value={editingExam.group_name} onChange={e => setEditingExam({...editingExam, group_name: e.target.value})} className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 dark:text-slate-200" placeholder="VD: Bộ đề Toán Sở Hà Nội..."/>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400 ml-1">Loại đề</label>
                <select value={editingExam.type} onChange={e => setEditingExam({...editingExam, type: e.target.value})} className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 dark:text-slate-200">
                  {TABS.map(tab => (
                    <option key={tab} value={tab}>{tab}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-400 ml-1">Thời gian (Phút)</label>
                <input type="number" value={editingExam.timeLimit} onChange={e => setEditingExam({...editingExam, timeLimit: Number(e.target.value)})} className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700 dark:text-slate-200 text-center"/>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowEditModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 text-slate-700 font-bold py-3.5 rounded-xl transition-colors text-sm">Hủy</button>
              <button onClick={handleUpdateExam} disabled={isSavingEdit} className={`flex-1 bg-gradient-to-r ${activeTheme.gradient} text-white font-bold py-3.5 rounded-xl transition-colors shadow-md flex justify-center items-center gap-2 disabled:opacity-50 text-sm hover:opacity-90`}>
                {isSavingEdit ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GIAO ĐỀ */}
      {showAssignModal && selectedExam && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[32px] p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-start mb-6 shrink-0">
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Quản lý Giao bài</h3>
                <p className={`text-sm font-bold ${activeTheme.text} max-w-md truncate`}>{selectedExam.title}</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><X size={18}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-8">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2"><Send size={16}/> Giao đề cho lớp học</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Chọn lớp học</label>
                    <select value={assignForm.classId} onChange={e => setAssignForm({...assignForm, classId: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-green-500 font-bold text-sm dark:text-white">
                      {teacherClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Hạn chót nộp bài</label>
                    <input type="datetime-local" value={assignForm.dueDate} onChange={e => setAssignForm({...assignForm, dueDate: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-green-500 font-bold text-sm dark:text-white"/>
                  </div>
                </div>
                <button onClick={handleAssignExam} disabled={isAssigning} className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md flex justify-center items-center gap-2 disabled:opacity-50 text-sm">
                  {isAssigning ? <Loader2 size={18} className="animate-spin"/> : <PlusCircle size={18}/>} Xác nhận Giao bài
                </button>
              </div>

              <div>
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2"><History size={16}/> Lớp đang được giao đề này</h4>
                {isLoadingAssignments ? (
                  <div className="flex justify-center p-6"><Loader2 className="animate-spin text-blue-500"/></div>
                ) : assignments.length === 0 ? (
                  <div className="text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 font-medium text-sm">Đề này chưa được giao cho lớp nào.</div>
                ) : (
                  <div className="space-y-3">
                    {assignments.map((assignment) => (
                      <div key={assignment.class_id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl gap-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${activeTheme.bg} ${activeTheme.text} dark:bg-slate-700 dark:text-white flex items-center justify-center font-black`}>{assignment.classes?.name.substring(0,2)}</div>
                          <div><p className="font-bold text-slate-900 dark:text-white">{assignment.classes?.name}</p><p className="text-xs text-slate-500 flex items-center gap-1"><CalendarClock size={12}/> Chỉnh sửa hạn chót:</p></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="datetime-local" value={editDates[assignment.class_id] || ''} onChange={(e) => setEditDates(prev => ({...prev, [assignment.class_id]: e.target.value}))} className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs dark:text-white"/>
                          <button onClick={() => handleUpdateAssignment(assignment.class_id)} className={`p-2 ${activeTheme.btn} rounded-lg transition-colors`} title="Lưu Hạn chót mới"><Save size={16}/></button>
                          <button onClick={() => handleDeleteAssignment(assignment.class_id)} className="p-2 bg-red-50 hover:bg-red-100 text-red-500 dark:bg-red-900/20 dark:text-red-400 rounded-lg transition-colors" title="Thu hồi bài tập"><Trash2 size={16}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ExamBank;