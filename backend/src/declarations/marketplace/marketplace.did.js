export const idlFactory = ({ IDL }) => {
  const BookingId = IDL.Text;
  const UserId = IDL.Text;
  const ApiError = IDL.Variant({
    'InvalidInput' : IDL.Text,
    'PaymentFailed' : IDL.Text,
    'InvalidStatus' : IDL.Text,
    'NotFound' : IDL.Text,
    'StageNotApproved' : IDL.Null,
    'LedgerError' : IDL.Text,
    'Unauthorized' : IDL.Text,
    'AlreadyExists' : IDL.Text,
    'BookingNotFunded' : IDL.Null,
    'InsufficientFunds' : IDL.Null,
  });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Null, 'err' : ApiError });
  const PackageId = IDL.Text;
  const BookingResponse = IDL.Record({
    'escrow_account' : IDL.Text,
    'ledger_block' : IDL.Opt(IDL.Nat64),
    'amount_e8s' : IDL.Nat64,
    'booking_id' : BookingId,
  });
  const Result_9 = IDL.Variant({ 'ok' : BookingResponse, 'err' : ApiError });
  const ServiceId = IDL.Text;
  const Result_8 = IDL.Variant({ 'ok' : BookingResponse, 'err' : IDL.Text });
  const Result_7 = IDL.Variant({ 'ok' : IDL.Text, 'err' : ApiError });
  const Result_6 = IDL.Variant({ 'ok' : PackageId, 'err' : IDL.Text });
  const Result_5 = IDL.Variant({ 'ok' : ServiceId, 'err' : IDL.Text });
  const Result = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const BookingStatus = IDL.Variant({
    'InDispute' : IDL.Null,
    'Active' : IDL.Null,
    'Cancelled' : IDL.Null,
    'Completed' : IDL.Null,
    'Pending' : IDL.Null,
  });
  const PaymentStatus = IDL.Variant({
    'Disputed' : IDL.Null,
    'HeldInEscrow' : IDL.Null,
    'Refunded' : IDL.Null,
    'Released' : IDL.Null,
    'Pending' : IDL.Null,
  });
  const StageId = IDL.Text;
  const Booking = IDL.Record({
    'transaction_id' : IDL.Text,
    'package_features' : IDL.Vec(IDL.Text),
    'status' : BookingStatus,
    'discount_amount_e8s' : IDL.Nat64,
    'package_title' : IDL.Text,
    'title' : IDL.Text,
    'updated_at' : IDL.Int,
    'delivery_days' : IDL.Nat,
    'time_remaining_hours' : IDL.Nat,
    'package_description' : IDL.Text,
    'client_rating' : IDL.Opt(IDL.Float64),
    'payment_completed_at_readable' : IDL.Text,
    'upsells' : IDL.Vec(
      IDL.Record({
        'id' : IDL.Text,
        'name' : IDL.Text,
        'category' : IDL.Text,
        'price_e8s' : IDL.Nat64,
      })
    ),
    'client_name' : IDL.Text,
    'freelancer_id' : UserId,
    'dispute_id' : IDL.Opt(IDL.Text),
    'description' : IDL.Text,
    'deadline' : IDL.Int,
    'base_amount_e8s' : IDL.Nat64,
    'freelancer_rating' : IDL.Opt(IDL.Float64),
    'created_at' : IDL.Int,
    'payment_status' : PaymentStatus,
    'payment_method' : IDL.Text,
    'client_review' : IDL.Opt(IDL.Text),
    'platform_fee_e8s' : IDL.Nat64,
    'freelancer_name' : IDL.Text,
    'delivery_deadline' : IDL.Int,
    'service_id' : ServiceId,
    'total_amount_e8s' : IDL.Nat64,
    'escrow_amount_e8s' : IDL.Nat64,
    'currency' : IDL.Text,
    'work_completed_at' : IDL.Opt(IDL.Int),
    'payment_completed_at' : IDL.Opt(IDL.Int),
    'special_instructions' : IDL.Text,
    'freelancer_review' : IDL.Opt(IDL.Text),
    'delivery_deadline_readable' : IDL.Text,
    'client_id' : UserId,
    'requirements' : IDL.Vec(IDL.Text),
    'payment_id' : IDL.Text,
    'client_reviewed_at' : IDL.Opt(IDL.Int),
    'booking_id' : BookingId,
    'package_id' : PackageId,
    'promo_code' : IDL.Opt(IDL.Text),
    'package_tier' : IDL.Text,
    'freelancer_reviewed_at' : IDL.Opt(IDL.Int),
    'ledger_deposit_block' : IDL.Opt(IDL.Nat64),
    'current_milestone' : IDL.Opt(StageId),
    'booking_confirmed_at' : IDL.Opt(IDL.Int),
    'booking_confirmed_at_readable' : IDL.Text,
    'package_revisions' : IDL.Nat,
    'created_at_readable' : IDL.Text,
    'work_started_at' : IDL.Opt(IDL.Int),
    'milestones' : IDL.Vec(StageId),
  });
  const Result_2 = IDL.Variant({ 'ok' : IDL.Vec(Booking), 'err' : ApiError });
  const ServiceStatus = IDL.Variant({
    'Paused' : IDL.Null,
    'Active' : IDL.Null,
    'Deleted' : IDL.Null,
  });
  const Service = IDL.Record({
    'sub_category' : IDL.Text,
    'total_rating' : IDL.Float64,
    'status' : ServiceStatus,
    'main_category' : IDL.Text,
    'title' : IDL.Text,
    'updated_at' : IDL.Int,
    'cover_image_url' : IDL.Opt(IDL.Text),
    'whats_included' : IDL.Text,
    'tags' : IDL.Vec(IDL.Text),
    'freelancer_id' : UserId,
    'description' : IDL.Text,
    'created_at' : IDL.Int,
    'review_count' : IDL.Nat,
    'service_id' : ServiceId,
    'starting_from_e8s' : IDL.Nat64,
    'delivery_time_days' : IDL.Nat,
    'portfolio_images' : IDL.Vec(IDL.Text),
  });
  const Result_4 = IDL.Variant({ 'ok' : Booking, 'err' : ApiError });
  const TimelineEventType = IDL.Variant({
    'ClientReviewed' : IDL.Null,
    'WorkStarted' : IDL.Null,
    'DisputeRaised' : IDL.Null,
    'BookingCompleted' : IDL.Null,
    'BookingCreated' : IDL.Null,
    'StageApproved' : IDL.Null,
    'StageRejected' : IDL.Null,
    'StageUpdated' : IDL.Null,
    'BookingConfirmed' : IDL.Null,
    'DisputeResolved' : IDL.Null,
    'FreelancerReviewed' : IDL.Null,
    'PaymentCompleted' : IDL.Null,
    'StageCreated' : IDL.Null,
    'WorkCompleted' : IDL.Null,
    'BookingCancelled' : IDL.Null,
  });
  const TimelineEvent = IDL.Record({
    'metadata' : IDL.Opt(IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))),
    'description' : IDL.Text,
    'created_by' : UserId,
    'timestamp' : IDL.Int,
    'event_id' : IDL.Text,
    'booking_id' : BookingId,
    'event_type' : TimelineEventType,
  });
  const Result_3 = IDL.Variant({
    'ok' : IDL.Tuple(IDL.Text, IDL.Text),
    'err' : ApiError,
  });
  const Package = IDL.Record({
    'delivery_timeline' : IDL.Text,
    'features' : IDL.Vec(IDL.Text),
    'revisions' : IDL.Nat,
    'name' : IDL.Text,
    'description' : IDL.Text,
    'created_at' : IDL.Int,
    'service_id' : ServiceId,
    'is_active' : IDL.Bool,
    'price_e8s' : IDL.Nat64,
    'delivery_time_days' : IDL.Nat,
    'package_id' : PackageId,
  });
  const PaginationParams = IDL.Record({
    'offset' : IDL.Nat,
    'limit' : IDL.Nat,
  });
  const ServiceFilter = IDL.Record({
    'sub_category' : IDL.Opt(IDL.Text),
    'delivery_time' : IDL.Opt(
      IDL.Record({ 'max_days' : IDL.Nat, 'min_days' : IDL.Nat })
    ),
    'tags' : IDL.Vec(IDL.Text),
    'freelancer_id' : IDL.Opt(UserId),
    'category' : IDL.Opt(IDL.Text),
    'rating' : IDL.Opt(IDL.Float64),
    'price_range' : IDL.Opt(
      IDL.Record({ 'min_e8s' : IDL.Nat64, 'max_e8s' : IDL.Nat64 })
    ),
  });
  const SortOption = IDL.Record({
    'field' : IDL.Text,
    'direction' : IDL.Variant({
      'Descending' : IDL.Null,
      'Ascending' : IDL.Null,
    }),
  });
  return IDL.Service({
    'addBookingReview' : IDL.Func(
        [BookingId, UserId, IDL.Float64, IDL.Text, IDL.Bool],
        [Result_1],
        [],
      ),
    'bookPackage' : IDL.Func(
        [UserId, IDL.Text, PackageId, IDL.Text, IDL.Text],
        [Result_9],
        [],
      ),
    'createBooking' : IDL.Func(
        [ServiceId, PackageId, IDL.Text, IDL.Text, IDL.Vec(IDL.Text), IDL.Int],
        [Result_8],
        [],
      ),
    'createChatRelationshipFromBooking' : IDL.Func(
        [BookingId, UserId, IDL.Opt(IDL.Text), IDL.Opt(IDL.Text)],
        [Result_7],
        [],
      ),
    'createPackage' : IDL.Func(
        [
          ServiceId,
          IDL.Text,
          IDL.Text,
          IDL.Nat64,
          IDL.Nat,
          IDL.Text,
          IDL.Nat,
          IDL.Vec(IDL.Text),
        ],
        [Result_6],
        [],
      ),
    'createPackageForBooking' : IDL.Func(
        [
          ServiceId,
          PackageId,
          IDL.Text,
          IDL.Text,
          IDL.Nat64,
          IDL.Nat,
          IDL.Text,
          IDL.Nat,
          IDL.Vec(IDL.Text),
        ],
        [Result_6],
        [],
      ),
    'createService' : IDL.Func(
        [
          UserId,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Nat,
          IDL.Nat64,
          IDL.Vec(IDL.Text),
        ],
        [Result_5],
        [],
      ),
    'createServiceForBooking' : IDL.Func(
        [
          ServiceId,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Nat,
          IDL.Nat64,
          IDL.Vec(IDL.Text),
        ],
        [Result_5],
        [],
      ),
    'deleteService' : IDL.Func([ServiceId], [Result], []),
    'getActiveBookingChatsForUser' : IDL.Func(
        [IDL.Text],
        [Result_2],
        ['query'],
      ),
    'getAllServices' : IDL.Func([], [IDL.Vec(Service)], ['query']),
    'getBooking' : IDL.Func([BookingId, UserId], [IDL.Opt(Booking)], []),
    'getBookingById' : IDL.Func([BookingId], [Result_4], ['query']),
    'getBookingTimeline' : IDL.Func(
        [BookingId],
        [IDL.Vec(TimelineEvent)],
        ['query'],
      ),
    'getChatParticipantsForBooking' : IDL.Func(
        [BookingId],
        [Result_3],
        ['query'],
      ),
    'getMarketplaceStats' : IDL.Func(
        [],
        [
          IDL.Record({
            'active_bookings' : IDL.Nat,
            'total_services' : IDL.Nat,
            'total_bookings' : IDL.Nat,
            'active_services' : IDL.Nat,
            'total_revenue_e8s' : IDL.Nat64,
          }),
        ],
        ['query'],
      ),
    'getPackagesByServiceId' : IDL.Func(
        [ServiceId],
        [IDL.Vec(Package)],
        ['query'],
      ),
    'getService' : IDL.Func([ServiceId], [IDL.Opt(Service)], []),
    'getServicesByFreelancer' : IDL.Func(
        [UserId, PaginationParams],
        [IDL.Vec(Service)],
        ['query'],
      ),
    'getUserBookings' : IDL.Func(
        [
          UserId,
          IDL.Variant({ 'Client' : IDL.Null, 'Freelancer' : IDL.Null }),
          PaginationParams,
        ],
        [IDL.Vec(Booking)],
        ['query'],
      ),
    'listBookingsForClient' : IDL.Func(
        [UserId, IDL.Opt(BookingStatus), IDL.Nat, IDL.Nat],
        [Result_2],
        ['query'],
      ),
    'listBookingsForFreelancer' : IDL.Func(
        [UserId, IDL.Opt(BookingStatus), IDL.Nat, IDL.Nat],
        [Result_2],
        ['query'],
      ),
    'searchServices' : IDL.Func(
        [ServiceFilter, SortOption, PaginationParams],
        [IDL.Vec(Service)],
        ['query'],
      ),
    'submitReview' : IDL.Func(
        [BookingId, UserId, IDL.Float64, IDL.Text],
        [Result],
        [],
      ),
    'updateBookingEnrichedData' : IDL.Func(
        [
          BookingId,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Vec(
            IDL.Record({
              'id' : IDL.Text,
              'name' : IDL.Text,
              'category' : IDL.Text,
              'price_e8s' : IDL.Nat64,
            })
          ),
          IDL.Opt(IDL.Text),
          IDL.Nat64,
          IDL.Opt(IDL.Nat64),
        ],
        [Result_1],
        [],
      ),
    'updateBookingStatus' : IDL.Func(
        [BookingId, UserId, BookingStatus],
        [Result],
        [],
      ),
    'updateBookingStatusWithTimeline' : IDL.Func(
        [BookingId, UserId, BookingStatus, IDL.Text],
        [Result_1],
        [],
      ),
    'updateService' : IDL.Func(
        [
          ServiceId,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Nat,
          IDL.Nat64,
          IDL.Vec(IDL.Text),
        ],
        [Result],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
