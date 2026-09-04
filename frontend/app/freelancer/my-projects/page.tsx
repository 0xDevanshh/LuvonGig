'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Activity, Clock, CheckCircle, Wallet, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useBookings, useJobProjects } from '@/hooks/useMarketplace';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney } from '@/lib/currency';

const JOB_STATUS_LABEL: Record<string, string> = {
  ASSIGNED: 'Active',
  COMPLETED: 'Completed',
  PAID: 'Paid',
  CLOSED: 'Closed',
  OPEN: 'Open',
}

export default function MyProjectsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>('');
  const [jobUserId, setJobUserId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [autoRefresh] = useState<boolean>(true);

  const {
    bookings,
    loading: bookingsLoading,
    fetchBookings
  } = useBookings(userId, 'freelancer', statusFilter);

  const {
    projects: jobProjects,
    loading: jobProjectsLoading,
    refetch: refetchJobProjects
  } = useJobProjects(jobUserId, 'freelancer');

  const isLoading = (bookingsLoading || jobProjectsLoading) && bookings.length === 0 && jobProjects.length === 0;

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        if (data.success && data.session) {
          setUserId(data.session.email);
          if (data.session.userId) setJobUserId(data.session.userId);
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching session:', error);
        router.push('/login');
      }
    };

    fetchSession();
  }, [router]);

  useEffect(() => {
    if (userId) fetchBookings();
  }, [fetchBookings, userId, statusFilter]);

  useEffect(() => {
    if (!autoRefresh || (!userId && !jobUserId)) return;
    const interval = setInterval(() => {
      if (userId) fetchBookings();
      if (jobUserId) refetchJobProjects();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, userId, jobUserId, fetchBookings, refetchJobProjects]);

  const totalProjects = bookings.length + jobProjects.length;
  const activeProjects = bookings.filter((b) => b.status === 'Active').length
    + jobProjects.filter((p) => (p.status || '').toUpperCase() === 'ASSIGNED').length;
  const completedProjects = bookings.filter((b) => b.status === 'Completed').length
    + jobProjects.filter((p) => ['COMPLETED', 'PAID'].includes((p.status || '').toUpperCase())).length;

  const bookingEarningsMinor = bookings
    .filter((b) => b.status === 'Completed')
    .reduce((sum, b) => sum + Number(b.total_minor || 0), 0);
  const jobEarningsMinor = jobProjects
    .filter((p) => ['COMPLETED', 'PAID'].includes((p.status || '').toUpperCase()))
    .reduce((sum, p) => sum + Number(p.budget_minor || 0), 0);
  const totalEarningsMinor = bookingEarningsMinor + jobEarningsMinor;

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="mb-6 h-9 w-64" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="My projects"
        description="Manage your projects and track earnings."
        actions={
          <>
            <Button variant="outline" onClick={() => { fetchBookings(); refetchJobProjects(); }}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <Link href="/freelancer/add-service">
              <Button>
                <Plus className="size-4" />
                Post new service
              </Button>
            </Link>
          </>
        }
      />

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total projects" value={totalProjects.toString()} icon={Activity} />
        <StatCard label="Active projects" value={activeProjects.toString()} icon={Clock} />
        <StatCard label="Completed" value={completedProjects.toString()} icon={CheckCircle} />
        <StatCard label="Total earnings" value={formatMoney(totalEarningsMinor)} icon={Wallet} />
      </div>

      <div className="mt-8 mb-4 flex gap-2">
        {['', 'Active', 'Completed', 'Pending'].map((s) => (
          <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(s)}>
            {s || 'All'}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent projects</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 && jobProjects.length === 0 ? (
            <EmptyState
              title="No projects yet"
              description="Post a service or apply to jobs to land your first project."
              action={<Link href="/freelancer/add-service"><Button>Post your first service</Button></Link>}
            />
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div key={booking.booking_id} className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft font-semibold text-primary-hover">
                      {booking.service_title?.charAt(0) || 'P'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-medium text-foreground">{booking.service_title}</h3>
                      <p className="truncate text-sm text-muted-foreground">Client: {(booking as any).client_name || booking.client_id}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <StatusBadge status={booking.status} />
                    <span className="font-medium text-foreground">{formatMoney(booking.total_minor)}</span>
                    <Button size="sm" variant="outline" onClick={() => router.push(`/freelancer/project-details/${booking.booking_id}`)}>
                      View
                    </Button>
                  </div>
                </div>
              ))}
              {jobProjects.map((project) => {
                const statusKey = (project.status || '').toUpperCase()
                return (
                  <div key={project.id} className="flex items-center justify-between gap-4 rounded-xl border border-border border-l-4 border-l-primary p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft font-semibold text-primary-hover">
                        {project.title?.charAt(0) || 'J'}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-medium text-foreground">{project.title}</h3>
                        <p className="truncate text-sm text-muted-foreground">Client: {project.client_name || project.clientId}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                      <StatusBadge status={JOB_STATUS_LABEL[statusKey] || project.status} />
                      <span className="font-medium text-foreground">{formatMoney(project.budget_minor, project.currency)}</span>
                      <Button size="sm" variant="outline" onClick={() => router.push(`/freelancer/project-details/job_${project.id}`)}>
                        View
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
