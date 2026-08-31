'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Clock, CheckCircle, XCircle, AlertCircle, DollarSign, RefreshCw, Activity, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useBookings, useJobProjects } from '@/hooks/useMarketplace';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function MyProjectsPage() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [userId, setUserId] = useState<string>('');
  const [jobUserId, setJobUserId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  const {
    bookings,
    loading: bookingsLoading,
    error: bookingsError,
    fetchBookings
  } = useBookings(userId, 'freelancer', statusFilter);

  const {
    projects: jobProjects,
    loading: jobProjectsLoading,
    refetch: refetchJobProjects
  } = useJobProjects(jobUserId, 'freelancer');

  const isLoading = (bookingsLoading || jobProjectsLoading) && bookings.length === 0 && jobProjects.length === 0;

  // Fetch session on component mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        if (data.success && data.session) {
          setSession(data.session);
          setUserId(data.session.email); // Use email for bookings
          if (data.session.userId) {
            setJobUserId(data.session.userId); // Use 8-char ID for job marketplace
          }
        } else {
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Error fetching session:', error);
        router.push('/auth/login');
      }
    };

    fetchSession();
  }, [router]);

  useEffect(() => {
    if (userId) {
      fetchBookings();
    }
  }, [fetchBookings, userId, statusFilter]);

  useEffect(() => {
    if (!autoRefresh || (!userId && !jobUserId)) return;
    const interval = setInterval(() => {
      if (userId) fetchBookings();
      if (jobUserId) refetchJobProjects();
      setLastUpdate(Date.now());
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, userId, jobUserId, fetchBookings, refetchJobProjects]);

  const getStatusString = (status: any): string => {
    if (typeof status === 'string') return status;
    if (typeof status === 'object' && status !== null) {
      const keys = Object.keys(status);
      return keys.length > 0 ? keys[0] : 'Pending';
    }
    return 'Pending';
  };


  const getStatusIcon = (status: any) => {
    const statusStr = getStatusString(status);
    switch (statusStr) {
      case 'Pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'Active': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'ASSIGNED': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'Completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'COMPLETED': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Paid': return <DollarSign className="w-4 h-4 text-green-600" />;
      case 'PAID': return <DollarSign className="w-4 h-4 text-green-600" />;
      case 'Cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'InDispute': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: any) => {
    const statusStr = getStatusString(status);
    switch (statusStr) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Active': return 'bg-blue-100 text-blue-800';
      case 'ASSIGNED': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'InDispute': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalProjects = bookings.length + jobProjects.length;
  const activeProjects = bookings.filter(b => b.status === 'Active').length + jobProjects.length;
  const completedProjects = bookings.filter(b => b.status === 'Completed').length;

  const bookingEarnings = bookings
    .filter(b => b.status === 'Completed')
    .reduce((sum, b) => sum + Number(b.total_amount_e8s || 0), 0);

  const totalEarnings = bookingEarnings; // Job projects budget is in unknown units (dollars probably), so skipping for now in ICP stats

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-white">
        <div className="flex-1 flex flex-col items-center justify-center p-12">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
          <div className="text-xl font-medium text-gray-600">Loading your projects...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <div className="flex-1 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">My Projects</h1>
            <p className="text-gray-600">Manage your projects and track earnings</p>
          </div>
          <div className="flex gap-4">
            <Link href="/freelancer/add-service">
              <Button className="flex items-center gap-2"><Plus size={18} /> Post New Service</Button>
            </Link>
            <Button variant="outline" onClick={() => { fetchBookings(); refetchJobProjects(); }} className="flex items-center gap-2">
              <RefreshCw size={18} /> Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-gray-600">Total Projects</p><p className="text-2xl font-bold">{totalProjects}</p></div><div className="p-3 bg-blue-100 rounded-full"><Activity className="w-6 h-6 text-blue-600" /></div></CardContent></Card>
          <Card><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-gray-600">Active Projects</p><p className="text-2xl font-bold">{activeProjects}</p></div><div className="p-3 bg-green-100 rounded-full"><Clock className="w-6 h-6 text-green-600" /></div></CardContent></Card>
          <Card><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-gray-600">Completed</p><p className="text-2xl font-bold">{completedProjects}</p></div><div className="p-3 bg-purple-100 rounded-full"><CheckCircle className="w-6 h-6 text-purple-600" /></div></CardContent></Card>
          <Card><CardContent className="p-6 flex items-center justify-between"><div><p className="text-sm text-gray-600">Total ICP Earnings</p><p className="text-2xl font-bold">{(totalEarnings / 100000000).toFixed(6)} ICP</p></div><div className="p-3 bg-yellow-100 rounded-full"><DollarSign className="w-6 h-6 text-yellow-600" /></div></CardContent></Card>
        </div>

        <div className="mb-6 flex gap-2">
          {['', 'Active', 'Completed', 'Pending'].map(s => (
            <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} onClick={() => setStatusFilter(s)}>{s || 'All'}</Button>
          ))}
        </div>

        <Card>
          <CardHeader><CardTitle>Recent Projects</CardTitle></CardHeader>
          <CardContent>
            {bookings.length === 0 && jobProjects.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No projects yet</p>
                <Link href="/freelancer/add-service"><Button className="mt-4">Post Your First Service</Button></Link>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <Card key={booking.booking_id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">{booking.service_title?.charAt(0) || 'P'}</div>
                        <div>
                          <h3 className="font-medium">{booking.service_title}</h3>
                          <p className="text-sm text-gray-600">Client: {booking.client_id}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge className={getStatusColor(booking.status)}>{getStatusIcon(booking.status)} <span className="ml-1">{getStatusString(booking.status)}</span></Badge>
                        <span className="font-semibold">{(Number(booking.total_amount_e8s || 0) / 100000000).toFixed(6)} ICP</span>
                        <Button onClick={() => router.push(`/freelancer/project-details/${booking.booking_id}`)} variant="outline">View</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {jobProjects.map((project) => (
                  <Card key={project.id} className="hover:shadow-md transition-shadow border-l-4 border-purple-500">
                    <CardContent className="p-6 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-bold">{project.title?.charAt(0) || 'J'}</div>
                        <div>
                          <h3 className="font-medium">{project.title}</h3>
                          <p className="text-sm text-gray-600">Client: {project.clientId}</p>
                          <Badge className="bg-purple-50 text-purple-700 border-purple-100">Job Project</Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge className={getStatusColor(project.status)}>
                          {getStatusIcon(project.status)}
                          <span className="ml-1">{getStatusString(project.status) === 'ASSIGNED' ? 'Assigned' : getStatusString(project.status)}</span>
                        </Badge>
                        <span className="font-semibold">{(Number(project.budgetAmount) / 100000000).toFixed(5)} ICP</span>
                        <Button onClick={() => router.push(`/freelancer/project-details/job_${project.id}`)} variant="outline">View</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}