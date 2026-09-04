'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Footer } from '@/components/Footer'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { Edit, Trash2, Eye, Plus, Pause, Play, Briefcase, AlertCircle, LogIn } from 'lucide-react'
import { useServices, useDeleteService, useUpdateService } from '@/hooks/useServices'
import { formatMoney } from '@/lib/currency'

function formatDate(value: string | number | undefined | null) {
  if (!value) return 'Date not set'
  const date = new Date(value)
  if (isNaN(date.getTime())) return 'Date not set'
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function getRelativeTime(value: string | number | undefined | null) {
  if (!value) return ''
  const date = new Date(value)
  if (isNaN(date.getTime())) return ''
  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 1) return 'Today'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

function getCoverImage(service: any) {
  if (typeof service.cover_image_url === 'string' && service.cover_image_url.trim()) {
    return service.cover_image_url
  }
  if (Array.isArray(service.cover_image_url) && service.cover_image_url.length > 0) {
    return service.cover_image_url[0]
  }
  if (Array.isArray(service.portfolio_images) && service.portfolio_images.length > 0) {
    return service.portfolio_images[0]
  }
  return '/images/default-service-placeholder.svg'
}

function transformServiceData(service: any) {
  const availablePackages = (service.packages || []).filter(
    (pkg: any) => pkg.price_minor && pkg.status === 'Available'
  )
  const cheapest = availablePackages.sort(
    (a: any, b: any) => Number(a.price_minor) - Number(b.price_minor)
  )[0]

  return {
    id: service.service_id,
    title: service.title,
    category: service.main_category,
    priceLabel: cheapest ? formatMoney(cheapest.price_minor, cheapest.currency) : '—',
    coverImage: getCoverImage(service),
    coverImages: Array.isArray(service.portfolio_images) ? service.portfolio_images : [],
    status: typeof service.status === 'string' ? service.status.toLowerCase() : 'active',
    createdAt: service.created_at,
  }
}

export default function MyServices() {
  const navigate = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session')
        const data = await response.json()

        if (data.success && data.session) {
          setUserId(data.session.userId)
          setUserEmail(data.session.email)
        } else {
          const meResponse = await fetch('/api/auth/me')
          const meData = await meResponse.json()

          if (meData.success && meData.session) {
            setUserId(meData.session.userId)
            setUserEmail(meData.session.email)
          } else {
            setUserId(null)
            setUserEmail(null)
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error)
        setUserId(null)
        setUserEmail(null)
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [])

  const { services: fetchedServices, loading, error, refetch } = useServices(userEmail || undefined, {
    freelancer_email: userEmail || undefined,
    limit: 50,
  })

  const { deleteService } = useDeleteService()
  const { updateService } = useUpdateService()

  const services = fetchedServices
    .map(transformServiceData)
    .filter((service) => service.status !== 'deleted')
  const isLoading = isCheckingAuth || loading

  const handleAddService = () => navigate.push('/freelancer/add-service/overview')
  const handleEditService = (serviceId: string) => navigate.push(`/freelancer/update-service/${serviceId}/overview`)
  const handleViewService = (serviceId: string) => navigate.push(`/freelancer/service-preview/${serviceId}`)

  const handleDeleteService = async (serviceId: string) => {
    if (!userEmail) {
      alert('Failed to delete service: User email not found. Please log in again.')
      return
    }

    if (!confirm('Are you sure you want to delete this service? This action cannot be undone.')) return

    try {
      const result = await deleteService(userEmail, serviceId)
      if (result.success) {
        refetch()
      } else {
        alert('Failed to delete service: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Delete service error:', error)
      alert('Failed to delete service. Please try again.')
    }
  }

  const handleToggleStatus = async (serviceId: string, currentStatus: string) => {
    if (!userEmail) {
      alert('Failed to update service status: User email not found. Please log in again.')
      return
    }

    const newStatus = currentStatus === 'active' ? 'Paused' : 'Active'

    try {
      const result = await updateService(userEmail, serviceId, { status: newStatus }, userId || undefined)
      if (result.success) {
        refetch()
      } else {
        alert('Failed to update service status: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Toggle status error:', error)
      alert('Failed to update service status. Please try again.')
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 p-6">
        <PageHeader
          title="My services"
          description="Manage and update your service offerings."
          actions={
            <Button onClick={handleAddService}>
              <Plus className="size-4" />
              Add new service
            </Button>
          }
        />

        <div className="mt-8">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : !userId ? (
            <EmptyState
              icon={LogIn}
              title="Please log in"
              description="You need to be logged in to view and manage your services."
              action={<Button onClick={() => navigate.push('/login')}>Log in to continue</Button>}
            />
          ) : error ? (
            <EmptyState
              icon={AlertCircle}
              title="Error loading services"
              description={error}
              action={<Button variant="outline" onClick={() => refetch()}>Try again</Button>}
            />
          ) : services.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No services yet"
              description="You haven't created any services yet. Add your first service to start selling your skills."
              action={
                <Button onClick={handleAddService}>
                  <Plus className="size-4" />
                  Add your first service
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {services.map((service) => (
                <Card key={service.id} className="overflow-hidden p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="relative h-48 w-full md:h-auto md:w-1/3">
                      <img
                        src={service.coverImage}
                        alt={service.title}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/images/default-service-placeholder.svg'
                        }}
                      />
                      {service.coverImages.length > 1 && (
                        <div className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white">
                          +{service.coverImages.length - 1}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="mb-1 line-clamp-2 font-heading text-h3 font-semibold text-foreground">
                            {service.title}
                          </h3>
                          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{service.category}</span>
                            <span>&middot;</span>
                            <span>{service.priceLabel}</span>
                          </div>
                          <Badge variant={service.status === 'active' ? 'default' : 'secondary'}>
                            {service.status === 'active' ? 'Active' : 'Paused'}
                          </Badge>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleToggleStatus(service.id, service.status)}
                            aria-label={service.status === 'active' ? 'Pause service' : 'Activate service'}
                          >
                            {service.status === 'active' ? <Pause className="size-4" /> : <Play className="size-4" />}
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => handleViewService(service.id)} aria-label="Preview service">
                            <Eye className="size-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          <div className="flex flex-col gap-0.5">
                            <span>Created {formatDate(service.createdAt)}</span>
                            <span>{getRelativeTime(service.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-destructive/30 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteService(service.id)}
                          >
                            <Trash2 className="size-3.5" />
                            Delete
                          </Button>
                          <Button size="sm" onClick={() => handleEditService(service.id)}>
                            <Edit className="size-3.5" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
