"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';
import { Award, DollarSign, FileText, ArrowRight, Landmark } from 'lucide-react';
import { toMajorUnits, toMinorUnits } from '@/lib/currency';

export default function ExpertRegistration() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [formData, setFormData] = useState({
        headline: '',
        expertise: '',
        hourlyRate: '',
        bio: '',
    });

    useEffect(() => {
        const fetchExpertProfile = async () => {
            try {
                const response = await fetch('/api/experts/me');
                const data = await response.json();
                if (data.success && data.data) {
                    setFormData({
                        headline: data.data.headline || '',
                        expertise: (data.data.expertise || []).join(', '),
                        hourlyRate: data.data.hourly_rate_minor
                            ? toMajorUnits(data.data.hourly_rate_minor, data.data.currency).toString()
                            : '',
                        bio: data.data.bio || '',
                    });
                }
            } catch (error) {
                console.error('Error fetching expert profile:', error);
            } finally {
                setFetching(false);
            }
        };

        fetchExpertProfile();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/experts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    headline: formData.headline,
                    bio: formData.bio,
                    expertise: formData.expertise.split(',').map((s) => s.trim()).filter(Boolean),
                    hourly_rate_minor: toMinorUnits(formData.hourlyRate),
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Expert profile saved!');
                router.push('/expert/dashboard');
            } else {
                toast.error(data.error || 'Failed to save profile');
            }
        } catch (error) {
            console.error('Registration error:', error);
            toast.error('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="p-8 pb-20">
            <div className="max-w-4xl mx-auto">
                <div className="mb-12 text-center relative">
                    <Button
                        variant="ghost"
                        className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-600 flex items-center gap-2"
                        onClick={() => router.push('/experts')}
                    >
                        <ArrowRight className="rotate-180" size={18} />
                        Browse Experts
                    </Button>
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Become an Expert</h1>
                    <p className="text-gray-600 text-lg">Share your knowledge and get paid for 1:1 sessions.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Expert Profile Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <p className="text-sm text-gray-500 -mt-2">
                                Your name and photo come from your account profile.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Award size={16} className="text-purple-600" />
                                        Headline
                                    </label>
                                    <Input
                                        name="headline"
                                        value={formData.headline}
                                        onChange={handleChange}
                                        placeholder="e.g. Senior Growth Strategist"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <DollarSign size={16} className="text-purple-600" />
                                        Hourly Rate (USD)
                                    </label>
                                    <Input
                                        name="hourlyRate"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.hourlyRate}
                                        onChange={handleChange}
                                        placeholder="e.g. 100.00"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Award size={16} className="text-purple-600" />
                                    Areas of Expertise
                                </label>
                                <Input
                                    name="expertise"
                                    value={formData.expertise}
                                    onChange={handleChange}
                                    placeholder="e.g. Growth Marketing, SEO, Paid Ads (comma separated)"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <FileText size={16} className="text-purple-600" />
                                    Profile Description
                                </label>
                                <Textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    className="h-32"
                                    placeholder="Tell users why they should book a session with you..."
                                />
                            </div>

                            <div className="rounded-xl border border-dashed border-gray-200 p-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Landmark size={18} className="text-purple-600 shrink-0" />
                                    <span>Set up payouts so you can get paid for booked sessions.</span>
                                </div>
                                <Button asChild variant="outline" type="button">
                                    <Link href="/freelancer/settings/payouts">Set up payouts</Link>
                                </Button>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg"
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : 'Save Expert Profile'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
