import { create } from 'zustand';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'system' | 'class' | 'exam' | 'achievement';
  time: string;
  isRead: boolean;
  link?: string;
}

interface AppState {
  isDark: boolean;
  toggleDark: () => void;
  isFptStudent: boolean;
  setIsFptStudent: (val: boolean) => void;
  toggleFptStudent: () => void;
  
  currentUser: {
    id?: string;
    name: string;
    email?: string;
    studentId: string;
    className: string;
    xp: number;
    level: number;
    streak: number;
    role: 'student' | 'teacher' | 'admin';
    subject?: string | null; // Thêm môn học
    avatar_url?: string | null;
  };
  
  switchRole: (newRole: 'student' | 'teacher' | 'admin') => void;
  setUser: (userData: any) => void;
  
  notifications: AppNotification[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isDark: localStorage.getItem('theme') === 'dark',
  toggleDark: () => set((state) => {
    const newDark = !state.isDark;
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    return { isDark: newDark };
  }),
  
  isFptStudent: false, 
  setIsFptStudent: (val) => set({ isFptStudent: val }),
  toggleFptStudent: () => set((state) => ({ isFptStudent: !state.isFptStudent })),
  
  currentUser: {
    name: "Đang tải...",
    studentId: "...",
    className: "...",
    xp: 0,
    level: 1,
    streak: 0,
    role: 'student'
  },

  switchRole: (newRole) => set((state) => ({
    currentUser: { ...state.currentUser, role: newRole }
  })),

  setUser: (userData) => set(() => {
    const emailStr = (userData.email || "").toLowerCase();
    const isFpt = emailStr === '5phutcungpy@gmail.com' || emailStr.endsWith('@fpt.edu.vn') || emailStr.includes('fct');
    
    return {
      currentUser: {
        id: userData.id,
        name: userData.full_name || userData.name || "Học sinh",
        email: userData.email,
        studentId: userData.student_code || "Chưa cập nhật",
        className: userData.class_name || "Chưa xếp lớp",
        xp: userData.xp || 0,
        level: userData.level || 1,
        streak: userData.streak || 0,
        role: userData.role || 'student',
        subject: userData.subject || null, // Lưu môn học
        avatar_url: userData.avatar_url || null
      },
      isFptStudent: isFpt
    };
  }),
  
  notifications: [],
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
  })),
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, isRead: true }))
  }))
}));