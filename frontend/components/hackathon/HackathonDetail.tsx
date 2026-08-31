'use client'
import React from 'react'
import { Button } from '../ui/button'
import { Calendar, Trophy, Clock, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
interface HackathonDetailProps {
  hackathon: {
    id: string
    title: string
    description: string
    registrationOpen: boolean
    submissionOpen: boolean
    startDate: string
    endDate: string
    prizePool: string
    participants: number
    image: string
  }
}
export function HackathonDetail({ hackathon }: HackathonDetailProps) {
  const router = useRouter()
  const handleRegister = () => {
    router.push('/hackathon-registration')
        router.push('/hackathon-registration')
  }
  const handleSubmitProject = () => {
    router.push(`/submit-project/${hackathon.id}`)
  }
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="h-48 overflow-hidden">
        <img
          src={hackathon.image}
          alt={hackathon.title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-2">{hackathon.title}</h2>
        <p className="text-gray-600 mb-6">{hackathon.description}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-start">
            <Calendar className="w-5 h-5 text-blue-500 mt-1 mr-3" />
            <div>
              <p className="font-medium">Duration</p>
              <p className="text-gray-600 text-sm">
                {hackathon.startDate} - {hackathon.endDate}
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <Trophy className="w-5 h-5 text-blue-500 mt-1 mr-3" />
            <div>
              <p className="font-medium">Prize Pool</p>
              <p className="text-gray-600 text-sm">{hackathon.prizePool}</p>
            </div>
          </div>
          <div className="flex items-start">
            <Clock className="w-5 h-5 text-blue-500 mt-1 mr-3" />
            <div>
              <p className="font-medium">Status</p>
              <div className="flex items-center">
                {hackathon.registrationOpen ? (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    Registration Open
                  </span>
                ) : (
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                    Registration Closed
                  </span>
                )}
                {hackathon.submissionOpen && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full ml-2">
                    Submissions Open
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-start">
            <Users className="w-5 h-5 text-blue-500 mt-1 mr-3" />
            <div>
              <p className="font-medium">Participants</p>
              <p className="text-gray-600 text-sm">
                {hackathon.participants} registered
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          {hackathon.registrationOpen && (
            <Button
              onClick={handleRegister}
              variant="default"
              size="lg"
              className="flex-1"
            >
              Register Now
            </Button>
          )}
          {hackathon.submissionOpen && (
            <Button
              onClick={handleSubmitProject}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              Submit Project
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
