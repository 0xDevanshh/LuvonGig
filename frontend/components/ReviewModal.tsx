'use client'
import React, { useState } from 'react';
import { X, Star } from 'lucide-react';

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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Rate Your Experience</h2>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Service Info */}
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Project Completed</p>
            <p className="font-semibold text-gray-900">{serviceTitle}</p>
            <p className="text-sm text-gray-600 mt-1">with {freelancerName}</p>
          </div>

          {/* Rating Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              How would you rate your experience? <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  disabled={submitting}
                  className="focus:outline-none disabled:opacity-50"
                >
                  <Star
                    size={40}
                    className={`transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-gray-200 text-gray-300'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-3 text-lg font-semibold text-gray-700">
                  {rating} {rating === 1 ? 'star' : 'stars'}
                </span>
              )}
            </div>
          </div>

          {/* Review Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Write your review <span className="text-red-500">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this project. What did you like? What could be improved?"
              rows={6}
              disabled={submitting}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              maxLength={1000}
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">
                Minimum 10 characters required
              </p>
              <p className="text-xs text-gray-500">
                {comment.length}/1000 characters
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Helpful Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 mb-2">💡 Tips for writing a helpful review:</p>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>Be specific about what you liked or didn't like</li>
              <li>Mention communication quality and timeliness</li>
              <li>Note if the deliverables met your expectations</li>
              <li>Your review helps other clients make informed decisions</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            disabled={submitting}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Skip for Now
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0 || comment.trim().length < 10}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Submitting...</span>
              </>
            ) : (
              <span>Submit Review</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


