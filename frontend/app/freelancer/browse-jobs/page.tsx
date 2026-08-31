'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header1 } from '@/components/Header1'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Filter,
  Briefcase,
  Clock,
  DollarSign,
  Tag,
  ChevronRight,
  Loader2
} from 'lucide-react'
import { getJobMarketplaceActor, serializeBigInts } from '@/lib/job-marketplace-agent'

export default function BrowseJobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [budgetRange, setBudgetRange] = useState({ min: '', max: '' })

  const [limit] = useState(10)
  const [offset, setOffset] = useState(0)

  const fetchJobs = async () => {
    setIsLoading(true)
    try {
      const actor = await getJobMarketplaceActor()

      const filter = {
        skills: selectedSkills.length > 0 ? [selectedSkills] : [],
        minBudget: budgetRange.min ? [BigInt(budgetRange.min)] : [],
        maxBudget: budgetRange.max ? [BigInt(budgetRange.max)] : []
      }

      const result = await actor.getJobs(
        filter.skills.length > 0 || filter.minBudget.length > 0 || filter.maxBudget.length > 0 ? [filter] : [],
        BigInt(limit),
        BigInt(offset)
      )

      const serialized = serializeBigInts(result)
      setJobs(serialized.jobs)
      setTotal(Number(serialized.total))
    } catch (error) {
      console.error('Error fetching jobs from ICP:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [offset, selectedSkills, budgetRange])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Local search for now or could be extended in canister
    fetchJobs()
  }

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )
    setOffset(0)
  }

  const commonSkills = ['React', 'Node.js', 'Python', 'Solidity', 'Rust', 'TypeScript', 'Design']

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Browse Jobs</h1>
            <p className="text-gray-600">Find your next client project on the Internet Computer</p>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => router.push('/freelancer/my-projects')}
          >
            My Projects
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            <Card className="bg-white shadow-sm border-gray-100 sticky top-4">
              <CardHeader className="pb-3 border-b border-gray-50">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-6">
                {/* Search */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Keywords</label>
                  <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search jobs..."
                      className="pl-9 bg-gray-50 border-gray-200"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </form>
                </div>

                {/* Budget */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                    Budget (ICP)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Min"
                      type="number"
                      className="bg-gray-50 border-gray-200"
                      value={budgetRange.min}
                      onChange={(e) => setBudgetRange(prev => ({ ...prev, min: e.target.value }))}
                    />
                    <Input
                      placeholder="Max"
                      type="number"
                      className="bg-gray-50 border-gray-200"
                      value={budgetRange.max}
                      onChange={(e) => setBudgetRange(prev => ({ ...prev, max: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Skills */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <Tag className="w-4 h-4 mr-2 text-gray-400" />
                    Skills
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {commonSkills.map(skill => (
                      <Badge
                        key={skill}
                        variant={selectedSkills.includes(skill) ? "default" : "outline"}
                        className={`cursor-pointer text-xs py-1 px-2 transition-all ${selectedSkills.includes(skill)
                          ? "bg-blue-600 hover:bg-blue-700 border-transparent"
                          : "hover:bg-blue-50 hover:text-blue-600 border-gray-200 text-gray-600"
                          }`}
                        onClick={() => toggleSkill(skill)}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex flex-col gap-2">
                  <Button
                    onClick={fetchJobs}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Apply Filters
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                      setSelectedSkills([])
                      setBudgetRange({ min: '', max: '' })
                      setSearchTerm('')
                    }}
                  >
                    Reset All
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Job Listings Area */}
          <div className="lg:col-span-3 space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-500">Loading jobs from ICP...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300 shadow-sm">
                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900">No jobs found</h3>
                <p className="text-gray-500">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Showing {jobs.length} of {total} available jobs</p>
                </div>
                {jobs.map(job => (
                  <Card key={job.id} className="hover:border-blue-300 hover:shadow-md transition-all group cursor-pointer border-gray-100 shadow-sm" onClick={() => router.push(`/freelancer/jobs/${job.id}/bid`)}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {job.title}
                          </h3>
                          <div className="flex items-center text-sm text-gray-500 gap-4">
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              Posted {new Date(Number(job.createdAt) / 1000000).toLocaleDateString()}
                            </span>
                            <span className="flex items-center">
                              <Tag className="w-4 h-4 mr-1" />
                              {job.clientId.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                        <div className="text-left md:text-right w-full md:w-auto">
                          <div className="text-xl font-bold text-green-600 flex items-center md:justify-end">
                            <DollarSign className="w-4 h-4" />
                            {(Number(job.budgetAmount) / 100000000).toFixed(5)} ICP {Object.keys(job.budgetType)[0] === 'FIXED' ? 'Total' : '/ hr'}
                          </div>
                          <Badge variant="secondary" className="mt-1 bg-green-50 text-green-700 border-none">
                            {Object.keys(job.status)[0]}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                        {job.description}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-6">
                        {job.requiredSkills.map((skill: string) => (
                          <Badge key={skill} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none">
                            {skill}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-end border-t border-gray-50 pt-4">
                        <div className="text-blue-600 font-medium flex items-center group-hover:translate-x-1 transition-transform">
                          View Details & Bid
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Pagination */}
                {total > limit && (
                  <div className="flex justify-center mt-8 gap-2">
                    <Button
                      variant="outline"
                      disabled={offset === 0}
                      className="border-gray-200 hover:bg-gray-50"
                      onClick={() => setOffset(Math.max(0, offset - limit))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      disabled={offset + limit >= total}
                      className="border-gray-200 hover:bg-gray-50"
                      onClick={() => setOffset(offset + limit)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
