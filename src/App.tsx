import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// --- 1. Import Common Pages ---
import LandingPage from './pages/common/LandingPage';
import LoginPage from './pages/common/LoginPage';
import Profile from './pages/common/Profile';
import OverviewSwitcher from './pages/common/OverviewSwitcher';

// --- 2. Import Student Pages ---
import Theory from './pages/student/Theory';
import QuizList from './pages/student/QuizList';
import QuizDetail from './pages/student/QuizDetail';
import QuizTaking from './pages/student/QuizTaking'; 
import Classroom from './pages/student/Classroom';
import Leaderboard from './pages/student/Leaderboard';
import JoinClass from './pages/student/JoinClass';

// --- 3. Import Teacher Pages ---
import ClassManager from './pages/teacher/ClassManager';
import QuestionBank from './pages/teacher/QuestionBank';
import ExamBank from './pages/teacher/ExamBank';
import ExamCreator from './pages/teacher/ExamCreator';
import TheoryEditor from './pages/teacher/TheoryEditor';
import ExamEditor from './pages/teacher/ExamEditor';

// --- 4. Import Admin Pages ---
import UserManagement from './pages/admin/UserManagement';

// --- 5. Import Layout ---
import DashboardLayout from './components/layout/DashboardLayout';

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="glass p-10 rounded-3xl text-center flex flex-col items-center justify-center h-full min-h-[300px]">
    <h2 className="text-2xl font-bold text-slate-500 dark:text-slate-400 mb-4">{title}</h2>
    <p className="text-slate-400 mb-6 font-medium">Tính năng này đang được phát triển và sẽ sớm ra mắt.</p>
    <button onClick={() => window.history.back()} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md transition-all hover:-translate-y-0.5">
      Quay lại
    </button>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<OverviewSwitcher />} />
          <Route path="/profile" element={<Profile />} />

          {/* HỌC SINH */}
          <Route path="/join/:code" element={<JoinClass />} />
          <Route path="/theory" element={<Theory />} />
          <Route path="/quiz" element={<QuizList />} />
          <Route path="/quiz/:id" element={<QuizDetail />} />
          <Route path="/quiz/:id/take" element={<QuizTaking />} /> 
          <Route path="/live-exam/:id" element={<PlaceholderPage title="Phòng thi Live (Coming Soon)" />} /> 
          <Route path="/classroom" element={<Classroom />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/join-live" element={<PlaceholderPage title="Tham gia Khảo thí Online (Coming Soon)" />} />
          
          {/* GIÁO VIÊN */}
          <Route path="/class-manager" element={<ClassManager />} />
          <Route path="/question-bank" element={<QuestionBank />} />
          <Route path="/exam-bank" element={<ExamBank />} />
          <Route path="/exam-creator" element={<ExamCreator />} />
          <Route path="/theory-editor/:lessonId" element={<TheoryEditor />} /> 
          <Route path="/exam-editor" element={<ExamEditor />} />
          
          {/* KHẢO THÍ ONLINE (COMING SOON) */}
          <Route path="/live-sessions" element={<PlaceholderPage title="Quản lý Ca thi Live (Coming Soon)" />} />
          <Route path="/live-monitor/:sessionId" element={<PlaceholderPage title="Giám sát Ca thi Realtime (Coming Soon)" />} />
          
          {/* ADMIN */}
          <Route path="/user-management" element={<UserManagement />} />
          <Route path="/grading" element={<PlaceholderPage title="Chấm bài & Giao đề (Coming Soon)" />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;