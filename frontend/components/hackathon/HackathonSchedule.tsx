'use client'
import React from 'react';
interface ScheduleItem {
  date: string;
  event: string;
}
interface HackathonScheduleProps {
  schedule: ScheduleItem[];
}
export function HackathonSchedule({
  schedule
}: HackathonScheduleProps) {
  return <div>
      <h2 className="text-xl font-bold mb-6">Hackathon Schedule</h2>
      <div className="space-y-6">
        {schedule.map((item, index) => <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
              <p className="text-blue-600 font-medium">{item.event}</p>
            </div>
            <p className="text-gray-600 ml-6">{item.date}</p>
          </div>)}
      </div>
      <div className="mt-12 p-6 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Registration</h3>
        <div className="flex items-center justify-center bg-green-500 text-white py-3 px-4 rounded-lg">
          <span className="text-lg font-medium">Registration Open</span>
        </div>
      </div>
    </div>;
}