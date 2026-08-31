'use client';

import React, { useState } from 'react';
import { Bold, Italic, Underline, Link, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// TypeScript interfaces
interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

interface ToolbarButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  'aria-label': string;
  className?: string;
}

interface SelectDropdownProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  'aria-label': string;
  className?: string;
}

// Extracted components
const ToolbarButton: React.FC<ToolbarButtonProps> = ({ 
  onClick, 
  children, 
  'aria-label': ariaLabel, 
  className 
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={ariaLabel}
    className={cn(
      "p-2 rounded-md hover:bg-gray-200 text-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
      className
    )}
  >
    {children}
  </button>
);

const SelectDropdown: React.FC<SelectDropdownProps> = ({ 
  value, 
  onChange, 
  options, 
  'aria-label': ariaLabel, 
  className 
}) => (
  <div className="relative">
    <select
      value={value}
      onChange={onChange}
      aria-label={ariaLabel}
      className={cn(
        "appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200",
        className
      )}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
      <ChevronDown className="w-4 h-4 text-gray-500" />
    </div>
  </div>
);

const ToolbarDivider: React.FC = () => (
  <div className="h-6 border-l border-gray-300 mx-1" role="separator" />
);

// Format and font size options
const formatOptions = [
  { value: 'paragraph', label: 'Paragraph text' },
  { value: 'h1', label: 'Heading 1' },
  { value: 'h2', label: 'Heading 2' },
  { value: 'h3', label: 'Heading 3' },
] as const;

const fontSizeOptions = [
  { value: '12', label: '12' },
  { value: '14', label: '14' },
  { value: '16', label: '16' },
  { value: '18', label: '18' },
  { value: '20', label: '20' },
] as const;

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  className,
  placeholder = "Write your description here..."
}) => {
  const [selectedFormat, setSelectedFormat] = useState('paragraph');
  const [fontSize, setFontSize] = useState('14');

  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFormat(e.target.value);
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFontSize(e.target.value);
  };

  // In a real implementation, these would apply formatting to the text
  const handleBold = () => {
    console.log('Bold formatting applied');
  };

  const handleItalic = () => {
    console.log('Italic formatting applied');
  };

  const handleUnderline = () => {
    console.log('Underline formatting applied');
  };

  const handleLink = () => {
    console.log('Link formatting applied');
  };

  const handleAlignLeft = () => {
    console.log('Left alignment applied');
  };

  const handleAlignCenter = () => {
    console.log('Center alignment applied');
  };

  const handleAlignRight = () => {
    console.log('Right alignment applied');
  };

  const handleList = () => {
    console.log('Bullet list applied');
  };

  const handleOrderedList = () => {
    console.log('Numbered list applied');
  };

  return (
    <div 
      className={cn(
        "border border-gray-300 rounded-lg overflow-hidden shadow-sm bg-white",
        className
      )}
      role="group"
      aria-label="Rich text editor"
    >
      {/* Toolbar */}
      <div 
        className="bg-gray-50 border-b border-gray-300 p-3 flex flex-wrap items-center gap-2"
        role="toolbar"
        aria-label="Text formatting toolbar"
      >
        {/* Format Selector */}
        <SelectDropdown
          value={selectedFormat}
          onChange={handleFormatChange}
          options={[...formatOptions]}
          aria-label="Text format"
        />

        {/* Font Size Selector */}
        <SelectDropdown
          value={fontSize}
          onChange={handleFontSizeChange}
          options={[...fontSizeOptions]}
          aria-label="Font size"
        />

        <ToolbarDivider />

        {/* Text Formatting Buttons */}
        <ToolbarButton onClick={handleBold} aria-label="Bold">
          <Bold size={18} />
        </ToolbarButton>
        
        <ToolbarButton onClick={handleItalic} aria-label="Italic">
          <Italic size={18} />
        </ToolbarButton>
        
        <ToolbarButton onClick={handleUnderline} aria-label="Underline">
          <Underline size={18} />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Link Button */}
        <ToolbarButton onClick={handleLink} aria-label="Insert link">
          <Link size={18} />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Alignment Buttons */}
        <ToolbarButton onClick={handleAlignLeft} aria-label="Align left">
          <AlignLeft size={18} />
        </ToolbarButton>
        
        <ToolbarButton onClick={handleAlignCenter} aria-label="Align center">
          <AlignCenter size={18} />
        </ToolbarButton>
        
        <ToolbarButton onClick={handleAlignRight} aria-label="Align right">
          <AlignRight size={18} />
        </ToolbarButton>

        <ToolbarDivider />

        {/* List Buttons */}
        <ToolbarButton onClick={handleList} aria-label="Bullet list">
          <List size={18} />
        </ToolbarButton>
        
        <ToolbarButton onClick={handleOrderedList} aria-label="Numbered list">
          <ListOrdered size={18} />
        </ToolbarButton>
      </div>

      {/* Text Area */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-64 p-4 bg-white text-gray-800 focus:outline-none resize-none border-0 placeholder-gray-500"
        placeholder={placeholder}
        aria-label="Rich text content"
        role="textbox"
        aria-multiline="true"
      />
    </div>
  );
};