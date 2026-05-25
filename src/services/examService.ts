import { supabase } from '../config/supabase';

export const examService = {
  // ==========================================
  // 1. DÀNH CHO HỌC SINH (VÀ DÙNG CHUNG)
  // ==========================================
  async getActiveExams(userId?: string) {
    try {
      const { data: exams, error } = await supabase
        .from('exams')
        .select('*, exam_attempts(id), exam_questions(count)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
        
      if (error) throw error;

      let userAttempts: any[] = [];
      if (userId) {
        const { data: attempts } = await supabase
          .from('exam_attempts')
          .select('exam_id, score')
          .eq('user_id', userId);
        if (attempts) userAttempts = attempts;
      }

      return exams?.map(exam => {
        const myAttempts = userAttempts.filter(a => a.exam_id === exam.id);
        return { 
          ...exam, 
          participants: exam.exam_attempts?.length || 0, 
          questionsCount: exam.exam_questions?.[0]?.count || exam.exam_questions?.length || 0,
          myAttemptCount: myAttempts.length,
          myHighestScore: myAttempts.length > 0 ? Math.max(...myAttempts.map(a => a.score)) : null,
          myAttempts: myAttempts
        };
      }) || [];
    } catch (error) { 
      console.error("Lỗi lấy danh sách đề thi:", error);
      return []; 
    }
  },

  async getExamById(examId: string) {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*, exam_questions(exercises(*))')
        .eq('id', examId)
        .single();
        
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching exam details:', error);
      return null;
    }
  },

  async getExamHistory(examId: string, userId: string) {
    try {
      const { data, error } = await supabase
        .from('exam_attempts')
        .select('*')
        .eq('exam_id', examId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) { 
      return []; 
    }
  },

  async getExamLeaderboard(examId: string) {
    try {
      const { data, error } = await supabase
        .from('exam_attempts')
        .select(`score, time_spent, created_at, users ( full_name, avatar_url )`)
        .eq('exam_id', examId)
        .order('score', { ascending: false })
        .order('time_spent', { ascending: true })
        .limit(5);
        
      if (error) throw error;
      return data || [];
    } catch (error) { 
      return []; 
    }
  },

  async submitExam(examId: string, userId: string, score: number, timeSpent: number) {
    try {
      const { error } = await supabase
        .from('exam_attempts')
        .insert({ exam_id: examId, user_id: userId, score: score, time_spent: timeSpent });
        
      if (error) throw error;
      return true;
    } catch (error) { 
      return false; 
    }
  },

  // ==========================================
  // 2. DÀNH CHO GIÁO VIÊN / ADMIN
  // ==========================================
  async getTeacherExams(teacherId: string, subjectId: string = 'math') {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('subject_id', subjectId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching teacher exams:', error);
      return [];
    }
  },

  async getTeacherClasses(teacherId: string) {
    try {
      // Lấy danh sách toàn bộ lớp học để giao bài
      const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching classes:', error);
      return [];
    }
  },

  async assignExamToClass(examId: string, classId: string) {
    try {
      const { error } = await supabase
        .from('class_exams')
        .insert({ exam_id: examId, class_id: classId });
        
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error assigning exam:', error);
      return false;
    }
  }
};