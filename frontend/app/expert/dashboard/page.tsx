"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserContext } from '@/contexts/UserContext';
import {
    Users,
    Calendar,
    DollarSign,
    TrendingUp,
    ExternalLink,
    Plus,
    Settings,
    UserCheck,
    Star,
    ArrowRight,
    Search,
    Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ExpertDashboard() {
    const router = useRouter();
    const { profile } = useUserContext();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [myBookings, setMyBookings] = useState<any[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch Expert Stats
                const statsRes = await fetch('/api/expert/dashboard/stats');
                const statsResult = await statsRes.json();
                if (statsResult.success) {
                    setData(statsResult);
                }

                // Fetch User's own bookings
                const bookingsRes = await fetch('/api/expert/my-bookings');
                const bookingsResult = await bookingsRes.json();
                if (bookingsResult.success) {
                    setMyBookings(bookingsResult.bookings);
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    const stats = data?.stats || { bookingCount: 0, customerCount: 0, recentCustomers: [] };
    const expert = data?.expert;

    return (
        <div className="p-8 space-y-10">
            {/* Header / Intro */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Expert Dashboard</h1>
                    <p className="text-gray-500 mt-1 text-lg">Manage your expert sessions and view your booking history.</p>
                </div>
            </div>

            {/* Expert Status / Call to Action */}
            {!expert ? (
                <Card className="border-dashed border-2 bg-gradient-to-br from-purple-50 to-white overflow-hidden rounded-3xl">
                    <CardContent className="p-10 flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-purple-100 rounded-3xl flex items-center justify-center mb-6">
                            <Star className="text-purple-600 w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Want to see your Expert Stats?</h2>
                        <p className="text-gray-600 max-w-lg mb-8 leading-relaxed">
                            It looks like you haven't registered as an expert yet. Share your knowledge, help others, and earn ICP by setting up your expert profile.
                        </p>
                        <Button
                            onClick={() => router.push('/expert/register')}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 rounded-2xl font-bold text-lg shadow-xl shadow-purple-100 transition-all hover:-translate-y-1"
                        >
                            Become an Expert Now
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Real Expert Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-white border-0 shadow-sm rounded-3xl border border-gray-100">
                            <CardContent className="p-8">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
                                        <Calendar size={24} />
                                    </div>
                                    <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full uppercase">Sold</span>
                                </div>
                                <h3 className="text-sm font-semibold text-gray-400 mb-1 uppercase tracking-wider">Total Bookings</h3>
                                <p className="text-4xl font-black text-gray-900">{stats.bookingCount}</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-white border-0 shadow-sm rounded-3xl border border-gray-100">
                            <CardContent className="p-8">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                                        <Users size={24} />
                                    </div>
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">Reach</span>
                                </div>
                                <h3 className="text-sm font-semibold text-gray-400 mb-1 uppercase tracking-wider">Total Customers</h3>
                                <p className="text-4xl font-black text-gray-900">{stats.customerCount}</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white border-0 shadow-xl rounded-3xl">
                            <CardContent className="p-8">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-white/10 rounded-2xl text-purple-400">
                                        <DollarSign size={24} />
                                    </div>
                                    <span className="text-xs font-bold text-purple-400 bg-white/5 px-3 py-1 rounded-full uppercase">Earnings</span>
                                </div>
                                <h3 className="text-sm font-semibold text-gray-400 mb-1 uppercase tracking-wider">Total ICP Earned</h3>
                                <p className="text-4xl font-black">{(stats.bookingCount * (expert?.session_amount_icp || 0)).toFixed(2)}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Recent Sales Table */}
                        <div className="lg:col-span-8">
                            <Card className="rounded-3xl border-gray-100 shadow-sm overflow-hidden">
                                <CardHeader className="bg-gray-50/50 px-8 py-6 border-b border-gray-100">
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <UserCheck size={20} className="text-purple-600" />
                                        Your Sales (Recent Customers)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {stats.recentCustomers.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="bg-gray-50/30 text-left text-xs text-gray-400 uppercase font-black">
                                                        <th className="px-8 py-4">Customer</th>
                                                        <th className="px-8 py-4">Amount</th>
                                                        <th className="px-8 py-4">Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {stats.recentCustomers.map((c: any, i: number) => (
                                                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="px-8 py-5 font-bold text-gray-900">{c.client_email}</td>
                                                            <td className="px-8 py-5 text-purple-600 font-black">{parseFloat(c.amount_icp).toFixed(2)} ICP</td>
                                                            <td className="px-8 py-5 text-gray-400 text-sm">{new Date(c.created_at).toLocaleDateString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-20">
                                            <Users className="mx-auto text-gray-200 mb-4" size={48} />
                                            <p className="text-gray-400 font-medium">No sales yet. Start sharing your profile!</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Profile Actions */}
                        <div className="lg:col-span-4 space-y-6">
                            <Card className="rounded-3xl border-gray-100 shadow-sm overflow-hidden">
                                <CardHeader className="px-6 py-5 border-b border-gray-50">
                                    <CardTitle className="text-lg">Expert Profile</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center overflow-hidden">
                                                {expert.picture_url ? <img src={expert.picture_url} className="w-full h-full object-cover" /> : <Star className="text-purple-600" />}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900">{expert.name}</h4>
                                                <p className="text-sm text-purple-600 font-medium">{expert.expertise}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Button
                                                variant="outline"
                                                className="w-full justify-between rounded-xl hover:bg-gray-50 group"
                                                onClick={() => router.push('/expert/register')}
                                            >
                                                <span className="flex items-center gap-2 font-semibold"><Settings size={18} /> Update Settings</span>
                                                <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-between rounded-xl hover:bg-gray-50 group"
                                                onClick={() => window.open(expert.calendly_link, '_blank')}
                                            >
                                                <span className="flex items-center gap-2 font-semibold"><ExternalLink size={18} /> Calendly Page</span>
                                                <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </>
            )}

            {/* "My Booked Sessions" - Visible to everyone */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                        <Clock size={20} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">My Purchased Sessions</h2>
                </div>

                <Card className="rounded-3xl border-gray-100 shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                        {myBookings.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50/30 text-left text-xs text-gray-400 uppercase font-black">
                                            <th className="px-8 py-4">Expert</th>
                                            <th className="px-8 py-4">Topic</th>
                                            <th className="px-8 py-4">Status</th>
                                            <th className="px-8 py-4">Amount</th>
                                            <th className="px-8 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {myBookings.map((b: any, i: number) => (
                                            <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
                                                            {b.expert_picture ? <img src={b.expert_picture} className="w-full h-full object-cover" /> : <UserCheck size={20} className="text-gray-400" />}
                                                        </div>
                                                        <span className="font-bold text-gray-900">{b.expert_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5"><span className="text-sm font-medium text-gray-600">{b.expert_expertise}</span></td>
                                                <td className="px-8 py-5">
                                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tighter">Confirmed</span>
                                                </td>
                                                <td className="px-8 py-5 text-gray-900 font-bold">{parseFloat(b.amount_icp).toFixed(2)} ICP</td>
                                                <td className="px-8 py-5 text-right">
                                                    <Button variant="ghost" size="sm" className="text-purple-600 hover:bg-purple-50 rounded-xl">
                                                        Check Email
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <Search className="mx-auto text-gray-200 mb-4" size={48} />
                                <p className="text-gray-400 font-medium mb-6">You haven't booked any expert sessions yet.</p>
                                <Button
                                    onClick={() => router.push('/experts')}
                                    className="bg-gray-900 text-white hover:bg-gray-800 rounded-xl px-6"
                                >
                                    Browse Experts
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
