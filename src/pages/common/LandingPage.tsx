import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calculator, Atom, Beaker, Dna, Laptop, 
  CheckCircle2, ChevronRight, ArrowRight, Heart,
  Menu, X, Sigma, Sun, Moon, Star, Sparkles
} from 'lucide-react';

const FlowingArrow = ({ className, direction = "right" }: { className?: string, direction?: "right" | "left" | "down" }) => {
  let path = "";
  let head = "";
  
  if (direction === "right") {
    path = "M10,20 Q100,20 100,60 T190,100";
    head = "M175,90 L190,100 L175,110";
  } else if (direction === "left") {
    path = "M190,20 Q100,20 100,60 T10,100";
    head = "M25,90 L10,100 L25,110";
  } else {
    path = "M20,10 Q20,80 80,140";
    head = "M65,135 L80,140 L75,125";
  }

  return (
    <svg width="200" height="150" viewBox="0 0 200 150" fill="none" className={`pointer-events-none opacity-50 ${className}`}>
      <defs>
        <linearGradient id="arrowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>
      <path d={path} stroke="url(#arrowGrad)" strokeWidth="3" strokeDasharray="6 6" fill="none" strokeLinecap="round" className="animate-flow" />
      <path d={head} stroke="#EC4899" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleDark = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('is-visible');
        });
      },
      { threshold: 0.1 }
    );
    sectionsRef.current.forEach((section) => { if (section) observer.observe(section); });
    return () => { sectionsRef.current.forEach((section) => { if (section) observer.unobserve(section); }); };
  }, []);

  const subjects = [
    { id: 'math', name: 'Toán học', brand: 'F-Math', icon: <Calculator size={26} strokeWidth={2}/>, count: '200+', isHot: true, color: 'blue' },
    { id: 'physics', name: 'Vật lý', brand: 'F-Physics', icon: <Atom size={26} strokeWidth={2}/>, count: '150+', isHot: false, color: 'indigo' },
    { id: 'chemistry', name: 'Hoá học', brand: 'F-Chem', icon: <Beaker size={26} strokeWidth={2}/>, count: '150+', isHot: false, color: 'emerald' },
    { id: 'biology', name: 'Sinh học', brand: 'F-Bio', icon: <Dna size={26} strokeWidth={2}/>, count: '100+', isHot: false, color: 'rose' },
    { id: 'it', name: 'Tin học', brand: 'F-IT', icon: <Laptop size={26} strokeWidth={2}/>, count: '80+', isHot: false, color: 'purple' },
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-slate-800 selection:bg-indigo-500 selection:text-white relative overflow-hidden transition-colors duration-500 dark:bg-[#0B1121] dark:text-slate-200">
      
      {/* NỀN SỐNG ĐỘNG ĐA SẮC (Multicolor Blobs) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-indigo-100 dark:bg-indigo-900/10 rounded-full mix-blend-multiply filter blur-[100px] md:blur-[150px] opacity-70 animate-blob"></div>
        <div className="absolute top-[30%] right-[-15%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-rose-100 dark:bg-rose-900/10 rounded-full mix-blend-multiply filter blur-[120px] md:blur-[180px] opacity-60 animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-amber-100 dark:bg-amber-900/10 rounded-full mix-blend-multiply filter blur-[100px] md:blur-[150px] opacity-50 animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* HEADER */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-[0_1px_10px_rgb(0,0,0,0.05)] py-3' : 'bg-transparent py-5 md:py-6'}`}>
        <div className="max-w-[1240px] mx-auto px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-4 lg:gap-12">
            <button 
              className="lg:hidden text-slate-600 dark:text-slate-400 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
            <Link to="/" className="flex items-center gap-3 font-bold text-2xl tracking-tight text-slate-900 dark:text-white group">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white w-9 h-9 rounded-lg flex items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-md">
                <Sigma size={20} strokeWidth={2.5} />
              </div>
              <span>F-Prep<span className="text-orange-500">.</span></span>
            </Link>
            
            <nav className="hidden lg:flex gap-8 font-semibold text-slate-600 dark:text-slate-400 text-[15px]">
              <a href="#subjects" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Kho đề 2026</a>
              <a href="#about" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Về tác giả</a>
            </nav>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <button onClick={toggleDark} className="hidden sm:flex p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors shadow-sm">
              {isDark ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
            </button>
            <Link to="/login" className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white px-6 md:px-8 py-2.5 rounded-lg font-bold text-sm md:text-[15px] transition-colors flex items-center gap-2">
              Bắt đầu
            </Link>
          </div>
        </div>
      </header>

      {/* MOBILE MENU */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute top-20 left-4 right-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl flex flex-col gap-2 border border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-4" onClick={e => e.stopPropagation()}>
            <a href="#subjects" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-[15px] text-slate-700 dark:text-white hover:text-indigo-600 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Kho đề 2026</a>
            <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="font-bold text-[15px] text-slate-700 dark:text-white hover:text-indigo-600 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Về tác giả</a>
            <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>
            <button onClick={() => { toggleDark(); setIsMobileMenuOpen(false); }} className="font-bold text-[15px] text-slate-700 dark:text-white hover:text-indigo-600 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3">
               {isDark ? <><Sun size={20} className="text-yellow-400"/> Chế độ Sáng</> : <><Moon size={20} className="text-slate-500"/> Chế độ Tối</>}
            </button>
          </div>
        </div>
      )}

      {/* HERO SECTION TYPOGRAPHY CHUẨN EDTECH */}
      <main className="pt-36 md:pt-44 pb-16 md:pb-24 px-4 md:px-6 max-w-[1240px] mx-auto text-center relative z-10 animate-fade-in-up">
        
        <div className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-1.5 rounded-full text-sm font-semibold text-slate-600 dark:text-slate-300 mb-8 shadow-sm">
          <Sparkles size={16} className="text-orange-500" />
          Dự án đến từ Fschooler Cần Thơ
        </div>

        {/* Tiêu đề Đa Sắc (Multicolor Gradient) */}
        <h1 className="text-4xl md:text-5xl lg:text-[64px] font-bold text-[#2A3342] dark:text-white mb-2 tracking-tight">
          Luyện thi tốt nghiệp
        </h1>
        <h2 className="text-4xl md:text-5xl lg:text-[64px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 mb-10 tracking-tight relative inline-block">
          <span className="bg-gradient-to-r from-orange-400 to-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded absolute -top-4 -left-6 transform -rotate-12 shadow-sm">2026</span>
          THPT Quốc Gia & ĐGNL
          <div className="absolute -top-2 -right-8 w-8 h-8 text-indigo-300 opacity-60"><Star fill="currentColor"/></div>
        </h2>

        {/* Khối thống kê nhỏ phía dưới tiêu đề */}
        <div className="flex justify-center items-center gap-6 md:gap-12 mb-14 border-t border-b border-slate-100 dark:border-slate-800 py-6 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nền tảng</div>
            <div className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">TOP 1</div>
          </div>
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
          <div className="text-center">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Thành viên</div>
            <div className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">717,140</div>
          </div>
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
          <div className="text-center">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kho đề</div>
            <div className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">1.111+</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative px-4 md:px-0 w-full md:w-auto">
          <Link to="/login" className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-10 py-3.5 rounded-xl font-bold text-base transition-colors flex items-center justify-center shadow-lg shadow-indigo-500/30">
            Bắt đầu luyện đề <ArrowRight size={18} className="ml-2" />
          </Link>
          <a href="#about" className="w-full sm:w-auto bg-white dark:bg-slate-800 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 px-10 py-3.5 rounded-xl font-bold text-base hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center">
            Tìm hiểu tác giả
          </a>
          <FlowingArrow className="hidden lg:block absolute -right-20 top-10" direction="right" />
        </div>
      </main>

      {/* KHO ĐỀ THI ĐA MÀU SẮC */}
      <section id="subjects" ref={el => sectionsRef.current[0] = el} className="py-16 px-4 md:px-6 max-w-[1000px] mx-auto section-animate relative z-20">
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-10 shadow-sm relative overflow-hidden">
          
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100 dark:border-slate-800 relative z-10">
            <div className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded">2026</div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Hệ thống đề chuẩn cấu trúc</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 relative z-10">
            {subjects.map((sub, i) => {
              // Cấu hình đa màu sắc cho từng bộ môn
              const colorMap: Record<string, string> = {
                blue: 'text-blue-600 bg-blue-50 border-blue-200 group-hover:border-blue-400',
                indigo: 'text-indigo-600 bg-indigo-50 border-indigo-200 group-hover:border-indigo-400',
                emerald: 'text-emerald-600 bg-emerald-50 border-emerald-200 group-hover:border-emerald-400',
                rose: 'text-rose-600 bg-rose-50 border-rose-200 group-hover:border-rose-400',
                purple: 'text-purple-600 bg-purple-50 border-purple-200 group-hover:border-purple-400',
                cyan: 'text-cyan-600 bg-cyan-50 border-cyan-200 group-hover:border-cyan-400',
              };
              
              const theme = colorMap[sub.color];
              const textColor = theme.split(' ')[0];

              return (
                <button key={i} className="group relative bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all text-left flex items-center gap-4 hover:-translate-y-1">
                  <div className={`w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-500 group-hover:${textColor} transition-colors shrink-0`}>
                    {sub.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-slate-900 dark:text-white text-[16px] mb-0.5 flex items-center gap-2">
                      {sub.name}
                      {sub.isHot && <span className="text-[9px] bg-orange-500 text-white px-1.5 py-0.5 rounded uppercase">Hot</span>}
                    </div>
                    <div className="text-sm font-medium text-slate-500">{sub.count} bài test</div>
                  </div>
                  <ChevronRight size={18} className={`text-slate-300 group-hover:${textColor} group-hover:translate-x-1 transition-all`} />
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* TÁC GIẢ DỰ ÁN */}
      <section id="about" className="py-20 relative z-10 bg-slate-50 dark:bg-[#0B1121] overflow-hidden border-t border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 md:px-6 max-w-[800px] relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">Tác giả dự án F-Prep</h2>
            <p className="text-base text-slate-600 dark:text-slate-400 font-medium">
              Được xây dựng nhằm mang lại giải pháp ôn thi công bằng, thông minh cho cộng đồng học sinh.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <div className="w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 border-4 border-white dark:border-slate-700 shadow-md flex items-center justify-center mb-6 overflow-hidden group-hover:scale-105 transition-transform">
              <img 
                src="https://scontent.fsgn5-22.fna.fbcdn.net/v/t39.30808-6/650925253_122206901426362156_16092688359717999_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=53a332&_nc_eui2=AeEwWTUaJ29bQNputCc3ZZ4rgxLF70b1RPWDEsXvRvVE9d2sA0y1TMm3E80fNzNpRx9Lfz8aXIP3twYnZ2ZHq3yf&_nc_ohc=xbpzrXdQffsQ7kNvwGxVEfm&_nc_oc=AdrEisjbO3GrC1ZNglXmzIUn-Cl9K_wL7Yd6ogyDI8SzXnuLZ_XFjQEAwLTKecagqOzmaUYyb4YBC56sRNJRiKWa&_nc_zt=23&_nc_ht=scontent.fsgn5-22.fna&_nc_gid=6wVDoMP5rAjBHRd2eprXAA&_nc_ss=7b2a8&oh=00_Af7gvBBgLUtvA4e1N9uFvu6f7pxBkXcLyOHHSjDvZQ2csQ&oe=6A036920" 
                alt="Trần Ngọc Minh Thông" 
                className="w-full h-full object-cover" 
              />
            </div>

            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Trần Ngọc Minh Thông</h3>
            <p className="text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider text-xs mb-6 inline-block bg-indigo-50 dark:bg-indigo-900/30 px-4 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-800">
              Kỹ sư phát triển phần mềm
            </p>
            
            <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed text-base md:text-lg mb-8 max-w-lg mx-auto italic">
              "Mình xây dựng F-Prep với mục tiêu duy nhất: giúp các bạn học sinh tiếp cận kiến thức 2026 một cách hiện đại, hiệu quả và được hỗ trợ 24/7 bởi công nghệ AI."
            </p>

            <div className="flex justify-center gap-4 md:gap-8">
              <div className="text-center bg-slate-50 dark:bg-slate-800 p-3 md:p-4 rounded-xl border border-slate-100 dark:border-slate-700 w-full max-w-[120px]">
                <div className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">100%</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Tâm huyết</div>
              </div>
              <div className="text-center bg-slate-50 dark:bg-slate-800 p-3 md:p-4 rounded-xl border border-slate-100 dark:border-slate-700 w-full max-w-[120px]">
                <div className="text-xl md:text-2xl font-bold text-purple-600 dark:text-purple-400">Gen-Z</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Sáng tạo</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 text-center text-slate-500 dark:text-slate-400 font-medium border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1121] relative z-10 px-4">
        <div className="max-w-[1240px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white w-6 h-6 rounded flex items-center justify-center font-bold text-xs">F</div>
            <span className="font-bold text-slate-900 dark:text-white">F-Prep Platform.</span>
          </div>
          <p className="text-sm">© 2026 Toàn bộ bản quyền thuộc về <strong>Trần Ngọc Minh Thông</strong>.</p>
        </div>
      </footer>

      <style>{`
        .section-animate { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease-out, transform 0.6s ease-out; }
        .section-animate.is-visible { opacity: 1; transform: translateY(0); }
        @keyframes flow { to { stroke-dashoffset: -12; } }
        .animate-flow { animation: flow 1s linear infinite; }
      `}</style>
    </div>
  );
};

export default LandingPage;