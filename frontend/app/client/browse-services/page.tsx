'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Star } from 'lucide-react';
import { ServiceCardWithPricing } from '@/components/client/ServiceCardWithPricing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { useServices } from '@/hooks/useServices';

const CATEGORIES = ['Marketing', 'Business', 'Admin', 'Portfolio', 'Technology', 'User Experience', 'Web Designer'];

export default function BrowseServices() {
  const navigate = useRouter();
  const [activeCategory, setActiveCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [topRatedOnly, setTopRatedOnly] = useState(false);
  const [bestSellerOnly, setBestSellerOnly] = useState(false);

  const { services, loading, error, refetch } = useServices(undefined, {
    category: activeCategory || undefined,
    search_term: searchTerm,
    limit: 50,
    offset: 0
  });

  const visibleServices = services
    .filter((s) => !topRatedOnly || s.rating_avg >= 4.5)
    .filter((s) => !bestSellerOnly || s.total_orders >= 10);

  const handleServiceClick = (serviceId: string) => {
    navigate.push(`/client/service/${serviceId}`);
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category === activeCategory ? '' : category);
  };

  return (
    <div className="p-6">
      <PageHeader title="Find talent" description="Browse services from skilled freelancers." />

      <div className="mt-6 flex flex-col gap-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search services..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((category) => (
            <Badge
              key={category}
              variant={activeCategory === category ? 'default' : 'outline'}
              className="cursor-pointer px-3 py-1.5"
              onClick={() => handleCategoryChange(category)}
            >
              {category}
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              className="rounded border-border"
              checked={topRatedOnly}
              onChange={() => setTopRatedOnly((v) => !v)}
            />
            <Star className="size-3.5 fill-warning text-warning" />
            Top rated
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              className="rounded border-border"
              checked={bestSellerOnly}
              onChange={() => setBestSellerOnly((v) => !v)}
            />
            Best seller
          </label>
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72" />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            title="Error loading services"
            description={error}
            action={<Button onClick={refetch}>Try again</Button>}
          />
        ) : visibleServices.length === 0 ? (
          <EmptyState
            title="No services found"
            description="Try adjusting your filters or search terms."
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visibleServices.map((service) => (
              <ServiceCardWithPricing
                key={service.service_id}
                service={{
                  id: service.service_id,
                  title: service.title,
                  image:
                    service.portfolio_images && service.portfolio_images.length > 0
                      ? service.portfolio_images[0]
                      : '/default-service.svg',
                  seller: service.freelancer_email,
                  rating: service.rating_avg,
                  reviews: `${service.total_orders}+`,
                  deliveryTimeline: service.delivery_timeline,
                  minDeliveryDays: service.min_delivery_days,
                  maxDeliveryDays: service.max_delivery_days,
                  startingFromE8s: service.starting_from_e8s,
                }}
                onClick={() => handleServiceClick(service.service_id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
