'use client'
import React from 'react';
import { X } from 'lucide-react';
interface SkillTagProps {
  skill: string;
  onRemove?: () => void;
  removable?: boolean;
  className?: string;
}
export function SkillTag({
  skill,
  onRemove,
  removable = true,
  className = ''
}: SkillTagProps) {
  return <div className={`inline-flex items-center px-3 py-1 rounded-full border border-dashed border-gray-300 text-sm ${className}`}>
      <span className="mr-1">{skill}</span>
      {removable && <button type="button" onClick={onRemove} className="text-gray-500 hover:text-gray-700 focus:outline-none">
          <X size={14} />
        </button>}
    </div>;
}