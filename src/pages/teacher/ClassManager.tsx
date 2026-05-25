import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, PlusCircle, Shield, TrendingUp, BookOpen, ArrowLeft, 
  Send, MessageSquare, Clock, CheckCircle2, XCircle, BarChart3, 
  Bell, ChevronRight, Loader2, AlertCircle, UserPlus, Copy, X, Save, 
  FileSpreadsheet, UploadCloud, Edit3, Trash2, Download, RefreshCcw, UserCheck,
  BrainCircuit, Sparkles, Lightbulb, Link as LinkIcon, Search, GripHorizontal,
  Bold, Italic, List
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import ReactMarkdown from 'react-markdown';
import { supabase } from '../../config/supabase';
import { useAppStore } from '../../store/useAppStore';
import { askGroqAI } from '../../services/groqAI';

// ========================================================
// HÀM HỖ TRỢ: TÁCH TÊN VÀ HỌ ĐỂ SẮP XẾP CHUẨN BỘ GD&ĐT
// ========================================================
const getVietnameseSortName = (fullName: string) => {
  if (!fullName) return { firstName: '', lastName: '' };
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts.length > 0 ? parts.pop() || '' : '';
  const lastName = parts.join(' '); 
  return { firstName, lastName };
};

const ClassManagement = () => {
  const { currentUser } = useAppStore();
  const navigate = useNavigate();
  
  // STATES CHUNG
  const [classes, setClasses] = useState<any[]>([]);
  const [classSearch, setClassSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  
  // PHÂN LOẠI LỚP HỌC
  const [activeClassGroup, setActiveClassGroup] = useState<'regular' | 'companion'>('regular');
  
  // STATES TẠO LỚP
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [newClassForm, setNewClassForm] = useState({ name: '', type: 'regular' });

  // STATES CHỈNH SỬA LỚP
  const [showEditClassModal, setShowEditClassModal] = useState(false);
  const [editClassForm, setEditClassForm] = useState({ id: '', name: '', type: 'regular' });

  // STATES DRAG & DROP & LƯU THỨ TỰ
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [isOrderChanged, setIsOrderChanged] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // STATES CHI TIẾT LỚP
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'assignments'>('overview');
  const [students, setStudents] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const [isRefreshingDetail, setIsRefreshingDetail] = useState(false);
  
  const annTextareaRef = useRef<HTMLTextAreaElement>(null);

  // STATES THÊM HỌC SINH
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [addMode, setAddMode] = useState<'manual' | 'excel'>('manual');
  const [isProcessing, setIsProcessing] = useState(false);
  const [newStudentForm, setNewStudentForm] = useState({ name: '', email: '', code: '' });

  // STATES BÀI TẬP & NỘP BÀI
  const [assignments, setAssignments] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [expandedAssignId, setExpandedAssignId] = useState<string | null>(null);

  // STATES AI ANALYTICS
  const [isAnalyzingClass, setIsAnalyzingClass] = useState(false);
  const [classAiInsight, setClassAiInsight] = useState("");
  const [analyzingStudentId, setAnalyzingStudentId] = useState<string | null>(null);
  const [showStudentAiModal, setShowStudentAiModal] = useState(false);
  const [studentAiInsight, setStudentAiInsight] = useState("");
  const [selectedStudentName, setSelectedStudentName] = useState("");

  const fetchClasses = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*, class_members(count)')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setClasses(data || []);
    } catch (error: any) {
      const { data } = await supabase
        .from('classes')
        .select('*, class_members(count)')
        .order('created_at', { ascending: true });
      setClasses(data || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchClasses(); }, [currentUser]);

  // HIỂN THỊ CÁC LỚP DỰA THEO TÌM KIẾM VÀ TAB PHÂN LOẠI
  const displayedClasses = useMemo(() => {
    return classes.filter(cls => {
      const name = cls.name?.trim() || '';
      const matchesSearch = name.toLowerCase().includes(classSearch.toLowerCase());
      const clsType = cls.type || 'regular'; 
      const matchesTab = activeClassGroup === clsType;
      return matchesSearch && matchesTab;
    });
  }, [classes, classSearch, activeClassGroup]);

  const handleDragStart = (index: number) => { setDraggedIdx(index); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = (targetIndex: number) => {
    if (draggedIdx === null || draggedIdx === targetIndex) return;
    const draggedItem = displayedClasses[draggedIdx];
    const targetItem = displayedClasses[targetIndex];
    const realDraggedIdx = classes.findIndex(c => c.id === draggedItem.id);
    const realTargetIdx = classes.findIndex(c => c.id === targetItem.id);
    if (realDraggedIdx === -1 || realTargetIdx === -1) return;

    const newClasses = [...classes];
    newClasses.splice(realDraggedIdx, 1);
    newClasses.splice(realTargetIdx, 0, draggedItem);
    
    setClasses(newClasses);
    setDraggedIdx(null);
    setIsOrderChanged(true); 
  };

  const handleSaveOrder = async () => {
    setIsSavingOrder(true);
    try {
      const updates = classes.map((cls, index) => supabase.from('classes').update({ sort_order: index + 1 }).eq('id', cls.id));
      await Promise.all(updates);
      setIsOrderChanged(false); 
      alert("Đã lưu cố định thứ tự các lớp học thành công!");
    } catch (err) { alert("Có lỗi xảy ra khi lưu thứ tự."); } 
    finally { setIsSavingOrder(false); }
  };

  const fetchClassDetails = async (cls: any, showSpinner = true) => {
    if (showSpinner) setIsRefreshingDetail(true);
    setSelectedClass(cls);
    
    const { data: studentsData } = await supabase.from('class_members')
      .select('id, user_id, status, temp_name, student_email, temp_code, created_at, users(id, full_name, email, avatar_url, xp, level, student_code)')
      .eq('class_id', cls.id);

    const { count: totalLessons } = await supabase.from('lessons').select('*', { count: 'exact', head: true });

    const userIds = studentsData?.map((item: any) => item.user_id).filter(Boolean) || [];
    let progressData: any[] = [];
    if (userIds.length > 0) {
      const { data: prog } = await supabase.from('student_lesson_progress').select('user_id').in('user_id', userIds).eq('is_completed', true);
      progressData = prog || [];
    }
    
    let formattedStudents = studentsData?.map((item: any) => {
      const completedCount = progressData.filter(p => p.user_id === item.user_id).length;
      const progressPercent = totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0;

      const displayName = (item.temp_name && item.temp_name.trim() !== '') ? item.temp_name : (item.users?.full_name || 'Không rõ tên');
      const displayCode = item.users?.student_code || item.temp_code || '---';

      if (item.users && item.status === 'joined') {
        return { ...item.users, member_id: item.id, isGhost: false, joinStatus: 'joined', full_name: displayName, student_code: displayCode, completedLessons: completedCount, progressPercent: progressPercent }; 
      }
      if (item.users && item.status === 'pending') {
        return { ...item.users, member_id: item.id, isGhost: false, joinStatus: 'pending', full_name: displayName, student_code: displayCode, completedLessons: 0, progressPercent: 0 }; 
      }
      return { id: item.user_id || item.id, member_id: item.id, full_name: displayName, student_code: displayCode, email: item.student_email || 'Chờ đăng nhập...', level: 0, xp: 0, isGhost: true, joinStatus: item.status || 'ghost', completedLessons: 0, progressPercent: 0 };
    }) || [];
    
    formattedStudents.sort((a, b) => {
      const nameA = getVietnameseSortName(a.full_name);
      const nameB = getVietnameseSortName(b.full_name);
      const firstCompare = nameA.firstName.localeCompare(nameB.firstName, 'vi');
      if (firstCompare !== 0) return firstCompare;
      return nameA.lastName.localeCompare(nameB.lastName, 'vi');
    });

    setStudents(formattedStudents);

    const { data: annData } = await supabase.from('class_announcements').select('*').eq('class_id', cls.id).order('created_at', { ascending: false });
    if (annData) setAnnouncements(annData);

    const { data: assignsData } = await supabase.from('class_exams').select('exam_id, due_date, exams(id, title, time_limit, type)').eq('class_id', cls.id).order('due_date', { ascending: false });
    if (assignsData) {
      const formattedAssigns = assignsData.map((item:any) => ({...item.exams, due_date: item.due_date}));
      setAssignments(formattedAssigns);
      
      if (formattedAssigns.length > 0) {
        const { data: attemptsData } = await supabase.from('exam_attempts').select('exam_id, user_id, score, created_at').in('exam_id', formattedAssigns.map((a:any) => a.id));
        if (attemptsData) setAttempts(attemptsData);
      }
    }
    if (showSpinner) setIsRefreshingDetail(false);
  };

  const submitAddClass = async () => {
    if (!newClassForm.name.trim()) return alert("Vui lòng nhập tên lớp học!");
    const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const nextOrder = classes.length + 1; 
    
    const { error } = await supabase.from('classes').insert({
      name: newClassForm.name.trim(), 
      teacher_id: currentUser?.id || 'admin', 
      code: generatedCode, 
      join_code: generatedCode, 
      school_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`, 
      sort_order: nextOrder,
      type: newClassForm.type
    });
    
    if (error) {
      alert("Lỗi tạo lớp: " + error.message);
    } else {
      fetchClasses();
      setShowAddClassModal(false);
      setNewClassForm({ name: '', type: 'regular' });
      setActiveClassGroup(newClassForm.type as 'regular' | 'companion');
    }
  };

  const handleEditClass = (e: React.MouseEvent, cls: any) => {
    e.stopPropagation();
    setEditClassForm({ 
      id: cls.id, 
      name: cls.name, 
      type: cls.type || 'regular' 
    });
    setShowEditClassModal(true);
  };

  const submitEditClass = async () => {
    if (!editClassForm.name.trim()) return alert("Vui lòng nhập tên lớp học!");
    
    const { error } = await supabase.from('classes').update({ 
      name: editClassForm.name.trim(),
      type: editClassForm.type
    }).eq('id', editClassForm.id);
    
    if (error) {
      alert("Lỗi cập nhật lớp: " + error.message);
    } else {
      fetchClasses();
      setShowEditClassModal(false);
      if (activeClassGroup !== editClassForm.type) {
        setActiveClassGroup(editClassForm.type as 'regular' | 'companion');
      }
    }
  };

  const handleDeleteClass = async (e: React.MouseEvent, clsId: string) => {
    e.stopPropagation();
    if (!window.confirm("BẠN CÓ CHẮC CHẮN MUỐN XÓA LỚP NÀY? Toàn bộ dữ liệu thành viên sẽ bị xóa vĩnh viễn.")) return;
    const { error } = await supabase.from('classes').delete().eq('id', clsId);
    if (!error) fetchClasses();
  };

  const insertMarkdownAnn = (before: string, after: string = '') => {
    const textarea = annTextareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = newAnnouncement.substring(start, end);
    const newText = newAnnouncement.substring(0, start) + before + selectedText + after + newAnnouncement.substring(end);
    
    setNewAnnouncement(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const handlePostAnnouncement = async () => {
    if (!newAnnouncement.trim()) return;
    const { error } = await supabase.from('class_announcements').insert({ class_id: selectedClass.id, content: newAnnouncement.trim() });
    if (!error) { setNewAnnouncement(""); fetchClassDetails(selectedClass, false); }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm("Xóa thông báo này?")) return;
    const { error } = await supabase.from('class_announcements').delete().eq('id', id);
    if (!error) fetchClassDetails(selectedClass, false);
  };

  const handleAddStudentManually = async () => {
    if (!newStudentForm.name.trim() || !newStudentForm.email.trim()) { alert("Vui lòng nhập Họ Tên và Email!"); return; }
    setIsProcessing(true);
    const { error } = await supabase.from('class_members').insert({
      class_id: selectedClass.id, temp_name: newStudentForm.name.trim(), student_email: newStudentForm.email.trim().toLowerCase(), temp_code: newStudentForm.code.trim(), status: 'ghost'
    });
    setIsProcessing(false);
    if (error) {
      if (error.code === '23505') alert("Học sinh với email này đã tồn tại trong lớp!");
      else alert("Lỗi thêm học sinh: " + error.message);
    } else {
      alert("Thêm học sinh thành công!");
      setNewStudentForm({ name: '', email: '', code: '' });
      setShowAddStudentModal(false);
      fetchClassDetails(selectedClass, false);
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      const membersToInsert = jsonData.map(row => ({
        class_id: selectedClass.id,
        temp_name: row['Họ tên'] || row['Name'] || row['Tên'] || 'Không có tên',
        student_email: (row['Email'] || row['email'] || '').toString().toLowerCase().trim(),
        temp_code: (row['Mã HS'] || row['Code'] || row['MSSV'] || '').toString().trim(),
        status: 'ghost'
      })).filter(m => m.student_email);

      if (membersToInsert.length === 0) throw new Error("Không tìm thấy dữ liệu hợp lệ. File Excel cần có cột 'Họ tên' và 'Email'.");
      const { error } = await supabase.from('class_members').insert(membersToInsert);
      if (error) throw error;

      alert(`Đã nạp thành công ${membersToInsert.length} học sinh từ file Excel!`);
      setShowAddStudentModal(false);
      fetchClassDetails(selectedClass, false);
    } catch (error: any) { alert("Lỗi đọc file: " + (error.message || "Vui lòng kiểm tra lại định dạng.")); } 
    finally { setIsProcessing(false); if (e.target) e.target.value = ''; }
  };

  const handleRemoveStudent = async (memberId: string) => {
    if (!window.confirm("Xóa học sinh này khỏi lớp?")) return;
    const { error } = await supabase.from('class_members').delete().eq('id', memberId);
    if (!error) fetchClassDetails(selectedClass, false);
  };

  const handleApproveStudent = async (memberId: string) => {
    const { error } = await supabase.from('class_members').update({ status: 'joined' }).eq('id', memberId);
    if (!error) fetchClassDetails(selectedClass, false);
  };

  const handleEditGhostStudent = async (student: any) => {
    const newEmail = window.prompt("Sửa Email cho học sinh:", student.email);
    if (!newEmail || newEmail === student.email) return;
    const { error } = await supabase.from('class_members').update({ student_email: newEmail.trim().toLowerCase() }).eq('id', student.member_id);
    if (!error) fetchClassDetails(selectedClass, false);
  };

  const handleCopyJoinLink = () => {
    const joinLink = `${window.location.origin}/join/${selectedClass.join_code}`;
    navigator.clipboard.writeText(joinLink);
    alert("Đã copy link tham gia lớp học! Thầy cô có thể gửi cho học sinh.");
  };

  const getAssignmentStats = (examId: string) => {
    const submittedUsers = attempts.filter(a => a.exam_id === examId);
    const submittedIds = [...new Set(submittedUsers.map(a => a.user_id))]; 
    
    const doneList = students.filter(s => submittedIds.includes(s.id)).map(s => {
      const userAttempts = submittedUsers
        .filter(a => a.user_id === s.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
      return { ...s, attempts: userAttempts };
    });
    
    const missingList = students.filter(s => !submittedIds.includes(s.id) && !s.isGhost);
    return { doneList, missingList, total: students.filter(s => !s.isGhost).length };
  };

  const handleExportScores = (examId: string, examTitle: string) => {
    const stats = getAssignmentStats(examId);
    const exportData = [
      ...stats.doneList.map(s => {
         const highestScore = Math.max(...s.attempts.map((a:any) => a.score));
         const latestAttempt = s.attempts[0]; 
         return { 
           'Họ và tên': s.full_name, 
           'Mã HS': s.student_code, 
           'Email': s.email, 
           'Trạng thái': 'Đã nộp', 
           'Số lượt làm': s.attempts.length, 
           'Điểm cao nhất': highestScore, 
           'Lần nộp cuối': new Date(latestAttempt.created_at).toLocaleString('vi-VN') 
         }
      }),
      ...stats.missingList.map(s => ({ 
        'Họ và tên': s.full_name, 
        'Mã HS': s.student_code, 
        'Email': s.email, 
        'Trạng thái': 'Chưa làm', 
        'Số lượt làm': 0, 
        'Điểm cao nhất': 0, 
        'Lần nộp cuối': '' 
      }))
    ];
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bang_Diem");
    XLSX.writeFile(wb, `Diem_${examTitle.substring(0, 20)}_${selectedClass.name}.xlsx`);
  };

  const handleCreateLiveSession = async (examId: string, classId: string) => {
    const pin = Math.random().toString(36).substring(2, 8).toUpperCase();
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 90 * 60000); 
    
    const { data, error } = await supabase.from('live_sessions').insert({
      class_id: classId,
      exam_id: examId,
      teacher_id: currentUser?.id,
      access_code: pin,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      is_active: true
    }).select().single();
  
    if (error) {
      alert("Lỗi tạo phòng thi: " + error.message);
    } else {
      alert(`Tạo phòng thi thành công! Mã PIN học sinh là: ${pin}`);
      navigate(`/live-monitor/${data.id}`);
    }
  };

  const handleAnalyzeClass = async () => {
    if (assignments.length === 0) return alert("Lớp chưa có bài tập nào để phân tích!");
    setIsAnalyzingClass(true);
    let statsSummary = "";
    assignments.forEach(assign => {
      const submittedUsers = attempts.filter(a => a.exam_id === assign.id);
      if (submittedUsers.length > 0) {
        const avgScore = submittedUsers.reduce((sum, a) => sum + a.score, 0) / submittedUsers.length;
        statsSummary += `- Bài "${assign.title}": Đã nộp ${submittedUsers.length}/${students.filter(s=>!s.isGhost).length} HS. Điểm TB: ${avgScore.toFixed(2)}\n`;
      } else statsSummary += `- Bài "${assign.title}": Chưa có ai nộp.\n`;
    });
    const prompt = `Phân tích lớp "${selectedClass.name}":\n- Sĩ số: ${students.length} học sinh.\n- Tổng số bài đã giao: ${assignments.length}.\n- Thống kê chi tiết:\n${statsSummary}\n\n1. Đánh giá tổng quan\n2. Chẩn đoán điểm yếu\n3. Đề xuất ôn tập`;
    try {
      const response = await askGroqAI("Bạn là FMath AI - Chuyên gia phân tích dữ liệu giáo dục.", prompt);
      setClassAiInsight(response);
    } catch (error) { alert("Hệ thống AI đang quá tải. Vui lòng thử lại sau."); } 
    finally { setIsAnalyzingClass(false); }
  };

  const handleAnalyzeStudent = async (student: any) => {
    if (student.joinStatus !== 'joined') return alert("Học sinh này chưa tham gia lớp chính thức!");
    setAnalyzingStudentId(student.id); setSelectedStudentName(student.full_name); setShowStudentAiModal(true); setStudentAiInsight(""); 
    const studentAttempts = attempts.filter(a => a.user_id === student.id);
    let historyString = studentAttempts.length === 0 ? "Chưa làm bài nào." : "";
    if (studentAttempts.length > 0) {
      assignments.forEach(assign => {
        const attempt = studentAttempts.find(a => a.exam_id === assign.id);
        if (attempt) historyString += `- Bài "${assign.title}": Đạt ${attempt.score} điểm.\n`;
        else historyString += `- Bài "${assign.title}": Chưa làm.\n`;
      });
    }
    const prompt = `Phân tích học sinh "${student.full_name}":\n- Tiến độ lý thuyết: Đã học ${student.completedLessons} bài (${student.progressPercent}%).\n- Lịch sử làm bài tập:\n${historyString}\n\n1. Nhận xét thái độ\n2. Chẩn đoán năng lực\n3. Chiến lược hỗ trợ`;
    try {
      const response = await askGroqAI("Bạn là trợ lý AI phân tích năng lực học sinh.", prompt);
      setStudentAiInsight(response);
    } catch (error) { setStudentAiInsight("Lỗi kết nối AI. Vui lòng thử lại."); } 
    finally { setAnalyzingStudentId(null); }
  };

  // MÀN HÌNH DANH SÁCH LỚP HỌC CHÍNH
  if (!selectedClass) {
    return (
      <div className="flex flex-col h-[calc(100vh-80px)] w-full relative animate-in fade-in overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 pb-32">
          <div className="max-w-6xl mx-auto w-full">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-blue-950 dark:text-white mb-2 flex items-center gap-3">
                  <Users className="text-blue-600"/> Quản lý Lớp học
                </h2>
                <p className="text-slate-600 dark:text-slate-400 font-medium">Tạo lớp mới, kéo thả để sắp xếp thứ tự ưu tiên.</p>
              </div>
              <button onClick={() => setShowAddClassModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:-translate-y-1">
                <PlusCircle size={20} /> Tạo lớp học mới
              </button>
            </div>

            {/* TAB PHÂN LOẠI LỚP */}
            <div className="flex gap-3 mb-6">
              <button 
                onClick={() => setActiveClassGroup('regular')}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeClassGroup === 'regular' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                Lớp Học
              </button>
              <button 
                onClick={() => setActiveClassGroup('companion')}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeClassGroup === 'companion' ? 'bg-green-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              >
                Lớp Đồng Hành
              </button>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:w-[400px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm lớp học..." 
                  value={classSearch}
                  onChange={(e) => setClassSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none shadow-sm transition-all dark:text-white"
                />
              </div>
              
              <div className="flex items-center gap-3">
                {isOrderChanged ? (
                  <button 
                    onClick={handleSaveOrder}
                    disabled={isSavingOrder}
                    className="text-sm font-bold text-white bg-green-500 hover:bg-green-600 px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-green-500/30 transition-all animate-pulse disabled:opacity-50 disabled:animate-none"
                  >
                    {isSavingOrder ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>} 
                    {isSavingOrder ? 'Đang lưu...' : 'Lưu cố định thứ tự'}
                  </button>
                ) : (
                  <div className="text-sm font-medium text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                    <GripHorizontal size={16} className="text-slate-400"/> 
                    {classSearch.trim() ? 'Đang tìm kiếm (Tắt kéo thả)' : 'Kéo thả thẻ lớp để sắp xếp'}
                  </div>
                )}
              </div>
            </div>

            {isLoading ? ( 
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={40}/></div>
            ) : displayedClasses.length === 0 ? ( 
              <div className="text-center p-12 text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[32px]">
                {classes.length > 0 ? "Không có lớp nào khớp với từ khóa tìm kiếm." : "Bạn chưa tạo lớp học nào trong nhóm này."}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedClasses.map((cls, index) => (
                  <div 
                    key={cls.id} 
                    draggable={!classSearch.trim()} 
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(index)}
                    className={`bg-white dark:bg-slate-900 rounded-[24px] border shadow-sm transition-all p-6 relative group ${
                      draggedIdx === index 
                        ? 'opacity-50 scale-95 border-blue-500 shadow-none' 
                        : 'border-slate-200 dark:border-slate-800 hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-600 cursor-pointer hover:-translate-y-1'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4" onClick={() => fetchClassDetails(cls)}>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl select-none ${cls.type === 'companion' ? 'bg-[#D1FAE5] text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-[#E0E7FF] text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                        {cls.name.match(/\d+/) ? cls.name.match(/\d+/)[0] : cls.name.charAt(0)}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 mr-2">
                          <button onClick={(e) => handleEditClass(e, cls)} className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 text-slate-500 hover:text-blue-600 rounded-lg transition-colors" title="Sửa thông tin lớp"><Edit3 size={16}/></button>
                          <button onClick={(e) => handleDeleteClass(e, cls.id)} className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-red-100 text-slate-500 hover:text-red-500 rounded-lg transition-colors" title="Xóa lớp"><Trash2 size={16}/></button>
                        </div>
                        <div className="text-slate-300 dark:text-slate-600 cursor-grab active:cursor-grabbing hover:text-slate-500 transition-colors p-1" title="Kéo thả để sắp xếp">
                           <GripHorizontal size={20} />
                        </div>
                      </div>
                    </div>
                    
                    <div onClick={() => fetchClassDetails(cls)}>
                      <h3 className="text-[26px] font-black text-slate-800 dark:text-white mb-3 tracking-tight line-clamp-1">{cls.name}</h3>
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[15px] mb-6 font-medium">
                        <Users size={18} className="stroke-[1.5]"/> Sĩ số: {cls.class_members?.[0]?.count || 0} HS
                      </div>
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[15px] text-slate-500 dark:text-slate-400 font-medium">
                        Mã tham gia: <strong className="text-blue-600 dark:text-blue-400">{cls.join_code}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* MODAL TẠO LỚP HỌC MỚI */}
        {showAddClassModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-blue-950 dark:text-white">Tạo Lớp Học Mới</h3>
                <button onClick={() => setShowAddClassModal(false)} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-full text-slate-500"><X size={18} /></button>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Tên lớp học</label>
                  <input 
                    type="text" 
                    value={newClassForm.name} 
                    onChange={e => setNewClassForm({...newClassForm, name: e.target.value})} 
                    className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 font-bold dark:text-white" 
                    placeholder="VD: 12A1, Lớp lấy lại gốc..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Nhóm lớp</label>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setNewClassForm({...newClassForm, type: 'regular'})} 
                      className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${newClassForm.type === 'regular' ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                      Lớp Học
                    </button>
                    <button 
                      onClick={() => setNewClassForm({...newClassForm, type: 'companion'})} 
                      className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${newClassForm.type === 'companion' ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                      Lớp Đồng Hành
                    </button>
                  </div>
                </div>
              </div>

              <button onClick={submitAddClass} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 shadow-md transition-all">
                <PlusCircle size={18}/> Xác nhận tạo
              </button>
            </div>
          </div>
        )}

        {/* MODAL CHỈNH SỬA LỚP HỌC */}
        {showEditClassModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-blue-950 dark:text-white">Chỉnh sửa Lớp Học</h3>
                <button onClick={() => setShowEditClassModal(false)} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-full text-slate-500"><X size={18} /></button>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Tên lớp học</label>
                  <input 
                    type="text" 
                    value={editClassForm.name} 
                    onChange={e => setEditClassForm({...editClassForm, name: e.target.value})} 
                    className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 font-bold dark:text-white" 
                    placeholder="VD: 12A1, Lớp lấy lại gốc..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 dark:text-slate-400">Nhóm lớp</label>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setEditClassForm({...editClassForm, type: 'regular'})} 
                      className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${editClassForm.type === 'regular' ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                      Lớp Học
                    </button>
                    <button 
                      onClick={() => setEditClassForm({...editClassForm, type: 'companion'})} 
                      className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${editClassForm.type === 'companion' ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                      Lớp Đồng Hành
                    </button>
                  </div>
                </div>
              </div>

              <button onClick={submitEditClass} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 shadow-md transition-all">
                <Save size={18}/> Lưu thay đổi
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full relative animate-in fade-in overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 pb-32">
        <div className="max-w-6xl mx-auto w-full">
          
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <button onClick={() => setSelectedClass(null)} className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 font-medium transition-colors"><ArrowLeft size={18} /> Quay lại danh sách</button>
            <div className="flex items-center gap-2 text-sm font-bold bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 dark:bg-[#111827] dark:border-slate-700">
               <button onClick={handleCopyJoinLink} className="flex items-center gap-2 bg-blue-50 text-blue-600 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800 hover:bg-blue-100 transition-all mr-2"><LinkIcon size={14}/> Copy Link Join</button>
               Mã: <span className="text-blue-600 dark:text-blue-400 text-lg tracking-widest">{selectedClass.join_code}</span>
            </div>
          </div>

          <div className="mb-6 bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 p-4 rounded-r-2xl flex items-start gap-3 shadow-sm">
             <AlertCircle className="text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" size={20}/>
             <div>
               <p className="text-sm font-black text-orange-800 dark:text-orange-300 uppercase tracking-tight">Lưu ý quan trọng cho thầy cô:</p>
               <p className="text-xs text-orange-700 dark:text-orange-400 font-medium mt-1">Thầy cô <b>BẮT BUỘC</b> phải thêm danh sách học sinh (bằng Excel hoặc thủ công) vào bảng bên dưới trước khi gửi Link hoặc Mã lớp cho học sinh. Điều này giúp hệ thống nhận diện đúng Email và không cho phép người lạ xâm nhập.</p>
             </div>
          </div>

          <div className="glass bg-white dark:bg-[#111827] rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-6">
            <div className={`p-8 text-white relative overflow-hidden ${selectedClass.type === 'companion' ? 'bg-gradient-to-r from-emerald-600 to-teal-500' : 'bg-gradient-to-r from-blue-600 to-purple-600'}`}>
              <div className="relative z-10 flex items-center gap-6">
                <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30"><Users size={40}/></div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {selectedClass.type === 'companion' && <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">Lớp Đồng Hành</span>}
                  </div>
                  <h2 className="text-3xl font-black mb-2">{selectedClass.name}</h2>
                  <p className="font-medium text-white/80 flex items-center gap-4">
                    <span className="flex items-center gap-1.5"><Users size={16}/> {students.length} Sĩ số</span> 
                    <span className="flex items-center gap-1.5"><BookOpen size={16}/> Niên khóa {selectedClass.school_year}</span>
                  </p>
                </div>
              </div>
              <Shield className="absolute -right-10 -top-10 w-48 h-48 text-white/10 rotate-12 pointer-events-none"/>
            </div>

            <div className="flex overflow-x-auto custom-scrollbar px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <button onClick={() => setActiveTab('overview')} className={`px-6 py-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'overview' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-300'}`}><MessageSquare size={18}/> Bảng tin chung</button>
              <button onClick={() => setActiveTab('students')} className={`px-6 py-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'students' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-300'}`}>
                <Users size={18}/> Danh sách Học sinh 
                {students.filter(s => s.joinStatus === 'pending').length > 0 && (
                  <span className="ml-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">{students.filter(s => s.joinStatus === 'pending').length}</span>
                )}
              </button>
              <button onClick={() => setActiveTab('assignments')} className={`px-6 py-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'assignments' ? 'border-orange-500 text-orange-500' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-300'}`}><BarChart3 size={18}/> Quản lý Nộp bài</button>
            </div>
          </div>

          {activeTab === 'overview' && (
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/3 shrink-0 space-y-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm">
                   <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2"><TrendingUp size={18}/> Thống kê nhanh</h3>
                   <div className="space-y-4 mb-6">
                     <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl"><span className="text-sm font-medium text-slate-600 dark:text-slate-400">Tổng bài đã giao</span><span className="font-black text-blue-600 dark:text-blue-400">{assignments.length}</span></div>
                     <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl"><span className="text-sm font-medium text-slate-600 dark:text-slate-400">HS xuất sắc (Lv &gt; 5)</span><span className="font-black text-green-600 dark:text-green-400">{students.filter(s => (s?.level || 0) > 5).length}</span></div>
                   </div>

                   <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-5 rounded-2xl border border-purple-200 dark:border-purple-800/50">
                     <h4 className="font-black text-purple-700 dark:text-purple-400 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                       <BrainCircuit size={18}/> Báo cáo AI
                     </h4>
                     <button onClick={handleAnalyzeClass} disabled={isAnalyzingClass} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl shadow-md transition-colors disabled:opacity-50 flex justify-center items-center gap-2 text-sm">
                       {isAnalyzingClass ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16}/>}
                       {isAnalyzingClass ? 'Đang phân tích...' : 'Phân tích năng lực lớp'}
                     </button>
                   </div>
                </div>
              </div>

              <div className="flex-1 space-y-6">
                {classAiInsight && (
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-[24px] border-2 border-purple-300 dark:border-purple-700 shadow-lg animate-in slide-in-from-top-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-purple-500"></div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600"><BrainCircuit size={20}/></div>
                      <div><h3 className="font-black text-xl text-blue-950 dark:text-white">Chẩn đoán từ FMath AI</h3><p className="text-sm text-slate-500 font-medium">Phân tích dựa trên điểm số trung bình.</p></div>
                    </div>
                    <div className="markdown-body text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed"><ReactMarkdown>{classAiInsight}</ReactMarkdown></div>
                  </div>
                )}

                <div className="bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2"><Bell size={18}/> Đăng thông báo mới</h3>
                  <div className="flex flex-col gap-3">
                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 flex-1 flex flex-col">
                      <div className="flex items-center gap-1 p-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827]">
                         <button type="button" onClick={() => insertMarkdownAnn('**', '**')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 transition-colors" title="In đậm (Bold)"><Bold size={16}/></button>
                         <button type="button" onClick={() => insertMarkdownAnn('*', '*')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 transition-colors" title="In nghiêng (Italic)"><Italic size={16}/></button>
                         <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1"></div>
                         <button type="button" onClick={() => insertMarkdownAnn('- ', '')} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 transition-colors" title="Danh sách (List)"><List size={16}/></button>
                      </div>
                      <textarea 
                        ref={annTextareaRef}
                        value={newAnnouncement} 
                        onChange={e => setNewAnnouncement(e.target.value)} 
                        placeholder="Nhập nhắc nhở, dặn dò... (Có thể bôi đen chữ rồi bấm nút bên trên để in đậm)" 
                        className="w-full px-4 py-3 bg-transparent outline-none font-medium text-sm min-h-[80px] resize-none dark:text-white custom-scrollbar"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button onClick={handlePostAnnouncement} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md"><Send size={18}/> Đăng thông báo</button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {announcements.length === 0 ? <div className="text-center p-10 bg-white/50 dark:bg-slate-900/50 rounded-[24px] border border-slate-200 dark:border-slate-800 text-slate-400 font-medium">Chưa có thông báo nào.</div> : announcements.map(ann => (
                    <div key={ann.id} className="bg-white dark:bg-[#111827] p-5 rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm flex gap-4 relative group">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0"><Bell size={20}/></div>
                      <div className="flex-1">
                        <div className="text-xs text-slate-400 font-medium mb-1.5">{new Date(ann.created_at).toLocaleString('vi-VN')}</div>
                        <div className="markdown-body !text-[15px] text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                          <ReactMarkdown>{ann.content}</ReactMarkdown>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteAnnouncement(ann.id)} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 ml-2">
                  <Users size={18} className="text-blue-600 dark:text-blue-400"/> Sĩ số: <span className="text-blue-600 dark:text-blue-400">{students.length}</span>
                  <button onClick={() => fetchClassDetails(selectedClass, true)} className="ml-3 flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg text-xs transition-colors">
                    <RefreshCcw size={14} className={isRefreshingDetail ? 'animate-spin' : ''} /> Làm mới
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => setShowAddStudentModal(true)} className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-md"><UserPlus size={16}/> Thêm học sinh</button>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-black">
                        <th className="p-4 text-center w-16">STT</th>
                        <th className="p-4">Học sinh</th>
                        <th className="p-4">Mã HS / Email</th>
                        <th className="p-4 text-center">Trạng thái</th>
                        <th className="p-4 text-center min-w-[150px]">Tiến độ</th>
                        <th className="p-4 text-right">Phân tích & Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {students.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-slate-500 font-medium">Chưa nạp danh sách học sinh.</td></tr> : students.map((student, idx) => (
                        <tr key={student?.member_id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group ${student?.joinStatus === 'ghost' ? 'bg-slate-50/50 dark:bg-slate-800/20 opacity-80' : student?.joinStatus === 'pending' ? 'bg-orange-50/30 dark:bg-orange-900/10' : ''}`}>
                          <td className="p-4 text-center text-slate-400 font-bold text-sm">{idx + 1}</td>
                          <td className="p-4 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm overflow-hidden ${student?.isGhost ? 'bg-slate-200 dark:bg-slate-700 text-slate-500' : 'bg-gradient-to-br from-blue-500 to-purple-500 text-white'}`}>
                               {student?.avatar_url ? <img src={student.avatar_url} alt="Ava" className="w-full h-full object-cover"/> : (student?.full_name?.charAt(0) || 'U')}
                            </div>
                            <div className="font-bold text-slate-800 dark:text-slate-200">{student?.full_name}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-slate-600 dark:text-slate-300">{student?.student_code || '---'}</div>
                            <div className="text-xs text-slate-400">{student?.email}</div>
                          </td>
                          <td className="p-4 text-center">
                            {student?.joinStatus === 'ghost' ? (
                              <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black rounded-lg text-[10px] uppercase flex items-center justify-center gap-1.5 w-fit mx-auto border border-slate-200 dark:border-slate-700"><AlertCircle size={12}/> Chờ Đăng Nhập</span>
                            ) : student?.joinStatus === 'pending' ? (
                              <span className="px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-500 font-black rounded-lg text-[10px] uppercase flex items-center justify-center gap-1.5 w-fit mx-auto border border-orange-100 dark:border-orange-800/50"><Clock size={12}/> Chờ duyệt</span>
                            ) : (
                              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 font-black rounded-lg text-[11px] flex items-center justify-center gap-1.5 w-fit mx-auto uppercase"><CheckCircle2 size={14}/> Đã tham gia</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {student?.joinStatus === 'joined' ? (
                              <div className="w-full max-w-[120px] mx-auto">
                                <div className="flex justify-between text-[10px] font-bold mb-1 text-slate-500">
                                  <span>{student.completedLessons} bài</span><span className="text-blue-600 dark:text-blue-400">{student.progressPercent}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-blue-600 rounded-full" style={{ width: `${student.progressPercent}%` }}></div></div>
                              </div>
                            ) : <span className="text-slate-400 text-xs">-</span>}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end items-center gap-2">
                              {student?.joinStatus === 'joined' && (
                                <button onClick={() => handleAnalyzeStudent(student)} disabled={analyzingStudentId === student.id} className="px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800/50 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50">
                                  {analyzingStudentId === student.id ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>} AI
                                </button>
                              )}
                              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {student?.joinStatus === 'pending' && <button onClick={() => handleApproveStudent(student.member_id)} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 flex items-center gap-1"><UserCheck size={14}/> Duyệt</button>}
                                {student?.isGhost && <button onClick={() => handleEditGhostStudent(student)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-slate-500 hover:text-blue-600 rounded-lg"><Edit3 size={16}/></button>}
                                <button onClick={() => handleRemoveStudent(student.member_id)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-500 hover:text-red-500 rounded-lg"><Trash2 size={16}/></button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-orange-50 dark:bg-orange-900/20 p-4 rounded-[20px] border border-orange-200 dark:border-orange-800/50 gap-4">
                <p className="text-sm font-bold text-orange-700 dark:text-orange-400 flex items-center gap-2"><BarChart3 size={18}/> Xem tiến độ và xuất điểm ra Excel.</p>
                <button onClick={() => navigate('/exam-bank')} className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors flex items-center gap-2 shrink-0">Vào Ngân hàng đề để Giao bài <ArrowLeft className="rotate-180" size={16}/></button>
              </div>

              {assignments.length === 0 ? <div className="text-center p-12 text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[24px]">Lớp chưa có bài tập nào.</div> : assignments.map(assign => {
                const stats = getAssignmentStats(assign.id);
                const isExpanded = expandedAssignId === assign.id;
                
                return (
                  <div key={assign.id} className="bg-white dark:bg-[#111827] rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2"><span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-black uppercase rounded">{assign.type}</span><span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Clock size={12}/> Hạn chót: {new Date(assign.due_date).toLocaleString('vi-VN')}</span></div>
                        <h4 className="text-lg font-bold text-blue-950 dark:text-white truncate">{assign.title}</h4>
                      </div>
                      
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right mr-4">
                          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats.doneList.length} <span className="text-sm text-slate-400 font-medium">/ {stats.total} HS</span></div>
                          <div className="text-xs font-bold text-slate-500 uppercase">Đã nộp</div>
                        </div>
                        
                        {/* NÚT TẠO PHÒNG THI LIVE Ở ĐÂY */}
                        <button onClick={() => handleCreateLiveSession(assign.id, selectedClass.id)} className="p-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl flex items-center gap-2 transition-colors font-bold text-sm border border-red-100 dark:border-red-800/50" title="Tạo phòng thi Live">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                          <span className="hidden sm:inline">Phòng thi Live</span>
                        </button>

                        <button onClick={() => handleExportScores(assign.id, assign.title)} className="p-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 text-green-600 dark:text-green-400 rounded-xl flex items-center gap-2 transition-colors font-bold text-sm border border-green-100 dark:border-green-800/50" title="Xuất Bảng Điểm (Excel)"><Download size={18}/> <span className="hidden sm:inline">Xuất Điểm</span></button>
                        <button onClick={() => setExpandedAssignId(isExpanded ? null : assign.id)} className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl flex items-center gap-2 transition-colors text-sm">{isExpanded ? 'Thu gọn' : 'Xem chi tiết nộp bài'} <ChevronRight size={16} className={`transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}/></button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                          <h5 className="font-black text-green-600 dark:text-green-400 mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3"><CheckCircle2 size={18}/> Đã nộp bài ({stats.doneList.length})</h5>
                          <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                            {stats.doneList.length === 0 ? <div className="text-sm text-slate-400 italic text-center py-4">Chưa có ai nộp.</div> : stats.doneList.map((hs:any) => (
                              <div key={hs.id} className="flex flex-col p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden shrink-0">
                                       {hs?.avatar_url ? <img src={hs.avatar_url} alt="Ava" className="w-full h-full object-cover"/> : (hs?.full_name?.charAt(0) || 'U')}
                                    </div>
                                    <div>
                                      <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{hs?.full_name}</div>
                                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">{hs.attempts.length} lượt làm bài</div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Điểm cao nhất</div>
                                    <div className="font-black text-xl text-green-600 dark:text-green-400">{Math.max(...hs.attempts.map((a:any)=>a.score))}</div>
                                  </div>
                                </div>
                                
                                <div className="pl-12 space-y-1.5">
                                  {hs.attempts.map((att:any, i: number) => (
                                    <div key={i} className="flex justify-between items-center text-[11px] bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                                       <span className="text-slate-500">Lần {hs.attempts.length - i}: {new Date(att.created_at).toLocaleString('vi-VN')}</span>
                                       <span className="font-bold text-blue-600 dark:text-blue-400">{att.score} điểm</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                          <h5 className="font-black text-red-500 dark:text-red-400 mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3"><XCircle size={18}/> Chưa nộp bài ({stats.missingList.length})</h5>
                          <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                            {stats.missingList.length === 0 ? <div className="text-sm text-green-500 font-bold text-center py-4">Cả lớp đã hoàn thành!</div> : stats.missingList.map((hs:any) => (
                              <div key={hs.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl opacity-80">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 text-slate-500 rounded-full flex items-center justify-center font-bold text-xs overflow-hidden">
                                     {hs?.avatar_url ? <img src={hs.avatar_url} alt="Ava" className="w-full h-full object-cover"/> : (hs?.full_name?.charAt(0) || 'U')}
                                  </div>
                                  <div><div className="text-sm font-bold text-slate-600 dark:text-slate-300">{hs?.full_name}</div>{hs.isGhost && <div className="text-[10px] text-red-400">Chưa Đăng nhập</div>}</div>
                                </div>
                                <div className="text-[10px] font-black uppercase text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded border border-red-100 dark:border-red-800/50">Chưa làm</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* MODALS AI ANALYTICS & ADD STUDENT */}
          {showStudentAiModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white dark:bg-[#111827] w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-[32px] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
                <button onClick={() => setShowStudentAiModal(false)} className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-full text-slate-500 transition-colors"><X size={18}/></button>
                <h3 className="text-2xl font-black text-blue-950 dark:text-white mb-2 flex items-center gap-2"><BrainCircuit className="text-purple-600"/> Báo cáo cá nhân</h3>
                <p className="text-sm font-bold text-purple-600 mb-6 bg-purple-50 dark:bg-purple-900/30 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800/50 w-fit">Học sinh: {selectedStudentName}</p>
                <div className="markdown-body text-[15px] leading-relaxed text-slate-700 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-6">
                  {studentAiInsight ? <ReactMarkdown>{studentAiInsight}</ReactMarkdown> : <div className="flex flex-col items-center justify-center py-10 text-purple-500"><Loader2 size={32} className="animate-spin mb-3"/><p className="font-bold">FMath AI đang phân tích dữ liệu...</p></div>}
                </div>
                <div className="mt-8 flex justify-end"><button onClick={() => setShowStudentAiModal(false)} className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-6 py-3 rounded-xl transition-colors">Đóng</button></div>
              </div>
            </div>
          )}

          {showAddStudentModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
                <div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-black text-blue-950 dark:text-white">Thêm Học Sinh Mới</h3><button onClick={() => setShowAddStudentModal(false)} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 rounded-full"><X size={18} className="dark:text-slate-400"/></button></div>
                <div className="flex gap-4 mb-6 border-b border-slate-200 dark:border-slate-800">
                  <button onClick={() => setAddMode('manual')} className={`pb-3 font-bold text-sm border-b-2 flex items-center gap-2 ${addMode === 'manual' ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400'}`}><UserPlus size={16}/> Thêm thủ công</button>
                  <button onClick={() => setAddMode('excel')} className={`pb-3 font-bold text-sm border-b-2 flex items-center gap-2 ${addMode === 'excel' ? 'border-green-600 text-green-600 dark:border-green-500 dark:text-green-400' : 'border-transparent text-slate-500 dark:text-slate-400'}`}><FileSpreadsheet size={16}/> Nhập từ Excel</button>
                </div>
                
                {addMode === 'manual' ? (
                  <div className="space-y-4">
                    <input type="text" value={newStudentForm.name} onChange={e => setNewStudentForm({...newStudentForm, name: e.target.value})} className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 font-bold dark:text-white" placeholder="Họ và tên (VD: Nguyễn Văn A) *"/>
                    <input type="email" value={newStudentForm.email} onChange={e => setNewStudentForm({...newStudentForm, email: e.target.value})} className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 font-bold dark:text-white" placeholder="Email học sinh *"/>
                    <input type="text" value={newStudentForm.code} onChange={e => setNewStudentForm({...newStudentForm, code: e.target.value})} className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 font-medium dark:text-white" placeholder="Mã HS (Tùy chọn)"/>
                    <button onClick={handleAddStudentManually} disabled={isProcessing} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50">{isProcessing ? <Loader2 className="animate-spin"/> : <Save size={18}/>} Thêm học sinh</button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-2xl text-sm font-medium text-green-800 dark:text-green-300 flex flex-col gap-2">
                      <p><span className="font-bold mb-1">Hướng dẫn:</span> File Excel bắt buộc phải có 2 cột <strong>"Họ tên"</strong> và <strong>"Email"</strong>.</p>
                    </div>
                    <label className="cursor-pointer flex flex-col items-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                      {isProcessing ? <Loader2 size={40} className="animate-spin text-green-500"/> : <><UploadCloud size={48} className="text-slate-400 dark:text-slate-500 mb-3"/><span className="font-bold text-slate-700 dark:text-slate-300 mb-1">Nhấn để tải file lên (.xlsx)</span><input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleExcelUpload}/></>}
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassManagement;