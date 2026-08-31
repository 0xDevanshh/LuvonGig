'use client'
import React from 'react';
interface CountdownTimerProps {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}
export function CountdownTimer({
  days,
  hours,
  minutes,
  seconds
}: CountdownTimerProps) {
  return <div className="flex justify-between text-center">
      <div className="bg-gray-800 text-white rounded-lg w-16 p-2">
        <div className="text-2xl font-bold">{days}</div>
        <div className="text-xs uppercase">D</div>
      </div>
      <div className="bg-gray-800 text-white rounded-lg w-16 p-2">
        <div className="text-2xl font-bold">{hours}</div>
        <div className="text-xs uppercase">H</div>
      </div>
      <div className="bg-gray-800 text-white rounded-lg w-16 p-2">
        <div className="text-2xl font-bold">{minutes}</div>
        <div className="text-xs uppercase">M</div>
      </div>
      <div className="bg-gray-800 text-white rounded-lg w-16 p-2">
        <div className="text-2xl font-bold">{seconds}</div>
        <div className="text-xs uppercase">S</div>
      </div>
    </div>;
}