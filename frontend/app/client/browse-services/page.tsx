'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ServiceFilter } from '../../../components/client/ServiceFilter';
import { ServiceCardWithPricing } from '../../../components/client/ServiceCardWithPricing';
import { Button } from '../../../components/ui/button';
import { useServices } from '../../../hooks/useServices';
export default function BrowseServices() {
  const navigate = useRouter();
  const [activeCategory, setActiveCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    topRated: false,
    bestSeller: false
  });

  // Fetch services from API
  const { services, loading, error, refetch } = useServices(undefined, {
    category: activeCategory || undefined,
    search_term: searchTerm,
    limit: 50,
    offset: 0
  });

  const categories = ['Marketing', 'Business', 'Admin', 'Portfolio', 'Technology', 'User Experience', 'Web Designer'];
  
  const handleServiceClick = (serviceId: string) => {
    navigate.push(`/client/service/${serviceId}`);
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category === activeCategory ? '' : category);
  };
  return <div className="flex flex-col min-h-screen bg-white">
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="overflow-x-auto pb-4">
          <div className="flex space-x-4 min-w-max">
            {categories.map(category => <Button key={category} variant={activeCategory === category ? 'default' : 'secondary'} size="sm" className={`text-sm ${activeCategory === category ? '' : 'bg-gray-100 text-gray-600'}`} onClick={() => handleCategoryChange(category)}>
                {category}
              </Button>)}
          </div>
        </div>
        <ServiceFilter filters={filters} setFilters={setFilters} />
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Error: {error}</p>
            <Button onClick={refetch}>Try Again</Button>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
            <p className="text-gray-600">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {services.map(service => (
              <ServiceCardWithPricing
                key={service.service_id}
                service={{
                  id: service.service_id,
                  title: service.title,
                  image: service.portfolio_images[0]||
                    (service.portfolio_images && service.portfolio_images.length > 0
                      ? service.portfolio_images[0]
                      : "/default-service.svg"),
                  seller: ` ${service.freelancer_email}`,
                  rating: service.rating_avg,
                  reviews: `${service.total_orders}+`,
                  deliveryTimeline: service.delivery_timeline,
                  minDeliveryDays: service.min_delivery_days,
                  maxDeliveryDays: service.max_delivery_days,
                  startingFromE8s: service.starting_from_e8s
                }}
                onClick={() => handleServiceClick(service.service_id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>;
}