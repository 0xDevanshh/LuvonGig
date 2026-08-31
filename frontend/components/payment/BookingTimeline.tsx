import React from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  CreditCard,
  Package,
  MessageSquare,
  Star,
  ChevronRight
} from 'lucide-react';
import { formatBookingDate, formatRelativeTime, getTimeRemaining, isOverdue } from '@/lib/booking-formatters';

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  timestamp?: number;
  status: 'completed' | 'current' | 'pending';
  icon: React.ComponentType<any>;
  isOptional?: boolean;
}

interface BookingTimelineProps {
  bookingId: string;
  createdAt: number;
  deliveryDeadline: number;
  status: string;
  deliveryDays: number;
  paymentCompletedAt?: number;
  bookingConfirmedAt?: number;
  className?: string;
}

export function BookingTimeline({
  bookingId,
  createdAt,
  deliveryDeadline,
  status,
  deliveryDays,
  paymentCompletedAt,
  bookingConfirmedAt,
  className = ''
}: BookingTimelineProps) {
  const currentTime = Date.now();
  const isDeliveryOverdue = isOverdue(deliveryDeadline);
  const deliveryTimeRemaining = getTimeRemaining(deliveryDeadline);

  // Generate timeline events based on booking status and timestamps
  const timelineEvents: TimelineEvent[] = [
    {
      id: 'payment-confirmed',
      title: 'Payment Confirmed',
      description: 'Payment has been successfully processed and funds are held in escrow',
      timestamp: paymentCompletedAt || createdAt,
      status: paymentCompletedAt ? 'completed' : 'completed',
      icon: CreditCard
    },
    {
      id: 'booking-confirmed',
      title: 'Booking Confirmed',
      description: `Booking ${bookingId} has been created and confirmed`,
      timestamp: bookingConfirmedAt || createdAt,
      status: bookingConfirmedAt ? 'completed' : 'completed',
      icon: Calendar
    },
    {
      id: 'work-in-progress',
      title: 'Work in Progress',
      description: `Freelancer is working on your service (${deliveryDays} days delivery)`,
      status: status === 'active' ? 'current' :
              ['completed', 'cancelled'].includes(status.toLowerCase()) ? 'completed' : 'pending',
      icon: Package
    },
    {
      id: 'communication',
      title: 'Communication',
      description: 'Chat with freelancer for updates and clarifications',
      status: status === 'active' ? 'current' : 'pending',
      icon: MessageSquare,
      isOptional: true
    },
    {
      id: 'delivery',
      title: 'Service Delivery',
      description: isDeliveryOverdue
        ? 'Delivery deadline passed - freelancer is finalizing the work'
        : `Expected delivery in ${deliveryTimeRemaining}`,
      timestamp: deliveryDeadline,
      status: isDeliveryOverdue ? 'current' :
              status === 'completed' ? 'completed' : 'pending',
      icon: status === 'completed' ? CheckCircle2 : Clock
    },
    {
      id: 'review',
      title: 'Review & Rating',
      description: 'Review the delivered service and rate your experience',
      status: status === 'completed' ? 'completed' : 'pending',
      icon: Star,
      isOptional: true
    }
  ];

  const getEventIcon = (event: TimelineEvent) => {
    const Icon = event.icon;
    const baseClasses = "w-5 h-5";

    if (event.status === 'completed') {
      return <Icon className={`${baseClasses} text-green-600`} />;
    } else if (event.status === 'current') {
      return <div className="relative">
        <Icon className={`${baseClasses} text-blue-600 animate-pulse`} />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full animate-ping" />
      </div>;
    } else {
      return <Icon className={`${baseClasses} text-gray-400`} />;
    }
  };

  const getEventStatusIcon = (event: TimelineEvent) => {
    if (event.status === 'completed') {
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    } else if (event.status === 'current') {
      return <Clock className="w-5 h-5 text-blue-600 animate-pulse" />;
    } else {
      return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-6 flex items-center">
        <Clock className="w-5 h-5 mr-2 text-blue-600" />
        Booking Timeline
      </h3>

      <div className="space-y-4">
        {timelineEvents.map((event, index) => (
          <div key={event.id} className="flex items-start space-x-3">
            {/* Timeline indicator */}
            <div className="flex flex-col items-center">
              {getEventStatusIcon(event)}
              {index < timelineEvents.length - 1 && (
                <div className="w-0.5 h-8 bg-gray-300 mt-2" />
              )}
            </div>

            {/* Event content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getEventIcon(event)}
                  <h4 className={`font-medium ${
                    event.status === 'completed' ? 'text-green-900' :
                    event.status === 'current' ? 'text-blue-900' : 'text-gray-600'
                  }`}>
                    {event.title}
                  </h4>
                  {event.isOptional && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      Optional
                    </span>
                  )}
                </div>

                {event.timestamp && (
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {formatRelativeTime(event.timestamp)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatBookingDate(event.timestamp)}
                    </div>
                  </div>
                )}
              </div>

              <p className={`mt-1 text-sm ${
                event.status === 'completed' ? 'text-green-700' :
                event.status === 'current' ? 'text-blue-700' : 'text-gray-500'
              }`}>
                {event.description}
              </p>

              {/* Current step action button */}
              {event.status === 'current' && event.id === 'communication' && (
                <button className="mt-3 flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Open Chat
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              )}

              {event.status === 'current' && event.id === 'delivery' && isDeliveryOverdue && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Delivery Overdue:</strong> The delivery deadline has passed.
                    The freelancer is finalizing the work and will deliver soon.
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatRelativeTime(createdAt)}
            </div>
            <div className="text-sm text-gray-500">Booking Created</div>
          </div>

          <div className="text-center">
            <div className={`text-2xl font-bold ${
              isDeliveryOverdue ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {isDeliveryOverdue ? 'Overdue' : formatRelativeTime(deliveryDeadline)}
            </div>
            <div className="text-sm text-gray-500">
              {isDeliveryOverdue ? 'Delivery Deadline' : 'Delivery Due'}
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.floor((deliveryDays * 24) - ((currentTime - createdAt) / (60 * 60 * 1000)))}h
            </div>
            <div className="text-sm text-gray-500">Time Remaining</div>
          </div>
        </div>
      </div>
    </div>
  );
}