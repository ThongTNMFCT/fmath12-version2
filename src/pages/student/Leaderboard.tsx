import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Flame, Medal, Loader2, User, School, Zap } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { studentService } from '../../services/studentService';

const Leaderboard = () => {
  const { currentUser } = useAppStore();
  const [filter, setFilter] = useState<'all' | 'class'>('all');
  
  // State lưu Data
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      const data = await studentService.getLeaderboard(50); // Lấy top 50
      setTopUsers(data);
      setIsLoading(false);
    };

    fetchLeaderboard();
  }, [filter]);

  // Hàm render Avatar
  const renderAvatar = (user: any, sizeClasses: string, textClasses: string) => {
    if (user.avatar_url) {
      return <img src={user.avatar_url} alt={user.full_name} className={`${sizeClasses} rounded-full object-cover`} />;
    }
    return (
      <div className={`${sizeClasses} rounded-full flex items-center justify-center font-black ${textClasses}`}>
        {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full relative animate-in fade-in bg-[#F8FAFC] dark:bg-[#0B0F19] overflow-hidden transition-colors duration-300">
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-40">
        
        {/* ========================================= */}
        {/* 1. HEADER KHU VỰC BẢNG VÀNG                 */}
        {/* ========================================= */}
        <div className="pt-10 pb-16 px-4 text-center relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-orange-400 to-amber-500 text-white rounded-[24px] flex items-center justify-center mb-6 shadow-lg shadow-orange-500/30 rotate-3">
            <Trophy size={40} />
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
            Bảng Vàng <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">F-Prep</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-lg mx-auto mb-8 text-lg">
            Cạnh tranh công bằng, vinh danh những cá nhân xuất sắc nhất hệ sinh thái.
          </p>

          <div className="inline-flex bg-white dark:bg-[#111827] rounded-2xl p-1.5 shadow-sm border border-slate-200 dark:border-slate-800 relative z-10">
            <button 
              onClick={() => setFilter('all')}
              className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${filter === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              🌍 Toàn Quốc
            </button>
            <button 
              onClick={() => setFilter('class')}
              className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${filter === 'class' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              🏫 Cùng Lớp
            </button>
          </div>
        </div>

        {/* LOADING STATE */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-indigo-500">
            <Loader2 size={48} className="animate-spin mb-4" />
            <p className="font-bold">Đang tải dữ liệu Bảng vàng...</p>
          </div>
        ) : topUsers.length === 0 ? (
          <div className="text-center text-slate-500 py-10 font-medium">
            Chưa có dữ liệu xếp hạng. Các thí sinh hãy nhanh chóng làm bài để tích lũy XP!
          </div>
        ) : (
          <>
            {/* ========================================= */}
            {/* 2. BỤC VINH QUANG (PODIUM TOP 3)            */}
            {/* ========================================= */}
            <div className="max-w-4xl mx-auto px-4 mb-16 relative">
              <div className="flex justify-center items-end gap-2 md:gap-8 relative z-10">
                
                {/* TOP 2 - Bạc */}
                {topUsers[1] && (
                  <div className="flex flex-col items-center w-28 md:w-36 animate-in slide-in-from-bottom-8 duration-500 delay-100">
                    <div className="relative mb-3 group cursor-pointer">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-200 dark:bg-slate-800 rounded-full border-4 border-slate-300 dark:border-slate-600 shadow-lg z-10 relative overflow-hidden group-hover:scale-105 transition-transform">
                        {renderAvatar(topUsers[1], "w-full h-full", "text-slate-500 text-2xl")}
                      </div>
                      <div className="absolute -bottom-3 -right-2 w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm z-20">
                        <span className="font-bold text-slate-700 text-xs">2</span>
                      </div>
                    </div>
                    <p className="font-bold text-slate-700 dark:text-slate-300 text-sm truncate w-full text-center">{topUsers[1].full_name}</p>
                    <p className="text-orange-500 font-black text-xs mb-3 flex items-center gap-1"><Flame size={12}/> {topUsers[1].xp?.toLocaleString() || 0}</p>
                    <div className="w-full h-28 bg-gradient-to-t from-slate-300 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-t-3xl shadow-inner border-t-4 border-slate-400 dark:border-slate-600"></div>
                  </div>
                )}

                {/* TOP 1 - Vàng */}
                {topUsers[0] && (
                  <div className="flex flex-col items-center w-32 md:w-44 animate-in slide-in-from-bottom-12 duration-700 z-10">
                    <Crown className="text-yellow-400 fill-yellow-400 mb-3 drop-shadow-md w-12 h-12 animate-bounce" />
                    <div className="relative mb-4 group cursor-pointer">
                      <div className="w-20 h-20 md:w-24 md:h-24 bg-yellow-400 rounded-full border-4 border-yellow-200 shadow-xl z-10 relative ring-4 ring-yellow-400/30 overflow-hidden group-hover:scale-105 transition-transform">
                        {renderAvatar(topUsers[0], "w-full h-full", "text-yellow-700 text-3xl")}
                      </div>
                      <div className="absolute -bottom-4 -right-2 w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-md z-20">
                        <span className="font-black text-white text-sm">1</span>
                      </div>
                    </div>
                    <p className="font-black text-indigo-900 dark:text-white text-base md:text-lg truncate w-full text-center">{topUsers[0].full_name}</p>
                    <p className="text-orange-500 font-black text-sm mb-4 flex items-center gap-1"><Flame size={14}/> {topUsers[0].xp?.toLocaleString() || 0}</p>
                    <div className="w-full h-40 bg-gradient-to-t from-yellow-500 to-yellow-300 rounded-t-3xl shadow-inner border-t-4 border-yellow-400 relative overflow-hidden">
                       <div className="absolute inset-0 bg-white/20 w-1/2 h-full skew-x-12 translate-x-4"></div>
                    </div>
                  </div>
                )}

                {/* TOP 3 - Đồng */}
                {topUsers[2] && (
                  <div className="flex flex-col items-center w-28 md:w-36 animate-in slide-in-from-bottom-4 duration-500 delay-200">
                    <div className="relative mb-3 group cursor-pointer">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-amber-600 rounded-full border-4 border-amber-400 shadow-lg z-10 relative overflow-hidden group-hover:scale-105 transition-transform">
                        {renderAvatar(topUsers[2], "w-full h-full", "text-white text-2xl")}
                      </div>
                      <div className="absolute -bottom-3 -right-2 w-8 h-8 bg-amber-700 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm z-20">
                        <span className="font-bold text-white text-xs">3</span>
                      </div>
                    </div>
                    <p className="font-bold text-slate-700 dark:text-slate-300 text-sm truncate w-full text-center">{topUsers[2].full_name}</p>
                    <p className="text-orange-500 font-black text-xs mb-3 flex items-center gap-1"><Flame size={12}/> {topUsers[2].xp?.toLocaleString() || 0}</p>
                    <div className="w-full h-24 bg-gradient-to-t from-amber-700 to-amber-500 rounded-t-3xl shadow-inner border-t-4 border-amber-600"></div>
                  </div>
                )}

              </div>

              {/* SÀN ĐẤU */}
              <div className="w-full h-10 bg-slate-300 dark:bg-slate-800 rounded-2xl relative z-20 shadow-xl border-b-4 border-slate-400 dark:border-slate-900 -mt-2 flex justify-center items-center">
                 <div className="w-2/3 h-1.5 bg-slate-400/50 dark:bg-slate-700/50 rounded-full"></div>
              </div>
            </div>

            {/* ========================================= */}
            {/* 3. BẢNG XẾP HẠNG (TABLE) TỪ TOP 4           */}
            {/* ========================================= */}
            {topUsers.length > 3 && (
              <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white dark:bg-[#111827] rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  
                  {/* Table Header */}
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                        <tr>
                          <th className="p-5 text-center text-xs font-black text-slate-400 uppercase tracking-widest w-20">Hạng</th>
                          <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">Học viên</th>
                          <th className="p-5 text-xs font-black text-slate-400 uppercase tracking-widest">Trường / Lớp</th>
                          <th className="p-5 text-right text-xs font-black text-slate-400 uppercase tracking-widest">Điểm XP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {topUsers.slice(3).map((user, index) => (
                          <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                            
                            {/* Hạng */}
                            <td className="p-5 text-center">
                              <span className="font-black text-slate-400 dark:text-slate-500 text-lg group-hover:text-indigo-500 transition-colors">
                                {index + 4}
                              </span>
                            </td>

                            {/* User Info */}
                            <td className="p-5 flex items-center gap-4">
                              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl overflow-hidden shrink-0 border border-indigo-200 dark:border-indigo-800/50">
                                {renderAvatar(user, "w-full h-full", "text-indigo-600 text-sm")}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white text-sm md:text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                  {user.full_name}
                                </div>
                                {user.email === currentUser.email && (
                                  <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-wider">
                                    <Zap size={10} className="fill-current"/> Bạn
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* School Info */}
                            <td className="p-5">
                              <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                                <School size={16} className="text-slate-400" /> 
                                <span className="truncate max-w-[150px]">{user.school || 'FPT School'}</span>
                              </div>
                            </td>

                            {/* XP Score */}
                            <td className="p-5 text-right">
                              <div className="inline-flex items-center gap-1.5 font-black text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-xl border border-orange-100 dark:border-orange-800/50 shadow-sm">
                                <Flame size={16} /> {user.xp?.toLocaleString() || 0}
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
          </>
        )}
      </div>

      {/* ========================================= */}
      {/* 4. THANH THỨ HẠNG CỦA BẠN (STICKY BOTTOM) */}
      {/* ========================================= */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-white via-white to-transparent dark:from-[#0B0F19] dark:via-[#0B0F19] pointer-events-none z-30">
        <div className="max-w-4xl mx-auto bg-white/90 dark:bg-[#111827]/90 backdrop-blur-xl border border-indigo-100 dark:border-slate-800 p-5 rounded-[24px] shadow-[0_10px_40px_rgba(79,70,229,0.15)] flex items-center justify-between pointer-events-auto transition-transform hover:-translate-y-1">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-500 text-white rounded-[18px] flex items-center justify-center font-black text-2xl shadow-inner border border-white/20">
              {topUsers.findIndex(u => u.email === currentUser.email) !== -1 
                ? topUsers.findIndex(u => u.email === currentUser.email) + 1 
                : '-'}
            </div>
            <div>
              <p className="font-black text-slate-900 dark:text-white text-lg tracking-tight">Thứ hạng của bạn</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Tiếp tục học tập để leo lên top đầu nhé!</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-orange-500 font-black flex items-center justify-end gap-1.5 text-xl"><Flame size={20}/> {currentUser.xp?.toLocaleString() || 0}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Cấp độ {currentUser.level || 1}</p>
            </div>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-xl font-bold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2">
              <Zap size={16} className="fill-current" /> Cày XP ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;