'use client'
import React from 'react';
import { Star, Clock } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { useServicePackages } from '../../hooks/useServices';

interface ServiceCardWithPricingProps {
  service: {
    id: string;
    title: string;
    image: string;
    seller: string;
    rating: number;
    reviews: string;
    deliveryTimeline?: string;
    minDeliveryDays?: number;
    maxDeliveryDays?: number;
    startingFromE8s?: number;
  };
  onClick: () => void;
}

export function ServiceCardWithPricing({
  service,
  onClick
}: ServiceCardWithPricingProps) {
  const { getMinPrice } = useServicePackages(service.id, service.startingFromE8s);

  const minPrice = getMinPrice();

  return (
    <Card className="cursor-pointer overflow-hidden p-0 transition-shadow hover:shadow-md" onClick={onClick}>
      <div className="relative h-48">
        <img
          src={service.image}
          alt={service.title}
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.src = '/default-service.svg';
          }}
        />
      </div>
      <CardContent className="p-4">
        <p className="mb-2 line-clamp-2 font-heading text-h3 font-semibold text-foreground">{service.title}</p>
        <div className="mb-2 flex items-center gap-2">
          <Avatar className="size-7">
            <AvatarFallback className="text-xs">{service.seller.trim()[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="truncate text-sm text-muted-foreground">{service.seller.trim()}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm">
            <Star className="size-4 fill-warning text-warning" />
            <span className="font-medium text-foreground">{service.rating.toFixed(1)}</span>
            <span className="text-muted-foreground">({service.reviews})</span>
          </div>
          <div className="font-semibold text-foreground">${minPrice.toFixed(2)}</div>
        </div>

        {(service.deliveryTimeline || service.minDeliveryDays) && (
          <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="size-3.5" />
            <span>
              {service.deliveryTimeline ||
                (service.minDeliveryDays === service.maxDeliveryDays
                  ? `${service.minDeliveryDays} days`
                  : `${service.minDeliveryDays}-${service.maxDeliveryDays} days`)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
