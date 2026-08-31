import { ProfileWorkExperience } from './ProfileWorkExperience'
import { Suspense } from 'react'

export default function Work() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProfileWorkExperience />
    </Suspense>
  )
}