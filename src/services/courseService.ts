import { supabase } from '../config/supabase';

export const courseService = {
  async getCurriculum(userId?: string, subjectId: string = 'math') {
    try {
      // Đã khôi phục bộ lọc môn học bằng Database thật
      const { data: chapters, error } = await supabase
        .from('chapters')
        .select(`
          id, title, sort_order, subject_id,
          lessons (
            id, title, theory_content, sort_order,
            exercises (id, content, options, correct_answer, explanation, sort_order, type, level)
          )
        `)
        .eq('subject_id', subjectId)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error("Lỗi lấy curriculum:", error.message);
        return [];
      }

      const formattedChapters = chapters?.map(chapter => ({
        ...chapter,
        lessons: chapter.lessons
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((lesson: any) => ({
            ...lesson,
            exercises: lesson.exercises?.sort((a: any, b: any) => a.sort_order - b.sort_order) || [],
            isCompleted: false 
          }))
      }));

      if (userId && formattedChapters) {
        const { data: progress } = await supabase
          .from('student_lesson_progress')
          .select('lesson_id, is_completed')
          .eq('user_id', userId);

        if (progress && progress.length > 0) {
          const progressMap = progress.reduce((acc, curr) => {
            acc[curr.lesson_id] = curr.is_completed;
            return acc;
          }, {} as Record<number, boolean>);

          formattedChapters.forEach(chap => {
            chap.lessons.forEach((les: any) => { les.isCompleted = progressMap[les.id] || false; });
          });
        }
      }
      return formattedChapters || [];
    } catch (error) {
      console.error("System Error:", error);
      return [];
    }
  },

  async markLessonCompleted(userId: string, lessonId: number) {
    if (!userId) return;
    await supabase.from('student_lesson_progress').upsert({ user_id: userId, lesson_id: lessonId, is_completed: true });
  }
};