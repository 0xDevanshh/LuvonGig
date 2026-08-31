'use client'
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
interface ServiceCardProps {
  service: {
    id: number;
    title: string;
    image: string;
    seller: string;
    rating: number;
    reviews: string;
    price: number;
  };
  onClick: () => void;
}
export function ServiceCard({
  service,
  onClick
}: ServiceCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // For demo purposes, let's create a few dummy images for each service
  const serviceImages = [service.image, "/Organaise_Home_Page-2.png", "/Organaise_Home_Page-3.png"];
  const goToPreviousImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => prev === 0 ? serviceImages.length - 1 : prev - 1);
  };
  const goToNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => prev === serviceImages.length - 1 ? 0 : prev + 1);
  };
  return <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <div className="relative h-48">
        <img src={serviceImages[currentImageIndex]} alt={service.title} className="w-full h-full object-cover" />
        <div className="absolute bottom-2 right-2 flex space-x-1">
          <Button variant="secondary" size="icon" className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 shadow" onClick={goToPreviousImage}>
            <ChevronLeft size={16} />
          </Button>
          <Button variant="default" size="icon" className="w-8 h-8 rounded-full shadow" onClick={goToNextImage}>
            <ChevronRight size={16} />
          </Button>
        </div>
        {/* Image pagination dots */}
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
          {serviceImages.map((_, index) => <div key={index} className={`w-1.5 h-1.5 rounded-full ${currentImageIndex === index ? 'bg-white' : 'bg-gray-400/60'}`} />)}
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex items-center mb-2">
          <Avatar className="w-8 h-8 mr-2">
            <AvatarImage src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=100&auto=format&fit=crop" alt={service.seller} />
            <AvatarFallback>{service.seller[0]}</AvatarFallback>
          </Avatar>
          <span>{service.seller}</span>
        </div>
        <p className="text-sm mb-2 line-clamp-2">{service.title}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-yellow-400">★</span>
            <span className="ml-1">{service.rating}</span>
            <span className="ml-1 text-gray-600">({service.reviews})</span>
          </div>
          <div className="font-bold">USD ${service.price}</div>
        </div>
        <Button variant="link" className="p-0 h-auto mt-2 text-blue-500" onClick={e => {
        e.stopPropagation();
        onClick();
      }}>
          <span>View</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-1">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </Button>
      </CardContent>
    </Card>;
}