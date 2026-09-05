'use client'
import React, { useState, useEffect, useRef } from 'react'
import { Award, Edit3, Camera, Save, X, AlertCircle, CheckCircle } from 'lucide-react'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useUserContext } from '@/contexts/UserContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

export default function FreelancerProfilePage() {
    const { profile, isLoading: profileLoading } = useUserProfile()
    const { refreshProfile } = useUserContext()
    const [isEditing, setIsEditing] = useState(false)
    const [saveLoading, setSaveLoading] = useState(false)
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    const [profileData, setProfileData] = useState({
        fullName: '',
        email: '',
        phone: '',
        location: '',
        bio: '',
        skills: [] as string[],
        github: '',
        linkedin: '',
        profileImage: '',
    })

    const [editData, setEditData] = useState(profileData)
    const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
    const [uploadingImage, setUploadingImage] = useState(false)
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const [hackathonStats, setHackathonStats] = useState({
        totalParticipations: 0,
        teamsCreated: 0,
        prizesWon: 0,
        successRate: '0%',
        achievements: [] as Array<{ hackathonId: string; hackathonTitle: string; rewardTitle: string; rank: number }>,
    })
    const [statsLoading, setStatsLoading] = useState(true)

    useEffect(() => {
        if (profile.isLoaded && !profileLoading) {
            const newProfileData = {
                fullName: `${profile.firstName} ${profile.lastName}`.trim(),
                email: profile.email || '',
                phone: profile.phone || '',
                location: profile.location || '',
                bio: profile.bio || '',
                skills: profile.skills || [],
                github: profile.github || '',
                linkedin: profile.linkedin || '',
                profileImage: profile.profileImage || '',
            }
            setProfileData(newProfileData)
            setEditData(newProfileData)
            setProfileImagePreview(null)
        }
    }, [profile, profileLoading])

    useEffect(() => {
        const loadHackathonStats = async () => {
            if (!profile.email) return;

            try {
                setStatsLoading(true);
                const response = await fetch(`/api/hackquest/user-stats?email=${encodeURIComponent(profile.email)}`);
                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        setHackathonStats(result.data);
                    }
                }
            } catch (error) {
                console.error('Error loading hackathon stats:', error);
            } finally {
                setStatsLoading(false);
            }
        };

        if (profile.isLoaded && profile.email) {
            loadHackathonStats();
        }
    }, [profile.email, profile.isLoaded])

    const handleSave = async () => {
        setSaveLoading(true)
        setSaveMessage(null)

        try {
            const nameParts = editData.fullName.trim().split(' ')
            const firstName = nameParts[0] || ''
            const lastName = nameParts.slice(1).join(' ') || ''

            const profileUpdateData = {
                firstName,
                lastName,
                email: editData.email,
                phone: editData.phone,
                location: editData.location,
                bio: editData.bio,
                github: editData.github,
                linkedin: editData.linkedin,
                skills: editData.skills,
                profileImageUrl: editData.profileImage || undefined,
            }

            const response = await fetch('/api/profile/complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(profileUpdateData),
            })

            const result = await response.json()

            if (result.success) {
                setProfileData(editData)
                setProfileImagePreview(null)
                setIsEditing(false)
                setSaveMessage({
                    type: 'success',
                    text: result.message || 'Profile updated successfully!'
                })
                await refreshProfile()
            } else {
                setSaveMessage({
                    type: 'error',
                    text: result.error || 'Failed to update profile. Please try again.'
                })
            }
        } catch (error) {
            console.error('Error saving profile:', error)
            setSaveMessage({
                type: 'error',
                text: 'An unexpected error occurred. Please try again.'
            })
        } finally {
            setSaveLoading(false)
            setTimeout(() => setSaveMessage(null), 5000)
        }
    }

    const handleCancel = () => {
        setEditData(profileData)
        setProfileImagePreview(null)
        setIsEditing(false)
    }

    const addSkill = (skill: string) => {
        if (skill && !editData.skills.includes(skill)) {
            setEditData({ ...editData, skills: [...editData.skills, skill] })
        }
    }

    const removeSkill = (skillToRemove: string) => {
        setEditData({ ...editData, skills: editData.skills.filter((skill) => skill !== skillToRemove) })
    }

    if (profileLoading) {
        return (
            <div className="mx-auto max-w-4xl space-y-6 p-6 md:p-8">
                <Skeleton className="h-64" />
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6 p-6 md:p-8">
            <PageHeader title="Profile" description="Manage how clients see you across LuvonGig." />

            {saveMessage && (
                <div
                    className={`flex items-center gap-3 rounded-lg border p-4 text-sm ${saveMessage.type === 'success'
                        ? 'border-success/20 bg-success/10 text-success'
                        : 'border-destructive/20 bg-destructive/10 text-destructive'
                        }`}
                >
                    {saveMessage.type === 'success' ? (
                        <CheckCircle className="size-5 shrink-0" />
                    ) : (
                        <AlertCircle className="size-5 shrink-0" />
                    )}
                    <span>{saveMessage.text}</span>
                </div>
            )}

            <Card className="p-6">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="font-heading text-h2 font-semibold text-foreground">Freelancer profile</h2>
                    <Button variant={isEditing ? 'outline' : 'default'} onClick={() => setIsEditing(!isEditing)}>
                        {isEditing ? (
                            <>
                                <X className="size-4" />
                                Cancel
                            </>
                        ) : (
                            <>
                                <Edit3 className="size-4" />
                                Edit profile
                            </>
                        )}
                    </Button>
                </div>

                <div className="mb-6 flex items-center gap-6">
                    <div className="relative">
                        <Avatar className="size-24 border-4 border-background shadow-sm">
                            <AvatarImage
                                src={profileImagePreview || (isEditing ? editData.profileImage : profileData.profileImage)}
                                alt={profileData.fullName || 'Profile'}
                            />
                            <AvatarFallback className="bg-primary-soft text-2xl font-semibold text-primary-hover">
                                {(profileData.fullName || profile.email || 'F').charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        {isEditing && (
                            <>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (event) => {
                                        const file = event.target.files?.[0]
                                        if (!file) return

                                        if (file.size > 5 * 1024 * 1024) {
                                            setSaveMessage({ type: 'error', text: 'File too large. Maximum size is 5MB.' })
                                            return
                                        }

                                        const reader = new FileReader()
                                        reader.onloadend = () => {
                                            setProfileImagePreview(reader.result as string)
                                        }
                                        reader.readAsDataURL(file)

                                        setUploadingImage(true)
                                        setSaveMessage(null)
                                        try {
                                            const formData = new FormData()
                                            formData.append('file', file)

                                            const uploadResponse = await fetch('/api/upload/profile-image', {
                                                method: 'POST',
                                                body: formData,
                                            })

                                            const uploadResult = await uploadResponse.json()
                                            if (!uploadResult.success || !uploadResult.fileUrl) {
                                                throw new Error(uploadResult.error || 'Failed to upload image')
                                            }

                                            setEditData((prev) => ({ ...prev, profileImage: uploadResult.fileUrl }))
                                            setSaveMessage({ type: 'success', text: 'Profile photo uploaded. Click save to apply.' })
                                        } catch (uploadError: any) {
                                            console.error('Profile image upload error:', uploadError)
                                            setSaveMessage({ type: 'error', text: uploadError?.message || 'Failed to upload profile image.' })
                                            setProfileImagePreview(null)
                                        } finally {
                                            setUploadingImage(false)
                                            if (event.target) event.target.value = ''
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    size="icon-sm"
                                    className="absolute bottom-0 right-0 rounded-full"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploadingImage}
                                >
                                    {uploadingImage ? (
                                        <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    ) : (
                                        <Camera className="size-4" />
                                    )}
                                </Button>
                            </>
                        )}
                    </div>
                    <div>
                        <h3 className="font-heading text-h3 font-semibold text-foreground">{profileData.fullName}</h3>
                        <p className="font-medium capitalize text-muted-foreground">{profile.designation || 'Freelancer'}</p>
                        <p className="text-sm text-muted-foreground">{profile.email}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                        <h4 className="border-b border-border pb-2 font-medium text-foreground">Personal information</h4>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="fullName">Full name</Label>
                            <Input
                                id="fullName"
                                value={isEditing ? editData.fullName : profileData.fullName}
                                onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                                disabled={!isEditing}
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={profileData.email} disabled />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={isEditing ? editData.phone : profileData.phone}
                                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                disabled={!isEditing}
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                value={isEditing ? editData.location : profileData.location}
                                onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                                disabled={!isEditing}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="border-b border-border pb-2 font-medium text-foreground">Professional details</h4>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="bio">Professional bio</Label>
                            <Textarea
                                id="bio"
                                value={isEditing ? editData.bio : profileData.bio}
                                onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                                disabled={!isEditing}
                                rows={4}
                                placeholder="Describe your skills and experience..."
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label>Skills</Label>
                            <div className="flex flex-wrap gap-2">
                                {(isEditing ? editData.skills : profileData.skills).map((skill) => (
                                    <Badge key={skill} variant="secondary" className="gap-1">
                                        {skill}
                                        {isEditing && (
                                            <button onClick={() => removeSkill(skill)} aria-label={`Remove ${skill}`}>
                                                <X className="size-3" />
                                            </button>
                                        )}
                                    </Badge>
                                ))}
                                {isEditing && (
                                    <button
                                        onClick={() => {
                                            const newSkill = prompt('Add a new skill:');
                                            if (newSkill) addSkill(newSkill);
                                        }}
                                        className="rounded-full border border-dashed border-primary/40 px-3 py-1 text-sm text-primary transition-colors hover:border-primary"
                                    >
                                        + Add
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="github">GitHub profile</Label>
                            <Input
                                id="github"
                                value={isEditing ? editData.github : profileData.github}
                                onChange={(e) => setEditData({ ...editData, github: e.target.value })}
                                disabled={!isEditing}
                                placeholder="github.com/username"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="linkedin">LinkedIn profile</Label>
                            <Input
                                id="linkedin"
                                value={isEditing ? editData.linkedin : profileData.linkedin}
                                onChange={(e) => setEditData({ ...editData, linkedin: e.target.value })}
                                disabled={!isEditing}
                                placeholder="linkedin.com/in/username"
                            />
                        </div>
                    </div>
                </div>

                {isEditing && (
                    <div className="mt-6 flex justify-end gap-3 border-t border-border pt-6">
                        <Button variant="outline" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={saveLoading}>
                            {saveLoading ? (
                                <>
                                    <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="size-4" />
                                    Save changes
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </Card>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Card className="p-6">
                    <h3 className="mb-4 flex items-center gap-2 font-heading text-h3 font-semibold text-foreground">
                        <Award className="size-5 text-primary" />
                        Hackathon activity
                    </h3>
                    {statsLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-4 w-full" />)}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between border-b border-border pb-2">
                                <span className="text-muted-foreground">Total participations</span>
                                <span className="font-semibold text-foreground">{hackathonStats.totalParticipations}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-border pb-2">
                                <span className="text-muted-foreground">Teams formed</span>
                                <span className="font-semibold text-foreground">{hackathonStats.teamsCreated}</span>
                            </div>
                            <div className="flex items-center justify-between border-b border-border pb-2">
                                <span className="text-muted-foreground">Prizes secured</span>
                                <span className="font-semibold text-success">{hackathonStats.prizesWon}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Success rate</span>
                                <span className="font-semibold text-primary">{hackathonStats.successRate}</span>
                            </div>
                        </div>
                    )}
                </Card>

                <Card className="p-6">
                    <h3 className="mb-4 font-heading text-h3 font-semibold text-foreground">Milestones &amp; awards</h3>
                    {statsLoading ? (
                        <div className="space-y-3">
                            {[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
                        </div>
                    ) : hackathonStats.achievements && hackathonStats.achievements.length > 0 ? (
                        <div className="max-h-[220px] space-y-3 overflow-y-auto pr-1">
                            {hackathonStats.achievements.map((achievement, index) => (
                                <div
                                    key={`${achievement.hackathonId}-${index}`}
                                    className="flex items-start gap-3 rounded-xl border border-border bg-primary-soft p-4"
                                >
                                    <div className="shrink-0 rounded-lg bg-surface p-2 shadow-xs">
                                        <Award className="size-5 text-primary-hover" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-foreground">{achievement.hackathonTitle}</p>
                                        <div className="mt-1 flex items-center gap-2">
                                            <Badge variant="secondary">Rank #{achievement.rank}</Badge>
                                            <span className="text-xs text-muted-foreground">{achievement.rewardTitle}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-border py-10 text-center">
                            <Award className="mx-auto mb-3 size-10 text-muted-foreground" />
                            <p className="font-medium text-foreground">No milestones yet</p>
                            <p className="mt-1 px-6 text-xs text-muted-foreground">
                                Join hackathons and collaborate with teams to earn recognition.
                            </p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    )
}
