/**
 * User, profile and onboarding routes.
 *
 * Every handler is scoped by `req.user.userId`. There is no route here that
 * takes a user id from the request body — that is what let the canister-era
 * code act on other people's records.
 */
import { Router } from 'express';
import { z } from 'zod';
import { notFound } from '../../lib/errors.js';
import { generateId } from '../../lib/ids.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validateBody } from '../../middleware/validate.js';
import * as repo from './repo.js';
import * as authRepo from '../auth/repo.js';

export const usersRouter = Router();

usersRouter.use(requireAuth);

const optionalUrl = z.string().url().or(z.literal('')).optional().nullable();

const profileSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  bio: z.string().max(2000).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  website: optionalUrl,
  linkedin: optionalUrl,
  github: optionalUrl,
  twitter: optionalUrl,
  profileImageUrl: optionalUrl,
  resumeUrl: optionalUrl,
  skills: z.array(z.string().min(1).max(60)).max(50).optional(),
});

const experienceSchema = z.object({
  id: z.string().optional(),
  company: z.string().min(1),
  position: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  current: z.boolean().optional(),
});

const educationSchema = z.object({
  id: z.string().optional(),
  institution: z.string().min(1),
  degree: z.string().min(1),
  field: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().optional().nullable(),
  gpa: z.string().max(20).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
});

/** Empty string means "not set" throughout the existing UI. */
const blankToNull = (v: string | null | undefined) => (v == null || v === '' ? null : v);

function toPatch(body: z.infer<typeof profileSchema>) {
  return {
    ...(body.firstName !== undefined && { first_name: body.firstName }),
    ...(body.lastName !== undefined && { last_name: body.lastName }),
    ...(body.bio !== undefined && { bio: blankToNull(body.bio) }),
    ...(body.phone !== undefined && { phone: blankToNull(body.phone) }),
    ...(body.location !== undefined && { location: blankToNull(body.location) }),
    ...(body.website !== undefined && { website: blankToNull(body.website) }),
    ...(body.linkedin !== undefined && { linkedin: blankToNull(body.linkedin) }),
    ...(body.github !== undefined && { github: blankToNull(body.github) }),
    ...(body.twitter !== undefined && { twitter: blankToNull(body.twitter) }),
    ...(body.profileImageUrl !== undefined && { profile_image_url: blankToNull(body.profileImageUrl) }),
    ...(body.resumeUrl !== undefined && { resume_url: blankToNull(body.resumeUrl) }),
    ...(body.skills !== undefined && { skills: body.skills }),
  };
}

/** The shape the frontend profile pages already consume. */
async function buildProfileResponse(userId: string) {
  const user = await authRepo.findById(userId);
  if (!user) throw notFound('Account not found');

  const [profile, experience, education] = await Promise.all([
    repo.getProfile(userId),
    repo.getExperiences(userId),
    repo.getEducations(userId),
  ]);

  // Experience and education are their own tables now, but the response still
  // nests them under `profile`. So the profile object has to appear whenever
  // ANY of the three has content — keying it on the user_profiles row alone
  // would hide a user's experience just because they never filled in a bio.
  const hasProfileContent = profile !== null || experience.length > 0 || education.length > 0;

  return {
    id: user.id,
    email: user.email,
    isVerified: user.is_verified,
    profileSubmitted: user.profile_submitted,
    createdAt: user.created_at,
    lastLoginAt: user.last_login_at,
    profile: hasProfileContent
      ? {
          firstName: profile?.first_name ?? '',
          lastName: profile?.last_name ?? '',
          bio: profile?.bio ?? null,
          phone: profile?.phone ?? null,
          location: profile?.location ?? null,
          website: profile?.website ?? null,
          linkedin: profile?.linkedin ?? null,
          github: profile?.github ?? null,
          twitter: profile?.twitter ?? null,
          profileImageUrl: profile?.profile_image_url ?? null,
          resumeUrl: profile?.resume_url ?? null,
          skills: profile?.skills ?? [],
          experience: experience.map((e) => ({
            id: e.id, company: e.company, position: e.position,
            startDate: e.start_date, endDate: e.end_date,
            description: e.description, current: e.is_current,
          })),
          education: education.map((e) => ({
            id: e.id, institution: e.institution, degree: e.degree, field: e.field,
            startDate: e.start_date, endDate: e.end_date,
            gpa: e.gpa, description: e.description,
          })),
        }
      : null,
  };
}

usersRouter.get('/profile', async (req, res, next) => {
  try {
    res.json({ success: true, data: await buildProfileResponse(req.user!.userId) });
  } catch (err) {
    next(err);
  }
});

usersRouter.post('/profile', validateBody(profileSchema), async (req, res, next) => {
  try {
    await repo.upsertProfile(req.user!.userId, toPatch(req.body));
    res.json({ success: true, data: await buildProfileResponse(req.user!.userId) });
  } catch (err) {
    next(err);
  }
});

usersRouter.post('/experience',
  validateBody(z.object({ experience: z.array(experienceSchema).max(50) })),
  async (req, res, next) => {
    try {
      const userId = req.user!.userId;
      await repo.replaceExperiences(userId, req.body.experience.map((e: z.infer<typeof experienceSchema>) => ({
        id: e.id || generateId('exp'),
        company: e.company, position: e.position,
        start_date: e.startDate, end_date: blankToNull(e.endDate),
        description: blankToNull(e.description), is_current: e.current ?? false,
      })));
      res.json({ success: true, data: await buildProfileResponse(userId) });
    } catch (err) {
      next(err);
    }
  });

usersRouter.post('/education',
  validateBody(z.object({ education: z.array(educationSchema).max(50) })),
  async (req, res, next) => {
    try {
      const userId = req.user!.userId;
      await repo.replaceEducations(userId, req.body.education.map((e: z.infer<typeof educationSchema>) => ({
        id: e.id || generateId('edu'),
        institution: e.institution, degree: e.degree, field: e.field,
        start_date: e.startDate, end_date: blankToNull(e.endDate),
        gpa: blankToNull(e.gpa), description: blankToNull(e.description),
      })));
      res.json({ success: true, data: await buildProfileResponse(userId) });
    } catch (err) {
      next(err);
    }
  });

/**
 * Which required fields are still missing. The old route computed this in the
 * page; centralising it means the answer cannot differ between callers.
 */
usersRouter.get('/profile/completeness', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const [profile, experience] = await Promise.all([
      repo.getProfile(userId), repo.getExperiences(userId),
    ]);

    const missing: string[] = [];
    if (!profile?.first_name) missing.push('firstName');
    if (!profile?.last_name) missing.push('lastName');
    if (!profile?.bio) missing.push('bio');
    if (!profile?.location) missing.push('location');
    if (!profile?.skills?.length) missing.push('skills');
    if (!profile?.resume_url) missing.push('resume');
    if (experience.length === 0) missing.push('experience');

    const total = 7;
    res.json({
      success: true,
      data: {
        isComplete: missing.length === 0,
        missing,
        completionPercentage: Math.round(((total - missing.length) / total) * 100),
      },
    });
  } catch (err) {
    next(err);
  }
});

usersRouter.post('/profile/submit', async (req, res, next) => {
  try {
    await repo.markProfileSubmitted(req.user!.userId, true);
    res.json({ success: true, data: { profileSubmitted: true } });
  } catch (err) {
    next(err);
  }
});

usersRouter.get('/profile/submission', async (req, res, next) => {
  try {
    const user = await authRepo.findById(req.user!.userId);
    res.json({ success: true, data: { profileSubmitted: user?.profile_submitted ?? false } });
  } catch (err) {
    next(err);
  }
});

// --- Onboarding ------------------------------------------------------------
// Each step is a partial profile update. Files are uploaded separately by the
// existing S3/R2 routes, which hand back a URL that lands here.

usersRouter.post('/onboarding/address',
  validateBody(z.object({
    location: z.string().min(1).max(200),
    phone: z.string().max(40).optional().nullable(),
  })),
  async (req, res, next) => {
    try {
      await repo.upsertProfile(req.user!.userId, {
        location: req.body.location,
        ...(req.body.phone !== undefined && { phone: blankToNull(req.body.phone) }),
      });
      res.json({ success: true, data: { step: 'address' } });
    } catch (err) {
      next(err);
    }
  });

usersRouter.post('/onboarding/skills',
  validateBody(z.object({ skills: z.array(z.string().min(1).max(60)).min(1).max(50) })),
  async (req, res, next) => {
    try {
      await repo.upsertProfile(req.user!.userId, { skills: req.body.skills });
      res.json({ success: true, data: { step: 'skills' } });
    } catch (err) {
      next(err);
    }
  });

usersRouter.post('/onboarding/resume',
  validateBody(z.object({ resumeUrl: z.string().url() })),
  async (req, res, next) => {
    try {
      await repo.upsertProfile(req.user!.userId, { resume_url: req.body.resumeUrl });
      res.json({ success: true, data: { step: 'resume' } });
    } catch (err) {
      next(err);
    }
  });

usersRouter.get('/onboarding/complete', async (req, res, next) => {
  try {
    const user = await authRepo.findById(req.user!.userId);
    const profile = await repo.getProfile(req.user!.userId);
    res.json({
      success: true,
      data: {
        completed: user?.profile_submitted ?? false,
        hasProfile: profile !== null,
      },
    });
  } catch (err) {
    next(err);
  }
});

usersRouter.post('/onboarding/complete', async (req, res, next) => {
  try {
    await repo.markProfileSubmitted(req.user!.userId, true);
    res.json({ success: true, data: { completed: true } });
  } catch (err) {
    next(err);
  }
});

/**
 * Wallet. Stubbed: the ICP wallet concept is being removed, and any migrated
 * value lives in users.legacy_wallet_*. Kept so the existing UI does not 404;
 * deleted along with ConnectWallet in Phase 7.
 */
usersRouter.get('/wallet', (_req, res) => {
  res.json({ success: true, data: { walletPrincipal: null, walletAccountId: null } });
});

usersRouter.post('/wallet', (_req, res) => {
  res.status(410).json({
    success: false,
    error: 'Wallet linking has been removed.',
    code: 'GONE',
  });
});
