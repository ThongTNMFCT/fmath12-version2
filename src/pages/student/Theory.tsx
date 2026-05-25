import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TheorySubjectList } from './TheorySubjectList';
import { TheoryCurriculum } from './TheoryCurriculum';
import { TheoryStudyRoom } from './TheoryStudyRoom';
import { subjectsConfig } from './theoryUtils';
import { useAppStore } from '../../store/useAppStore';
import { courseService } from '../../services/courseService';

const Theory = () => {
  const { currentUser } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState<'subjects' | 'curriculum' | 'study'>('subjects');
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  
  const [chapters, setChapters] = useState<any[]>([]);
  const [expandedChapterId, setExpandedChapterId] = useState<string | number | null>(null);
  const [activeLesson, setActiveLesson] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const subjectParam = params.get('subject');
    if (subjectParam && subjectsConfig.find(s => s.id === subjectParam)) {
      setActiveSubject(subjectParam);
      if (viewMode === 'subjects') setViewMode('curriculum');
    } else {
      setViewMode('subjects');
      setActiveSubject(null);
    }
  }, [location.search]);

  useEffect(() => {
    const fetchCurriculum = async () => {
      if (!activeSubject) return;
      setIsLoading(true);
      
      // Gọi API dữ liệu thật 100%
      const data = await courseService.getCurriculum(currentUser.id, activeSubject);
      
      setChapters(data);
      if (data.length > 0) setExpandedChapterId(data[0].id);
      setIsLoading(false);
    };

    if (currentUser?.id && viewMode !== 'subjects') {
      fetchCurriculum();
    }
  }, [currentUser.id, viewMode, activeSubject]);

  const handleSelectSubject = (subjectId: string) => {
    setActiveSubject(subjectId);
    setViewMode('curriculum');
    navigate(`?subject=${subjectId}`);
  };

  const handleSelectLesson = (lesson: any) => {
    setActiveLesson(lesson);
    setViewMode('study');
  };

  const activeTheme = subjectsConfig.find(s => s.id === activeSubject) || subjectsConfig[0];

  if (viewMode === 'subjects') {
    return <TheorySubjectList onSelect={handleSelectSubject} />;
  }

  if (viewMode === 'curriculum') {
    return (
      <TheoryCurriculum 
        activeTheme={activeTheme}
        chapters={chapters}
        isLoading={isLoading}
        expandedChapterId={expandedChapterId}
        setExpandedChapterId={setExpandedChapterId}
        onSelectLesson={handleSelectLesson}
        onBack={() => {
          setViewMode('subjects');
          setActiveSubject(null);
          navigate('/theory');
        }}
      />
    );
  }

  return (
    <TheoryStudyRoom 
      activeLesson={activeLesson}
      setActiveLesson={setActiveLesson}
      activeTheme={activeTheme}
      setChapters={setChapters}
      onBack={() => {
        setViewMode('curriculum');
        setActiveLesson(null);
      }}
    />
  );
};

export default Theory;