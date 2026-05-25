import React from 'react';
import { subjectsConfig } from './theoryUtils';

interface Props {
  onSelect: (subjectId: string) => void;
}

export const TheorySubjectList: React.FC<Props> = ({ onSelect }) => {
  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full bg-[#F8FAFC] dark:bg-[#0B0F19] overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4">
          <div className="text-center max-w-3xl mx-auto mt-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-black uppercase tracking-[0.2em] border border-indigo-200 dark:border-indigo-800/50 mb-6">
              F-Prep Ecosystem
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight leading-tight">
              Chọn khối môn học <br className="hidden md:block"/> để bắt đầu bứt phá
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg md:text-xl">
              Lộ trình cá nhân hóa được thiết kế chuẩn cấu trúc mới của Bộ GD&ĐT, tích hợp AI chấm điểm và giải thích cặn kẽ.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjectsConfig.map(sub => (
              <div 
                key={sub.id} 
                onClick={() => onSelect(sub.id)}
                className={`group relative bg-white dark:bg-[#111827] border-2 border-slate-200 dark:border-slate-800 hover:border-${sub.theme}-500 rounded-[32px] p-8 cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-${sub.theme}-500/20 hover:-translate-y-2 overflow-hidden`}
              >
                <div className={`absolute top-0 right-0 w-40 h-40 bg-${sub.theme}-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all duration-700 group-hover:scale-150`}></div>
                <div className={`w-20 h-20 rounded-[24px] bg-gradient-to-br ${sub.gradient} text-white flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-500`}>
                  {sub.icon}
                </div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-0.5">{sub.brandName}</h3>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">by F-Prep</div>
                <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed h-12 line-clamp-2">{sub.name} - {sub.desc}</p>
                
                <div className="flex items-center justify-between mt-auto pt-5 border-t border-slate-100 dark:border-slate-800 relative z-10">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tiến độ</span>
                  <span className={`text-sm font-black ${sub.text}`}>{sub.id === 'math' ? '25%' : '0%'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};