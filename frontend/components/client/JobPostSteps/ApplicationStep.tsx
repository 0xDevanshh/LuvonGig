'use client'
import React, { useState } from 'react';
import { JobPostingFormData } from '../../../types/JobPostingFormData';
import { ChevronDown } from 'lucide-react';
interface ApplicationStepProps {
  formData: JobPostingFormData;
  updateFormData: (data: Partial<JobPostingFormData>) => void;
}
export function ApplicationStep({
  formData,
  updateFormData
}: ApplicationStepProps) {
  const [newQuestion, setNewQuestion] = useState('');
  const addQuestion = () => {
    if (newQuestion.trim()) {
      const updatedQuestions = [...formData.applicationQuestions, newQuestion.trim()];
      updateFormData({
        applicationQuestions: updatedQuestions
      });
      setNewQuestion('');
    }
  };
  const removeQuestion = (index: number) => {
    const updatedQuestions = formData.applicationQuestions.filter((_, i) => i !== index);
    updateFormData({
      applicationQuestions: updatedQuestions
    });
  };
  return <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          How Can People Apply For This Job Role?
        </h2>
        <p className="text-gray-500 text-sm">
          Add at least 5 images. you can add more also.
        </p>
      </div>
      <div className="space-y-6">
        <div className="relative">
          <label className="block text-xs text-gray-500 mb-1">
            APPLICATION DETAILS
          </label>
          <div className="relative">
            <select value={formData.applicationCategory} onChange={e => updateFormData({
            applicationCategory: e.target.value
          })} className="w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Category</option>
              <option value="resume">Resume</option>
              <option value="portfolio">Portfolio</option>
              <option value="cover-letter">Cover Letter</option>
              <option value="work-samples">Work Samples</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center">
              <div className="flex items-center pr-4">
                <button className="text-gray-400 text-xs hover:text-blue-500">
                  Ask AI
                </button>
                <ChevronDown className="ml-2 h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
        <div className="relative mt-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add screening questions (optional)
          </label>
          <p className="text-sm text-gray-500 mb-4">
            Add questions that applicants must answer when applying for your
            job.
          </p>
          <div className="mb-4">
            <div className="relative">
              <input type="text" placeholder="Enter your question" value={newQuestion} onChange={e => setNewQuestion(e.target.value)} className="w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addQuestion();
              }
            }} />
              <button onClick={addQuestion} className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white px-4 py-1 rounded-md text-sm">
                Add
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {formData.applicationQuestions.map((question, index) => <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-800">{question}</span>
                <button onClick={() => removeQuestion(index)} className="text-red-500 hover:text-red-700">
                  Remove
                </button>
              </div>)}
          </div>
          {formData.applicationQuestions.length === 0 && <div className="text-center py-8 text-gray-500">
              No questions added yet. Add questions above.
            </div>}
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium text-blue-800 mb-2">
            Suggested Questions
          </h3>
          <div className="space-y-2">
            <button className="block w-full text-left p-2 hover:bg-blue-100 rounded-md text-blue-700" onClick={() => {
            setNewQuestion('What relevant experience do you have for this role?');
          }}>
              What relevant experience do you have for this role?
            </button>
            <button className="block w-full text-left p-2 hover:bg-blue-100 rounded-md text-blue-700" onClick={() => {
            setNewQuestion('Are you available to start immediately?');
          }}>
              Are you available to start immediately?
            </button>
            <button className="block w-full text-left p-2 hover:bg-blue-100 rounded-md text-blue-700" onClick={() => {
            setNewQuestion('What is your expected salary range?');
          }}>
              What is your expected salary range?
            </button>
          </div>
        </div>
      </div>
    </div>;
}