import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';

// Simplified IDL factory matching the actual marketplace canister
const idlFactory = ({ IDL }: any) => {
  return IDL.Service({
    // Service methods
    getAllServices: IDL.Func([], [IDL.Vec(IDL.Record({
      service_id: IDL.Text,
      freelancer_id: IDL.Text,
      title: IDL.Text,
      main_category: IDL.Text,
      sub_category: IDL.Text,
      description: IDL.Text,
      whats_included: IDL.Text,
      cover_image_url: IDL.Opt(IDL.Text),
      portfolio_images: IDL.Vec(IDL.Text),
      status: IDL.Variant({ Active: IDL.Null, Paused: IDL.Null, Deleted: IDL.Null }),
      created_at: IDL.Int,
      updated_at: IDL.Int,
      delivery_time_days: IDL.Nat,
      starting_from_e8s: IDL.Nat64,
      total_rating: IDL.Float64,
      review_count: IDL.Nat,
      tags: IDL.Vec(IDL.Text),
      tier_mode: IDL.Text
    }))]),
    createService: IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Nat, IDL.Nat64, IDL.Vec(IDL.Text), IDL.Text], [IDL.Variant({ ok: IDL.Text, err: IDL.Text })]),
    createServiceForBooking: IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Nat, IDL.Nat64, IDL.Vec(IDL.Text), IDL.Text], [IDL.Variant({ ok: IDL.Text, err: IDL.Text })]),
    updateService: IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Opt(IDL.Text), IDL.Vec(IDL.Text), IDL.Nat, IDL.Nat64, IDL.Vec(IDL.Text), IDL.Text], [IDL.Variant({ ok: IDL.Null, err: IDL.Text })]),
    deleteService: IDL.Func([IDL.Text], [IDL.Variant({ ok: IDL.Null, err: IDL.Text })]),
    // Match exact canister return type and order
    getPackagesByServiceId: IDL.Func([IDL.Text], [IDL.Vec(IDL.Record({
      delivery_timeline: IDL.Text,
      features: IDL.Vec(IDL.Text),
      revisions: IDL.Nat,
      name: IDL.Text,
      description: IDL.Text,
      created_at: IDL.Int,
      service_id: IDL.Text,
      is_active: IDL.Bool,
      price_e8s: IDL.Nat64,
      delivery_time_days: IDL.Nat,
      package_id: IDL.Text
    }))], ['query']),
    getService: IDL.Func([IDL.Text], [IDL.Opt(IDL.Record({
      service_id: IDL.Text,
      freelancer_id: IDL.Text,
      title: IDL.Text,
      main_category: IDL.Text,
      sub_category: IDL.Text,
      description: IDL.Text,
      whats_included: IDL.Text,
      cover_image_url: IDL.Opt(IDL.Text),
      portfolio_images: IDL.Vec(IDL.Text),
      status: IDL.Variant({ Active: IDL.Null, Paused: IDL.Null, Deleted: IDL.Null }),
      created_at: IDL.Int,
      updated_at: IDL.Int,
      delivery_time_days: IDL.Nat,
      starting_from_e8s: IDL.Nat64,
      total_rating: IDL.Float64,
      review_count: IDL.Nat,
      tags: IDL.Vec(IDL.Text),
      tier_mode: IDL.Text
    }))]),
    getServicesByFreelancer: IDL.Func([IDL.Text, IDL.Record({ limit: IDL.Nat, offset: IDL.Nat })], [IDL.Vec(IDL.Record({
      service_id: IDL.Text,
      freelancer_id: IDL.Text,
      title: IDL.Text,
      main_category: IDL.Text,
      sub_category: IDL.Text,
      description: IDL.Text,
      whats_included: IDL.Text,
      cover_image_url: IDL.Opt(IDL.Text),
      portfolio_images: IDL.Vec(IDL.Text),
      status: IDL.Variant({ Active: IDL.Null, Paused: IDL.Null, Deleted: IDL.Null }),
      created_at: IDL.Int,
      updated_at: IDL.Int,
      delivery_time_days: IDL.Nat,
      starting_from_e8s: IDL.Nat64,
      total_rating: IDL.Float64,
      review_count: IDL.Nat,
      tags: IDL.Vec(IDL.Text),
      tier_mode: IDL.Text
    }))]),
    searchServices: IDL.Func([IDL.Record({
      category: IDL.Opt(IDL.Text),
      sub_category: IDL.Opt(IDL.Text),
      price_range: IDL.Opt(IDL.Record({ min_e8s: IDL.Nat64, max_e8s: IDL.Nat64 })),
      delivery_time: IDL.Opt(IDL.Record({ min_days: IDL.Nat, max_days: IDL.Nat })),
      rating: IDL.Opt(IDL.Float64),
      tags: IDL.Vec(IDL.Text),
      freelancer_id: IDL.Opt(IDL.Text)
    }), IDL.Record({ field: IDL.Text, direction: IDL.Variant({ Ascending: IDL.Null, Descending: IDL.Null }) }), IDL.Record({ limit: IDL.Nat, offset: IDL.Nat })], [IDL.Vec(IDL.Record({
      service_id: IDL.Text,
      freelancer_id: IDL.Text,
      title: IDL.Text,
      main_category: IDL.Text,
      sub_category: IDL.Text,
      description: IDL.Text,
      whats_included: IDL.Text,
      cover_image_url: IDL.Opt(IDL.Text),
      portfolio_images: IDL.Vec(IDL.Text),
      status: IDL.Variant({ Active: IDL.Null, Paused: IDL.Null, Deleted: IDL.Null }),
      created_at: IDL.Int,
      updated_at: IDL.Int,
      delivery_time_days: IDL.Nat,
      starting_from_e8s: IDL.Nat64,
      total_rating: IDL.Float64,
      review_count: IDL.Nat,
      tags: IDL.Vec(IDL.Text),
      tier_mode: IDL.Text
    }))]),

    // Package methods
    createPackage: IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Nat64, IDL.Nat, IDL.Text, IDL.Nat, IDL.Vec(IDL.Text)], [IDL.Variant({ ok: IDL.Text, err: IDL.Text })]),
    createPackageForBooking: IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Nat64, IDL.Nat, IDL.Text, IDL.Nat, IDL.Vec(IDL.Text)], [IDL.Variant({ ok: IDL.Text, err: IDL.Text })]),
    updatePackage: IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Nat64, IDL.Nat, IDL.Text, IDL.Nat, IDL.Vec(IDL.Text)], [IDL.Variant({ ok: IDL.Null, err: IDL.Text })]),

    // Booking methods
    // Note: Canister expects 5 parameters: clientId, clientEmail, packageId, idempotencyKey, specialInstructions
    bookPackage: IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text], [IDL.Variant({
      ok: IDL.Record({
        booking_id: IDL.Text,
        escrow_account: IDL.Text,
        amount_e8s: IDL.Nat64,
        ledger_block: IDL.Opt(IDL.Nat64)
      }),
      err: IDL.Variant({
        NotFound: IDL.Text,
        AlreadyExists: IDL.Text,
        InvalidInput: IDL.Text,
        Unauthorized: IDL.Text,
        PaymentFailed: IDL.Text,
        InsufficientFunds: IDL.Null,
        LedgerError: IDL.Text,
        StageNotApproved: IDL.Null,
        BookingNotFunded: IDL.Null,
        InvalidStatus: IDL.Text
      })
    })]),

    getBookingById: IDL.Func([IDL.Text], [IDL.Variant({
      ok: IDL.Record({
        booking_id: IDL.Text,
        service_id: IDL.Text,
        package_id: IDL.Text,
        client_id: IDL.Text,
        freelancer_id: IDL.Text,
        title: IDL.Text,
        description: IDL.Text,
        requirements: IDL.Vec(IDL.Text),
        status: IDL.Variant({ Pending: IDL.Null, Active: IDL.Null, InDispute: IDL.Null, Completed: IDL.Null, Paid: IDL.Null, Cancelled: IDL.Null }),
        payment_status: IDL.Variant({ Pending: IDL.Null, HeldInEscrow: IDL.Null, Released: IDL.Null, Refunded: IDL.Null, Disputed: IDL.Null }),
        total_amount_e8s: IDL.Nat64,
        currency: IDL.Text,
        created_at: IDL.Int,
        updated_at: IDL.Int,
        deadline: IDL.Int,
        milestones: IDL.Vec(IDL.Text),
        current_milestone: IDL.Opt(IDL.Text),
        client_review: IDL.Opt(IDL.Text),
        client_rating: IDL.Opt(IDL.Float64),
        freelancer_review: IDL.Opt(IDL.Text),
        freelancer_rating: IDL.Opt(IDL.Float64),
        dispute_id: IDL.Opt(IDL.Text),
        isPaid: IDL.Bool
      }),
      err: IDL.Variant({
        NotFound: IDL.Text,
        AlreadyExists: IDL.Text,
        InvalidInput: IDL.Text,
        Unauthorized: IDL.Text,
        PaymentFailed: IDL.Text,
        InsufficientFunds: IDL.Null,
        LedgerError: IDL.Text,
        StageNotApproved: IDL.Null,
        BookingNotFunded: IDL.Null,
        InvalidStatus: IDL.Text
      })
    })]),

    listBookingsForClient: IDL.Func([IDL.Text, IDL.Opt(IDL.Variant({ Pending: IDL.Null, Active: IDL.Null, InDispute: IDL.Null, Completed: IDL.Null, Paid: IDL.Null, Cancelled: IDL.Null })), IDL.Nat, IDL.Nat], [IDL.Variant({
      ok: IDL.Vec(IDL.Record({
        booking_id: IDL.Text,
        service_id: IDL.Text,
        package_id: IDL.Text,
        client_id: IDL.Text,
        freelancer_id: IDL.Text,
        title: IDL.Text,
        description: IDL.Text,
        requirements: IDL.Vec(IDL.Text),
        status: IDL.Variant({ Pending: IDL.Null, Active: IDL.Null, InDispute: IDL.Null, Completed: IDL.Null, Paid: IDL.Null, Cancelled: IDL.Null }),
        payment_status: IDL.Variant({ Pending: IDL.Null, HeldInEscrow: IDL.Null, Released: IDL.Null, Refunded: IDL.Null, Disputed: IDL.Null }),
        total_amount_e8s: IDL.Nat64,
        currency: IDL.Text,
        created_at: IDL.Int,
        updated_at: IDL.Int,
        deadline: IDL.Int,
        milestones: IDL.Vec(IDL.Text),
        current_milestone: IDL.Opt(IDL.Text),
        client_review: IDL.Opt(IDL.Text),
        client_rating: IDL.Opt(IDL.Float64),
        freelancer_review: IDL.Opt(IDL.Text),
        freelancer_rating: IDL.Opt(IDL.Float64),
        dispute_id: IDL.Opt(IDL.Text),
        isPaid: IDL.Bool
      })),
      err: IDL.Variant({
        NotFound: IDL.Text,
        AlreadyExists: IDL.Text,
        InvalidInput: IDL.Text,
        Unauthorized: IDL.Text,
        PaymentFailed: IDL.Text,
        InsufficientFunds: IDL.Null,
        LedgerError: IDL.Text,
        StageNotApproved: IDL.Null,
        BookingNotFunded: IDL.Null,
        InvalidStatus: IDL.Text
      })
    })]),

    listBookingsForFreelancer: IDL.Func([IDL.Text, IDL.Opt(IDL.Variant({ Pending: IDL.Null, Active: IDL.Null, InDispute: IDL.Null, Completed: IDL.Null, Paid: IDL.Null, Cancelled: IDL.Null })), IDL.Nat, IDL.Nat], [IDL.Variant({
      ok: IDL.Vec(IDL.Record({
        booking_id: IDL.Text,
        service_id: IDL.Text,
        package_id: IDL.Text,
        client_id: IDL.Text,
        freelancer_id: IDL.Text,
        title: IDL.Text,
        description: IDL.Text,
        requirements: IDL.Vec(IDL.Text),
        status: IDL.Variant({ Pending: IDL.Null, Active: IDL.Null, InDispute: IDL.Null, Completed: IDL.Null, Paid: IDL.Null, Cancelled: IDL.Null }),
        payment_status: IDL.Variant({ Pending: IDL.Null, HeldInEscrow: IDL.Null, Released: IDL.Null, Refunded: IDL.Null, Disputed: IDL.Null }),
        total_amount_e8s: IDL.Nat64,
        currency: IDL.Text,
        created_at: IDL.Int,
        updated_at: IDL.Int,
        deadline: IDL.Int,
        milestones: IDL.Vec(IDL.Text),
        current_milestone: IDL.Opt(IDL.Text),
        client_review: IDL.Opt(IDL.Text),
        client_rating: IDL.Opt(IDL.Float64),
        freelancer_review: IDL.Opt(IDL.Text),
        freelancer_rating: IDL.Opt(IDL.Float64),
        dispute_id: IDL.Opt(IDL.Text),
        isPaid: IDL.Bool
      })),
      err: IDL.Variant({
        NotFound: IDL.Text,
        AlreadyExists: IDL.Text,
        InvalidInput: IDL.Text,
        Unauthorized: IDL.Text,
        PaymentFailed: IDL.Text,
        InsufficientFunds: IDL.Null,
        LedgerError: IDL.Text,
        StageNotApproved: IDL.Null,
        BookingNotFunded: IDL.Null,
        InvalidStatus: IDL.Text
      })
    })]),

    // Stage methods
    getStageById: IDL.Func([IDL.Text], [IDL.Variant({
      ok: IDL.Record({
        stage_id: IDL.Text,
        booking_id: IDL.Text,
        stage_number: IDL.Nat,
        title: IDL.Text,
        description: IDL.Text,
        amount_e8s: IDL.Nat64,
        status: IDL.Variant({ Pending: IDL.Null, InProgress: IDL.Null, Submitted: IDL.Null, Approved: IDL.Null, Rejected: IDL.Null, Released: IDL.Null }),
        created_at: IDL.Int,
        updated_at: IDL.Int,
        submitted_at: IDL.Opt(IDL.Int),
        approved_at: IDL.Opt(IDL.Int),
        rejected_at: IDL.Opt(IDL.Int),
        released_at: IDL.Opt(IDL.Int),
        submission_notes: IDL.Opt(IDL.Text),
        submission_artifacts: IDL.Vec(IDL.Text),
        rejection_reason: IDL.Opt(IDL.Text)
      }),
      err: IDL.Text
    })]),

    listStagesForBooking: IDL.Func([IDL.Text], [IDL.Variant({
      ok: IDL.Vec(IDL.Record({
        stage_id: IDL.Text,
        booking_id: IDL.Text,
        stage_number: IDL.Nat,
        title: IDL.Text,
        description: IDL.Text,
        amount_e8s: IDL.Nat64,
        status: IDL.Variant({ Pending: IDL.Null, InProgress: IDL.Null, Submitted: IDL.Null, Approved: IDL.Null, Rejected: IDL.Null, Released: IDL.Null }),
        created_at: IDL.Int,
        updated_at: IDL.Int,
        submitted_at: IDL.Opt(IDL.Int),
        approved_at: IDL.Opt(IDL.Int),
        rejected_at: IDL.Opt(IDL.Int),
        released_at: IDL.Opt(IDL.Int),
        submission_notes: IDL.Opt(IDL.Text),
        submission_artifacts: IDL.Vec(IDL.Text),
        rejection_reason: IDL.Opt(IDL.Text)
      })),
      err: IDL.Text
    })]),

    createStages: IDL.Func([IDL.Text, IDL.Text, IDL.Vec(IDL.Record({
      stage_number: IDL.Nat,
      title: IDL.Text,
      description: IDL.Text,
      amount_e8s: IDL.Nat64
    }))], [IDL.Variant({
      ok: IDL.Vec(IDL.Record({
        stage_id: IDL.Text,
        booking_id: IDL.Text,
        stage_number: IDL.Nat,
        title: IDL.Text,
        description: IDL.Text,
        amount_e8s: IDL.Nat64,
        status: IDL.Variant({ Pending: IDL.Null, InProgress: IDL.Null, Submitted: IDL.Null, Approved: IDL.Null, Rejected: IDL.Null, Released: IDL.Null }),
        created_at: IDL.Int,
        updated_at: IDL.Int,
        submitted_at: IDL.Opt(IDL.Int),
        approved_at: IDL.Opt(IDL.Int),
        rejected_at: IDL.Opt(IDL.Int),
        released_at: IDL.Opt(IDL.Int),
        submission_notes: IDL.Opt(IDL.Text),
        submission_artifacts: IDL.Vec(IDL.Text),
        rejection_reason: IDL.Opt(IDL.Text)
      })),
      err: IDL.Text
    })]),

    submitStage: IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Vec(IDL.Text)], [IDL.Variant({
      ok: IDL.Record({
        stage_id: IDL.Text,
        booking_id: IDL.Text,
        stage_number: IDL.Nat,
        title: IDL.Text,
        description: IDL.Text,
        amount_e8s: IDL.Nat64,
        status: IDL.Variant({ Pending: IDL.Null, InProgress: IDL.Null, Submitted: IDL.Null, Approved: IDL.Null, Rejected: IDL.Null, Released: IDL.Null }),
        created_at: IDL.Int,
        updated_at: IDL.Int,
        submitted_at: IDL.Opt(IDL.Int),
        approved_at: IDL.Opt(IDL.Int),
        rejected_at: IDL.Opt(IDL.Int),
        released_at: IDL.Opt(IDL.Int),
        submission_notes: IDL.Opt(IDL.Text),
        submission_artifacts: IDL.Vec(IDL.Text),
        rejection_reason: IDL.Opt(IDL.Text)
      }),
      err: IDL.Text
    })]),

    approveStage: IDL.Func([IDL.Text, IDL.Text], [IDL.Variant({
      ok: IDL.Record({
        stage_id: IDL.Text,
        booking_id: IDL.Text,
        stage_number: IDL.Nat,
        title: IDL.Text,
        description: IDL.Text,
        amount_e8s: IDL.Nat64,
        status: IDL.Variant({ Pending: IDL.Null, InProgress: IDL.Null, Submitted: IDL.Null, Approved: IDL.Null, Rejected: IDL.Null, Released: IDL.Null }),
        created_at: IDL.Int,
        updated_at: IDL.Int,
        submitted_at: IDL.Opt(IDL.Int),
        approved_at: IDL.Opt(IDL.Int),
        rejected_at: IDL.Opt(IDL.Int),
        released_at: IDL.Opt(IDL.Int),
        submission_notes: IDL.Opt(IDL.Text),
        submission_artifacts: IDL.Vec(IDL.Text),
        rejection_reason: IDL.Opt(IDL.Text)
      }),
      err: IDL.Text
    })]),

    rejectStage: IDL.Func([IDL.Text, IDL.Text, IDL.Text], [IDL.Variant({
      ok: IDL.Record({
        stage_id: IDL.Text,
        booking_id: IDL.Text,
        stage_number: IDL.Nat,
        title: IDL.Text,
        description: IDL.Text,
        amount_e8s: IDL.Nat64,
        status: IDL.Variant({ Pending: IDL.Null, InProgress: IDL.Null, Submitted: IDL.Null, Approved: IDL.Null, Rejected: IDL.Null, Released: IDL.Null }),
        created_at: IDL.Int,
        updated_at: IDL.Int,
        submitted_at: IDL.Opt(IDL.Int),
        approved_at: IDL.Opt(IDL.Int),
        rejected_at: IDL.Opt(IDL.Int),
        released_at: IDL.Opt(IDL.Int),
        submission_notes: IDL.Opt(IDL.Text),
        submission_artifacts: IDL.Vec(IDL.Text),
        rejection_reason: IDL.Opt(IDL.Text)
      }),
      err: IDL.Text
    })]),

    // Booking status update methods
    updateBookingStatusWithTimeline: IDL.Func([
      IDL.Text, // bookingId
      IDL.Text, // userId
      IDL.Variant({ Pending: IDL.Null, Active: IDL.Null, InDispute: IDL.Null, Completed: IDL.Null, Paid: IDL.Null, Cancelled: IDL.Null }), // status
      IDL.Text // description
    ], [IDL.Variant({
      ok: IDL.Null,
      err: IDL.Variant({
        NotFound: IDL.Text,
        Unauthorized: IDL.Text,
        InvalidInput: IDL.Text,
        InvalidStatus: IDL.Text
      })
    })]),

    // Payment status update (for escrow release)
    updateBookingPaymentStatus: IDL.Func([
      IDL.Text, // bookingId
      IDL.Text, // userId
      IDL.Variant({ Pending: IDL.Null, HeldInEscrow: IDL.Null, Released: IDL.Null, Refunded: IDL.Null, Disputed: IDL.Null }) // paymentStatus
    ], [IDL.Variant({
      ok: IDL.Null,
      err: IDL.Text
    })]),

    // Mark booking as paid — mirrors job_marketplace's markJobAsPaid
    markBookingAsPaid: IDL.Func([
      IDL.Text, // bookingId
      IDL.Text  // clientId
    ], [IDL.Variant({
      ok: IDL.Null,
      err: IDL.Text
    })]),

    // Review methods
    submitReview: IDL.Func([IDL.Text, IDL.Float64, IDL.Text], [IDL.Variant({ ok: IDL.Null, err: IDL.Text })]),
    addBookingReview: IDL.Func([IDL.Text, IDL.Text, IDL.Float64, IDL.Text, IDL.Bool], [IDL.Variant({
      ok: IDL.Null,
      err: IDL.Variant({
        NotFound: IDL.Text,
        Unauthorized: IDL.Text,
        InvalidInput: IDL.Text,
        InvalidStatus: IDL.Text
      })
    })]),

    // Admin methods
    getMarketplaceStats: IDL.Func([], [IDL.Record({
      total_services: IDL.Nat,
      active_services: IDL.Nat,
      total_bookings: IDL.Nat,
      active_bookings: IDL.Nat,
      total_revenue_e8s: IDL.Nat64
    })]),

    // Alias for backward compatibility
    getStats: IDL.Func([], [IDL.Record({
      total_services: IDL.Nat,
      active_services: IDL.Nat,
      total_bookings: IDL.Nat,
      active_bookings: IDL.Nat,
      total_revenue_e8s: IDL.Nat64
    })])
  });
};

// Type imports from generated declarations
type _SERVICE = any;

// Marketplace Types
export interface Service {
  service_id: string;
  freelancer_id: string;
  title: string;
  main_category: string;
  sub_category: string;
  description: string;
  whats_included: string;
  cover_image_url?: string;
  portfolio_images: string[];
  status: 'Active' | 'Paused' | 'Deleted';
  created_at: number;
  updated_at: number;
  delivery_time_days: number;
  starting_from_e8s: bigint;
  total_rating: number;
  review_count: number;
  tags: string[];
  tier_mode: string;
}

export interface Booking {
  booking_id: string;
  service_id: string;
  package_id: string;
  client_id: string;
  freelancer_id: string;
  title: string;
  description: string;
  requirements: string[];
  status: 'Pending' | 'Active' | 'InDispute' | 'Completed' | 'Paid' | 'Cancelled';
  payment_status: 'Pending' | 'HeldInEscrow' | 'Released' | 'Refunded' | 'Disputed';
  total_amount_e8s: bigint;
  currency: string;
  created_at: number;
  updated_at: number;
  deadline: number;
  milestones: string[];
  current_milestone?: string;
  client_review?: string;
  client_rating?: number;
  freelancer_review?: string;
  freelancer_rating?: number;
  dispute_id?: string;
  isPaid: boolean;
}

export interface BookingResponse {
  booking_id: string;
  escrow_account: string;
  amount_e8s: bigint;
  ledger_block?: bigint;
}

export interface ApiError {
  NotFound?: string;
  AlreadyExists?: string;
  InvalidInput?: string;
  Unauthorized?: string;
  PaymentFailed?: string;
  InsufficientFunds?: boolean;
  LedgerError?: string;
  StageNotApproved?: boolean;
  BookingNotFunded?: boolean;
  InvalidStatus?: string;
}

export interface MarketplaceStats {
  total_services: number;
  active_services: number;
  total_bookings: number;
  active_bookings: number;
  total_revenue_e8s: bigint;
}

// IC Agent configuration
const IC_HOST = process.env.NEXT_PUBLIC_IC_HOST || 'http://localhost:4943';
const MARKETPLACE_CANISTER_ID = process.env.NEXT_PUBLIC_MARKETPLACE_CANISTER_ID || '';

let agent: HttpAgent | null = null;
let marketplaceActor: _SERVICE | null = null;

export async function getICAgent(): Promise<HttpAgent> {
  if (!agent) {
    agent = new HttpAgent({
      host: IC_HOST,
      verifyQuerySignatures: false // Set to true in production
    });

    // In development, we don't need to fetch the root key
    if (IC_HOST.includes('localhost')) {
      await agent.fetchRootKey();
    }
  }
  return agent;
}

export async function getMarketplaceActor(): Promise<_SERVICE> {
  if (!marketplaceActor) {
    const agent = await getICAgent();
    const canisterId = Principal.fromText(MARKETPLACE_CANISTER_ID);

    marketplaceActor = Actor.createActor(idlFactory, {
      agent,
      canisterId,
    });
  }
  return marketplaceActor;
}

// Helper function to create a real actor with IDL
export async function createActorWithIDL<T>(
  canisterId: string,
  idlFactory: any
): Promise<T> {
  const agent = await getICAgent();
  const principal = Principal.fromText(canisterId);
  return Actor.createActor(idlFactory, { agent, canisterId: principal });
}

// Environment variables validation
export function validateMarketplaceConfig(): void {
  if (!process.env.NEXT_PUBLIC_MARKETPLACE_CANISTER_ID) {
    throw new Error('NEXT_PUBLIC_MARKETPLACE_CANISTER_ID environment variable is required');
  }
}

// Initialize IC connection
export async function initializeMarketplace(): Promise<void> {
  validateMarketplaceConfig();
  await getICAgent();
  await getMarketplaceActor();
}

// Utility functions
export function e8sToICP(e8s: bigint): number {
  return Number(e8s) / 100_000_000;
}

export function icpToE8s(icp: number): bigint {
  return BigInt(Math.floor(icp * 100_000_000));
}

export function formatICP(amount: bigint): string {
  const icp = e8sToICP(amount);
  return icp.toFixed(2) + ' ICP';
}

// Error handling helper
export function handleApiError(error: any): string {
  if (typeof error === 'object' && error !== null) {
    if ('err' in error) {
      const err = error.err;
      if (typeof err === 'object') {
        if ('NotFound' in err) return `Not found: ${err.NotFound}`;
        if ('AlreadyExists' in err) return `Already exists: ${err.AlreadyExists}`;
        if ('InvalidInput' in err) return `Invalid input: ${err.InvalidInput}`;
        if ('Unauthorized' in err) return `Unauthorized: ${err.Unauthorized}`;
        if ('PaymentFailed' in err) return `Payment failed: ${err.PaymentFailed}`;
        if ('InsufficientFunds' in err) return 'Insufficient funds';
        if ('LedgerError' in err) return `Ledger error: ${err.LedgerError}`;
        if ('StageNotApproved' in err) return 'Stage not approved';
        if ('BookingNotFunded' in err) return 'Booking not funded';
        if ('InvalidStatus' in err) return `Invalid status: ${err.InvalidStatus}`;
      }
    }
  }
  return 'Unknown error occurred';
}

// BigInt serialization helper
export function serializeBigInts(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return obj.toString();
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeBigInts);
  }

  if (typeof obj === 'object') {
    const serialized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeBigInts(value);
    }
    return serialized;
  }

  return obj;
}