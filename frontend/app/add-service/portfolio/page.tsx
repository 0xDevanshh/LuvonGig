'use client'
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ServiceNavigation } from '@/components/ServiceNavigation';
import { useServiceForm } from '@/context/ServiceFormContext';
import { Plus, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
export default function AddServicePortfolio() {
  const navigate = useRouter();
  const {
    formData,
    updateFormData
  } = useServiceForm();
  const [dragOver, setDragOver] = useState(false);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Demo portfolio images for the UI
  const demoImages = ["/Freelancer_Dashbioard_-_Add_Your_Services-13.png", "/Freelancer_Dashbioard_-_Add_Your_Services-19.png", "/Organaise_Freelancer_Onboarding_-_41.png", "/Freelancer_Dashbioard_-_Add_Your_Services-15.png"];
  // Initialize portfolio images if empty
  useEffect(() => {
    if (!formData.coverImage && formData.portfolioImages.length === 0) {
      updateFormData({
        coverImage: "/Freelancer_Dashbioard_-_Add_Your_Services-6.png",
        portfolioImages: demoImages
      });
    }
  }, [formData.coverImage, formData.portfolioImages, updateFormData]);
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    // In a real app, you'd upload the file to a server and get back a URL
    // For this demo, we'll use the uploaded images from the prompt
    const randomIndex = Math.floor(Math.random() * demoImages.length);
    const newImageUrl = demoImages[randomIndex];
    updateFormData({
      portfolioImages: [...formData.portfolioImages, newImageUrl]
    });
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = () => {
    setDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    // In a real app, you'd handle the dropped files
    // For this demo, we'll use a random image from our demo images
    const randomIndex = Math.floor(Math.random() * demoImages.length);
    updateFormData({
      coverImage: demoImages[randomIndex]
    });
  };
  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };
  const handleDragEnd = () => {
    setDraggedItem(null);
  };
  const handleDragOverItem = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };
  const handleDropOnItem = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedItem === null) return;
    // Make the dragged item the cover image
    if (dropIndex === -1) {
      const draggedImage = formData.portfolioImages[draggedItem];
      const newPortfolioImages = [...formData.portfolioImages];
      // Remove the dragged image from portfolio images
      newPortfolioImages.splice(draggedItem, 1);
      // Add the current cover image to portfolio images if it exists
      if (formData.coverImage) {
        newPortfolioImages.unshift(formData.coverImage);
      }
      updateFormData({
        coverImage: draggedImage,
        portfolioImages: newPortfolioImages
      });
    }
    setDraggedItem(null);
  };
  const handleContinue = () => {
    navigate.push('/add-service/others');
  };
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
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
          Projects Details: <span className="font-medium">1/5 Done</span>
        </div>
      </div>
      <ServiceNavigation activeTab="portfolio" />
      <div className="mt-12">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-[#161616]">
            Add Images For Your Portfolio
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Drag to change cover image
          </p>
        </div>
        {formData.coverImage ? <div className="mb-8">
          <div className={`relative overflow-hidden rounded-lg border ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={e => handleDropOnItem(e, -1)}>
            <div className="absolute top-3 left-3 bg-white rounded-full px-3 py-1 text-sm shadow-sm">
              Cover Image
            </div>
            <img src={formData.coverImage} alt="Portfolio Cover" className="w-full h-auto" />
          </div>
        </div> : <div className={`mb-8 border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
          <ImageIcon size={48} className="text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4 text-center">
            Drag and drop your cover image here, or click to browse
          </p>
          <button onClick={handleBrowseClick} className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
            Browse Files
          </button>
          <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
        </div>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {formData.portfolioImages.map((image, index) => <div key={index} className="relative border border-gray-200 rounded-lg overflow-hidden h-40" draggable onDragStart={() => handleDragStart(index)} onDragEnd={handleDragEnd} onDragOver={e => handleDragOverItem(e, index)} onDrop={e => handleDropOnItem(e, index)}>
            <img src={image} alt={`Portfolio ${index + 1}`} className="w-full h-full object-cover" />
          </div>)}
          <label className="border border-dashed border-gray-300 rounded-lg h-40 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50" onClick={handleBrowseClick}>
            <Plus size={32} className="text-gray-400 mb-2" />
            <span className="text-gray-500">Add Image</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
          </label>
        </div>
        <div className="flex justify-center">
          <button onClick={handleContinue} className="px-16 py-3 bg-[#0F1E36] text-white rounded-full font-medium hover:bg-[#1a3a5f] transition-colors">
            Next
          </button>
        </div>
      </div>
    </main>
  </div>;
}