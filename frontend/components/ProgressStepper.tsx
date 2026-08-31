'use client'
import React from 'react';
interface ProgressStepperProps {
  currentStep: number;
  totalSteps: number;
}
export function ProgressStepper({
  currentStep,
  totalSteps
}: ProgressStepperProps) {
  return <div className="flex items-center gap-2">
      <div className="text-gray-500">Step</div>
      <div className="relative w-16 h-16">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="32" cy="32" r="28" fill="none" stroke="#f3f3f3" strokeWidth="4" />
          <circle cx="32" cy="32" r="28" fill="none" stroke="#000" strokeWidth="4" strokeDasharray="175.9" strokeDashoffset={175.9 - 175.9 * currentStep / totalSteps} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-lg font-medium">
          {currentStep}/{totalSteps}
        </div>
      </div>
    </div>;
}