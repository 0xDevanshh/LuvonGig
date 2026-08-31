'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useServices, useDeleteService } from '@/hooks/useServices'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Star, 
  ShoppingCart,
  MoreHorizontal,
  Package
} from 'lucide-react'
import { formatICP } from '@/lib/ic-marketplace-agent'

export default function MyServicesPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string>('TEST_FREELANCER_456') // TODO: Get from auth context
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { services, loading, error, refetch } = useServices(userId, {
    search_term: searchTerm,
    limit: 20,
    offset: 0
  })

  const { deleteService, loading: deleteLoading } = useDeleteService()

  const handleCreateService = () => {
    router.push('/add-service/overview')
  }

  const handleEditService = (serviceId: string) => {
    router.push(`/update-service/${serviceId}/overview`)
  }

  const handleDeleteService = async (serviceId: string) => {
    if (confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      const result = await deleteService(userId, serviceId)
      if (result.success) {
        refetch()
      } else {
        alert('Failed to delete service: ' + result.error)
      }
    }
  }

  const handleViewService = (serviceId: string) => {
    router.push(`/service-preview/${serviceId}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800'
      case 'Inactive': return 'bg-gray-100 text-gray-800'
      case 'Draft': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || service.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <Button onClick={refetch}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Services</h1>
          <p className="text-gray-600">Manage your service offerings</p>
        </div>
        <Button onClick={handleCreateService} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Create New Service
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Draft">Draft</option>
        </select>
      </div>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter 
              ? 'Try adjusting your filters' 
              : 'Create your first service to get started'
            }
          </p>
          {!searchTerm && !statusFilter && (
            <Button onClick={handleCreateService} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Service
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <Card key={service.service_id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{service.title}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{service.main_category} • {service.sub_category}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Badge className={getStatusColor(service.status)}>
                      {service.status}
                    </Badge>
                    <div className="relative">
                      <Button variant="ghost" size="sm" className="p-1">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                  {service.description}
                </p>
                
                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    <span>{service.rating_avg.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center">
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    <span>{service.total_orders} orders</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleViewService(service.service_id)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEditService(service.service_id)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDeleteService(service.service_id)}
                    disabled={deleteLoading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats Summary */}
      {filteredServices.length > 0 && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{filteredServices.length}</p>
              <p className="text-sm text-gray-600">Total Services</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {filteredServices.filter(s => s.status === 'Active').length}
              </p>
              <p className="text-sm text-gray-600">Active Services</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {filteredServices.reduce((sum, s) => sum + s.total_orders, 0)}
              </p>
              <p className="text-sm text-gray-600">Total Orders</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

