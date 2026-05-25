import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { Loader2, Activity } from 'lucide-react';

const JoinLive = () => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleJoin = async () => {
    setErrorMsg('');
    if (!pin.trim()) { setErrorMsg('Vui lòng nhập mã PIN phòng thi!'); return; }
    setLoading(true);
    
    try {
      const { data: session, error } = await supabase.from('live_sessions')
        .select('*').eq('access_code', pin.trim().toUpperCase()).single();

      if (error || !session) { setErrorMsg("Mã PIN không tồn tại!"); setLoading(false); return; }

      const now = new Date().getTime();
      const start = new Date(session.start_time).getTime();
      const end = new Date(session.end_time).getTime();

      if (now < start) { setErrorMsg("Chưa đến giờ mở phòng thi!"); setLoading(false); return; }
      if (now > end || !session.is_active) { setErrorMsg("Phòng thi đã đóng!"); setLoading(false); return; }

      navigate(`/live-exam/${session.exam_id}?liveSession=${session.id}`);
      
    } catch (err) {
      setErrorMsg("Có lỗi kết nối. Vui lòng thử lại!");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center bg-[#0B0F19] overflow-hidden font-sans">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="bg-[#111827]/80 backdrop-blur-2xl p-8 md:p-12 rounded-[40px] shadow-2xl border border-slate-800 w-full max-w-[480px] z-10 animate-in fade-in slide-in-from-bottom-4">
        
        <div className="flex flex-col items-center gap-3 mb-10">
          <div className="bg-indigo-500/20 p-3 rounded-2xl border border-indigo-500/30 text-indigo-400 shadow-lg shadow-indigo-500/20">
            <Activity size={28} strokeWidth={2.5} className="animate-pulse" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-widest uppercase mt-2">
            FPT EXAM PLATFORM
          </h1>
          <p className="text-xs font-bold text-slate-500 tracking-[0.2em]">F-Prep System</p>
        </div>
        
        <div className="mb-8">
          <label className="block text-center text-xs font-bold text-slate-400 mb-4 uppercase tracking-[0.2em]">
            Nhập mã PIN phòng thi
          </label>
          <input 
            type="text" 
            value={pin}
            onChange={(e) => setPin(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            maxLength={8}
            placeholder="XXXXXX"
            className="w-full text-center text-4xl tracking-[0.4em] font-black p-6 rounded-2xl border-2 border-slate-800 focus:border-indigo-500 outline-none uppercase bg-[#0B0F19] text-white transition-all placeholder:text-slate-700 shadow-inner"
          />
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm font-bold mt-4 text-center animate-in fade-in">{errorMsg}</div>
          )}
        </div>
        
        <button 
          onClick={handleJoin} 
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : "TRUY CẬP PHÒNG THI"}
        </button>

      </div>
    </div>
  );
};

export default JoinLive;