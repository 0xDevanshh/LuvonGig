'use client'

import React from 'react'
import FreelancerLayout from './layout'
import FreelancerDashboard from '@/app/freelancer/dashboard/page'

export default function FreelancerPage() {
  return (
    <FreelancerLayout>
      <FreelancerDashboard />
    </FreelancerLayout>
  )
}