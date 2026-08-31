'use client'
import React, { useEffect, useState, useRef } from 'react';
interface OtpInputProps {
  length?: number;
  value?: string;
  onChange?: (otp: string) => void;
  hasInitialValue?: boolean;
  initialValue?: string;
}
export function OtpInput({
  length = 6,
  onChange,
  hasInitialValue = false,
  initialValue = ''
}: OtpInputProps) {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => {
    if (hasInitialValue && initialValue) {
      const otpArray = initialValue.split('').slice(0, length);
      setOtp([...otpArray, ...Array(length - otpArray.length).fill('')]);
    }
  }, [hasInitialValue, initialValue, length]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (isNaN(Number(value))) return;
    // Only take the first digit if multiple are pasted/entered
    const digit = value.substring(0, 1);
    // Update the OTP array
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    // Call onChange callback with the full OTP string
    onChange?.(newOtp.join(''));
    // Move to the next input if a digit was entered
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // Move to previous input on backspace if current input is empty
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text/plain').trim();
    if (!pasteData) return;
    // Filter only digits from pasted content
    const digits = pasteData.replace(/\D/g, '').split('').slice(0, length);
    // Update OTP array with pasted digits
    const newOtp = [...Array(length).fill('')];
    digits.forEach((digit, idx) => {
      if (idx < length) newOtp[idx] = digit;
    });
    setOtp(newOtp);
    onChange?.(newOtp.join(''));
    // Focus the next empty input or the last one
    const nextEmptyIndex = digits.length < length ? digits.length : length - 1;
    inputRefs.current[nextEmptyIndex]?.focus();
  };
  return <div className="flex justify-center gap-2 sm:gap-4">
      {Array(length).fill(0).map((_, index) => <input key={index} ref={ref => {
        if (ref) {
          inputRefs.current[index] = ref;
        }
      }} type="text" inputMode="numeric" maxLength={1} value={otp[index]} onChange={e => handleChange(e, index)} onKeyDown={e => handleKeyDown(e, index)} onPaste={index === 0 ? handlePaste : undefined} className="w-12 h-14 text-center text-2xl border border-[#cacaca] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2ba24c] text-[#161616]" autoComplete="one-time-code" />)}
    </div>;
}