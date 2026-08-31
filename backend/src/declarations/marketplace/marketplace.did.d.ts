import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type ApiError = { 'InvalidInput' : string } |
  { 'PaymentFailed' : string } |
  { 'InvalidStatus' : string } |
  { 'NotFound' : string } |
  { 'StageNotApproved' : null } |
  { 'LedgerError' : string } |
  { 'Unauthorized' : string } |
  { 'AlreadyExists' : string } |
  { 'BookingNotFunded' : null } |
  { 'InsufficientFunds' : null };
export interface Booking {
  'transaction_id' : string,
  'package_features' : Array<string>,
  'status' : BookingStatus,
  'discount_amount_e8s' : bigint,
  'package_title' : string,
  'title' : string,
  'updated_at' : bigint,
  'delivery_days' : bigint,
  'time_remaining_hours' : bigint,
  'package_description' : string,
  'client_rating' : [] | [number],
  'payment_completed_at_readable' : string,
  'upsells' : Array<
    {
      'id' : string,
      'name' : string,
      'category' : string,
      'price_e8s' : bigint,
    }
  >,
  'client_name' : string,
  'freelancer_id' : UserId,
  'dispute_id' : [] | [string],
  'description' : string,
  'deadline' : bigint,
  'base_amount_e8s' : bigint,
  'freelancer_rating' : [] | [number],
  'created_at' : bigint,
  'payment_status' : PaymentStatus,
  'payment_method' : string,
  'client_review' : [] | [string],
  'platform_fee_e8s' : bigint,
  'freelancer_name' : string,
  'delivery_deadline' : bigint,
  'service_id' : ServiceId,
  'total_amount_e8s' : bigint,
  'escrow_amount_e8s' : bigint,
  'currency' : string,
  'work_completed_at' : [] | [bigint],
  'payment_completed_at' : [] | [bigint],
  'special_instructions' : string,
  'freelancer_review' : [] | [string],
  'delivery_deadline_readable' : string,
  'client_id' : UserId,
  'requirements' : Array<string>,
  'payment_id' : string,
  'client_reviewed_at' : [] | [bigint],
  'booking_id' : BookingId,
  'package_id' : PackageId,
  'promo_code' : [] | [string],
  'package_tier' : string,
  'freelancer_reviewed_at' : [] | [bigint],
  'ledger_deposit_block' : [] | [bigint],
  'current_milestone' : [] | [StageId],
  'booking_confirmed_at' : [] | [bigint],
  'booking_confirmed_at_readable' : string,
  'package_revisions' : bigint,
  'created_at_readable' : string,
  'work_started_at' : [] | [bigint],
  'milestones' : Array<StageId>,
}
export type BookingId = string;
export interface BookingResponse {
  'escrow_account' : string,
  'ledger_block' : [] | [bigint],
  'amount_e8s' : bigint,
  'booking_id' : BookingId,
}
export type BookingStatus = { 'InDispute' : null } |
  { 'Active' : null } |
  { 'Cancelled' : null } |
  { 'Completed' : null } |
  { 'Pending' : null };
export interface Package {
  'delivery_timeline' : string,
  'features' : Array<string>,
  'revisions' : bigint,
  'name' : string,
  'description' : string,
  'created_at' : bigint,
  'service_id' : ServiceId,
  'is_active' : boolean,
  'price_e8s' : bigint,
  'delivery_time_days' : bigint,
  'package_id' : PackageId,
}
export type PackageId = string;
export interface PaginationParams { 'offset' : bigint, 'limit' : bigint }
export type PaymentStatus = { 'Disputed' : null } |
  { 'HeldInEscrow' : null } |
  { 'Refunded' : null } |
  { 'Released' : null } |
  { 'Pending' : null };
export type Result = { 'ok' : null } |
  { 'err' : string };
export type Result_1 = { 'ok' : null } |
  { 'err' : ApiError };
export type Result_2 = { 'ok' : Array<Booking> } |
  { 'err' : ApiError };
export type Result_3 = { 'ok' : [string, string] } |
  { 'err' : ApiError };
export type Result_4 = { 'ok' : Booking } |
  { 'err' : ApiError };
export type Result_5 = { 'ok' : ServiceId } |
  { 'err' : string };
export type Result_6 = { 'ok' : PackageId } |
  { 'err' : string };
export type Result_7 = { 'ok' : string } |
  { 'err' : ApiError };
export type Result_8 = { 'ok' : BookingResponse } |
  { 'err' : string };
export type Result_9 = { 'ok' : BookingResponse } |
  { 'err' : ApiError };
export interface Service {
  'sub_category' : string,
  'total_rating' : number,
  'status' : ServiceStatus,
  'main_category' : string,
  'title' : string,
  'updated_at' : bigint,
  'cover_image_url' : [] | [string],
  'whats_included' : string,
  'tags' : Array<string>,
  'freelancer_id' : UserId,
  'description' : string,
  'created_at' : bigint,
  'review_count' : bigint,
  'service_id' : ServiceId,
  'starting_from_e8s' : bigint,
  'delivery_time_days' : bigint,
  'portfolio_images' : Array<string>,
}
export interface ServiceFilter {
  'sub_category' : [] | [string],
  'delivery_time' : [] | [{ 'max_days' : bigint, 'min_days' : bigint }],
  'tags' : Array<string>,
  'freelancer_id' : [] | [UserId],
  'category' : [] | [string],
  'rating' : [] | [number],
  'price_range' : [] | [{ 'min_e8s' : bigint, 'max_e8s' : bigint }],
}
export type ServiceId = string;
export type ServiceStatus = { 'Paused' : null } |
  { 'Active' : null } |
  { 'Deleted' : null };
export interface SortOption {
  'field' : string,
  'direction' : { 'Descending' : null } |
    { 'Ascending' : null },
}
export type StageId = string;
export interface TimelineEvent {
  'metadata' : [] | [Array<[string, string]>],
  'description' : string,
  'created_by' : UserId,
  'timestamp' : bigint,
  'event_id' : string,
  'booking_id' : BookingId,
  'event_type' : TimelineEventType,
}
export type TimelineEventType = { 'ClientReviewed' : null } |
  { 'WorkStarted' : null } |
  { 'DisputeRaised' : null } |
  { 'BookingCompleted' : null } |
  { 'BookingCreated' : null } |
  { 'StageApproved' : null } |
  { 'StageRejected' : null } |
  { 'StageUpdated' : null } |
  { 'BookingConfirmed' : null } |
  { 'DisputeResolved' : null } |
  { 'FreelancerReviewed' : null } |
  { 'PaymentCompleted' : null } |
  { 'StageCreated' : null } |
  { 'WorkCompleted' : null } |
  { 'BookingCancelled' : null };
export type UserId = string;
export interface _SERVICE {
  'addBookingReview' : ActorMethod<
    [BookingId, UserId, number, string, boolean],
    Result_1
  >,
  'bookPackage' : ActorMethod<
    [UserId, string, PackageId, string, string],
    Result_9
  >,
  'createBooking' : ActorMethod<
    [ServiceId, PackageId, string, string, Array<string>, bigint],
    Result_8
  >,
  'createChatRelationshipFromBooking' : ActorMethod<
    [BookingId, UserId, [] | [string], [] | [string]],
    Result_7
  >,
  'createPackage' : ActorMethod<
    [ServiceId, string, string, bigint, bigint, string, bigint, Array<string>],
    Result_6
  >,
  'createPackageForBooking' : ActorMethod<
    [
      ServiceId,
      PackageId,
      string,
      string,
      bigint,
      bigint,
      string,
      bigint,
      Array<string>,
    ],
    Result_6
  >,
  'createService' : ActorMethod<
    [
      UserId,
      string,
      string,
      string,
      string,
      string,
      bigint,
      bigint,
      Array<string>,
    ],
    Result_5
  >,
  'createServiceForBooking' : ActorMethod<
    [
      ServiceId,
      string,
      string,
      string,
      string,
      string,
      string,
      bigint,
      bigint,
      Array<string>,
    ],
    Result_5
  >,
  'deleteService' : ActorMethod<[ServiceId], Result>,
  'getActiveBookingChatsForUser' : ActorMethod<[string], Result_2>,
  'getAllServices' : ActorMethod<[], Array<Service>>,
  'getBooking' : ActorMethod<[BookingId, UserId], [] | [Booking]>,
  'getBookingById' : ActorMethod<[BookingId], Result_4>,
  'getBookingTimeline' : ActorMethod<[BookingId], Array<TimelineEvent>>,
  'getChatParticipantsForBooking' : ActorMethod<[BookingId], Result_3>,
  'getMarketplaceStats' : ActorMethod<
    [],
    {
      'active_bookings' : bigint,
      'total_services' : bigint,
      'total_bookings' : bigint,
      'active_services' : bigint,
      'total_revenue_e8s' : bigint,
    }
  >,
  'getPackagesByServiceId' : ActorMethod<[ServiceId], Array<Package>>,
  'getService' : ActorMethod<[ServiceId], [] | [Service]>,
  'getServicesByFreelancer' : ActorMethod<
    [UserId, PaginationParams],
    Array<Service>
  >,
  'getUserBookings' : ActorMethod<
    [UserId, { 'Client' : null } | { 'Freelancer' : null }, PaginationParams],
    Array<Booking>
  >,
  'listBookingsForClient' : ActorMethod<
    [UserId, [] | [BookingStatus], bigint, bigint],
    Result_2
  >,
  'listBookingsForFreelancer' : ActorMethod<
    [UserId, [] | [BookingStatus], bigint, bigint],
    Result_2
  >,
  'searchServices' : ActorMethod<
    [ServiceFilter, SortOption, PaginationParams],
    Array<Service>
  >,
  'submitReview' : ActorMethod<[BookingId, UserId, number, string], Result>,
  'updateBookingEnrichedData' : ActorMethod<
    [
      BookingId,
      string,
      string,
      string,
      string,
      string,
      string,
      Array<
        {
          'id' : string,
          'name' : string,
          'category' : string,
          'price_e8s' : bigint,
        }
      >,
      [] | [string],
      bigint,
      [] | [bigint],
    ],
    Result_1
  >,
  'updateBookingStatus' : ActorMethod<
    [BookingId, UserId, BookingStatus],
    Result
  >,
  'updateBookingStatusWithTimeline' : ActorMethod<
    [BookingId, UserId, BookingStatus, string],
    Result_1
  >,
  'updateService' : ActorMethod<
    [ServiceId, string, string, string, bigint, bigint, Array<string>],
    Result
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
