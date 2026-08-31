"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserContext } from '@/contexts/UserContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';
import { User, Award, DollarSign, Link as LinkIcon, FileText, Camera, ArrowRight } from 'lucide-react';

export default function ExpertRegistration() {
    const router = useRouter();
    const { profile, refreshProfile } = useUserContext();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        expertise: '',
        session_amount_icp: '',
        calendly_link: '',
        description: '',
        picture_url: ''
    });

    useEffect(() => {
        const fetchExpertProfile = async () => {
            try {
                const response = await fetch('/api/expert/register');
                const data = await response.json();
                if (data.success && data.expert) {
                    setFormData({
                        name: data.expert.name || '',
                        expertise: data.expert.expertise || '',
                        session_amount_icp: data.expert.session_amount_icp?.toString() || '',
                        calendly_link: data.expert.calendly_link || '',
                        description: data.expert.description || '',
                        picture_url: data.expert.picture_url || ''
                    });
                } else {
                    // Prefill with user profile data if available
                    setFormData(prev => ({
                        ...prev,
                        name: `${profile.firstName} ${profile.lastName}`.trim(),
                        picture_url: profile.profileImage || ''
                    }));
                }
            } catch (error) {
                console.error('Error fetching expert profile:', error);
            } finally {
                setFetching(false);
            }
        };

        fetchExpertProfile();
    }, [profile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/expert/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Expert profile updated successfully!');
                await refreshProfile();
                router.push('/expert/dashboard');
            } else {
                toast.error(data.error || 'Failed to update profile');
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
                    <p className="text-gray-600 text-lg">Share your knowledge and earn ICP by helping others.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Expert Profile Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="flex flex-col items-center mb-6">
                                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-purple-100 mb-4">
                                    {formData.picture_url ? (
                                        <img src={formData.picture_url} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-full h-full p-4 text-gray-400" />
                                    )}
                                </div>
                                <p className="text-sm text-gray-500">Profile picture synced from settings</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <User size={16} className="text-purple-600" />
                                        Full Name
                                    </label>
                                    <Input
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="e.g. John Doe"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Award size={16} className="text-purple-600" />
                                        Primary Expertise
                                    </label>
                                    <Input
                                        name="expertise"
                                        value={formData.expertise}
                                        onChange={handleChange}
                                        placeholder="e.g. Blockchain Development"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <DollarSign size={16} className="text-purple-600" />
                                        Session Amount (ICP)
                                    </label>
                                    <Input
                                        name="session_amount_icp"
                                        type="number"
                                        step="0.01"
                                        value={formData.session_amount_icp}
                                        onChange={handleChange}
                                        placeholder="e.g. 5.00"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <LinkIcon size={16} className="text-purple-600" />
                                        Calendly Link
                                    </label>
                                    <Input
                                        name="calendly_link"
                                        value={formData.calendly_link}
                                        onChange={handleChange}
                                        placeholder="calendly.com/your-url"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <FileText size={16} className="text-purple-600" />
                                    Profile Description
                                </label>
                                <Textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    className="h-32"
                                    placeholder="Tell users why they should book a session with you..."
                                />
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
