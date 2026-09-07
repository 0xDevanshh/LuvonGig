'use client'
import React, { useState, useRef } from 'react'
import { Image, Send, Loader2, Check, X } from 'lucide-react'
import { uploadImageToR2 } from '@/lib/r2-upload-client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
          disabled={uploading || sending}
          className="shrink-0 rounded-full text-muted-foreground hover:text-primary"
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
          onChange={e => setMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={uploading || sending}
          className="flex-1 rounded-full"
        />

        <Button
          type="submit"
          size="icon"
          className={cn(
            'shrink-0 rounded-full',
            deliveryStatus === 'sent' && 'bg-success text-success-foreground hover:bg-success/90',
            deliveryStatus === 'failed' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
          )}
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
        </Button>
      </form>
    </div>
  )
}