import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sigma, Sparkles, Loader2 } from 'lucide-react';
import { signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider } from '../../config/firebase';
import { useAppStore } from '../../store/useAppStore';

const LoginPage = () => {
  const navigate = useNavigate();
  const { switchRole, setIsFptStudent } = useAppStore(); 
  
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // 1. TỰ ĐỘNG ĐĂNG NHẬP (0-Click) NẾU ĐÃ CÓ SESSION
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Nếu đã đăng nhập, cho vào thẳng trang chủ luôn
        navigate('/dashboard');
      } else {
        setIsCheckingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // 2. XỬ LÝ ĐĂNG NHẬP BẰNG GOOGLE (1-Click)
  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError("");
      
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userEmail = user.email?.toLowerCase() || "";
      
      let assignedRole: 'admin' | 'teacher' | 'student' = 'student';
      let isFPT = false;

      // PHÂN LUỒNG TÀI KHOẢN THEO QUY TẮC EMAIL
      if (userEmail === '5phutcungpy@gmail.com' || userEmail === 'tamtt48@fpt.edu.vn') {
        assignedRole = 'admin';
        isFPT = true;
      } else if (userEmail === 'aiquizfct@gmail.com' || userEmail.endsWith('@fpt.edu.vn')) {
        assignedRole = 'teacher';
        isFPT = true;
      } else if (userEmail.includes('fct')) {
        assignedRole = 'student';
        isFPT = true; // Học sinh FPT
      } else {
        assignedRole = 'student';
        isFPT = false; // Học sinh tự do ngoài hệ thống
      }

      setIsFptStudent(isFPT);
      switchRole(assignedRole);
      
      // Đăng nhập thành công, Firebase onAuthStateChanged sẽ tự động đẩy sang Dashboard
      navigate('/dashboard');
      
    } catch (err: any) {
      console.error(err);
      setError("Đăng nhập bị hủy hoặc có lỗi kết nối. Vui lòng thử lại!");
      setIsLoading(false);
    }
  };

  // Màn hình chờ siêu tốc khi đang check tài khoản cũ
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] dark:bg-[#0B1121] flex flex-col items-center justify-center">
        <Loader2 size={40} className="animate-spin text-indigo-600 mb-4" />
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Đang xác thực...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative font-sans text-slate-800 dark:text-slate-200 flex items-center justify-center overflow-hidden transition-colors duration-500 bg-[#FDFDFD] dark:bg-[#0B1121]">
      
      {/* NỀN SỐNG ĐỘNG ĐA SẮC (Multicolor Blobs) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-indigo-100 dark:bg-indigo-900/10 rounded-full mix-blend-multiply filter blur-[100px] md:blur-[150px] opacity-70 animate-blob"></div>
        <div className="absolute top-[30%] right-[-15%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-rose-100 dark:bg-rose-900/10 rounded-full mix-blend-multiply filter blur-[120px] md:blur-[180px] opacity-60 animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-amber-100 dark:bg-amber-900/10 rounded-full mix-blend-multiply filter blur-[100px] md:blur-[150px] opacity-50 animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="w-full max-w-[420px] px-4 md:px-0 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Nút quay lại */}
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 font-semibold mb-6 transition-colors">
          <ArrowLeft size={18} /> Quay lại trang chủ
        </Link>

        {/* Thẻ Đăng nhập Kính Nổi (Glassmorphism Card) */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl p-8 md:p-10 rounded-[32px] md:rounded-[40px] shadow-[0_20px_60px_rgba(0,0,0,0.05)] dark:shadow-none border border-slate-100 dark:border-slate-800 relative overflow-hidden">
          
          <div className="flex flex-col items-center mb-8">
            {/* Thẻ tag FSchooler Cần Thơ */}
            <div className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-6 border border-indigo-100 dark:border-indigo-800">
              <Sparkles size={14} />
              Dự án FSchooler Cần Thơ
            </div>

            {/* Logo F-Prep */}
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Sigma size={24} strokeWidth={2.5} />
              </div>
              <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                F-Prep<span className="text-orange-500">.</span>
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 tracking-tight text-center">
              Chào mừng sĩ tử 2k8
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed text-center px-2">
              Hệ thống sử dụng tài khoản Google để đồng bộ dữ liệu và bảo mật tuyệt đối.
            </p>
          </div>

          {/* Cảnh báo lỗi */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 text-red-600 dark:text-red-400 rounded-2xl text-sm font-semibold text-center animate-in fade-in">
              {error}
            </div>
          )}

          {/* Nút Đăng nhập Google (Tối ưu 1-Click) */}
          <button 
            onClick={handleGoogleLogin} 
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-6 py-4 rounded-2xl font-bold text-[15px] border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-slate-700/50 hover:shadow-md transition-all duration-300 group disabled:opacity-50 disabled:hover:scale-100"
          >
            {isLoading ? (
              <Loader2 size={24} className="animate-spin text-indigo-600 dark:text-indigo-400" />
            ) : (
              <>
                <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Tiếp tục với Google
              </>
            )}
          </button>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-400 font-medium">
              Bảo mật tuyệt đối qua Google OAuth 2.0
            </p>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes flow { to { stroke-dashoffset: -12; } }
        .animate-flow { animation: flow 1s linear infinite; }
      `}</style>
    </div>
  );
};

export default LoginPage;