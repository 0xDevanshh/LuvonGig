'use client'
import React, { useState, useEffect, useRef } from 'react';
import { Image, Send, Loader2 } from 'lucide-react';
import { uploadImageToR2 } from '@/lib/r2-upload-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface MessageInputProps {
  onSendMessage: (message: string, options?: {
    messageType?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
  }) => void;
  onTypingIndicator?: (isTyping: boolean) => void;
}

export function MessageInput({
  onSendMessage,
  onTypingIndicator
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Handle typing indicator
  const handleTyping = (value: string) => {
    setMessage(value);

    // Send typing indicator if callback is provided
    if (onTypingIndicator) {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Send typing indicator
      onTypingIndicator(true);

      // Set timeout to stop typing indicator after 1 second of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        onTypingIndicator(false);
      }, 1000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (message.trim() && !uploading) {
      await onSendMessage(message);
      setMessage('');

      // Stop typing indicator
      if (onTypingIndicator && typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        onTypingIndicator(false);
      }
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only images are allowed.');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File too large. Maximum size is 10MB.');
      return;
    }

    try {
      setUploading(true);

      // Upload image to Cloudflare R2
      const result = await uploadImageToR2(file, 'chat-images');

      if (result.success && result.url) {
        // Send message with image
        await onSendMessage('', {
          messageType: 'image',
          fileUrl: result.url,
          fileName: file.name,
          fileSize: file.size
        });
      } else {
        alert(result.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);
  return (
    <div className="border-t border-border bg-card p-4">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleImageSelect}
          className="hidden"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="shrink-0 rounded-full text-muted-foreground"
          title="Send image"
        >
          {uploading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Image size={20} />
          )}
        </Button>
        <Input
          type="text"
          value={message}
          onChange={e => handleTyping(e.target.value)}
          placeholder="Type a message here"
          disabled={uploading}
          className="flex-1 rounded-full"
        />
        <Button
          type="submit"
          size="icon"
          className="shrink-0 rounded-full"
          disabled={(!message.trim() && !uploading) || uploading}
        >
          <Send size={20} />
        </Button>
      </form>
    </div>
  );
}