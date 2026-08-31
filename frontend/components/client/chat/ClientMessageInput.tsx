'use client'
import React, { useState, useRef } from 'react'
import { Paperclip, Image, Send, Smile, Loader2, Check, X } from 'lucide-react'
import { uploadImageToR2 } from '@/lib/r2-upload-client'

interface ClientMessageInputProps {
  onSendMessage: (message: string, options?: {
    messageType?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
  }) => Promise<void>
}

export function ClientMessageInput({
  onSendMessage
}: ClientMessageInputProps) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deliveryStatus, setDeliveryStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !sending && !uploading) {
      setSending(true)
      setDeliveryStatus('sending')

      try {
        await onSendMessage(message)
        setDeliveryStatus('sent')
        setMessage('')

        // Reset status after 2 seconds
        setTimeout(() => setDeliveryStatus('idle'), 2000)
      } catch (error) {
        console.error('Failed to send message:', error)
        setDeliveryStatus('failed')

        // Reset status after 3 seconds
        setTimeout(() => setDeliveryStatus('idle'), 3000)
      } finally {
        setSending(false)
      }
    }
  }

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
      setDeliveryStatus('sending');

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
        setDeliveryStatus('sent');
        setTimeout(() => setDeliveryStatus('idle'), 2000);
      } else {
        alert(result.error || 'Failed to upload image');
        setDeliveryStatus('failed');
        setTimeout(() => setDeliveryStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
      setDeliveryStatus('failed');
      setTimeout(() => setDeliveryStatus('idle'), 3000);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="p-4 border-t border-gray-200 bg-white">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleImageSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || sending}
          className="p-2 text-gray-500 hover:text-purple-600 rounded-full hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Send image"
        >
          {uploading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Image size={20} />
          )}
        </button>

        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={uploading || sending}
            className="w-full py-3 pl-4 pr-10 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          className={`p-3 rounded-full transition-colors disabled:cursor-not-allowed flex items-center justify-center ${deliveryStatus === 'sending' || uploading
              ? 'bg-blue-600 hover:bg-blue-700'
              : deliveryStatus === 'sent'
                ? 'bg-green-600 hover:bg-green-700'
                : deliveryStatus === 'failed'
                  ? 'bg-red-600 hover:bg-red-700'
                  : (message.trim() || uploading) && !sending && !uploading
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-gray-300'
            } text-white`}
          disabled={(!message.trim() && !uploading) || sending || uploading}
          title={
            uploading || deliveryStatus === 'sending'
              ? 'Sending...'
              : deliveryStatus === 'sent'
                ? 'Message sent!'
                : deliveryStatus === 'failed'
                  ? 'Failed to send - try again'
                  : 'Send message'
          }
        >
          {(sending || uploading) ? (
            <Loader2 size={20} className="animate-spin" />
          ) : deliveryStatus === 'sent' ? (
            <Check size={20} />
          ) : deliveryStatus === 'failed' ? (
            <X size={20} />
          ) : (
            <Send size={20} />
          )}
        </button>
      </form>
    </div>
  )
}