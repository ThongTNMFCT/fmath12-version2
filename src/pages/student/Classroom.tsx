import React, { useState, useEffect } from 'react';
import { 
  Users, MessageSquare, FileText, Bell, Send, User, 
  Trophy, Calendar, CheckCircle2, AlertCircle, PlayCircle,
  GraduationCap, Loader2, ArrowRight, BrainCircuit, ExternalLink, X, Mail
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';

const Classroom = () => {
  const { currentUser } = useAppStore();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'feed' | 'assignments' | 'members'>('feed');

  // States Dữ liệu thật
  const [isLoading, setIsLoading] = useState(true);
  const [classInfo, setClassInfo] = useState<any>(null);
  const [teacherInfo, setTeacherInfo] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  // State Modal Thông tin giáo viên
  const [showTeacherProfile, setShowTeacherProfile] = useState(false);

  useEffect(() => {
    const fetchClassroomData = async () => {
      if (!currentUser?.id) return;
      setIsLoading(true);

      try {
        // 1. Lấy thông tin lớp mà học sinh đang tham gia (status = joined)
        const { data: memberData } = await supabase
          .from('class_members')
          .select('class_id')
          .eq('user_id', currentUser.id)
          .eq('status', 'joined')
          .maybeSingle();

        if (!memberData) {
          setIsLoading(false);
          return; // Chưa vào lớp nào
        }

        // 2. Lấy chi tiết lớp học & Thông tin giáo viên
        const { data: classData } = await supabase
          .from('classes')
          .select('*')
          .eq('id', memberData.class_id)
          .single();
        
        setClassInfo(classData);

        if (classData?.teacher_id) {
          const { data: teacherData } = await supabase.from('users').select('*').eq('id', classData.teacher_id).single();
          setTeacherInfo(teacherData);
        }

        // 3. Lấy danh sách thành viên trong lớp
        const { data: classMembers } = await supabase
          .from('class_members')
          .select('users(id, full_name, email, role, xp, avatar_url)')
          .eq('class_id', memberData.class_id)
          .eq('status', 'joined');
        
        if (classMembers) {
          const formattedMembers = classMembers.map((m: any) => m.users).filter(Boolean);
          // Sắp xếp học sinh theo XP giảm dần
          formattedMembers.sort((a: any, b: any) => (b.xp || 0) - (a.xp || 0));
          setMembers(formattedMembers);
        }

        // 4. Lấy danh sách Bài tập được giao & Lịch sử làm bài
        const { data: assignsData } = await supabase
          .from('class_exams')
          .select('due_date, exams(id, title, type)')
          .eq('class_id', memberData.class_id)
          .order('due_date', { ascending: true });

        const { data: attemptsData } = await supabase
          .from('exam_attempts')
          .select('exam_id, score')
          .eq('user_id', currentUser.id);

        if (assignsData) {
          const formattedAssigns = assignsData.map((item: any) => {
            const studentAttempts = attemptsData?.filter(a => a.exam_id === item.exams.id) || [];
            const isOverdue = new Date(item.due_date).getTime() < new Date().getTime();
            
            let status = 'todo';
            if (studentAttempts.length > 0) status = 'done';
            else if (isOverdue) status = 'overdue';

            return {
              id: item.exams.id,
              title: item.exams.title,
              type: item.exams.type,
              dueDate: new Date(item.due_date).toLocaleString('vi-VN'),
              status: status,
              attemptsCount: studentAttempts.length,
              score: studentAttempts.length > 0 ? Math.max(...studentAttempts.map(a => a.score)) : null
            };
          });
          setAssignments(formattedAssigns);
        }

        // 5. Lấy Thông báo từ Giáo viên
        const { data: annData } = await supabase
          .from('class_announcements')
          .select('*')
          .eq('class_id', memberData.class_id)
          .order('created_at', { ascending: false });

        if (annData) setAnnouncements(annData);

      } catch (error) {
        console.error("Lỗi lấy dữ liệu Lớp học:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassroomData();
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] text-blue-600">
        <Loader2 size={48} className="animate-spin mb-4" />
        <p className="font-bold">Đang tải không gian lớp học...</p>
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] text-slate-500 p-6">
        <GraduationCap size={80} className="mb-6 opacity-20" />
        <h3 className="text-2xl font-black text-blue-950 dark:text-white mb-2">Chưa tham gia lớp học</h3>
        <p className="font-medium text-center max-w-md mb-8">Bạn hiện chưa được xếp vào lớp nào. Vui lòng xin Mã lớp (hoặc Link tham gia) từ giáo viên bộ môn nhé!</p>
        <button onClick={() => navigate('/dashboard')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-xl shadow-md transition-all">
          Về trang chủ
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] relative animate-in fade-in overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 pb-32">
        <div className="max-w-5xl mx-auto w-full">
          
          {/* --- CLASS COVER BANNER --- */}
          <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-[32px] md:rounded-[40px] p-8 md:p-12 mb-8 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
            <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border border-white/30 shadow-inner">
                <GraduationCap size={18} /> FPT School
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 tracking-tight drop-shadow-md">
                {classInfo.name}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-blue-50 font-medium text-base">
                <span className="flex items-center gap-2 bg-black/20 px-4 py-1.5 rounded-xl backdrop-blur-sm">
                  <Users size={18}/> {members.length} Học sinh
                </span>
                <span className="flex items-center gap-2 bg-black/20 px-4 py-1.5 rounded-xl backdrop-blur-sm cursor-pointer hover:bg-white/20 transition-colors" onClick={() => {setActiveTab('members'); setTimeout(() => setShowTeacherProfile(true), 100);}}>
                  GV: <strong className="text-white">{teacherInfo?.full_name || 'Đang cập nhật'}</strong>
                </span>
              </div>
            </div>
            <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
            <Users className="absolute top-12 right-12 w-48 h-48 text-white/10 -rotate-12 pointer-events-none hidden md:block" />
          </div>

          {/* --- TABS --- */}
          <div className="flex justify-center mb-8">
            <div className="glass bg-white/80 dark:bg-slate-900/80 p-2 rounded-2xl md:rounded-full border border-white dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-2">
              <button onClick={() => setActiveTab('feed')} className={`px-6 py-3 rounded-xl md:rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'feed' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
                <MessageSquare size={18} /> Bảng tin
              </button>
              <button onClick={() => setActiveTab('assignments')} className={`px-6 py-3 rounded-xl md:rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'assignments' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
                <FileText size={18} /> Bài tập lớp
              </button>
              <button onClick={() => setActiveTab('members')} className={`px-6 py-3 rounded-xl md:rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'members' ? 'bg-green-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
                <Users size={18} /> Thành viên
              </button>
            </div>
          </div>

          <div className="w-full">
            
            {/* TAB 1: BẢNG TIN */}
            {activeTab === 'feed' && (
              <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 max-w-4xl mx-auto">
                {announcements.length === 0 ? (
                  <div className="text-center p-12 text-slate-500 glass rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <Bell size={40} className="mx-auto mb-4 opacity-30" />
                    <p className="font-bold text-lg">Chưa có thông báo nào từ Giáo viên.</p>
                  </div>
                ) : (
                  announcements.map(ann => (
                    <div key={ann.id} className="glass bg-white/90 dark:bg-slate-900/90 p-6 md:p-8 rounded-[30px] border shadow-sm transition-all hover:shadow-md border-purple-200 dark:border-purple-800/50 ring-1 ring-purple-100 dark:ring-purple-900/30">
                      
                      <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs uppercase tracking-wider mb-5 bg-purple-50 dark:bg-purple-900/20 w-fit px-3 py-1.5 rounded-lg border border-purple-100 dark:border-purple-800/50">
                        <Bell size={14} /> Thông báo từ Giáo viên
                      </div>
                      
                      <div className="flex justify-between items-start mb-5">
                        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setShowTeacherProfile(true)}>
                          <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-white text-lg shadow-inner bg-gradient-to-br from-purple-500 to-purple-700 overflow-hidden group-hover:scale-105 transition-transform border-2 border-transparent group-hover:border-purple-300">
                            {teacherInfo?.avatar_url ? <img src={teacherInfo.avatar_url} alt="GV" className="w-full h-full object-cover"/> : teacherInfo?.full_name?.charAt(0) || 'GV'}
                          </div>
                          <div>
                            <div className="font-bold text-blue-950 dark:text-white flex items-center gap-2 text-lg group-hover:text-purple-600 transition-colors">
                              {teacherInfo?.full_name || 'Giáo viên'}
                              <CheckCircle2 size={16} className="text-blue-500"/>
                            </div>
                            <div className="text-sm text-slate-500 flex items-center gap-2">
                              {new Date(ann.created_at).toLocaleString('vi-VN')}
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-base md:text-lg whitespace-pre-line bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                        {ann.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 2: BÀI TẬP */}
            {activeTab === 'assignments' && (
              <div className="flex flex-col gap-5 animate-in slide-in-from-bottom-4 max-w-4xl mx-auto">
                {assignments.length === 0 ? (
                   <div className="text-center py-20 text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[32px]">Giáo viên chưa giao bài tập nào cho lớp.</div>
                ) : assignments.map(assignment => {
                  
                  let statusColor = "";
                  let statusText = "";
                  let StatusIcon = FileText;

                  if (assignment.status === 'todo') {
                    statusColor = "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400";
                    statusText = "Chưa làm";
                    StatusIcon = AlertCircle;
                  } else if (assignment.status === 'done') {
                    statusColor = "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400";
                    statusText = "Đã nộp";
                    StatusIcon = CheckCircle2;
                  } else {
                    statusColor = "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400";
                    statusText = "Quá hạn";
                    StatusIcon = AlertCircle;
                  }

                  return (
                    <div key={assignment.id} className="glass bg-white/90 dark:bg-slate-900/90 p-6 md:p-8 rounded-[30px] border border-white dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all">
                      <div className="flex items-start md:items-center gap-5">
                        <div className={`p-4 rounded-2xl shrink-0 border ${statusColor}`}>
                          <StatusIcon size={28} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-blue-950 dark:text-white mb-2 leading-snug">{assignment.title}</h3>
                          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500">
                            <span className="flex items-center gap-1.5"><Calendar size={16}/> Hạn chót: {assignment.dueDate}</span>
                            <span className="flex items-center gap-1.5 uppercase tracking-wider px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-400">
                              {assignment.type}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-center justify-between md:justify-end gap-4 sm:gap-8 w-full md:w-auto border-t md:border-none border-slate-100 dark:border-slate-800 pt-5 md:pt-0 shrink-0">
                        <div className="text-center md:text-right w-full sm:w-auto">
                          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Trạng thái</div>
                          <div className={`font-black text-xl ${
                            assignment.status === 'todo' ? 'text-orange-500' : 
                            assignment.status === 'done' ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {assignment.status === 'done' ? `Max: ${assignment.score} điểm` : statusText}
                          </div>
                          {assignment.status === 'done' && (
                            <div className="text-[10px] text-slate-500 font-medium mt-1">Đã làm {assignment.attemptsCount} lượt</div>
                          )}
                        </div>
                        
                        <Link 
                          to={`/quiz/${assignment.id}/take`}
                          className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black transition-all text-center shadow-md ${
                            assignment.status === 'todo' 
                              ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-blue-600/30 hover:-translate-y-1' 
                              : 'bg-slate-800 text-white hover:bg-slate-700 hover:-translate-y-1'
                          }`}
                        >
                          {assignment.status === 'done' ? 'Làm lại' : 'Làm ngay'}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 3: THÀNH VIÊN */}
            {activeTab === 'members' && (
              <div className="animate-in slide-in-from-bottom-4 max-w-4xl mx-auto">
                
                {/* TƯƠNG TÁC: THẺ GIÁO VIÊN CÓ THỂ CLICK */}
                {teacherInfo && (
                  <div className="mb-10">
                    <h3 className="text-xl font-black text-blue-950 dark:text-white mb-6 flex items-center gap-2">
                      <GraduationCap className="text-purple-500"/> Giáo viên chủ nhiệm
                    </h3>
                    <div 
                      onClick={() => setShowTeacherProfile(true)}
                      className="flex items-center justify-between p-5 rounded-[24px] glass bg-white/90 dark:bg-slate-900/90 border border-slate-100 dark:border-slate-800 shadow-sm max-w-md hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 text-white flex items-center justify-center font-bold text-xl shadow-inner overflow-hidden group-hover:scale-105 transition-transform">
                          {teacherInfo.avatar_url ? <img src={teacherInfo.avatar_url} alt="Ava" className="w-full h-full object-cover"/> : teacherInfo.full_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-blue-950 dark:text-white text-lg group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{teacherInfo.full_name}</div>
                          <div className="text-xs font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded mt-1 inline-block uppercase tracking-wider">Giáo viên</div>
                        </div>
                      </div>
                      <div className="text-slate-400 group-hover:text-purple-500 transition-colors p-2">
                        <ExternalLink size={20} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Học sinh */}
                <div>
                  <div className="flex justify-between items-end mb-6">
                    <h3 className="text-xl font-black text-blue-950 dark:text-white flex items-center gap-2">
                      <Users className="text-blue-500"/> Sĩ tử ({members.length})
                    </h3>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">Xếp hạng XP</div>
                  </div>

                  <div className="space-y-4">
                    {members.map((student, idx) => (
                      <div key={student.id} className="flex items-center gap-4 md:gap-6 p-4 md:p-5 rounded-[24px] glass bg-white/90 dark:bg-slate-900/90 border border-white dark:border-slate-800 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 group">
                        
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-base shrink-0 ${
                          idx === 0 ? 'bg-yellow-400 text-yellow-900 shadow-sm' :
                          idx === 1 ? 'bg-slate-300 text-slate-700 shadow-sm' :
                          idx === 2 ? 'bg-amber-600 text-amber-100 shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {idx === 0 ? <Trophy size={20}/> : idx + 1}
                        </div>

                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-green-400 p-[2px] shrink-0">
                          <div className="w-full h-full bg-white dark:bg-slate-900 rounded-full flex items-center justify-center font-bold text-lg text-blue-600 dark:text-blue-400 overflow-hidden">
                            {student.avatar_url ? <img src={student.avatar_url} alt="Ava" className="w-full h-full object-cover"/> : student.full_name.charAt(0)}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-blue-950 dark:text-white text-lg group-hover:text-blue-600 transition-colors truncate">{student.full_name}</div>
                          <div className="text-sm font-medium text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <User size={14}/> Thành viên {currentUser.id === student.id && <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded font-bold ml-1 uppercase tracking-wider">Bạn</span>}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-black text-lg text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-4 py-2 rounded-xl border border-orange-100 dark:border-orange-800/50 shadow-inner">
                            {student.xp || 0} <span className="text-sm">XP</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      </div>

      {/* --- MODAL THÔNG TIN GIÁO VIÊN --- */}
      {showTeacherProfile && teacherInfo && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-in fade-in px-4">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] max-w-sm w-full text-center shadow-2xl border border-slate-200 dark:border-slate-800 scale-in-center relative">
            <button 
              onClick={() => setShowTeacherProfile(false)} 
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors"
            >
              <X size={18}/>
            </button>

            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-purple-700 text-white flex items-center justify-center font-black text-3xl shadow-lg overflow-hidden mb-4 border-4 border-white dark:border-slate-800">
              {teacherInfo.avatar_url ? <img src={teacherInfo.avatar_url} alt="Ava" className="w-full h-full object-cover"/> : teacherInfo.full_name.charAt(0)}
            </div>

            <h2 className="text-2xl font-black text-blue-950 dark:text-white mb-1">{teacherInfo.full_name}</h2>
            <p className="text-purple-600 dark:text-purple-400 font-bold text-sm uppercase tracking-wider mb-6">Giáo viên chủ nhiệm</p>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 mb-6 text-left shadow-inner">
               <div className="text-xs font-bold text-slate-400 uppercase mb-2">Thông tin liên hệ</div>
               <div className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                    <Mail size={16} className="text-purple-500"/> 
                  </div>
                  <span className="truncate">{teacherInfo.email || 'Chưa cập nhật email'}</span>
               </div>
            </div>

            <a
              href={`mailto:${teacherInfo.email}`}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-4 rounded-xl transition-all shadow-md hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              <Mail size={18} /> GỬI EMAIL CHO THẦY/CÔ
            </a>
          </div>
        </div>
      )}

    </div>
  );
};

export default Classroom;