// Client-safe date formatting helper functions
// This file contains only date formatting utilities that can be used in client components

export function formatBookingDate(timestamp: number): string {
  if (!timestamp || timestamp === 0) {
    return 'Date not set';
  }
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  });
}

export function formatRelativeTime(timestamp: number): string {
  if (!timestamp || timestamp === 0) {
    return 'Time not set';
  }

  const now = Date.now();
  const diff = timestamp - now;
  const absDiff = Math.abs(diff);
  const days = Math.floor(absDiff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((absDiff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

  if (diff > 0) {
    // Future timestamp
    if (days > 0) {
      return `in ${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `in ${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return 'in less than an hour';
    }
  } else {
    // Past timestamp
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return 'less than an hour ago';
    }
  }
}

export function formatDuration(milliseconds: number): string {
  const days = Math.floor(milliseconds / (24 * 60 * 60 * 1000));
  const hours = Math.floor((milliseconds % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    return 'Less than an hour';
  }
}

export function formatPrice(priceE8s: number): string {
  return (priceE8s / 100000000).toFixed(2);
}

export function formatStatus(status: string): string {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function isOverdue(deadline: number): boolean {
  if (!deadline || deadline === 0) return false;
  return Date.now() > deadline;
}

export function getTimeRemaining(deadline: number): string {
  if (!deadline || deadline === 0) return 'No deadline set';

  const now = Date.now();
  const diff = deadline - now;

  if (diff <= 0) return 'Overdue';

  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
  return 'Less than 1 hour remaining';
}

