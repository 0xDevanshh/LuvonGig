'use client'
import React, { useState } from 'react';
import { X } from 'lucide-react';
interface RevisionModalProps {
  onClose: () => void;
  onSubmit: () => void;
}
export function RevisionModal({
  onClose,
  onSubmit
}: RevisionModalProps) {
  const [files, setFiles] = useState<{
    name: string;
    id: number;
  }[]>([{
    name: 'Variation1.pdf',
    id: 1
  }, {
    name: 'Variation1.pdf',
    id: 2
  }]);
  const removeFile = (id: number) => {
    setFiles(files.filter(file => file.id !== id));
  };
  const handleSubmit = () => {
    onSubmit();
    onClose();
  };
  return <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Submit Your Revised
        </h2>
        <div className="mb-4">
          <textarea className="w-full border border-gray-300 rounded-lg p-4 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Add your comments here..." />
        </div>
        <div className="mb-6">
          <div className="border border-gray-300 rounded-lg p-4">
            <p className="text-gray-500 mb-2 uppercase text-xs">
              SELECT YOUR FILES HERE
            </p>
            <div className="flex flex-wrap gap-2">
              {files.map(file => <div key={file.id} className="flex items-center bg-gray-50 rounded-md px-3 py-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2 text-gray-500">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-sm">{file.name}</span>
                  <button onClick={() => removeFile(file.id)} className="ml-2 text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                </div>)}
            </div>
          </div>
        </div>
        <button onClick={handleSubmit} className="w-full py-3 bg-rainbow-gradient text-white rounded-full font-medium hover:opacity-90 transition-opacity">
          Send
        </button>
      </div>
    </div>;
}