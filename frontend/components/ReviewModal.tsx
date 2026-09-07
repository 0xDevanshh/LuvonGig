'use client'
import React, { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  freelancerName?: string;
  serviceTitle?: string;
  submitting?: boolean;
}

export function ReviewModal({
  isOpen,
  onClose,
  onSubmit,
  freelancerName = 'the freelancer',
  serviceTitle = 'this project',
  submitting = false
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (comment.trim().length < 10) {
      setError('Please write at least 10 characters in your review');
      return;
    }

    setError(null);
    try {
      await onSubmit(rating, comment);
      // Reset form on success
      setRating(0);
      setComment('');
      setHoveredRating(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setRating(0);
      setComment('');
      setHoveredRating(0);
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto" showCloseButton={!submitting}>
        <DialogHeader>
          <DialogTitle>Rate Your Experience</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Service Info */}
          <div className="rounded-lg bg-primary-soft p-4">
            <p className="mb-1 text-sm text-muted-foreground">Project Completed</p>
            <p className="font-semibold text-foreground">{serviceTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">with {freelancerName}</p>
          </div>

          {/* Rating Section */}
          <div>
            <label className="mb-3 block text-sm font-medium text-foreground">
              How would you rate your experience? <span className="text-destructive">*</span>
            </label>
            <div className="flex items-center space-x-2" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  role="radio"
                  aria-checked={rating === star}
                  aria-label={`${star} ${star === 1 ? 'star' : 'stars'}`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  disabled={submitting}
                  className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50"
                >
                  <Star
                    size={40}
                    className={cn(
                      'transition-colors',
                      star <= (hoveredRating || rating)
                        ? 'fill-warning text-warning'
                        : 'fill-secondary text-muted-foreground/40',
                    )}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-3 text-lg font-semibold text-foreground">
                  {rating} {rating === 1 ? 'star' : 'stars'}
                </span>
              )}
            </div>
          </div>

          {/* Review Comment */}
          <div>
            <label htmlFor="review-comment" className="mb-2 block text-sm font-medium text-foreground">
              Write your review <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this project. What did you like? What could be improved?"
              rows={6}
              disabled={submitting}
              className="resize-none"
              maxLength={1000}
            />
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Minimum 10 characters required
              </p>
              <p className="text-xs text-muted-foreground">
                {comment.length}/1000 characters
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Helpful Tips */}
          <div className="rounded-lg border border-border bg-secondary p-4">
            <p className="mb-2 text-sm font-medium text-foreground">Tips for writing a helpful review:</p>
            <ul className="list-inside list-disc space-y-1 text-xs text-muted-foreground">
              <li>Be specific about what you liked or didn't like</li>
              <li>Mention communication quality and timeliness</li>
              <li>Note if the deliverables met your expectations</li>
              <li>Your review helps other clients make informed decisions</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Skip for Now
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || rating === 0 || comment.trim().length < 10}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Review'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
