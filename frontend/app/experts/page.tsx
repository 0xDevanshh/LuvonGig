"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Star, Clock, ArrowRight, User } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { Header1 } from '@/components/Header1';

export default function ExpertsMarketplace() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [experts, setExperts] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchExperts = async () => {
            try {
                const response = await fetch('/api/expert/list');
                const data = await response.json();
                if (data.success) {
                    setExperts(data.experts);
                } else {
                    toast.error('Failed to load experts');
                }
            } catch (error) {
                console.error('Error fetching experts:', error);
                toast.error('Connection error');
            } finally {
                setLoading(false);
            }
        };

        fetchExperts();
    }, []);

    const filteredExperts = experts.filter(expert =>
        expert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expert.expertise.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="py-12 px-8">
            <div className="max-w-7xl">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
                            Find the Perfect <span className="text-purple-600">Expert</span>
                        </h1>
                        <p className="text-lg text-gray-400 max-w-2xl">
                            Book 1:1 sessions with industry leaders and specialists. Get the guidance you need to succeed.
                        </p>
                    </div>
                    <Button
                        onClick={() => router.push('/expert/register')}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 rounded-2xl shadow-lg shadow-purple-100 font-bold text-lg"
                    >
                        Become an Expert
                    </Button>
                </div>

                {/* Search Bar */}
                <div className="max-w-2xl mx-auto mb-16 relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="text-gray-400" size={20} />
                    </div>
                    <Input
                        className="pl-12 py-7 text-lg shadow-xl border-0 ring-1 ring-gray-200 focus:ring-2 focus:ring-purple-500 rounded-2xl"
                        placeholder="Search by name, expertise, or industry..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    </div>
                ) : filteredExperts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredExperts.map((expert) => (
                            <Card key={expert.id} className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white overflow-hidden rounded-3xl">
                                <div className="relative h-48 bg-gradient-to-br from-purple-100 to-blue-50">
                                    <div className="absolute bottom-0 left-6 translate-y-1/2">
                                        <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white bg-white shadow-lg">
                                            {expert.picture_url ? (
                                                <img src={expert.picture_url} alt={expert.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                    <User className="text-gray-300" size={32} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <CardContent className="pt-14 p-6">
                                    <div className="mb-4">
                                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                                            {expert.name}
                                        </h3>
                                        <p className="text-sm font-medium text-purple-600 bg-purple-50 inline-block px-3 py-1 rounded-full mt-2">
                                            {expert.expertise}
                                        </p>
                                    </div>

                                    <p className="text-gray-500 text-sm line-clamp-2 mb-6">
                                        {expert.description || "Top-rated expert providing specialized sessions and guidance."}
                                    </p>

                                    <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Session Rate</p>
                                            <p className="text-lg font-bold text-gray-900">{parseFloat(expert.session_amount_icp).toFixed(2)} ICP</p>
                                        </div>
                                        <Button
                                            className="bg-gray-900 hover:bg-purple-600 text-white rounded-xl px-6 group"
                                            onClick={() => router.push(`/expert/${expert.id}`)}
                                        >
                                            Book Now
                                            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={16} />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-dashed border-gray-200">
                        <User className="mx-auto text-gray-200 mb-4" size={64} />
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">No Experts Found</h3>
                        <p className="text-gray-500">Try adjusting your search query to find more results.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
