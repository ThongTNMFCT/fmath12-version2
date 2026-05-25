import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, School, BookOpen, Hash, Award, Flame, ShieldCheck, Edit2, Save, X, Loader2, CheckCircle2, Trophy, Camera } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { supabase } from '../../config/supabase';
import { studentService } from '../../services/studentService';

const Profile = () => {
  const { currentUser, setUser, isFptStudent } = useAppStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // States cho ảnh Avatar
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: currentUser.name || '',
    studentId: currentUser.studentId || '',
    school: currentUser.school || (isFptStudent ? 'FPT School' : ''),
    className: currentUser.className || '',
  });

  // Tải dữ liệu lần đầu khi vào trang
  useEffect(() => {
    setAvatarPreview(currentUser.avatar_url || null);
    
    setFormData({
      name: currentUser.name || '',
      studentId: currentUser.studentId || '',
      school: currentUser.school || (isFptStudent ? 'FPT School' : ''),
      className: currentUser.className || '',
    });
  }, [currentUser, isFptStudent]);

  // Khi người dùng chọn ảnh từ máy tính
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const imageUrl = URL.createObjectURL(file);
      setAvatarPreview(imageUrl); // Hiện ngay ảnh tạm thời cho mượt
      setIsEditing(true); // Bật chế độ chỉnh sửa
    }
  };

  // Nút Lưu siêu cấp vô địch
  const handleSave = async () => {
    if (!currentUser.email) {
      alert("Lỗi: Không tìm thấy email của bạn!");
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      let finalAvatarUrl = currentUser.avatar_url; // Mặc định giữ link ảnh cũ

      // 1. UPLOAD LÊN CLOUDINARY NẾU CÓ CHỌN ẢNH MỚI
      if (selectedFile) {
        console.log("1. Đang tải ảnh lên Cloudinary...");
        const tempId = currentUser.id || currentUser.email.split('@')[0];
        const publicUrl = await studentService.uploadAvatar(tempId, selectedFile);
        
        if (publicUrl) {
          finalAvatarUrl = publicUrl;
          console.log("-> Upload ảnh thành công:", finalAvatarUrl);
        }
      }

      // 2. LƯU THÔNG TIN & LINK ẢNH MỚI VÀO SUPABASE
      console.log("2. Đang lưu thông tin vào Supabase...");
      const { data, error } = await supabase
        .from('users')
        .upsert({
          email: currentUser.email,
          full_name: formData.name,
          student_code: formData.studentId,
          school: formData.school,
          class_name: formData.className,
          role: currentUser.role || 'student',
          avatar_url: finalAvatarUrl, // Chuẩn tên cột PostgreSQL
        }, { onConflict: 'email' })
        .select(); 

      if (error) throw error;

      console.log("-> Lưu Supabase thành công!");

      // 3. ÉP GIAO DIỆN CẬP NHẬT NGAY LẬP TỨC
      setUser({
        ...currentUser,
        ...data[0], 
        avatar_url: finalAvatarUrl // Ép Store nhận link mới
      });
      setAvatarPreview(finalAvatarUrl); // Ép UI vẽ lại cái ảnh vừa up

      setSaveSuccess(true);
      setIsEditing(false);
      setSelectedFile(null); 
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error("Lỗi cập nhật hồ sơ chi tiết:", error.message);
      alert("Không thể lưu thông tin: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleLabel = () => {
    if (currentUser.role === 'admin') return { text: 'Quản trị viên', color: 'bg-red-100 text-red-600 border-red-200' };
    if (currentUser.role === 'teacher') return { text: 'Giáo viên', color: 'bg-purple-100 text-purple-600 border-purple-200' };
    return { text: 'Học sinh', color: 'bg-blue-100 text-blue-600 border-blue-200' };
  };

  const roleInfo = getRoleLabel();

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] relative animate-in fade-in overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 pb-24">
        <div className="max-w-4xl mx-auto w-full">
          
          {/* ========================================= */}
          {/* HEADER CARD: Banner + User Info */}
          {/* ========================================= */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[32px] border border-white dark:border-slate-800 shadow-sm mb-8 overflow-hidden hover:shadow-md transition-shadow">
            
            {/* Banner (Nửa trên) */}
            <div className="h-32 md:h-48 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative">
              <div className="absolute inset-0 opacity-20 math-pattern"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[50px] translate-x-1/2 -translate-y-1/2"></div>
            </div>

            {/* Thông tin User (Nửa dưới) */}
            <div className="px-6 md:px-10 pb-8 relative flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6">
              
              {/* Avatar */}
              <div className="-mt-16 md:-mt-20 shrink-0 relative group z-10">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white dark:bg-slate-900 p-1.5 shadow-xl border-4 border-white dark:border-slate-900 transition-transform duration-300 group-hover:scale-105 relative overflow-hidden">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center font-black text-5xl md:text-6xl text-white">
                      {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  
                  {/* Nút Đổi ảnh (Hover) */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                  >
                    <Camera size={32} className="mb-1" />
                    <span className="text-xs font-bold">Đổi ảnh</span>
                  </div>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
              </div>

              {/* Tên và Chức vụ */}
              <div className="pt-2 md:pt-4 flex-1 text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-black text-blue-950 dark:text-white mb-2">
                  {formData.name || 'Thành viên mới'}
                </h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${roleInfo.color} flex items-center gap-1.5 shadow-sm`}>
                    <ShieldCheck size={14} /> {roleInfo.text}
                  </span>
                  {isFptStudent && (
                    <span className="px-3 py-1 rounded-lg text-xs font-bold border bg-orange-100 text-orange-600 border-orange-200 flex items-center gap-1.5 shadow-sm">
                      <School size={14} /> FPT School
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* ========================================= */}


          {/* THÔNG BÁO LƯU THÀNH CÔNG */}
          {saveSuccess && (
            <div className="mb-8 bg-green-50 border border-green-200 text-green-700 px-5 py-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 shadow-sm">
              <CheckCircle2 size={24} className="text-green-500 shrink-0" />
              <span className="font-bold text-sm md:text-base">Cập nhật hồ sơ thành công! Dữ liệu đã được đồng bộ.</span>
            </div>
          )}

          {/* MAIN CONTENT CARDS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            
            {/* CỘT TRÁI: THỐNG KÊ (Chỉ hiện cho Học sinh) */}
            {currentUser.role === 'student' && (
              <div className="lg:col-span-1 flex flex-col gap-6">
                <div className="glass bg-white/90 dark:bg-slate-900/90 rounded-[32px] border border-white dark:border-slate-800 shadow-sm p-6 md:p-8 hover:shadow-md transition-shadow">
                  <h3 className="font-black text-blue-950 dark:text-white text-lg mb-6 flex items-center gap-2">
                    <Award className="text-orange-500" /> Thành tích cá nhân
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex items-center gap-4 border border-slate-100 dark:border-slate-700">
                      <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-500 flex items-center justify-center shrink-0">
                        <Flame size={24} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Chuỗi ngày học</div>
                        <div className="font-black text-xl text-blue-950 dark:text-white">{currentUser.streak || 0} <span className="text-sm font-medium text-slate-500">ngày</span></div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex items-center gap-4 border border-slate-100 dark:border-slate-700">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
                        <Award size={24} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Cấp độ hiện tại</div>
                        <div className="font-black text-xl text-blue-950 dark:text-white">Level {currentUser.level || 1}</div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex items-center gap-4 border border-slate-100 dark:border-slate-700">
                      <div className="w-12 h-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 flex items-center justify-center shrink-0">
                        <Trophy size={24} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Điểm kinh nghiệm</div>
                        <div className="font-black text-xl text-blue-950 dark:text-white">{(currentUser.xp || 0).toLocaleString()} <span className="text-sm font-medium text-slate-500">XP</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CỘT PHẢI: FORM THÔNG TIN CƠ BẢN */}
            <div className={currentUser.role === 'student' ? 'lg:col-span-2' : 'lg:col-span-3'}>
              <div className="glass bg-white/90 dark:bg-slate-900/90 rounded-[32px] border border-white dark:border-slate-800 shadow-sm p-6 md:p-8 relative hover:shadow-md transition-shadow">
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="font-black text-blue-950 dark:text-white text-xl">Thông tin cơ bản</h3>
                  {!isEditing ? (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="w-full sm:w-auto text-sm font-bold bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-5 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit2 size={16} /> Chỉnh sửa hồ sơ
                    </button>
                  ) : (
                    <div className="flex w-full sm:w-auto gap-2">
                      <button 
                        onClick={() => {
                          setIsEditing(false);
                          setSelectedFile(null);
                          setAvatarPreview(currentUser.avatar_url || null); // Hủy là quay về ảnh cũ ngay
                          setFormData({
                            name: currentUser.name || '',
                            studentId: currentUser.studentId || '',
                            school: currentUser.school || '',
                            className: currentUser.className || '',
                          });
                        }}
                        className="flex-1 sm:flex-none text-sm font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-5 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <X size={16} /> Hủy
                      </button>
                      <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 sm:flex-none text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                        {isSaving ? 'Đang lưu...' : 'Lưu lại'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Email */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Mail size={14}/> Địa chỉ Email</label>
                    <div className="w-full bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 p-4 rounded-xl font-medium border border-slate-200 dark:border-slate-700 cursor-not-allowed flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm">
                        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-3.5 h-3.5" />
                      </div>
                      {currentUser.email || 'Chưa liên kết email'}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 font-medium italic">* Email được liên kết an toàn với Google và không thể thay đổi.</p>
                  </div>

                  {/* Họ và Tên */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><User size={14}/> Họ và Tên</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-white dark:bg-slate-900 text-blue-950 dark:text-white p-4 rounded-xl font-bold border-2 border-blue-200 dark:border-blue-800 outline-none focus:border-blue-500 transition-colors shadow-inner"
                        placeholder="Nhập họ và tên..."
                      />
                    ) : (
                      <div className="w-full bg-slate-50 dark:bg-slate-800/50 text-blue-950 dark:text-white p-4 rounded-xl font-bold border border-slate-100 dark:border-slate-800">
                        {formData.name || 'Chưa cập nhật'}
                      </div>
                    )}
                  </div>

                  {/* Mã học sinh (Chỉ Học sinh mới có) */}
                  {currentUser.role === 'student' && (
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><Hash size={14}/> Mã số học sinh</label>
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={formData.studentId}
                          onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                          className="w-full bg-white dark:bg-slate-900 text-blue-950 dark:text-white p-4 rounded-xl font-bold border-2 border-blue-200 dark:border-blue-800 outline-none focus:border-blue-500 transition-colors shadow-inner"
                          placeholder="Nhập mã số..."
                        />
                      ) : (
                        <div className="w-full bg-slate-50 dark:bg-slate-800/50 text-blue-950 dark:text-white p-4 rounded-xl font-bold border border-slate-100 dark:border-slate-800">
                          {formData.studentId || 'Chưa cập nhật'}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Trường học */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><School size={14}/> Trường học</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={formData.school}
                        onChange={(e) => setFormData({...formData, school: e.target.value})}
                        className="w-full bg-white dark:bg-slate-900 text-blue-950 dark:text-white p-4 rounded-xl font-bold border-2 border-blue-200 dark:border-blue-800 outline-none focus:border-blue-500 transition-colors shadow-inner"
                        placeholder="Tên trường..."
                      />
                    ) : (
                      <div className="w-full bg-slate-50 dark:bg-slate-800/50 text-blue-950 dark:text-white p-4 rounded-xl font-bold border border-slate-100 dark:border-slate-800">
                        {formData.school || 'Chưa cập nhật'}
                      </div>
                    )}
                  </div>

                  {/* Lớp học */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2"><BookOpen size={14}/> Lớp học</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={formData.className}
                        onChange={(e) => setFormData({...formData, className: e.target.value})}
                        className="w-full bg-white dark:bg-slate-900 text-blue-950 dark:text-white p-4 rounded-xl font-bold border-2 border-blue-200 dark:border-blue-800 outline-none focus:border-blue-500 transition-colors shadow-inner"
                        placeholder="Tên lớp (VD: 12A1)..."
                      />
                    ) : (
                      <div className="w-full bg-slate-50 dark:bg-slate-800/50 text-blue-950 dark:text-white p-4 rounded-xl font-bold border border-slate-100 dark:border-slate-800">
                        {formData.className || 'Chưa cập nhật'}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;