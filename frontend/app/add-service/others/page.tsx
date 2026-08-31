'use client'
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ServiceNavigation } from '@/components/ServiceNavigation';
import { useServiceForm } from '@/context/ServiceFormContext';
import { Plus, Circle, CheckCircle, Square, ChevronDown, File, Check, HelpCircle, X } from 'lucide-react';
import Image from 'next/image';
type QuestionType = 'text' | 'file' | 'mcq' | 'checkbox' | 'dropdown';
interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  saved?: boolean;
  required: boolean;
}
export default function AddServiceOthers() {
  const navigate = useRouter();
  const {
    formData,
    updateFormData
  } = useServiceForm();
  const [showQuestionTypes, setShowQuestionTypes] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([{
    id: '1',
    type: 'text',
    question: 'Explain me your Product?',
    saved: true,
    required: true
  }, {
    id: '2',
    type: 'file',
    question: 'Add your Sow Document',
    saved: true,
    required: false
  }, {
    id: '3',
    type: 'mcq',
    question: 'Ask your first question?',
    options: ['Enter Your Option A', 'Enter Your Option B'],
    saved: false,
    required: true
  }]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleAddQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: (questions.length + 1).toString(),
      type,
      question: currentQuestion || 'New Question',
      saved: false,
      required: true
    };
    if (type === 'mcq' || type === 'checkbox' || type === 'dropdown') {
      newQuestion.options = ['Enter Your Option A', 'Enter Your Option B'];
    }
    setQuestions([...questions, newQuestion]);
    setCurrentQuestion('');
    setShowQuestionTypes(false);
  };
  const handleQuestionChange = (id: string, value: string) => {
    setQuestions(questions.map(q => q.id === id ? {
      ...q,
      question: value,
      saved: false
    } : q));
  };
  const handleOptionChange = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(questions.map(q => q.id === questionId && q.options ? {
      ...q,
      options: q.options.map((opt, i) => i === optionIndex ? value : opt),
      saved: false
    } : q));
  };
  const handleAddOption = (questionId: string) => {
    setQuestions(questions.map(q => q.id === questionId && q.options ? {
      ...q,
      options: [...q.options, `Enter Your Option ${q.options.length + 1}`],
      saved: false
    } : q));
  };
  const handleSaveQuestion = (id: string) => {
    setQuestions(questions.map(q => q.id === id ? {
      ...q,
      saved: true
    } : q));
    // Clear editing state
    setEditingQuestionId(null);
  };
  const handleEditQuestion = (id: string) => {
    setEditingQuestionId(id);
  };
  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };
  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };
  const handleContinue = () => {
    // Save questions to form context
    updateFormData({
      clientQuestions: questions
    });
    navigate.push('/service-preview');
  };
  const renderQuestionContent = (question: Question) => {
    const isEditing = editingQuestionId === question.id;
    switch (question.type) {
      case 'text':
        return <div className="px-4 py-3">
          {isEditing ? <input type="text" value={question.question} onChange={e => handleQuestionChange(question.id, e.target.value)} className="w-full p-2 border border-gray-200 rounded outline-none" autoFocus /> : <p className="text-gray-800 font-medium">{question.question}</p>}
        </div>;
      case 'file':
        return <div className="px-4 py-3">
          {isEditing ? <input type="text" value={question.question} onChange={e => handleQuestionChange(question.id, e.target.value)} className="w-full p-2 border border-gray-200 rounded outline-none mb-3" autoFocus /> : <p className="text-gray-800 font-medium mb-3">
            {question.question}
          </p>}
          <div onClick={handleFileUpload} className="flex items-center text-gray-600 hover:text-blue-500 cursor-pointer">
            <File size={16} className="mr-2" />
            <span>Click here to upload Your Resume</span>
            <input ref={fileInputRef} type="file" className="hidden" onChange={() => { }} />
          </div>
        </div>;
      case 'mcq':
      case 'checkbox':
      case 'dropdown':
        return <div className="px-4 py-3">
          {isEditing ? <input type="text" value={question.question} onChange={e => handleQuestionChange(question.id, e.target.value)} className="w-full p-2 border border-gray-200 rounded outline-none mb-3" autoFocus /> : <p className="text-gray-800 font-medium mb-3">
            {question.question}
          </p>}
          {question.options && <div className="space-y-2">
            {question.options.map((option, optIndex) => <div key={optIndex} className="flex items-center">
              <span className="w-6 text-gray-400">
                {String.fromCharCode(65 + optIndex)}.
              </span>
              {isEditing ? <input type="text" value={option} onChange={e => handleOptionChange(question.id, optIndex, e.target.value)} className="flex-1 p-2 border border-gray-200 rounded outline-none" /> : <span className="text-gray-600">{option}</span>}
            </div>)}
            {isEditing && <button onClick={() => handleAddOption(question.id)} className="flex items-center text-blue-500 mt-2 text-sm">
              <Plus size={14} className="mr-1" />
              Add More Options
            </button>}
          </div>}
        </div>;
      default:
        return null;
    }
  };
  const getQuestionTypeIcon = (type: QuestionType) => {
    switch (type) {
      case 'text':
        return <Circle size={16} className="text-gray-500" />;
      case 'mcq':
        return <CheckCircle size={16} className="text-gray-500" />;
      case 'checkbox':
        return <Square size={16} className="text-gray-500" />;
      case 'dropdown':
        return <ChevronDown size={16} className="text-gray-500" />;
      case 'file':
        return <File size={16} className="text-gray-500" />;
      default:
        return null;
    }
  };
  const getQuestionTypeLabel = (type: QuestionType) => {
    switch (type) {
      case 'text':
        return 'QUESTION';
      case 'mcq':
        return 'QUESTION (MCQ)';
      case 'checkbox':
        return 'QUESTION (CHECKBOX)';
      case 'dropdown':
        return 'QUESTION (DROPDOWN)';
      case 'file':
        return 'QUESTION (FILE)';
      default:
        return 'QUESTION';
    }
  };
  return <div className="flex flex-col min-h-screen bg-white">
    <header className="flex justify-between items-center p-4 border-b border-gray-200">
      <img src="/WB.png" alt="Workbudd Logo" className="h-6" />

      <button className="px-8 py-2 rounded-full border border-gray-300 text-gray-800 hover:bg-gray-50">
        Exit
      </button>
    </header>
    <main className="flex-1 container mx-auto py-6 px-4 max-w-5xl">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#161616]">
          Add Your Services
        </h1>
        <div className="text-sm text-gray-600">
          Others Details: <span className="font-medium">1/3 Done</span>
        </div>
      </div>
      <ServiceNavigation activeTab="others" />
      <div className="mt-12">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-[#161616]">
            Client Requirements
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Add your questions and requirements here.
          </p>
        </div>
        {questions.length > 0 && <div className="mb-8 space-y-4">
          {questions.map((question, index) => <div key={question.id} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex justify-between items-center bg-gray-50 px-4 py-2 border-b border-gray-200">
              <div className="flex items-center gap-2">
                {getQuestionTypeIcon(question.type)}
                <span className="text-sm text-gray-500">
                  {getQuestionTypeLabel(question.type)} {index + 1}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {question.saved ? <div className="flex items-center text-green-500 text-sm">
                  <Check size={14} className="mr-1" />
                  <span>Saved</span>
                </div> : null}
                {editingQuestionId === question.id ? <button onClick={() => handleSaveQuestion(question.id)} className="text-blue-500 text-sm">
                  Save
                </button> : <button onClick={() => handleEditQuestion(question.id)} className="text-gray-500 hover:text-gray-700 text-sm">
                  Edit
                </button>}
                <button onClick={() => handleDeleteQuestion(question.id)} className="text-red-500 hover:text-red-700">
                  <X size={16} />
                </button>
              </div>
            </div>
            {renderQuestionContent(question)}
          </div>)}
        </div>}
        <div className="relative mb-8">
          <div className="mb-4">
            <input type="text" value={currentQuestion} onChange={e => setCurrentQuestion(e.target.value)} placeholder="Type your question here..." className="w-full p-3 border border-gray-200 rounded-lg outline-none" />
          </div>
          <button onClick={() => setShowQuestionTypes(!showQuestionTypes)} className="flex items-center gap-2 text-gray-600 border border-dashed border-gray-300 rounded-full px-4 py-2 hover:bg-gray-50">
            <Plus size={16} />
            ADD YOUR QUESTIONS
          </button>
          {showQuestionTypes && <div className="absolute left-0 top-24 bg-white border border-gray-200 shadow-lg rounded-lg p-2 w-64 z-10">
            <div className="p-2 flex items-center gap-2 hover:bg-gray-100 rounded cursor-pointer" onClick={() => handleAddQuestion('text')}>
              <Circle size={16} className="text-gray-500" />
              Answer Type
            </div>
            <div className="p-2 flex items-center gap-2 hover:bg-gray-100 rounded cursor-pointer" onClick={() => handleAddQuestion('mcq')}>
              <CheckCircle size={16} className="text-gray-500" />
              Multiple Choice
            </div>
            <div className="p-2 flex items-center gap-2 hover:bg-gray-100 rounded cursor-pointer" onClick={() => handleAddQuestion('checkbox')}>
              <Square size={16} className="text-gray-500" />
              Check Box
            </div>
            <div className="p-2 flex items-center gap-2 hover:bg-gray-100 rounded cursor-pointer bg-gradient-to-r from-purple-400 to-orange-400 text-white" onClick={() => handleAddQuestion('dropdown')}>
              <ChevronDown size={16} />
              Drop Down
            </div>
            <div className="p-2 flex items-center gap-2 hover:bg-gray-100 rounded cursor-pointer" onClick={() => handleAddQuestion('file')}>
              <File size={16} className="text-gray-500" />
              File
            </div>
          </div>}
        </div>
        <div className="mt-12 flex justify-center">
          <button onClick={handleContinue} className="px-12 py-3 bg-[#0B1F36] text-white rounded-full font-medium hover:bg-[#1a3a5f] transition-colors">
            Complete & Preview
          </button>
        </div>
      </div>
    </main>
  </div>;
}