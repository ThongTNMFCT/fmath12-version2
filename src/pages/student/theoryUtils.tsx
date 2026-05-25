import React from 'react';
import { Calculator, Atom, Beaker, Dna, Laptop } from 'lucide-react';

export const subjectsConfig = [
  { id: 'math', brandName: 'F-Math', name: 'Toán Học', icon: <Calculator size={32} strokeWidth={2}/>, theme: 'blue', bg: 'bg-blue-500', text: 'text-blue-600', gradient: 'from-blue-600 to-cyan-500', desc: 'Đại số, Giải tích & Hình học không gian.' },
  { id: 'physics', brandName: 'F-Physics', name: 'Vật Lý', icon: <Atom size={32} strokeWidth={2}/>, theme: 'indigo', bg: 'bg-indigo-500', text: 'text-indigo-600', gradient: 'from-indigo-600 to-blue-500', desc: 'Động lực học, Sóng cơ, Điện xoay chiều.' },
  { id: 'chemistry', brandName: 'F-Chem', name: 'Hóa Học', icon: <Beaker size={32} strokeWidth={2}/>, theme: 'emerald', bg: 'bg-emerald-500', text: 'text-emerald-600', gradient: 'from-emerald-500 to-teal-400', desc: 'Hóa vô cơ, Hóa hữu cơ, Phản ứng Oxi hóa.' },
  { id: 'biology', brandName: 'F-Bio', name: 'Sinh Học', icon: <Dna size={32} strokeWidth={2}/>, theme: 'rose', bg: 'bg-rose-500', text: 'text-rose-600', gradient: 'from-rose-500 to-pink-500', desc: 'Di truyền học, Tiến hóa & Sinh thái học.' },
  { id: 'it', brandName: 'F-IT', name: 'Tin Học', icon: <Laptop size={32} strokeWidth={2}/>, theme: 'purple', bg: 'bg-purple-500', text: 'text-purple-600', gradient: 'from-purple-600 to-fuchsia-500', desc: 'Thuật toán, Cấu trúc dữ liệu & Lập trình.' },
];

export const getQuestionType = (q: any) => {
  if (!q) return 'mcq';
  if (typeof q.correct_answer === 'object' && q.correct_answer !== null) return 'tf';
  if (typeof q.correct_answer === 'string') {
    const cleanCA = q.correct_answer.toLowerCase().trim();
    if (cleanCA.includes('true') || cleanCA.includes('false')) return 'tf';
  }
  const typeStr = String(q.type || '').toLowerCase().trim();
  if (['mcq', 'tf', 'saq'].includes(typeStr)) return typeStr;
  const hasOptions = Array.isArray(q.options) && q.options.length > 0;
  if (!hasOptions) return 'saq';
  return 'mcq';
};

export const parseTFAnswer = (ans: any) => {
  let parsed: any = {};
  if (typeof ans === 'string') { try { parsed = JSON.parse(ans); } catch { return {}; } } 
  else if (typeof ans === 'object' && ans !== null) { parsed = ans; }
  let normalized: any = {};
  Object.keys(parsed).forEach(k => { normalized[String(k).toLowerCase().trim()] = parsed[k]; });
  return normalized;
};

export const isMcqCorrect = (userAns: any, correctAns: any) => String(userAns).trim().toLowerCase() === String(correctAns).trim().toLowerCase();
export const isSaqCorrect = (userAns: any, correctAns: any) => String(userAns).trim().replace(/,/g, '.').toLowerCase() === String(correctAns).trim().replace(/,/g, '.').toLowerCase();

// DỮ LIỆU GIẢ LẬP ĐỂ DEMO CÁC MÔN CHƯA CÓ TRONG DATABASE
export const getMockCurriculum = (subjectId: string) => {
  if (subjectId === 'physics') {
    return [
      { id: 'p1', title: 'Dao động cơ học', lessons: [
        { id: 'pl1', title: '1. Dao động điều hòa', type: 'video', isCompleted: true, theory_content: '### Phương trình dao động điều hòa\nPhương trình có dạng: $x = A \\cos(\\omega t + \\varphi)$\nTrong đó:\n- $A$: Biên độ\n- $\\omega$: Tần số góc\n- $\\varphi$: Pha ban đầu', exercises: [
          { id: 'pe1', type: 'mcq', content: 'Biên độ dao động là gì?', options: [{id: 'A', text: 'Độ dời lớn nhất khỏi VTCB'}, {id: 'B', text: 'Quãng đường đi được'}], correct_answer: 'A', explanation: 'Biên độ là độ dời lớn nhất của vật.' }
        ]},
        { id: 'pl2', title: '2. Con lắc lò xo', type: 'doc', isCompleted: false, theory_content: 'Chu kì con lắc lò xo: $T = 2\\pi \\sqrt{\\frac{m}{k}}$' }
      ]},
      { id: 'p2', title: 'Sóng cơ và Sóng âm', lessons: [
        { id: 'pl3', title: '1. Sóng cơ và sự truyền sóng', type: 'video', isCompleted: false }
      ]}
    ];
  }
  
  if (subjectId === 'chemistry') {
    return [
      { id: 'c1', title: 'Este - Lipit', lessons: [
        { id: 'cl1', title: '1. Khái niệm và Danh pháp Este', type: 'video', isCompleted: true, theory_content: '### Este\nCông thức chung: $RCOOR\'$\nVí dụ: $CH_3COOC_2H_5$ (Etyl axetat).' },
        { id: 'cl2', title: '2. Tính chất hóa học của Este', type: 'doc', isCompleted: false }
      ]}
    ];
  }

  if (subjectId === 'biology') {
    return [
      { id: 'b1', title: 'Cơ chế di truyền và biến dị', lessons: [
        { id: 'bl1', title: '1. Cấu trúc ADN và ARN', type: 'video', isCompleted: false, theory_content: 'ADN có cấu trúc chuỗi xoắn kép, được cấu tạo từ 4 loại nucleotide: A, T, G, X.' }
      ]}
    ];
  }

  if (subjectId === 'it') {
    return [
      { id: 'i1', title: 'Cấu trúc dữ liệu & Thuật toán', lessons: [
        { id: 'il1', title: '1. Mảng và Danh sách liên kết', type: 'doc', isCompleted: false, theory_content: 'Mảng (Array) là tập hợp các phần tử có cùng kiểu dữ liệu lưu trữ liên tiếp trong bộ nhớ.' }
      ]}
    ];
  }

  return [];
};