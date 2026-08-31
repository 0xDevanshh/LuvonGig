'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { HttpAgent, Actor } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { Loader2, Plus, Trash2, CheckCircle2, AlertTriangle, ArrowLeft, Save, Image, Upload, Users, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getPrincipalFromEmail } from '@/lib/principal-utils';

const CANISTER_ID = process.env.NEXT_PUBLIC_HACKATHON_CANISTER_ID ?? '';
const IC_HOST = process.env.NEXT_PUBLIC_IC_HOST ?? '';

const hackquestIdl = ({ IDL }: typeof import('@dfinity/candid')) => {
  const HackathonStatus = IDL.Variant({
    Draft: IDL.Null,
    Upcoming: IDL.Null,
    Ongoing: IDL.Null,
    Judging: IDL.Null,
    Completed: IDL.Null,
    Cancelled: IDL.Null,
  });

  const CategoryInput = IDL.Record({
    name: IDL.Text,
    description: IDL.Text,
    rewardSlots: IDL.Nat,
    judgingCriteria: IDL.Vec(IDL.Text),
  });

  const RewardInput = IDL.Record({
    title: IDL.Text,
    description: IDL.Text,
    amount: IDL.Nat64,
    rank: IDL.Nat,
    categoryName: IDL.Opt(IDL.Text),
    perks: IDL.Vec(IDL.Text),
  });

  const Hackathon = IDL.Record({
    id: IDL.Text,
    organizer: IDL.Principal,
    title: IDL.Text,
    tagline: IDL.Text,
    summary: IDL.Text,
    bannerUrl: IDL.Text,
    heroVideoUrl: IDL.Text,
    location: IDL.Text,
    theme: IDL.Text,
    prizePool: IDL.Nat64,
    faq: IDL.Vec(IDL.Text),
    resources: IDL.Vec(IDL.Text),
    minTeamSize: IDL.Nat,
    maxTeamSize: IDL.Nat,
    maxTeamsPerCategory: IDL.Nat,
    submissionsOpenAt: IDL.Int,
    submissionsCloseAt: IDL.Int,
    startAt: IDL.Int,
    endAt: IDL.Int,
    createdAt: IDL.Int,
    status: HackathonStatus,
    categories: IDL.Vec(IDL.Text),
    rewards: IDL.Vec(IDL.Text),
  });

  const HackQuestError = IDL.Variant({
    NotFound: IDL.Text,
    ValidationError: IDL.Text,
    InvalidState: IDL.Text,
    NotAuthorized: IDL.Null,
  });

  const CreateHackathonRequest = IDL.Record({
    title: IDL.Text,
    tagline: IDL.Text,
    summary: IDL.Text,
    bannerUrl: IDL.Text,
    heroVideoUrl: IDL.Text,
    location: IDL.Text,
    theme: IDL.Text,
    prizePool: IDL.Nat64,
    faq: IDL.Vec(IDL.Text),
    resources: IDL.Vec(IDL.Text),
    minTeamSize: IDL.Nat,
    maxTeamSize: IDL.Nat,
    maxTeamsPerCategory: IDL.Nat,
    submissionsOpenAt: IDL.Int,
    submissionsCloseAt: IDL.Int,
    startAt: IDL.Int,
    endAt: IDL.Int,
    categories: IDL.Vec(CategoryInput),
    rewards: IDL.Vec(RewardInput),
  });

  return IDL.Service({
    createHackathon: IDL.Func(
      [CreateHackathonRequest, IDL.Principal],
      [IDL.Variant({ ok: Hackathon, err: HackQuestError })],
      []
    ),
    updateHackathon: IDL.Func(
      [IDL.Text, CreateHackathonRequest, IDL.Principal],
      [IDL.Variant({ ok: Hackathon, err: HackQuestError })],
      []
    ),
    getHackathonDetails: IDL.Func(
      [IDL.Text],
      [IDL.Opt(IDL.Record({
        hackathon: Hackathon,
        categories: IDL.Vec(IDL.Record({
          id: IDL.Text,
          hackathonId: IDL.Text,
          name: IDL.Text,
          description: IDL.Text,
          rewardSlots: IDL.Nat,
          judgingCriteria: IDL.Vec(IDL.Text),
        })),
        rewards: IDL.Vec(IDL.Record({
          id: IDL.Text,
          hackathonId: IDL.Text,
          title: IDL.Text,
          description: IDL.Text,
          amount: IDL.Nat64,
          rank: IDL.Nat,
          categoryId: IDL.Opt(IDL.Text),
          perks: IDL.Vec(IDL.Text),
          // Other fields omitted for simplicity in form hydration
        })),
      }))],
      ['query']
    ),
  });
};

const createHackquestActor = async () => {
  if (!CANISTER_ID) throw new Error('Canister ID not configured');
  const agent = new HttpAgent({ host: IC_HOST });
  if (IC_HOST.includes('127.0.0.1') || IC_HOST.includes('localhost')) {
    await agent.fetchRootKey();
  }
  return Actor.createActor(hackquestIdl as any, { agent, canisterId: CANISTER_ID });
};

const emptyCategory = { name: '', description: '', rewardSlots: 1, judgingCriteria: [''] };
const emptyReward = { title: '', description: '', amount: '', rank: 1, categoryName: '', perks: [''] };

const buildTimestamp = (value: string) => {
  if (!value) return BigInt(0);
  try {
    // value is YYYY-MM-DDTHH:mm from datetime-local input
    const [datePart, timePart] = value.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);
    
    // new Date(y, m-1, d, h, i) is ALWAYS local time
    const date = new Date(year, month - 1, day, hours, minutes);
    return BigInt(date.getTime()) * BigInt(1_000_000);
  } catch (e) {
    console.error('Error parsing date:', value, e);
    const millis = Date.parse(value);
    return isNaN(millis) ? BigInt(0) : BigInt(millis) * BigInt(1_000_000);
  }
};

const sanitizeTextArray = (items: string[]) => items.map(item => item.trim()).filter(Boolean);

interface HackathonFormProps {
  initialHackathonId?: string;
}

export const HackathonForm: React.FC<HackathonFormProps> = ({ initialHackathonId }) => {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userPrincipal, setUserPrincipal] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(initialHackathonId || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!initialHackathonId);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState({
    title: '',
    tagline: '',
    summary: '',
    bannerUrl: '',
    heroVideoUrl: '',
    location: '',
    theme: '',
    prizePool: '',
    minTeamSize: 1,
    maxTeamSize: 4,
    maxTeamsPerCategory: 20,
    submissionsOpenAt: '',
    submissionsCloseAt: '',
    startAt: '',
    endAt: '',
    faq: [''],
    resources: [''],
    categories: [emptyCategory],
    rewards: [emptyReward],
  });

  const hydrateForm = useCallback((data: any) => {
    const formatTS = (ts: any) => {
      if (!ts) return '';
      try {
        const millis = typeof ts === 'bigint' ? Number(ts / BigInt(1_000_000)) : Number(ts);
        if (isNaN(millis)) return '';
        
        const date = new Date(millis);
        // We need to return YYYY-MM-DDTHH:mm in LOCAL time
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      } catch (e) {
        console.error('Error formatting timestamp:', ts, e);
        return '';
      }
    };

    setForm({
      title: data.title || '',
      tagline: data.tagline || '',
      summary: data.summary || data.description || '',
      bannerUrl: data.bannerUrl || data.banner_image || '',
      heroVideoUrl: data.heroVideoUrl || '',
      location: data.location || '',
      theme: data.theme || '',
      prizePool: data.prizePool?.toString() || data.prize_pool?.toString() || '',
      minTeamSize: Number(data.minTeamSize || data.min_team_size || 1),
      maxTeamSize: Number(data.maxTeamSize || data.max_team_size || 4),
      maxTeamsPerCategory: Number(data.maxTeamsPerCategory || 20),
      submissionsOpenAt: formatTS(data.submissionsOpenAt || data.submission_start),
      submissionsCloseAt: formatTS(data.submissionsCloseAt || data.submission_end),
      startAt: formatTS(data.startAt || data.start_date),
      endAt: formatTS(data.endAt || data.end_date),
      faq: data.faq && data.faq.length ? data.faq : [''],
      resources: data.resources && data.resources.length ? data.resources : [''],
      categories: data.categories && data.categories.length 
        ? data.categories.map((c: any) => ({
            name: c.name || '',
            description: c.description || '',
            rewardSlots: Number(c.rewardSlots || 1),
            judgingCriteria: c.judgingCriteria && c.judgingCriteria.length ? c.judgingCriteria : ['']
          }))
        : [{ ...emptyCategory }],
      rewards: data.rewards && data.rewards.length
        ? data.rewards.map((r: any) => ({
            title: r.title || '',
            description: r.description || '',
            amount: r.amount?.toString() || '',
            rank: Number(r.rank || 1),
            categoryName: r.categoryName || '',
            perks: r.perks && r.perks.length ? r.perks : ['']
          }))
        : [{ ...emptyReward }],
    });
  }, []);

  const fetchHackathonForEdit = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const actor: any = await createHackquestActor();
      const result = await actor.getHackathonDetails(id);
      
      if (result && result[0]) {
        const details = result[0];
        hydrateForm({
          ...details.hackathon,
          categories: details.categories,
          rewards: details.rewards
        });
      } else {
        setStatusMessage({ type: 'error', text: 'Hackathon not found.' });
      }
    } catch (error) {
      console.error('Failed to fetch hackathon for edit', error);
      setStatusMessage({ type: 'error', text: 'Failed to load hackathon details.' });
    } finally {
      setIsLoading(false);
    }
  }, [hydrateForm]);

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.session?.email) {
            setUserEmail(data.session.email);
            try {
              const principal = getPrincipalFromEmail(data.session.email);
              setUserPrincipal(principal.toText());
            } catch (err) {
              console.error('Failed to generate principal:', err);
            }
          }
        }
      } catch (error) {
        console.error('Error getting user session:', error);
      }
    };
    getUserInfo();

    if (initialHackathonId) {
      fetchHackathonForEdit(initialHackathonId);
    }
  }, [initialHackathonId, fetchHackathonForEdit]);

  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const updateForm = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingBanner(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'hackathons');

      const response = await fetch('/api/upload/s3', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        updateForm('bannerUrl', data.url);
        setStatusMessage({ type: 'success', text: 'Banner uploaded successfully!' });
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Banner upload error:', error);
      setStatusMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to upload banner' });
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleArrayChange = (key: 'faq' | 'resources', index: number, value: string) => {
    const next = [...form[key]];
    next[index] = value;
    updateForm(key, next);
  };

  const updateCategory = (index: number, field: keyof typeof emptyCategory, value: any) => {
    const next = [...form.categories];
    next[index] = { ...next[index], [field]: value };
    updateForm('categories', next);
  };

  const updateCategoryCriteria = (catIndex: number, critIndex: number, value: string) => {
    const next = [...form.categories];
    const criteria = [...next[catIndex].judgingCriteria];
    criteria[critIndex] = value;
    next[catIndex].judgingCriteria = criteria;
    updateForm('categories', next);
  };

  const updateReward = (index: number, field: keyof typeof emptyReward, value: any) => {
    const next = [...form.rewards];
    next[index] = { ...next[index], [field]: value };
    updateForm('rewards', next);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      if (!form.title.trim() || !form.summary.trim()) throw new Error('Title and summary are required.');
      if (!userEmail || !userPrincipal) throw new Error('Please login to continue.');

      const now = new Date();
      const startDate = new Date(form.startAt);
      const endDate = new Date(form.endAt);
      const regOpenDate = new Date(form.submissionsOpenAt);
      const regCloseDate = new Date(form.submissionsCloseAt);

      if (startDate < now && !editId) {
        throw new Error('Start date cannot be in the past for new hackathons.');
      }
      if (endDate <= startDate) {
        throw new Error('End date must be after the start date.');
      }
      if (regCloseDate <= regOpenDate) {
        throw new Error('Registration close date must be after registration open date.');
      }

      const payload = {
        title: form.title.trim(),
        tagline: form.tagline.trim(),
        summary: form.summary.trim(),
        bannerUrl: form.bannerUrl.trim(),
        heroVideoUrl: form.heroVideoUrl.trim(),
        location: form.location.trim(),
        theme: form.theme.trim(),
        prizePool: BigInt(Math.max(Number(form.prizePool) || 0, 0)),
        faq: sanitizeTextArray(form.faq),
        resources: sanitizeTextArray(form.resources),
        minTeamSize: BigInt(Math.max(form.minTeamSize, 1)),
        maxTeamSize: BigInt(Math.max(form.maxTeamSize, form.minTeamSize)),
        maxTeamsPerCategory: BigInt(Math.max(form.maxTeamsPerCategory, 1)),
        submissionsOpenAt: buildTimestamp(form.submissionsOpenAt),
        submissionsCloseAt: buildTimestamp(form.submissionsCloseAt),
        startAt: buildTimestamp(form.startAt),
        endAt: buildTimestamp(form.endAt),
        categories: form.categories.map(category => ({
          name: category.name.trim(),
          description: category.description.trim(),
          rewardSlots: BigInt(Math.max(category.rewardSlots, 1)),
          judgingCriteria: sanitizeTextArray(category.judgingCriteria),
        })),
        rewards: form.rewards.map(reward => ({
          title: reward.title.trim(),
          description: reward.description.trim(),
          amount: BigInt(Math.max(Number(reward.amount) || 0, 0)),
          rank: BigInt(Math.max(reward.rank, 1)),
          categoryName: reward.categoryName.trim() ? [reward.categoryName.trim()] : [],
          perks: sanitizeTextArray(reward.perks),
        })),
      };

      const actor: any = await createHackquestActor();
      const organizerPrincipal = Principal.fromText(userPrincipal);
      
      let result;
      if (editId) {
        result = await actor.updateHackathon(editId, payload, organizerPrincipal);
      } else {
        result = await actor.createHackathon(payload, organizerPrincipal);
      }

      if ('ok' in result) {
        setStatusMessage({ type: 'success', text: editId ? 'Hackathon updated!' : 'Hackathon created!' });
        if (!editId) router.push('/client/hackathons');
      } else {
        throw new Error(Object.values(result.err)[0] as string);
      }
    } catch (error) {
      console.error('Failed to save hackathon', error);
      setStatusMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to save.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center p-20">
      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      <span className="ml-3">Loading hackathon data...</span>
    </div>
  );

  return (
    <div className="space-y-8">
      {statusMessage && (
        <div className={`p-4 rounded-md flex items-center gap-3 ${statusMessage.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'} border`}>
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          {statusMessage.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <h2 className="text-xl font-semibold">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-1 block">
              <span className="text-sm font-medium">Title *</span>
              <input type="text" value={form.title} onChange={e => updateForm('title', e.target.value)} className="w-full rounded-md border p-2" required />
            </label>
            <label className="space-y-1 block">
              <span className="text-sm font-medium">Tagline</span>
              <input type="text" value={form.tagline} onChange={e => updateForm('tagline', e.target.value)} className="w-full rounded-md border p-2" />
            </label>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium block">Hackathon Banner (Poster)</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Image className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Paste Image URL or upload →"
                      value={form.bannerUrl}
                      onChange={e => updateForm('bannerUrl', e.target.value)}
                      className="w-full pl-10 rounded-md border p-2 text-sm"
                    />
                  </div>
                  <label className="cursor-pointer bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 rounded-md px-4 py-2 flex items-center gap-2 transition-colors">
                    {isUploadingBanner ? (
                      <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    ) : (
                      <Upload className="w-4 h-4 text-gray-600" />
                    )}
                    <span className="text-sm font-medium text-gray-600">Upload</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      disabled={isUploadingBanner}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500">Recommended size: 1200x630px. Max 10MB.</p>
              </div>

              <div className="border rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden h-32 relative group">
                {form.bannerUrl ? (
                  <>
                    <img src={form.bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => updateForm('bannerUrl', '')}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <Image className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                    <span className="text-xs text-gray-400">No image selected</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Summary & Description */}
        <section className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-purple-600" />
            Project Details
          </h2>
          <label className="space-y-1 block">
            <span className="text-sm font-medium">Summary * (Short description for cards)</span>
            <textarea 
              value={form.summary} 
              onChange={e => updateForm('summary', e.target.value)} 
              className="w-full rounded-md border p-2 focus:ring-2 focus:ring-purple-500 outline-none transition-all" 
              placeholder="A brief overview of your hackathon..."
              rows={3} 
              required 
            />
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="space-y-1 block">
              <span className="text-sm font-medium">Location</span>
              <input type="text" value={form.location} onChange={e => updateForm('location', e.target.value)} className="w-full rounded-md border p-2 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="e.g. Global, Remote, or City name" />
            </label>
            <label className="space-y-1 block">
              <span className="text-sm font-medium">Theme / Industry</span>
              <input type="text" value={form.theme} onChange={e => updateForm('theme', e.target.value)} className="w-full rounded-md border p-2 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="e.g. DeFi, AI, Social Impact" />
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="space-y-1 block">
              <span className="text-sm font-medium">Total Prize Pool ($ or ICP)</span>
              <input type="text" value={form.prizePool} onChange={e => updateForm('prizePool', e.target.value)} className="w-full rounded-md border p-2 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="e.g. 50,000" />
            </label>
            <label className="space-y-1 block">
              <span className="text-sm font-medium">Promo Video URL (YouTube/Vimeo)</span>
              <input type="text" value={form.heroVideoUrl} onChange={e => updateForm('heroVideoUrl', e.target.value)} className="w-full rounded-md border p-2 focus:ring-2 focus:ring-purple-500 outline-none" placeholder="https://youtube.com/..." />
            </label>
          </div>
        </section>

        {/* Team Settings */}
        <section className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Team Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <label className="space-y-1 block">
              <span className="text-sm font-medium">Min Team Size</span>
              <input type="number" min={1} value={form.minTeamSize} onChange={e => updateForm('minTeamSize', parseInt(e.target.value))} className="w-full rounded-md border p-2 focus:ring-2 focus:ring-purple-500 outline-none" />
            </label>
            <label className="space-y-1 block">
              <span className="text-sm font-medium">Max Team Size</span>
              <input type="number" min={1} value={form.maxTeamSize} onChange={e => updateForm('maxTeamSize', parseInt(e.target.value))} className="w-full rounded-md border p-2 focus:ring-2 focus:ring-purple-500 outline-none" />
            </label>
            <label className="space-y-1 block">
              <span className="text-sm font-medium">Max Teams Per Category</span>
              <input type="number" min={1} value={form.maxTeamsPerCategory} onChange={e => updateForm('maxTeamsPerCategory', parseInt(e.target.value))} className="w-full rounded-md border p-2 focus:ring-2 focus:ring-purple-500 outline-none" />
            </label>
          </div>
        </section>

        {/* Timeline */}
        <section className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            Timeline
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="space-y-1 block"><span className="text-sm font-medium">Registration Opens</span><input type="datetime-local" value={form.submissionsOpenAt} onChange={e => updateForm('submissionsOpenAt', e.target.value)} className="w-full rounded-md border p-2 focus:ring-2 focus:ring-purple-500 outline-none" /></label>
            <label className="space-y-1 block"><span className="text-sm font-medium">Registration Closes</span><input type="datetime-local" value={form.submissionsCloseAt} onChange={e => updateForm('submissionsCloseAt', e.target.value)} className="w-full rounded-md border p-2 focus:ring-2 focus:ring-purple-500 outline-none" /></label>
            <label className="space-y-1 block"><span className="text-sm font-medium">Hackathon Starts</span><input type="datetime-local" value={form.startAt} onChange={e => updateForm('startAt', e.target.value)} className="w-full rounded-md border p-2 focus:ring-2 focus:ring-purple-500 outline-none" /></label>
            <label className="space-y-1 block"><span className="text-sm font-medium">Hackathon Ends</span><input type="datetime-local" value={form.endAt} onChange={e => updateForm('endAt', e.target.value)} className="w-full rounded-md border p-2 focus:ring-2 focus:ring-purple-500 outline-none" /></label>
          </div>
        </section>

        {/* Categories */}
        <section className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Plus className="w-5 h-5 text-purple-600" />
              Tracks / Categories
            </h2>
            <button 
              type="button" 
              onClick={() => updateForm('categories', [...form.categories, emptyCategory])}
              className="text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Category
            </button>
          </div>
          <div className="space-y-6">
            {form.categories.map((cat, idx) => (
              <div key={idx} className="border rounded-lg p-4 space-y-4 relative bg-gray-50/50">
                {form.categories.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => updateForm('categories', form.categories.filter((_, i) => i !== idx))}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="space-y-1 block">
                    <span className="text-sm font-medium">Category Name</span>
                    <input 
                      type="text" 
                      value={cat.name} 
                      onChange={e => {
                        const newCats = [...form.categories];
                        newCats[idx].name = e.target.value;
                        updateForm('categories', newCats);
                      }} 
                      className="w-full rounded-md border p-2 focus:ring-2 focus:ring-purple-500 outline-none" 
                    />
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-sm font-medium">Reward Slots (e.g. 3 for Top 3)</span>
                    <input 
                      type="number" 
                      min={1} 
                      value={cat.rewardSlots} 
                      onChange={e => {
                        const newCats = [...form.categories];
                        newCats[idx].rewardSlots = parseInt(e.target.value);
                        updateForm('categories', newCats);
                      }} 
                      className="w-full rounded-md border p-2 focus:ring-2 focus:ring-purple-500 outline-none" 
                    />
                  </label>
                </div>
                <label className="space-y-1 block">
                  <span className="text-sm font-medium">Track Description</span>
                  <textarea 
                    value={cat.description} 
                    onChange={e => {
                      const newCats = [...form.categories];
                      newCats[idx].description = e.target.value;
                      updateForm('categories', newCats);
                    }} 
                    className="w-full rounded-md border p-2 focus:ring-2 focus:ring-purple-500 outline-none" 
                    rows={2} 
                  />
                </label>
              </div>
            ))}
          </div>
        </section>

        {/* Rewards */}
        <section className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Plus className="w-5 h-5 text-purple-600" />
              Prizes & Rewards
            </h2>
            <button 
              type="button" 
              onClick={() => updateForm('rewards', [...form.rewards, emptyReward])}
              className="text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Prize
            </button>
          </div>
          <div className="space-y-6">
            {form.rewards.map((reward, idx) => (
              <div key={idx} className="border rounded-lg p-4 space-y-4 relative bg-gray-50/50">
                {form.rewards.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => updateForm('rewards', form.rewards.filter((_, i) => i !== idx))}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="space-y-1 block">
                    <span className="text-sm font-medium">Prize Title (e.g. 1st Place)</span>
                    <input 
                      type="text" 
                      value={reward.title} 
                      onChange={e => {
                        const newRewards = [...form.rewards];
                        newRewards[idx].title = e.target.value;
                        updateForm('rewards', newRewards);
                      }} 
                      className="w-full rounded-md border p-2 focus:ring-2 focus:ring-purple-500 outline-none" 
                    />
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-sm font-medium">Amount ($/ICP)</span>
                    <input 
                      type="text" 
                      value={reward.amount} 
                      onChange={e => {
                        const newRewards = [...form.rewards];
                        newRewards[idx].amount = e.target.value;
                        updateForm('rewards', newRewards);
                      }} 
                      className="w-full rounded-md border p-2 focus:ring-2 focus:ring-purple-500 outline-none" 
                    />
                  </label>
                  <label className="space-y-1 block">
                    <span className="text-sm font-medium">Track Name (Optional)</span>
                    <select 
                      value={reward.categoryName}
                      onChange={e => {
                        const newRewards = [...form.rewards];
                        newRewards[idx].categoryName = e.target.value;
                        updateForm('rewards', newRewards);
                      }}
                      className="w-full rounded-md border p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      <option value="">Main Event</option>
                      {form.categories.map((c, i) => c.name && <option key={i} value={c.name}>{c.name}</option>)}
                    </select>
                  </label>
                </div>
                <label className="space-y-1 block">
                  <span className="text-sm font-medium">Prize Description</span>
                  <textarea 
                    value={reward.description} 
                    onChange={e => {
                      const newRewards = [...form.rewards];
                      newRewards[idx].description = e.target.value;
                      updateForm('rewards', newRewards);
                    }} 
                    className="w-full rounded-md border p-2 focus:ring-2 focus:ring-purple-500 outline-none" 
                    rows={2} 
                  />
                </label>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ & Resources */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">FAQ</h2>
              <button 
                type="button" 
                onClick={() => updateForm('faq', [...form.faq, ''])}
                className="text-xs text-purple-600 font-medium"
              >
                + Add FAQ
              </button>
            </div>
            <div className="space-y-3">
              {form.faq.map((q, i) => (
                <div key={i} className="flex gap-2">
                  <input 
                    type="text" 
                    value={q} 
                    onChange={e => {
                      const newFaq = [...form.faq];
                      newFaq[i] = e.target.value;
                      updateForm('faq', newFaq);
                    }} 
                    className="flex-1 rounded-md border p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" 
                    placeholder="e.g. Can I work alone?"
                  />
                  <button type="button" onClick={() => updateForm('faq', form.faq.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Resources</h2>
              <button 
                type="button" 
                onClick={() => updateForm('resources', [...form.resources, ''])}
                className="text-xs text-purple-600 font-medium"
              >
                + Add Link
              </button>
            </div>
            <div className="space-y-3">
              {form.resources.map((r, i) => (
                <div key={i} className="flex gap-2">
                  <input 
                    type="text" 
                    value={r} 
                    onChange={e => {
                      const newRes = [...form.resources];
                      newRes[i] = e.target.value;
                      updateForm('resources', newRes);
                    }} 
                    className="flex-1 rounded-md border p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" 
                    placeholder="e.g. Documentation link"
                  />
                  <button type="button" onClick={() => updateForm('resources', form.resources.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="bg-white rounded-xl shadow-sm border p-6 space-y-4 text-right">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-8 py-4 bg-purple-600 text-white rounded-lg font-bold text-lg hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-6 h-6 mr-2 animate-spin" /> : <Save className="w-6 h-6 mr-2" />}
            {editId ? 'Update Hackathon' : 'Publish Hackathon'}
          </button>
        </section>
      </form>
    </div>
  );
};
