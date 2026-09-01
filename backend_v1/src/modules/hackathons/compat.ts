/**
 * Compatibility shims for the three hackquest endpoints that existed only to
 * translate between IC Principals and emails.
 *
 * They cannot simply be deleted in this phase: five pages and one component
 * still call them (app/freelancer/hackathons/[id], .../view-project,
 * app/client/hackathons, components/hackathons/HackathonForm). Rewriting those
 * is frontend work that belongs with the rest of the Phase 7 cleanup.
 *
 * So the shape survives and the meaning changes. `principal` now carries the
 * USER ID — the callers treat it as an opaque identity token and only ever
 * compare it against ids returned elsewhere, which now agree. Nothing here
 * touches IC.
 *
 * Two improvements over the originals, which were unauthenticated and took the
 * email from the query string: these require a session and answer only for the
 * caller's own email. Every existing call site already passes the logged-in
 * user's address, so nothing loses function — but the endpoint can no longer
 * be used to probe whether an arbitrary address has an account.
 *
 * Delete this file in Phase 7, with the pages.
 */
import { Router } from 'express';
import { queryOne } from '../../db/pool.js';
import { requireAuth } from '../../middleware/requireAuth.js';

export const hackquestCompatRouter = Router();
hackquestCompatRouter.use(requireAuth);

hackquestCompatRouter.get('/email-to-principal', (req, res) => {
  res.json({ success: true, principal: req.user!.userId, email: req.user!.email });
});

hackquestCompatRouter.get('/participant', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const hackathonId =
      typeof req.query.hackathonId === 'string' ? req.query.hackathonId
      : typeof req.query.hackathon_id === 'string' ? req.query.hackathon_id
      : null;

    const participant = await queryOne<{ user_id: string }>(
      'SELECT user_id FROM hackathon_participants WHERE user_id = $1', [userId]);

    const registration = hackathonId
      ? await queryOne<{ user_id: string }>(
          'SELECT user_id FROM hackathon_registrations WHERE hackathon_id = $1 AND user_id = $2',
          [hackathonId, userId])
      : null;

    res.json({
      success: true,
      isRegistered: participant !== null,
      isRegisteredForHackathon: hackathonId ? registration !== null : participant !== null,
      principal: userId,
      email: req.user!.email,
    });
  } catch (err) {
    next(err);
  }
});
