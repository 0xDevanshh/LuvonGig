'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header1 } from '@/components/Header1';
import { useServices, usePackages } from '@/hooks/useMarketplace';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Package, Eye } from 'lucide-react';
import { formatICP } from '@/lib/ic-marketplace-agent';

export default function FreelancerServices() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>(''); // This should come from auth context
  const [selectedService, setSelectedService] = useState<string | null>(null);
  
  const { 
    services, 
    loading: servicesLoading, 
    error: servicesError, 
    refetch: fetchServices
  } = useServices();
  
  const { 
    packages, 
    loading: packagesLoading, 
    error: packagesError, 
    refetch: fetchPackages
  } = usePackages(selectedService || undefined);

  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [editingPackage, setEditingPackage] = useState<any>(null);

  useEffect(() => {
    // TODO: Get userId from auth context
    const mockUserId = 'USER123'; // Replace with actual user ID
    setUserId(mockUserId);
    
    if (mockUserId) {
      fetchServices();
    }
  }, [fetchServices]);

  const handleCreateService = async (serviceData: any) => {
    if (!userId) return;
    
    // TODO: Implement createService
    console.log('Creating service:', serviceData);
    setShowServiceForm(false);
  };

  const handleUpdateService = async (serviceId: string, updates: any) => {
    if (!userId) return;
    
    // TODO: Implement updateService
    console.log('Updating service:', serviceId, updates);
    setEditingService(null);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!userId) return;
    
    if (confirm('Are you sure you want to delete this service?')) {
      // TODO: Implement deleteService
      console.log('Deleting service:', serviceId);
    }
  };

  const handleCreatePackage = async (packageData: any) => {
    if (!userId || !selectedService) return;
    
    // TODO: Implement createPackage
    console.log('Creating package:', { ...packageData, service_id: selectedService });
    setShowPackageForm(false);
  };

  const handleUpdatePackage = async (packageId: string, updates: any) => {
    if (!userId) return;
    
    // TODO: Implement updatePackage
    console.log('Updating package:', packageId, updates);
    setEditingPackage(null);
  };

  const handleDeletePackage = async (packageId: string) => {
    if (!userId) return;
    
    if (confirm('Are you sure you want to delete this package?')) {
      // TODO: Implement deletePackage
      console.log('Deleting package:', packageId);
    }
  };

  if (servicesLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Header1 />
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading services...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
        <Header1 />
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#161616]">My Services</h1>
          <Button 
            onClick={() => setShowServiceForm(true)}
            className="bg-[#0B1F36] text-white hover:bg-[#1a3a5f]"
          >
            <Plus size={16} className="mr-2" />
            Add Service
          </Button>
        </div>

        {servicesError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {servicesError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Services List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Services ({services.length})</h2>
            {services.map((service) => (
              <Card key={service.service_id} className="border border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{service.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{service.main_category}</Badge>
                        <Badge variant="outline">{service.sub_category}</Badge>
                        <Badge 
                          variant={service.status === 'Active' ? 'default' : 'secondary'}
                        >
                          {service.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingService(service)}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedService(service.service_id)}
                      >
                        <Package size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteService(service.service_id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 line-clamp-2">{service.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="text-sm text-gray-500">
                      {service.total_orders} orders • {service.rating_avg.toFixed(1)}★
                    </div>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => router.push(`/freelancer/services/${service.service_id}`)}
                    >
                      <Eye size={14} className="mr-1" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Packages for Selected Service */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                Packages {selectedService ? `(${packages.length})` : ''}
              </h2>
              {selectedService && (
                <Button 
                  onClick={() => setShowPackageForm(true)}
                  size="sm"
                  className="bg-[#0B1F36] text-white hover:bg-[#1a3a5f]"
                >
                  <Plus size={14} className="mr-1" />
                  Add Package
                </Button>
              )}
            </div>

            {selectedService ? (
              packagesLoading ? (
                <div className="text-center py-4">Loading packages...</div>
              ) : packagesError ? (
                <div className="text-red-600">{packagesError}</div>
              ) : packages.length > 0 ? (
                packages.map((pkg) => (
                  <Card key={pkg.package_id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{pkg.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{pkg.tier}</Badge>
                            <Badge 
                              variant={pkg.status === 'Available' ? 'default' : 'secondary'}
                            >
                              {pkg.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {pkg.description}
                          </p>
                          <div className="flex items-center justify-between mt-3">
                            <div className="text-lg font-semibold text-[#0B1F36]">
                              {formatICP(BigInt(pkg.price_e8s))}
                            </div>
                            <div className="text-sm text-gray-500">
                              {pkg.delivery_days} days
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingPackage(pkg)}
                          >
                            <Edit size={12} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePackage(pkg.package_id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No packages yet. Create your first package to get started.
                </div>
              )
            ) : (
              <div className="text-center py-8 text-gray-500">
                Select a service to view its packages
              </div>
            )}
          </div>
        </div>

        {/* Service Form Modal */}
        {showServiceForm && (
          <ServiceForm
            onSubmit={handleCreateService}
            onCancel={() => setShowServiceForm(false)}
          />
        )}

        {/* Package Form Modal */}
        {showPackageForm && selectedService && (
          <PackageForm
            serviceId={selectedService}
            onSubmit={handleCreatePackage}
            onCancel={() => setShowPackageForm(false)}
          />
        )}

        {/* Edit Service Modal */}
        {editingService && (
          <ServiceForm
            service={editingService}
            onSubmit={(data) => handleUpdateService(editingService.service_id, data)}
            onCancel={() => setEditingService(null)}
          />
        )}

        {/* Edit Package Modal */}
        {editingPackage && (
          <PackageForm
            serviceId={selectedService || ''}
            package={editingPackage}
            onSubmit={(data) => handleUpdatePackage(editingPackage.package_id, data)}
            onCancel={() => setEditingPackage(null)}
          />
        )}
      </main>
    </div>
  );
}

// Service Form Component
function ServiceForm({ 
  service, 
  onSubmit, 
  onCancel 
}: { 
  service?: any; 
  onSubmit: (data: any) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState({
    title: service?.title || '',
    main_category: service?.main_category || 'Web Design',
    sub_category: service?.sub_category || '',
    description: service?.description || '',
    whats_included: service?.whats_included || '',
    cover_image_url: service?.cover_image_url || '',
    portfolio_images: service?.portfolio_images || []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {service ? 'Edit Service' : 'Create Service'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Service Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Main Category</label>
              <select
                value={formData.main_category}
                onChange={(e) => setFormData({ ...formData, main_category: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="Web Design">Web Design</option>
                <option value="UI/UX Design">UI/UX Design</option>
                <option value="Graphic Design">Graphic Design</option>
                <option value="Frontend Development">Frontend Development</option>
                <option value="Full Stack Development">Full Stack Development</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Sub Category</label>
              <input
                type="text"
                value={formData.sub_category}
                onChange={(e) => setFormData({ ...formData, sub_category: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">What's Included</label>
            <input
              type="text"
              value={formData.whats_included}
              onChange={(e) => setFormData({ ...formData, whats_included: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#0B1F36] text-white">
              {service ? 'Update Service' : 'Create Service'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Package Form Component
function PackageForm({ 
  serviceId,
  package: pkg, 
  onSubmit, 
  onCancel 
}: { 
  serviceId: string;
  package?: any; 
  onSubmit: (data: any) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState({
    title: pkg?.title || '',
    description: pkg?.description || '',
    price_e8s: pkg?.price_e8s ? Number(pkg.price_e8s) : 0,
    delivery_days: pkg?.delivery_days || 7,
    tier: pkg?.tier || 'Basic',
    features: pkg?.features || [''],
    revisions_included: pkg?.revisions_included || 1
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const removeFeature = (index: number) => {
    const newFeatures = formData.features.filter((_: string, i: number) => i !== index);
    setFormData({ ...formData, features: newFeatures });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {pkg ? 'Edit Package' : 'Create Package'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Package Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20"
              required
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tier</label>
              <select
                value={formData.tier}
                onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="Basic">Basic</option>
                <option value="Advanced">Advanced</option>
                <option value="Premium">Premium</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Price (ICP)</label>
              <input
                type="number"
                step="0.01"
                value={formData.price_e8s / 100_000_000}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  price_e8s: Math.floor(parseFloat(e.target.value || '0') * 100_000_000) 
                })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Delivery Days</label>
              <input
                type="number"
                value={formData.delivery_days}
                onChange={(e) => setFormData({ ...formData, delivery_days: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Features</label>
            {formData.features.map((feature: string, index: number) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => updateFeature(index, e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Feature description"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeFeature(index)}
                  disabled={formData.features.length === 1}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addFeature}
              className="mt-2"
            >
              Add Feature
            </Button>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Revisions Included</label>
            <input
              type="number"
              value={formData.revisions_included}
              onChange={(e) => setFormData({ ...formData, revisions_included: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              min="0"
              required
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#0B1F36] text-white">
              {pkg ? 'Update Package' : 'Create Package'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
