/**
 * Booking creation, shared by the bookings route and the payments checkout
 * route.
 *
 * Extracted so both callers enforce the same rules. Duplicating "can this be
 * booked?" in the payment path is how a service that is paused, self-owned, or
 * still awaiting repricing ends up sellable through one door and not the other.
 */
import { withTransaction } from '../../db/pool.js';
import { badRequest, conflict, notFound } from '../../lib/errors.js';
import { newBookingId } from '../../lib/ids.js';
import { splitPlatformFee } from '../../lib/money.js';
import * as serviceRepo from '../services/repo.js';
import * as repo from './repo.js';

export interface CreateBookingArgs {
  clientId: string;
  packageId: string;
  requirements?: string[];
  specialInstructions?: string;
  discountMinor?: bigint;
}

/** Throws an AppError the route layer can pass straight to next(). */
export async function createBooking(args: CreateBookingArgs): Promise<repo.BookingRow> {
  const pkg = await serviceRepo.getPackage(args.packageId);
  if (!pkg || !pkg.is_active) throw notFound('Package not found');

  const service = await serviceRepo.getService(pkg.service_id);
  if (!service || service.status !== 'active') {
    throw badRequest('That service is not currently available');
  }
  if (service.freelancer_id === args.clientId) {
    // booking_parties_differ would reject this anyway.
    throw badRequest('You cannot book your own service');
  }
  if (service.price_needs_review || pkg.price_needs_review) {
    // Migrated rows carry a placeholder price; selling at it would be wrong.
    throw conflict('This service is being repriced and cannot be booked yet');
  }

  const base = BigInt(pkg.price_minor);
  const discount = args.discountMinor ?? 0n;
  if (discount > base) throw badRequest('Discount cannot exceed the package price');

  // booking_amounts_balance: total = base + fee - discount.
  const { fee } = splitPlatformFee(base);
  const total = base + fee - discount;

  const bookingId = newBookingId();

  // Booking and its first timeline event are one unit of work.
  await withTransaction(async (client) => {
    await repo.insertBooking(client, {
      id: bookingId,
      serviceId: service.id,
      packageId: pkg.id,
      clientId: args.clientId,
      freelancerId: service.freelancer_id,
      title: service.title,
      description: pkg.description,
      requirements: args.requirements ?? [],
      specialInstructions: args.specialInstructions ?? '',
      currency: pkg.currency,
      totalMinor: total,
      baseMinor: base,
      feeMinor: fee,
      discountMinor: discount,
      promoCode: null,
      // Immutable record of what was agreed: editing the package later must
      // not change the terms of an existing order.
      packageSnapshot: {
        tier: pkg.tier, title: pkg.name, description: pkg.description,
        price_minor: pkg.price_minor, currency: pkg.currency,
        revisions: pkg.revisions, features: pkg.features,
        delivery_time_days: pkg.delivery_time_days,
      },
      deliveryDays: pkg.delivery_time_days,
    });

    await repo.addTimelineEvent(client, bookingId, 'booking_created', args.clientId,
      'Booking created', { packageId: pkg.id, serviceId: service.id });
  });

  return (await repo.getBooking(bookingId))!;
}
