'use client'    
import React from 'react'
interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: string
  trendValue?: string
}

export function StatsCard({
  title,
  value,
  icon,
  trend,
  trendValue,
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm text-gray-500 font-medium">{title}</h3>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="text-gray-400">{icon}</div>
      </div>
      {trend && trendValue && (
        <div className="mt-2">
          <span
            className={`text-xs font-medium ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}
          >
            {trend === 'up' ? '↑' : '↓'} {trendValue}
          </span>
        </div>
      )}
    </div>
  )
}
