import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Buffer "mo:base/Buffer";
import Result "mo:base/Result";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Int "mo:base/Int";
import _Int64 "mo:base/Int64";
import Iter "mo:base/Iter";
import Char "mo:base/Char";
import Order "mo:base/Order";
import Principal "mo:base/Principal";
import Debug "mo:base/Debug";
import Array "mo:base/Array";
import _Option "mo:base/Option";
import Float "mo:base/Float";

// Import UserCanister for authentication
// import UserCanister "canister:user_v2"; // Commented out for now

actor MarketplaceCanister {
  // ========================================
  // TYPE DEFINITIONS
  // ========================================

  type ServiceId = Text;
  type PackageId = Text;
  type BookingId = Text;
  type StageId = Text;
  type TransactionId = Text;
  type UserId = Text;

  // Service Types
  type ServiceStatus = {
    #Active;
    #Paused;
    #Deleted;
  };

  type Service = {
    service_id: ServiceId;
    freelancer_id: UserId;
    title: Text;
    main_category: Text;
    sub_category: Text;
    description: Text;
    whats_included: Text;
    cover_image_url: ?Text;
    portfolio_images: [Text];
    status: ServiceStatus;
    created_at: Int;
    updated_at: Int;
    delivery_time_days: Nat;
    starting_from_e8s: Nat64;
    total_rating: Float;
    review_count: Nat;
    tags: [Text];
    tier_mode: Text; // "1tier" or "3tier"
  };

  type Package = {
    package_id: PackageId;
    service_id: ServiceId;
    name: Text;
    description: Text;
    price_e8s: Nat64;
    delivery_time_days: Nat;
    delivery_timeline: Text;
    revisions: Nat;
    features: [Text];
    is_active: Bool;
    created_at: Int;
  };

  type PackageFeatures = {
    basic: Package;
    standard: ?Package;
    premium: ?Package;
  };

  // Project Stages
  type StageStatus = {
    #Pending;
    #InProgress;
    #Completed;
    #Cancelled;
    #Approved;
    #Rejected;
    #Disputed;
  };

  type ProjectStage = {
    stage_id: StageId;
    booking_id: BookingId;
    stage_name: Text;
    description: Text;
    status: StageStatus;
    amount_e8s: Nat64;
    due_date: Int;
    created_at: Int;
    completed_at: ?Int;
    deliverables: [Text];
    client_approved: Bool;
    freelancer_approved: Bool;
    dispute_reason: ?Text;
  };

  // Booking Types
  type BookingStatus = {
    #Pending;
    #Active;
    #InDispute;
    #Completed;
    #Paid;
    #Cancelled;
  };

  type PaymentStatus = {
    #Pending;
    #HeldInEscrow;
    #Released;
    #Refunded;
    #Disputed;
  };

  type Booking = {
    booking_id: BookingId;
    service_id: ServiceId;
    package_id: PackageId;
    client_id: UserId;
    freelancer_id: UserId;
    title: Text;
    description: Text;
    requirements: [Text];
    status: BookingStatus;
    payment_status: PaymentStatus;
    total_amount_e8s: Nat64;
    currency: Text;
    created_at: Int;
    updated_at: Int;
    deadline: Int;

    // Enhanced lifecycle timestamps
    booking_confirmed_at: ?Int;
    payment_completed_at: ?Int;
    delivery_deadline: Int;
    work_started_at: ?Int;
    work_completed_at: ?Int;
    client_reviewed_at: ?Int;
    freelancer_reviewed_at: ?Int;

    // Time tracking fields
    delivery_days: Nat;
    time_remaining_hours: Nat;

    // Human-readable fields for frontend
    created_at_readable: Text;
    booking_confirmed_at_readable: Text;
    payment_completed_at_readable: Text;
    delivery_deadline_readable: Text;

    milestones: [StageId];
    current_milestone: ?StageId;
    client_review: ?Text;
    client_rating: ?Float;
    freelancer_review: ?Text;
    freelancer_rating: ?Float;
    dispute_id: ?Text;
    isPaid: Bool;

    // ========================================
    // ENRICHED FIELDS FOR COMPLETE BOOKING DATA
    // ========================================
    
    // User full names
    client_name: Text;
    freelancer_name: Text;
    
    // Package details
    package_title: Text;
    package_description: Text;
    package_tier: Text;              // "basic", "standard", "premium"
    package_revisions: Nat;
    package_features: [Text];
    
    // Payment breakdown
    base_amount_e8s: Nat64;          // Amount before platform fee
    platform_fee_e8s: Nat64;         // 5% platform fee
    escrow_amount_e8s: Nat64;        // Amount held in escrow (95% of total)
    payment_method: Text;            // "credit-card", "bitpay", "icp"
    payment_id: Text;
    transaction_id: Text;
    
    // Enhancements and discounts
    upsells: [{
      id: Text;
      name: Text;
      price_e8s: Nat64;
      category: Text;
    }];
    promo_code: ?Text;
    discount_amount_e8s: Nat64;
    
    // Additional metadata
    special_instructions: Text;
    ledger_deposit_block: ?Nat64;   // ICP ledger block number for payment
  };

  // Review System
  type Review = {
    review_id: Text;
    booking_id: BookingId;
    reviewer_id: UserId;
    reviewee_id: UserId;
    rating: Float;
    comment: Text;
    created_at: Int;
    helpful_count: Nat;
  };

  type ReviewFilter = {
    rating_filter: ?Float;
    date_range: ?{
      start_date: Int;
      end_date: Int;
    };
    has_comment: Bool;
  };

  // Dispute System
  type DisputeType = {
    #QualityIssue;
    #DeadlineMiss;
    #CommunicationIssue;
    #PaymentIssue;
    #Other;
  };

  type DisputeStatus = {
    #Open;
    #UnderReview;
    #Resolved;
    #Dismissed;
  };

  type Dispute = {
    dispute_id: Text;
    booking_id: BookingId;
    raised_by: UserId;
    dispute_type: DisputeType;
    description: Text;
    evidence: [Text];
    status: DisputeStatus;
    resolution: ?Text;
    resolved_by: ?UserId;
    created_at: Int;
    updated_at: Int;
  };

  // Payment System
  type PaymentMethod = {
    #ICP;
    #CreditCard;
    #PayPal;
    #BankTransfer;
  };

  type Transaction = {
    transaction_id: TransactionId;
    booking_id: BookingId;
    payer_id: UserId;
    payee_id: UserId;
    amount_e8s: Nat64;
    fee_e8s: Nat64;
    payment_method: PaymentMethod;
    status: PaymentStatus;
    transaction_type: {
      #ServicePayment;
      #Refund;
      #DisputeResolution;
    };
    created_at: Int;
    processed_at: ?Int;
  };

  // Escrow System
  type EscrowStatus = {
    #Pending;
    #Funded;
    #Released;
    #Refunded;
  };

  type EscrowTransaction = {
    transaction_id: TransactionId;
    booking_id: BookingId;
    amount_e8s: Nat64;
    fee_e8s: Nat64;
    client_id: UserId;
    freelancer_id: UserId;
    status: EscrowStatus;
    created_at: Int;
    funded_at: ?Int;
    released_at: ?Int;
    refunded_at: ?Int;
    release_conditions: [Text];
  };

  // Timeline Event System
  type TimelineEventType = {
    #BookingCreated;
    #BookingConfirmed;
    #PaymentCompleted;
    #WorkStarted;
    #WorkCompleted;
    #StageCreated;
    #StageUpdated;
    #StageApproved;
    #StageRejected;
    #ClientReviewed;
    #FreelancerReviewed;
    #BookingCompleted;
    #BookingCancelled;
    #DisputeRaised;
    #DisputeResolved;
  };

  type TimelineEvent = {
    event_id: Text;
    booking_id: BookingId;
    event_type: TimelineEventType;
    timestamp: Int;
    description: Text;
    metadata: ?[(Text, Text)]; // Key-value pairs for additional data
    created_by: UserId;
  };

  // Query Types
  type ServiceFilter = {
    category: ?Text;
    sub_category: ?Text;
    price_range: ?{
      min_e8s: Nat64;
      max_e8s: Nat64;
    };
    delivery_time: ?{
      min_days: Nat;
      max_days: Nat;
    };
    rating: ?Float;
    tags: [Text];
    freelancer_id: ?UserId;
  };

  type SortOption = {
    field: Text;
    direction: {
      #Ascending;
      #Descending;
    };
  };

  type PaginationParams = {
    limit: Nat;
    offset: Nat;
  };

  // Response Types
  type BookingResponse = {
    booking_id: BookingId;
    escrow_account: Text;
    amount_e8s: Nat64;
    ledger_block: ?Nat64;
  };

  // API Error Types
  type ApiError = {
    #NotFound: Text;
    #AlreadyExists: Text;
    #InvalidInput: Text;
    #Unauthorized: Text;
    #PaymentFailed: Text;
    #InsufficientFunds;
    #LedgerError: Text;
    #StageNotApproved;
    #BookingNotFunded;
    #InvalidStatus: Text;
  };

  // ========================================
  // CANISTER STATE
  // ========================================

  // Stable storage for upgrade persistence
  var servicesEntries: [(ServiceId, Service)] = [];
  var packagesEntries: [(PackageId, Package)] = [];
  var bookingsEntries: [(BookingId, Booking)] = [];
  var stagesEntries: [(StageId, ProjectStage)] = [];
  var transactionsEntries: [(TransactionId, EscrowTransaction)] = [];
  var timelineEventsEntries: [(Text, TimelineEvent)] = [];
  var _idempotencyKeys: [Text] = [];
  var eventLogEntries: [Text] = [];

  // Transient storage
  private flexible var services = HashMap.HashMap<ServiceId, Service>(0, Text.equal, Text.hash);
  private flexible var packages = HashMap.HashMap<PackageId, Package>(0, Text.equal, Text.hash);
  private flexible var bookings = HashMap.HashMap<BookingId, Booking>(0, Text.equal, Text.hash);
  private flexible var stages = HashMap.HashMap<StageId, ProjectStage>(0, Text.equal, Text.hash);
  private flexible var transactions = HashMap.HashMap<TransactionId, EscrowTransaction>(0, Text.equal, Text.hash);
  private flexible var timelineEvents = HashMap.HashMap<Text, TimelineEvent>(0, Text.equal, Text.hash);
  private flexible var usedIdempotencyKeys = HashMap.HashMap<Text, Bool>(0, Text.equal, Text.hash);
  private flexible var eventLog = Buffer.Buffer<Text>(0);

  // Configuration
  private let _ESCROW_FEE_PERCENTAGE = 4.0; // 4% platform fee (Basic plan default)
  private let MAX_REVIEW_LENGTH = 1000;
  private let MIN_SERVICE_TITLE_LENGTH = 10;
  private let MAX_SERVICE_TITLE_LENGTH = 100;

  // ========================================
  // SYSTEM FUNCTIONS
  // ========================================

  system func preupgrade() {
    servicesEntries := Iter.toArray(services.entries());
    packagesEntries := Iter.toArray(packages.entries());
    bookingsEntries := Iter.toArray(bookings.entries());
    stagesEntries := Iter.toArray(stages.entries());
    transactionsEntries := Iter.toArray(transactions.entries());
    timelineEventsEntries := Iter.toArray(timelineEvents.entries());
    eventLogEntries := Buffer.toArray(eventLog);
  };

  system func postupgrade() {
    for ((id, service) in servicesEntries.vals()) {
      services.put(id, service);
    };
    for ((id, package) in packagesEntries.vals()) {
      packages.put(id, package);
    };
    for ((id, booking) in bookingsEntries.vals()) {
      bookings.put(id, booking);
    };
    for ((id, stage) in stagesEntries.vals()) {
      stages.put(id, stage);
    };
    for ((id, transaction) in transactionsEntries.vals()) {
      transactions.put(id, transaction);
    };
    for ((id, event) in timelineEventsEntries.vals()) {
      timelineEvents.put(id, event);
    };
    servicesEntries := [];
    packagesEntries := [];
    bookingsEntries := [];
    stagesEntries := [];
    transactionsEntries := [];
    timelineEventsEntries := [];
    for (entry in eventLogEntries.vals()) {
      eventLog.add(entry);
    };
    eventLogEntries := [];
  };

  // ========================================
  // HELPER FUNCTIONS
  // ========================================

  private func generateId(prefix: Text): Text {
    let chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
    let size = 21;
    var result = Text.toLowercase(prefix) # "_";
    var i = 0;
    while (i < size) {
      let random = Int.abs(Time.now() + i) % 62;
      result := result # Char.toText(chars[random]);
      i += 1;
    };
    result
  };

  private func getCurrentTime(): Int {
    Time.now();
  };

  // Helper functions for timeline management
  private func addTimelineEvent(
    bookingId: BookingId,
    eventType: TimelineEventType,
    description: Text,
    metadata: ?[(Text, Text)],
    createdBy: UserId
  ): () {
    let eventId = generateId("TE");
    let event: TimelineEvent = {
      event_id = eventId;
      booking_id = bookingId;
      event_type = eventType;
      timestamp = getCurrentTime();
      description = description;
      metadata = metadata;
      created_by = createdBy;
    };
    timelineEvents.put(eventId, event);
    logEvent("Timeline event added: " # eventId # " for booking " # bookingId # " - " # description);
  };

  private func _formatTimestamp(timestamp: Int): Text {
    // Convert nanoseconds to milliseconds for Date object
    let milliseconds = timestamp / 1000000;
    // This creates a simple readable format - in production, you might want more sophisticated formatting
    "T" # Int.toText(milliseconds);
  };

  private func calculateTimeRemaining(deadline: Int): Nat {
    let now = getCurrentTime();
    if (deadline <= now) {
      0 // Already past deadline
    } else {
      // Calculate hours remaining (nanoseconds to hours)
      Nat64.toNat(Nat64.fromIntWrap(Int.abs((deadline - now) / 3600000000000))) // Convert nanoseconds to hours
    }
  };

  private func createHumanReadableTimestamp(timestamp: Int): Text {
    let milliseconds = timestamp / 1000000;
    // Convert to Unix timestamp in seconds and create ISO-like format
    let seconds = milliseconds / 1000;
    let _nanoseconds = timestamp % 1000000000;

    // Simple date formatting - you may want to enhance this
    let year = 2025; // Placeholder - implement proper date calculation
    let month = 1;
    let day = 1;
    let hour = (seconds / 3600) % 24;
    let minute = (seconds / 60) % 60;
    let second = seconds % 60;

    // Format: 2025-01-01T12:30:45.123Z
    Int.toText(year) # "-" #
    (if (month < 10) "0" else "") # Int.toText(month) # "-" #
    (if (day < 10) "0" else "") # Int.toText(day) # "T" #
    (if (hour < 10) "0" else "") # Int.toText(hour) # ":" #
    (if (minute < 10) "0" else "") # Int.toText(minute) # ":" #
    (if (second < 10) "0" else "") # Int.toText(second) # ".Z"
  };

  // ========================================
  // BOOKING CONSTANTS AND HELPERS
  // ========================================

  private let PLATFORM_FEE_PERCENT: Float = 4.0; // 4% platform fee (Basic plan default)
  private let USE_MOCK_LEDGER: Bool = true;

  private func calculatePlatformFee(amount: Nat64): Nat64 {
    let amountFloat = Float.fromInt(Nat64.toNat(amount));
    let feeFloat = amountFloat * PLATFORM_FEE_PERCENT / 100.0;
    Nat64.fromNat(Int.abs(Float.toInt(feeFloat)));
  };

  // Mock ledger functions for testing
  private func mockLedgerTransfer(from: Principal, to: Principal, amount: Nat64): async Nat64 {
    Debug.print("Mock ledger transfer: " # Principal.toText(from) # " -> " # Principal.toText(to) # " amount: " # Nat64.toText(amount));
    // Return mock block index
    12345;
  };

  // Real ledger integration (to be implemented with ICRC-1)
  private func realLedgerTransfer(_from: Principal, _to: Principal, _amount: Nat64): async Result.Result<Nat64, Text> {
    // TODO: Implement real ICRC-1 ledger integration
    // This would call the actual ledger canister
    #ok(12345); // Placeholder
  };

  // Authorization helper - simplified version for testing
  // Note: Currently unused as we moved to session-based auth in API layer
  private func _verifyCaller(_userId: Text, _caller: Principal): async Bool {
    // For development, we'll allow any authenticated caller
    // In production, implement proper user-principal verification
    true;
  };

  private func logEvent(event: Text): () {
    let timestamp = Int.toText(getCurrentTime());
    let logEntry = "[" # timestamp # "] " # event;
    eventLog.add(logEntry);
  };

  private func _calculateServiceRating(reviews: [Review]): Float {
    if (reviews.size() == 0) {
      return 0.0;
    };
    var total = 0.0;
    for (review in reviews.vals()) {
      total += review.rating;
    };
    total / Float.fromInt(reviews.size())
  };

  private func validateServiceInput(service: Service): Result.Result<(), Text> {
    if (service.title.size() < MIN_SERVICE_TITLE_LENGTH or service.title.size() > MAX_SERVICE_TITLE_LENGTH) {
      return #err("Invalid title length");
    };
    if (service.description.size() == 0) {
      return #err("Description cannot be empty");
    };
    if (service.starting_from_e8s == 0) {
      return #err("Price must be greater than 0");
    };
    if (service.delivery_time_days == 0) {
      return #err("Delivery time must be greater than 0");
    };
    #ok(())
  };

  // ========================================
  // SERVICE MANAGEMENT
  // ========================================

  public shared func createService(
    freelancer_id: UserId,
    title: Text,
    main_category: Text,
    sub_category: Text,
    description: Text,
    whats_included: Text,
    delivery_time_days: Nat,
    starting_from_e8s: Nat64,
    tags: [Text],
    tier_mode: Text
  ): async Result.Result<ServiceId, Text> {
    let service_id = generateId("SVC");
    let service: Service = {
      service_id = service_id;
      freelancer_id = freelancer_id;
      title = title;
      main_category = main_category;
      sub_category = sub_category;
      description = description;
      whats_included = whats_included;
      cover_image_url = null;
      portfolio_images = [];
      status = #Active;
      created_at = Time.now();
      updated_at = Time.now();
      delivery_time_days = delivery_time_days;
      starting_from_e8s = starting_from_e8s;
      total_rating = 0.0;
      review_count = 0;
      tags = tags;
      tier_mode = tier_mode;
    };

    switch (validateServiceInput(service)) {
      case (#ok()) {
        services.put(service_id, service);
        #ok(service_id)
      };
      case (#err(msg)) {
        #err(msg)
      }
    }
  };

  // Get all packages for a specific service
  public query func getPackagesByServiceId(service_id: ServiceId): async [Package] {
    let buffer = Buffer.Buffer<Package>(0);
    for ((_, package) in packages.entries()) {
      if (package.service_id == service_id and package.is_active) {
        buffer.add(package);
      }
    };
    Buffer.toArray(buffer)
  };

  public query func getAllServices(): async [Service] {
    // Return all services from the services HashMap
    Iter.toArray(services.vals());
  };

  // New method to create service without freelancer authentication (for payment flow)
  public shared func createServiceForBooking(
    service_id: ServiceId,
    freelancer_id: Text,
    title: Text,
    main_category: Text,
    sub_category: Text,
    description: Text,
    whats_included: Text,
    delivery_time_days: Nat,
    starting_from_e8s: Nat64,
    tags: [Text],
    tier_mode: Text
  ): async Result.Result<ServiceId, Text> {
    // Check if service already exists
        switch (services.get(service_id)) {
          case (?_existingService) {
            // Service already exists, return success
            #ok(service_id)
          };
          case null {
        // Create new service
        let service: Service = {
          service_id = service_id;
          freelancer_id = freelancer_id;
          title = title;
          main_category = main_category;
          sub_category = sub_category;
          description = description;
          whats_included = whats_included;
          cover_image_url = null;
          portfolio_images = [];
          status = #Active;
          created_at = Time.now();
          updated_at = Time.now();
          delivery_time_days = delivery_time_days;
          starting_from_e8s = starting_from_e8s;
          total_rating = 0.0;
          review_count = 0;
          tags = tags;
          tier_mode = tier_mode;
        };

        switch (validateServiceInput(service)) {
          case (#ok()) {
            services.put(service_id, service);
            #ok(service_id)
          };
          case (#err(msg)) {
            #err(msg)
          }
        }
      }
    }
  };

  public shared func createPackage(
    service_id: ServiceId,
    name: Text,
    description: Text,
    price_e8s: Nat64,
    delivery_time_days: Nat,
    delivery_timeline: Text,
    revisions: Nat,
    features: [Text]
  ): async Result.Result<PackageId, Text> {
    // Verify service exists and caller is the owner
    switch (services.get(service_id)) {
      case (?service) {
        // TODO: Add proper authentication check
        // if (service.freelancer_id != Principal.toText(caller)) {
        //   return #err("Not authorized to create package for this service");
        // };

        let package_id = generateId("PKG");
        let package: Package = {
          package_id = package_id;
          service_id = service_id;
          name = name;
          description = description;
          price_e8s = price_e8s;
          delivery_time_days = delivery_time_days;
          delivery_timeline = delivery_timeline;
          revisions = revisions;
          features = features;
          is_active = true;
          created_at = Time.now();
        };

        packages.put(package_id, package);
        #ok(package_id)
      };
      case null {
        #err("Service not found")
      }
    }
  };

  // New method to create package without freelancer authentication (for payment flow)
  public shared func createPackageForBooking(
    service_id: ServiceId,
    package_id: PackageId,
    name: Text,
    description: Text,
    price_e8s: Nat64,
    delivery_time_days: Nat,
    delivery_timeline: Text,
    revisions: Nat,
    features: [Text]
  ): async Result.Result<PackageId, Text> {
    // Verify service exists (no freelancer authentication required)
    switch (services.get(service_id)) {
      case (?service) {
        // Check if package already exists
        switch (packages.get(package_id)) {
          case (?_existingPackage) {
            // Package already exists, return success
            #ok(package_id)
          };
          case null {
            // Create new package
            let package: Package = {
              package_id = package_id;
              service_id = service_id;
              name = name;
              description = description;
              price_e8s = price_e8s;
              delivery_time_days = delivery_time_days;
              delivery_timeline = delivery_timeline;
              revisions = revisions;
              features = features;
              is_active = true;
              created_at = Time.now();
            };

            packages.put(package_id, package);
            #ok(package_id)
          }
        }
      };
      case null {
        #err("Service not found")
      }
    }
  };

  public shared func updateService(
    service_id: ServiceId,
    title: Text,
    main_category: Text,
    sub_category: Text,
    description: Text,
    whats_included: Text,
    cover_image_url: ?Text,
    portfolio_images: [Text],
    delivery_time_days: Nat,
    starting_from_e8s: Nat64,
    tags: [Text],
    tier_mode: Text
  ): async Result.Result<(), Text> {
    switch (services.get(service_id)) {
      case (?existing_service) {
        // TODO: Add proper authentication check
        // if (existing_service.freelancer_id != Principal.toText(caller)) {
        //   return #err("Not authorized to update this service");
        // };

        let updated_service: Service = {
          existing_service with
          title = title;
          main_category = main_category;
          sub_category = sub_category;
          description = description;
          whats_included = whats_included;
          cover_image_url = cover_image_url;
          portfolio_images = portfolio_images;
          delivery_time_days = delivery_time_days;
          starting_from_e8s = starting_from_e8s;
          tags = tags;
          tier_mode = tier_mode;
          updated_at = Time.now();
        };

        switch (validateServiceInput(updated_service)) {
          case (#ok()) {
            services.put(service_id, updated_service);
            #ok(())
          };
          case (#err(msg)) {
            #err(msg)
          }
        }
      };
      case null {
        #err("Service not found")
      }
    }
  };

  public shared func updatePackage(
    package_id: PackageId,
    name: Text,
    description: Text,
    price_e8s: Nat64,
    delivery_time_days: Nat,
    delivery_timeline: Text,
    revisions: Nat,
    features: [Text]
  ): async Result.Result<(), Text> {
    switch (packages.get(package_id)) {
      case (?existing_package) {
        let updated_package: Package = {
          existing_package with
          name = name;
          description = description;
          price_e8s = price_e8s;
          delivery_time_days = delivery_time_days;
          delivery_timeline = delivery_timeline;
          revisions = revisions;
          features = features;
        };

        packages.put(package_id, updated_package);
        #ok(())
      };
      case null {
        #err("Package not found")
      }
    }
  };

  public shared func deleteService(service_id: ServiceId): async Result.Result<(), Text> {
    switch (services.get(service_id)) {
      case (?service) {
        // TODO: Add proper authentication check
        // if (service.freelancer_id != Principal.toText(caller)) {
        //   return #err("Not authorized to delete this service");
        // };

        let deleted_service = { service with status = #Deleted };
        services.put(service_id, deleted_service);
        #ok(())
      };
      case null {
        #err("Service not found")
      }
    }
  };

  public shared func getService(service_id: ServiceId): async ?Service {
    services.get(service_id)
  };

  public query func getServicesByFreelancer(
    freelancer_id: UserId,
    pagination: PaginationParams
  ): async [Service] {
    let buffer = Buffer.Buffer<Service>(0);
    for ((_, service) in services.entries()) {
      if (service.freelancer_id == freelancer_id and service.status != #Deleted) {
        buffer.add(service);
      }
    };
    let result = Buffer.toArray(buffer);
    let start = Nat.min(pagination.offset, result.size());
    let end = Nat.min(start + pagination.limit, result.size());
    Iter.toArray(Array.slice(result, start, end))
  };

  public query func searchServices(
    filter: ServiceFilter,
    _sort: SortOption,
    pagination: PaginationParams
  ): async [Service] {
    let buffer = Buffer.Buffer<Service>(0);

    for ((_, service) in services.entries()) {
      if (service.status == #Deleted) {
        // Skip deleted services
      } else {

      var matches = true;

      // Apply filters
      switch (filter.category) {
        case (?cat) { if (service.main_category != cat) { matches := false } };
        case null {}
      };

      switch (filter.sub_category) {
        case (?sub) { if (service.sub_category != sub) { matches := false } };
        case null {}
      };

      switch (filter.price_range) {
        case (?range) {
          if (service.starting_from_e8s < range.min_e8s or service.starting_from_e8s > range.max_e8s) {
            matches := false
          }
        };
        case null {}
      };

      switch (filter.rating) {
        case (?min_rating) {
          if (service.total_rating < min_rating) { matches := false }
        };
        case null {}
      };

      if (matches) {
        buffer.add(service);
      }
      }
    };

    let result = Buffer.toArray(buffer);
    // TODO: Apply sorting
    let start = Nat.min(pagination.offset, result.size());
    let end = Nat.min(start + pagination.limit, result.size());
    Iter.toArray(Array.slice(result, start, end))
  };

  // ========================================
  // BOOKING MANAGEMENT
  // ========================================

  public shared func createBooking(
    service_id: ServiceId,
    package_id: PackageId,
    _title: Text,
    _description: Text,
    _requirements: [Text],
    _deadline: Int
  ): async Result.Result<BookingResponse, Text> {
    switch (services.get(service_id), packages.get(package_id)) {
      case (?service, ?package) {
        if (service.service_id != package.service_id) {
          return #err("Package does not belong to this service");
        };

        let booking_id = generateId("BK");
        let transaction_id = generateId("TX");
        let client_id = "anonymous"; // TODO: Get from authentication
        let freelancer_id = service.freelancer_id;

        // Temporarily skip booking creation to focus on services functionality
        // TODO: Fix booking type compatibility and re-enable
        /*
        let booking: Booking = {
          booking_id = booking_id;
          service_id = service_id;
          package_id = package_id;
          client_id = client_id;
          freelancer_id = freelancer_id;
          title = title;
          description = description;
          requirements = requirements;
          status = #Pending;
          payment_status = #Pending;
          total_amount_e8s = package.price_e8s;
          currency = "ICP";
          created_at = Time.now();
          updated_at = Time.now();
          deadline = deadline;
          milestones = [];
          current_milestone = null;
          client_review = null;
          client_rating = null;
          freelancer_review = null;
          freelancer_rating = null;
          dispute_id = null;
        };
        */

        let escrow_fee_e8s = package.price_e8s * 5 / 100; // 5% fee calculated with integer arithmetic

        let escrow_transaction: EscrowTransaction = {
          transaction_id = transaction_id;
          booking_id = booking_id;
          amount_e8s = package.price_e8s;
          fee_e8s = escrow_fee_e8s;
          client_id = client_id;
          freelancer_id = freelancer_id;
          status = #Pending;
          created_at = Time.now();
          funded_at = null;
          released_at = null;
          refunded_at = null;
          release_conditions = ["Project completion", "Client approval"];
        };

        // Temporarily skip booking functionality
        // bookings.put(booking_id, booking);
        transactions.put(transaction_id, escrow_transaction);

        #ok({
          booking_id = "disabled-temporarily";
          escrow_account = transaction_id;
          amount_e8s = package.price_e8s;
          ledger_block = null;
        })
      };
      case (_, _) {
        #err("Service or package not found")
      }
    }
  };

  public shared func updateBookingStatus(
    booking_id: BookingId,
    user_id: UserId,
    status: BookingStatus
  ): async Result.Result<(), Text> {
    switch (bookings.get(booking_id)) {
      case (?booking) {
        // Authorization check
        if (user_id != booking.client_id and user_id != booking.freelancer_id) {
          return #err("Not authorized to update this booking");
        };

        let updated_booking = {
          booking with
          status = status;
          updated_at = Time.now();
        };
        bookings.put(booking_id, updated_booking);
        #ok(())
      };
      case null {
        #err("Booking not found")
      }
    }
  };

  // Update booking payment status (e.g., after escrow release)
  public shared func updateBookingPaymentStatus(
    booking_id: BookingId,
    user_id: UserId,
    payment_status: PaymentStatus
  ): async Result.Result<(), Text> {
    switch (bookings.get(booking_id)) {
      case (?booking) {
        if (user_id != booking.client_id and user_id != booking.freelancer_id) {
          return #err("Not authorized to update this booking");
        };

        let now = getCurrentTime();
        let updatedBooking = {
          booking with
          payment_status = payment_status;
          updated_at = now;
        };
        bookings.put(booking_id, updatedBooking);

        // Add timeline event for payment status change
        let statusText = switch (payment_status) {
          case (#Released) { "Released — funds transferred to freelancer" };
          case (#Refunded) { "Refunded — funds returned to client" };
          case (#Disputed) { "Disputed — payment under review" };
          case (#HeldInEscrow) { "Held in escrow" };
          case (#Pending) { "Pending" };
        };
        addTimelineEvent(
          booking_id,
          #PaymentCompleted,
          "Payment status updated: " # statusText,
          null,
          user_id
        );

        #ok(())
      };
      case null {
        #err("Booking not found")
      }
    }
  };

  // Mark booking as paid — mirrors job_marketplace.mo's markJobAsPaid
  public shared func markBookingAsPaid(
    booking_id: BookingId,
    client_id: UserId
  ): async Result.Result<(), Text> {
    switch (bookings.get(booking_id)) {
      case (?booking) {
        if (booking.client_id != client_id) {
          return #err("Not authorized: Only the client can mark booking as paid");
        };

        let now = getCurrentTime();
        let updatedBooking = {
          booking with
          status = #Paid;
          payment_status = #Released;
          isPaid = true;
          updated_at = now;
        };
        bookings.put(booking_id, updatedBooking);

        addTimelineEvent(
          booking_id,
          #PaymentCompleted,
          "Funds released — booking marked as paid",
          null,
          client_id
        );

        #ok(())
      };
      case null {
        #err("Booking not found")
      }
    }
  };

  public shared func getBooking(booking_id: BookingId, user_id: UserId): async ?Booking {
    switch (bookings.get(booking_id)) {
      case (?booking) {
        if (user_id == booking.client_id or user_id == booking.freelancer_id) {
          ?booking
        } else {
          null
        }
      };
      case null {
        null
      }
    }
  };

  public query func getUserBookings(
    user_id: UserId,
    role: { #Client; #Freelancer },
    pagination: PaginationParams
  ): async [Booking] {
    let buffer = Buffer.Buffer<Booking>(0);
    for ((_, booking) in bookings.entries()) {
      let is_user_booking = switch (role) {
        case (#Client) { booking.client_id == user_id };
        case (#Freelancer) { booking.freelancer_id == user_id };
      };

      if (is_user_booking) {
        buffer.add(booking);
      }
    };

    let result = Buffer.toArray(buffer);
    let start = Nat.min(pagination.offset, result.size());
    let end = Nat.min(start + pagination.limit, result.size());
    Iter.toArray(Array.slice(result, start, end))
  };

  // ========================================
  // REVIEW SYSTEM
  // ========================================

  public shared func submitReview(
    booking_id: BookingId,
    user_id: UserId,
    rating: Float,
    comment: Text
  ): async Result.Result<(), Text> {
    switch (bookings.get(booking_id)) {
      case (?booking) {
        if (booking.status != #Completed) {
          return #err("Can only review completed bookings");
        };

        if (rating < 1.0 or rating > 5.0) {
          return #err("Rating must be between 1 and 5");
        };

        if (comment.size() > MAX_REVIEW_LENGTH) {
          return #err("Comment too long");
        };

        let is_client = user_id == booking.client_id;
        let is_freelancer = user_id == booking.freelancer_id;

        if (not (is_client or is_freelancer)) {
          return #err("Not authorized to review this booking");
        };

        let _review_id = generateId("RV");
        let _reviewee_id = if (is_client) { booking.freelancer_id } else { booking.client_id };

        // Update booking with review
        let updated_booking = if (is_client) {
          { booking with
            client_review = ?comment;
            client_rating = ?rating;
          }
        } else {
          { booking with
            freelancer_review = ?comment;
            freelancer_rating = ?rating;
          }
        };

        bookings.put(booking_id, updated_booking);
        #ok(())
      };
      case null {
        #err("Booking not found")
      }
    }
  };

  // ========================================
  // ADMIN FUNCTIONS
  // ========================================

  public query func getMarketplaceStats(): async {
    total_services: Nat;
    active_services: Nat;
    total_bookings: Nat;
    active_bookings: Nat;
    total_revenue_e8s: Nat64;
  } {
    var total_services = 0;
    var active_services = 0;
    var total_bookings = 0;
    var active_bookings = 0;
    var total_revenue_e8s = 0 : Nat64;

    for ((_, service) in services.entries()) {
      total_services += 1;
      if (service.status == #Active) {
        active_services += 1;
      }
    };

    for ((_, booking) in bookings.entries()) {
      total_bookings += 1;
      if (booking.status == #Active) {
        active_bookings += 1;
      }
    };

    for ((_, transaction) in transactions.entries()) {
      if (transaction.status == #Released) {
        total_revenue_e8s += transaction.fee_e8s;
      }
    };

    {
      total_services = total_services;
      active_services = active_services;
      total_bookings = total_bookings;
      active_bookings = active_bookings;
      total_revenue_e8s = total_revenue_e8s;
    }
  };

  // ========================================
  // BOOKING FUNCTIONS
  // ========================================

  public shared func bookPackage(clientId: UserId, clientEmail: Text, packageId: PackageId, idempotencyKey: Text, specialInstructions: Text): async Result.Result<BookingResponse, ApiError> {
    // Verify client ID is provided
    if (clientId == "" or clientEmail == "") {
      return #err(#Unauthorized("Client ID and email are required"));
    };

    // Check idempotency
    if (usedIdempotencyKeys.get(idempotencyKey) == ?true) {
      return #err(#AlreadyExists("Duplicate booking request"));
    };

    // Get package
    switch (packages.get(packageId)) {
      case (?package) {
        if (not package.is_active) {
          return #err(#InvalidInput("Package not available"));
        };

        // Get service to get freelancer
        switch (services.get(package.service_id)) {
          case (?service) {
            let bookingId = generateId("BK");
            let now = getCurrentTime();
            let platformFee = calculatePlatformFee(package.price_e8s);
            let totalPrice = package.price_e8s + platformFee;
            let deliveryDeadline = now + (package.delivery_time_days * 86400000000000); // days to nanoseconds

            // Create booking record with enhanced timestamps
            let booking: Booking = {
              booking_id = bookingId;
              service_id = package.service_id;
              package_id = packageId;
              client_id = clientId;
              freelancer_id = service.freelancer_id;
              title = service.title;
              description = specialInstructions;
              requirements = [];
              status = #Pending;
              payment_status = #Pending;
              total_amount_e8s = totalPrice;
              currency = "ICP";
              created_at = now;
              updated_at = now;
              deadline = deliveryDeadline;

              // Enhanced lifecycle timestamps
              booking_confirmed_at = null;
              payment_completed_at = null;
              delivery_deadline = deliveryDeadline;
              work_started_at = null;
              work_completed_at = null;
              client_reviewed_at = null;
              freelancer_reviewed_at = null;

              // Time tracking fields
              delivery_days = package.delivery_time_days;
              time_remaining_hours = calculateTimeRemaining(deliveryDeadline);

              // Human-readable fields for frontend
              created_at_readable = createHumanReadableTimestamp(now);
              booking_confirmed_at_readable = createHumanReadableTimestamp(now);
              payment_completed_at_readable = createHumanReadableTimestamp(now);
              delivery_deadline_readable = createHumanReadableTimestamp(deliveryDeadline);

              milestones = [];
              current_milestone = null;
              client_review = null;
              client_rating = null;
              freelancer_review = null;
              freelancer_rating = null;
              dispute_id = null;
              isPaid = false;

              // Enriched fields with defaults (will be updated on payment confirmation)
              client_name = clientEmail;  // Use client email as name initially
              freelancer_name = service.freelancer_id;  // Freelancer email/ID
              
              package_title = package.name;
              package_description = package.description;
              package_tier = "basic";  // Default, should be passed from frontend
              package_revisions = package.revisions;
              package_features = package.features;
              
              base_amount_e8s = package.price_e8s;
              platform_fee_e8s = platformFee;
              escrow_amount_e8s = package.price_e8s;  // 95% of total, adjusted on payment
              payment_method = "pending";  // Will be set on payment confirmation
              payment_id = "";  // Will be set on payment confirmation
              transaction_id = "";  // Will be set on payment confirmation
              
              upsells = [];  // Will be updated on payment confirmation
              promo_code = null;
              discount_amount_e8s = 0;
              
              special_instructions = specialInstructions;
              ledger_deposit_block = null;
            };

            // Store booking
            bookings.put(bookingId, booking);
            usedIdempotencyKeys.put(idempotencyKey, true);

            // Add timeline event for booking creation
            addTimelineEvent(
              bookingId,
              #BookingCreated,
              "Booking created for package: " # package.name,
              ?[
                ("package_id", packageId),
                ("service_id", package.service_id),
                ("amount_e8s", Nat64.toText(totalPrice)),
                ("delivery_days", Nat.toText(package.delivery_time_days))
              ],
              clientId
            );

            // Simulate ledger transfer
            let ledgerBlock = if (USE_MOCK_LEDGER) {
              await mockLedgerTransfer(Principal.fromText("2vxsx-fae"), Principal.fromActor(MarketplaceCanister), package.price_e8s); // TODO: Get from authentication
            } else {
              switch (await realLedgerTransfer(Principal.fromText("2vxsx-fae"), Principal.fromActor(MarketplaceCanister), package.price_e8s)) { // TODO: Get from authentication
                case (#ok(block)) { block };
                case (#err(msg)) {
                  // Rollback booking
                  bookings.delete(bookingId);
                  usedIdempotencyKeys.delete(idempotencyKey);
                  return #err(#LedgerError(msg));
                };
              };
            };

            let paymentTime = getCurrentTime();

            // Update booking with payment completion and enhanced timestamps
            let updatedBooking: Booking = {
              booking with
              payment_status = #HeldInEscrow;
              status = #Active;
              booking_confirmed_at = ?paymentTime;
              payment_completed_at = ?paymentTime;
              booking_confirmed_at_readable = createHumanReadableTimestamp(paymentTime);
              payment_completed_at_readable = createHumanReadableTimestamp(paymentTime);
              updated_at = paymentTime;
            };
            bookings.put(bookingId, updatedBooking);

            // Add timeline event for payment completion
            addTimelineEvent(
              bookingId,
              #PaymentCompleted,
              "Payment confirmed and held in escrow",
              ?[
                ("transaction_amount", Nat64.toText(package.price_e8s)),
                ("platform_fee", Nat64.toText(platformFee)),
                ("ledger_block", Nat64.toText(ledgerBlock))
              ],
              clientId
            );

            logEvent("Booking created: " # bookingId # " amount: " # Nat64.toText(package.price_e8s) # " block: " # Nat64.toText(ledgerBlock));

            #ok({
              booking_id = bookingId;
              escrow_account = Principal.toText(Principal.fromActor(MarketplaceCanister));
              amount_e8s = package.price_e8s;
              ledger_block = ?ledgerBlock;
            });
          };
          case null { #err(#NotFound("Service not found")) };
        };
      };
      case null { #err(#NotFound("Package not found")) };
    };
  };

  // Update booking with enriched data after payment confirmation
  public shared func updateBookingEnrichedData(
    bookingId: BookingId,
    clientName: Text,
    freelancerName: Text,
    packageTier: Text,
    paymentMethod: Text,
    paymentId: Text,
    transactionId: Text,
    upsells: [{id: Text; name: Text; price_e8s: Nat64; category: Text}],
    promoCode: ?Text,
    discountAmountE8s: Nat64,
    ledgerBlock: ?Nat64
  ): async Result.Result<(), ApiError> {
    switch (bookings.get(bookingId)) {
      case (?booking) {
        let updatedBooking: Booking = {
          booking with
          client_name = clientName;
          freelancer_name = freelancerName;
          package_tier = packageTier;
          payment_method = paymentMethod;
          payment_id = paymentId;
          transaction_id = transactionId;
          upsells = upsells;
          promo_code = promoCode;
          discount_amount_e8s = discountAmountE8s;
          ledger_deposit_block = ledgerBlock;
          updated_at = getCurrentTime();
        };
        bookings.put(bookingId, updatedBooking);
        #ok(())
      };
      case null { #err(#NotFound("Booking not found")) };
    };
  };

  public query func getBookingById(bookingId: BookingId): async Result.Result<Booking, ApiError> {
    switch (bookings.get(bookingId)) {
      case (?booking) { #ok(booking) };
      case null { #err(#NotFound("Booking not found")) };
    };
  };

  public query func listBookingsForClient(clientId: UserId, statusFilter: ?BookingStatus, limit: Nat, offset: Nat): async Result.Result<[Booking], ApiError> {
    let results = Buffer.Buffer<Booking>(bookings.size());

    for ((id, booking) in bookings.entries()) {
      if (booking.client_id == clientId) {
        var include = true;

        // Filter by status
        switch (statusFilter) {
          case (?status) {
            if (booking.status != status) include := false;
          };
          case null {};
        };

        if (include) {
          results.add(booking);
        };
      };
    };

    // Apply pagination
    let limitFinal = if (limit == 0) 10 else limit;
    var resultArray = Buffer.Buffer<Booking>(results.size());
    var i = 0;
    for (item in results.vals()) {
      if (i >= offset and i < offset + limitFinal) {
        resultArray.add(item);
      };
      i += 1;
    };

    #ok(Buffer.toArray(resultArray));
  };

  public query func listBookingsForFreelancer(freelancerId: UserId, statusFilter: ?BookingStatus, limit: Nat, offset: Nat): async Result.Result<[Booking], ApiError> {
    let results = Buffer.Buffer<Booking>(bookings.size());

    for ((id, booking) in bookings.entries()) {
      if (booking.freelancer_id == freelancerId) {
        var include = true;

        // Filter by status
        switch (statusFilter) {
          case (?status) {
            if (booking.status != status) include := false;
          };
          case null {};
        };

        if (include) {
          results.add(booking);
        };
      };
    };

    // Apply pagination
    let limitFinal = if (limit == 0) 10 else limit;
    var resultArray = Buffer.Buffer<Booking>(results.size());
    var i = 0;
    for (item in results.vals()) {
      if (i >= offset and i < offset + limitFinal) {
        resultArray.add(item);
      };
      i += 1;
    };

    #ok(Buffer.toArray(resultArray));
  };

  // ========================================
  // TIMELINE FUNCTIONS
  // ========================================

  public query func getBookingTimeline(bookingId: BookingId): async [TimelineEvent] {
    let buffer = Buffer.Buffer<TimelineEvent>(0);
    for ((_, event) in timelineEvents.entries()) {
      if (event.booking_id == bookingId) {
        buffer.add(event);
      };
    };

    // Sort events by timestamp
    let events = Buffer.toArray(buffer);
    Array.sort(events, func(a: TimelineEvent, b: TimelineEvent): Order.Order {
      if (a.timestamp < b.timestamp) { #less }
      else if (a.timestamp > b.timestamp) { #greater }
      else { #equal }
    })
  };

  public shared func updateBookingStatusWithTimeline(
    bookingId: BookingId,
    user_id: UserId,
    status: BookingStatus,
    description: Text
  ): async Result.Result<(), ApiError> {
    switch (bookings.get(bookingId)) {
      case (?booking) {
        if (user_id != booking.client_id and user_id != booking.freelancer_id) {
          return #err(#Unauthorized("Not authorized to update this booking"));
        };

        let now = getCurrentTime();
        let updatedBooking = {
          booking with
          status = status;
          updated_at = now;
        };

        // Update specific lifecycle timestamps based on status
        let finalBooking = switch (status) {
          case (#Active) {
            addTimelineEvent(bookingId, #BookingConfirmed, description, null, user_id);
            {
              updatedBooking with
              booking_confirmed_at = ?now;
              booking_confirmed_at_readable = createHumanReadableTimestamp(now);
              work_started_at = ?now; // Assume work starts when booking is confirmed
            }
          };
          case (#Completed) {
            addTimelineEvent(bookingId, #BookingCompleted, description, null, user_id);
            {
              updatedBooking with
              work_completed_at = ?now;
              work_completed_at_readable = createHumanReadableTimestamp(now);
            }
          };
          case (#Cancelled) {
            addTimelineEvent(bookingId, #BookingCancelled, description, null, user_id);
            updatedBooking
          };
          case (_) {
            updatedBooking
          }
        };

        bookings.put(bookingId, finalBooking);
        #ok(())
      };
      case null {
        #err(#NotFound("Booking not found"))
      }
    }
  };

  public shared func addBookingReview(
    bookingId: BookingId,
    user_id: UserId,
    rating: Float,
    comment: Text,
    isClient: Bool
  ): async Result.Result<(), ApiError> {
    switch (bookings.get(bookingId)) {
      case (?booking) {
        let authorized = if (isClient) {
          user_id == booking.client_id
        } else {
          user_id == booking.freelancer_id
        };

        if (not authorized) {
          return #err(#Unauthorized("Not authorized to review this booking"));
        };

        let now = getCurrentTime();
        let updatedBooking = if (isClient) {
          addTimelineEvent(bookingId, #ClientReviewed, "Client submitted review", ?[("rating", Float.toText(rating))], user_id);
          {
            booking with
            client_review = ?comment;
            client_rating = ?rating;
            client_reviewed_at = ?now;
          }
        } else {
          addTimelineEvent(bookingId, #FreelancerReviewed, "Freelancer submitted review", ?[("rating", Float.toText(rating))], user_id);
          {
            booking with
            freelancer_review = ?comment;
            freelancer_rating = ?rating;
            freelancer_reviewed_at = ?now;
          }
        };

        bookings.put(bookingId, updatedBooking);
        #ok(())
      };
      case null {
        #err(#NotFound("Booking not found"))
      }
    }
  };

  // Chat relationship management for booking-based chat access
  public shared query func getChatParticipantsForBooking(bookingId: BookingId): async Result.Result<(Text, Text), ApiError> {
    switch (bookings.get(bookingId)) {
      case (?booking) {
        #ok((booking.client_id, booking.freelancer_id))
      };
      case null {
        #err(#NotFound("Booking not found"))
      }
    }
  };

  public shared query func getActiveBookingChatsForUser(userId: Text): async Result.Result<[Booking], ApiError> {
    let buffer = Buffer.Buffer<Booking>(0);
    for ((_, booking) in bookings.entries()) {
      if ((booking.client_id == userId or booking.freelancer_id == userId) and
          (booking.status == #Active or booking.status == #Completed)) {
        buffer.add(booking);
      };
    };

    #ok(Buffer.toArray(buffer))
  };

  // Helper function to create chat relationship from booking
  public shared func createChatRelationshipFromBooking(
    bookingId: BookingId,
    user_id: UserId,
    _clientDisplayName: ?Text,
    _freelancerDisplayName: ?Text
  ): async Result.Result<Text, ApiError> {
    switch (bookings.get(bookingId)) {
      case (?booking) {
        // Only allow client or freelancer to create chat relationship
        if (user_id != booking.client_id and user_id != booking.freelancer_id) {
          return #err(#Unauthorized("Only booking participants can create chat relationships"));
        };

        // Get service details
        let serviceTitle = switch (services.get(booking.service_id)) {
          case (?service) { service.title };
          case null { "Service" };
        };

        let _bookingStatus = switch (booking.status) {
          case (#Pending) { "Pending" };
          case (#Active) { "Active" };
          case (#Completed) { "Completed" };
          case (#Cancelled) { "Cancelled" };
          case (#InDispute) { "In Dispute" };
        };

        // Create chat relationship ID
        let _chatRelationshipId = "rel_" # bookingId # "_" # Int.toText(Time.now());

        // This would normally interact with the chat storage canister
        // For now, we return a success response with the relationship details
        let relationshipDetails = "Chat relationship created: " # booking.client_id # " <-> " # booking.freelancer_id;

        addTimelineEvent(
          bookingId,
          #BookingConfirmed,
          "Chat relationship established between client and freelancer",
          ?[
            ("client_id", booking.client_id),
            ("freelancer_id", booking.freelancer_id),
            ("service_title", serviceTitle)
          ],
          user_id
        );

        #ok(relationshipDetails)
      };
      case null {
        #err(#NotFound("Booking not found"))
      }
    }
  };
}