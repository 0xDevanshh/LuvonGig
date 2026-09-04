'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/ui/page-header'
import {
  Search,
  Filter,
  Briefcase,
  Clock,
  DollarSign,
  Tag,
  ChevronRight,
} from 'lucide-react'
import { listJobs, type Job } from '@/lib/api/jobs'
import { formatMoney, toMinorUnits } from '@/lib/currency'

const COMMON_SKILLS = ['React', 'Node.js', 'Python', 'TypeScript', 'Design', 'Writing', 'Marketing']

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

export default function BrowseJobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
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
      const { jobs: rows, total: count } = await listJobs({
        limit,
        offset,
        status: 'open',
        skills: selectedSkills.length > 0 ? selectedSkills : undefined,
        minBudget: budgetRange.min ? String(toMinorUnits(budgetRange.min)) : undefined,
        maxBudget: budgetRange.max ? String(toMinorUnits(budgetRange.max)) : undefined,
      })

      setJobs(rows)
      setTotal(count)
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [offset, selectedSkills, budgetRange])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchJobs()
  }

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    )
    setOffset(0)
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Find jobs"
        description="Browse open jobs and send a proposal."
        actions={
          <Button variant="outline" onClick={() => router.push('/freelancer/my-projects')}>
            My projects
          </Button>
        }
      />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-4">
        <aside className="space-y-6 lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Filter className="size-4" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Keywords</label>
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search jobs..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </form>
              </div>

              <div className="space-y-3">
                <label className="flex items-center text-sm font-medium text-foreground">
                  <DollarSign className="mr-1.5 size-4 text-muted-foreground" />
                  Budget (USD)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Min"
                    type="number"
                    value={budgetRange.min}
                    onChange={(e) => setBudgetRange((prev) => ({ ...prev, min: e.target.value }))}
                  />
                  <Input
                    placeholder="Max"
                    type="number"
                    value={budgetRange.max}
                    onChange={(e) => setBudgetRange((prev) => ({ ...prev, max: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center text-sm font-medium text-foreground">
                  <Tag className="mr-1.5 size-4 text-muted-foreground" />
                  Skills
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_SKILLS.map((skill) => (
                    <Badge
                      key={skill}
                      variant={selectedSkills.includes(skill) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleSkill(skill)}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button onClick={fetchJobs} className="w-full">
                  Apply filters
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setSelectedSkills([])
                    setBudgetRange({ min: '', max: '' })
                    setSearchTerm('')
                  }}
                >
                  Reset all
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>

        <div className="space-y-4 lg:col-span-3">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No jobs found"
              description="Try adjusting your filters or search terms."
            />
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Showing {jobs.length} of {total} available jobs
              </p>
              {jobs.map((job) => (
                <Card
                  key={job.id}
                  className="cursor-pointer transition-colors hover:border-primary"
                  onClick={() => router.push(`/freelancer/jobs/${job.id}/bid`)}
                >
                  <CardContent className="pt-6">
                    <div className="mb-4 flex flex-col items-start justify-between gap-4 md:flex-row">
                      <div className="space-y-1">
                        <h3 className="font-heading text-h3 font-semibold text-foreground">
                          {job.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="size-4" />
                            Posted {new Date(job.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Tag className="size-4" />
                            {job.client_name || job.clientId.slice(0, 8)}
                          </span>
                        </div>
                      </div>
                      <div className="w-full text-left md:w-auto md:text-right">
                        <div className="text-lg font-semibold text-success">
                          {formatMoney(job.budget_minor, job.currency)}{' '}
                          {job.budgetType === 'FIXED' ? 'total' : '/ hr'}
                        </div>
                        <StatusBadge status={titleCase(job.status)} className="mt-1" />
                      </div>
                    </div>

                    <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {job.description}
                    </p>

                    <div className="mb-4 flex flex-wrap gap-2">
                      {job.requiredSkills.map((skill: string) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-end border-t border-border pt-4">
                      <div className="flex items-center font-medium text-primary">
                        View details &amp; bid
                        <ChevronRight className="ml-1 size-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {total > limit && (
                <div className="mt-8 flex justify-center gap-2">
                  <Button
                    variant="outline"
                    disabled={offset === 0}
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    disabled={offset + limit >= total}
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
    </div>
  )
}
