// Date formatting utilities for booking data

export function formatBookingDate(timestamp: number): string {
  if (!timestamp || timestamp === 0) {
    return 'Date not set';
  }
  
  // Handle different timestamp formats
  let date: Date;
  let milliseconds: number;
  
  if (timestamp > 1000000000000) {
    // Already in milliseconds
    milliseconds = timestamp;
  } else if (timestamp > 1000000000) {
    // In seconds, convert to milliseconds
    milliseconds = timestamp * 1000;
  } else {
    // In nanoseconds, convert to milliseconds
    milliseconds = timestamp / 1000000;
  }
  
  // Validate timestamp is reasonable (not 1970 or before 2000)
  if (milliseconds < 946684800000) { // Before 2000-01-01
    console.warn('⚠️ Invalid timestamp detected in formatBookingDate:', timestamp, '->', milliseconds);
    return 'Date not set';
  }
  
  date = new Date(milliseconds);
  
  // Double-check the date is valid
  if (isNaN(date.getTime())) {
    console.warn('⚠️ Invalid date created from timestamp:', timestamp, '->', milliseconds);
    return 'Date not set';
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  });
}

export function formatBookingDateShort(timestamp: number): string {
  if (!timestamp || timestamp === 0) {
    return 'Date not set';
  }
  
  // Handle different timestamp formats
  let milliseconds: number;
  
  if (timestamp > 1000000000000) {
    // Already in milliseconds
    milliseconds = timestamp;
  } else if (timestamp > 1000000000) {
    // In seconds, convert to milliseconds
    milliseconds = timestamp * 1000;
  } else {
    // In nanoseconds, convert to milliseconds
    milliseconds = timestamp / 1000000;
  }
  
  // Validate timestamp is reasonable (not 1970 or before 2000)
  if (milliseconds < 946684800000) { // Before 2000-01-01
    console.warn('⚠️ Invalid timestamp detected in formatBookingDateShort:', timestamp, '->', milliseconds);
    return 'Date not set';
  }
  
  const date = new Date(milliseconds);
  
  // Double-check the date is valid
  if (isNaN(date.getTime())) {
    console.warn('⚠️ Invalid date created from timestamp:', timestamp, '->', milliseconds);
    return 'Date not set';
  }
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function formatRelativeTime(timestamp: number): string {
  if (!timestamp || timestamp === 0) {
    return 'Time not set';
  }

  // Handle different timestamp formats
  let date: Date;
  if (timestamp > 1000000000000) {
    // Already in milliseconds
    date = new Date(timestamp);
  } else if (timestamp > 1000000000) {
    // In seconds, convert to milliseconds
    date = new Date(timestamp * 1000);
  } else {
    // In nanoseconds, convert to milliseconds
    date = new Date(timestamp / 1000000);
  }

  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const absDiff = Math.abs(diff);
  const days = Math.floor(absDiff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((absDiff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

  if (diff > 0) {
    // Future timestamp
    if (days > 0) return `in ${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `in ${hours} hour${hours > 1 ? 's' : ''}`;
    return 'soon';
  } else {
    // Past timestamp
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'just now';
  }
}

export function isOverdue(deadline: number): boolean {
  if (!deadline || deadline === 0) return false;
  
  // Handle different timestamp formats
  let milliseconds: number;
  
  if (deadline > 1000000000000) {
    // Already in milliseconds
    milliseconds = deadline;
  } else if (deadline > 1000000000) {
    // In seconds, convert to milliseconds
    milliseconds = deadline * 1000;
  } else {
    // In nanoseconds, convert to milliseconds
    milliseconds = deadline / 1000000;
  }
  
  // Validate timestamp is reasonable (not 1970 or before 2000)
  if (milliseconds < 946684800000) { // Before 2000-01-01
    console.warn('⚠️ Invalid deadline timestamp in isOverdue:', deadline, '->', milliseconds);
    return false; // Don't mark as overdue if timestamp is invalid
  }
  
  const date = new Date(milliseconds);
  
  // Double-check the date is valid
  if (isNaN(date.getTime())) {
    console.warn('⚠️ Invalid date created from deadline:', deadline, '->', milliseconds);
    return false;
  }
  
  return new Date() > date;
}

export function getTimeRemaining(deadline: number): string {
  if (!deadline || deadline === 0) return 'No deadline set';

  // Handle different timestamp formats
  let milliseconds: number;
  
  if (deadline > 1000000000000) {
    // Already in milliseconds
    milliseconds = deadline;
  } else if (deadline > 1000000000) {
    // In seconds, convert to milliseconds
    milliseconds = deadline * 1000;
  } else {
    // In nanoseconds, convert to milliseconds
    milliseconds = deadline / 1000000;
  }
  
  // Validate timestamp is reasonable (not 1970 or before 2000)
  if (milliseconds < 946684800000) { // Before 2000-01-01
    console.warn('⚠️ Invalid deadline timestamp in getTimeRemaining:', deadline, '->', milliseconds);
    return 'No deadline set';
  }
  
  const date = new Date(milliseconds);
  
  // Double-check the date is valid
  if (isNaN(date.getTime())) {
    console.warn('⚠️ Invalid date created from deadline:', deadline, '->', milliseconds);
    return 'No deadline set';
  }

  const now = new Date();
  const diff = date.getTime() - now.getTime();

  if (diff <= 0) return 'Overdue';

  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
  return 'Less than 1 hour remaining';
}
