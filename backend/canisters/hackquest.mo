import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Time "mo:base/Time";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Buffer "mo:base/Buffer";
import Int "mo:base/Int";
import Char "mo:base/Char";

actor HackQuestCanister {
  // ===============================
  // TYPE DEFINITIONS
  // ===============================
  public type HackathonId = Text;
  public type CategoryId = Text;
  public type RewardId = Text;
  public type TeamId = Text;
  public type SubmissionId = Text;

  public type HackathonStatus = {
    #Draft;
    #Upcoming;
    #Ongoing;
    #Judging;
    #Completed;
    #Cancelled;
  };

  public type SubmissionStatus = {
    #Draft;
    #Submitted;
    #UnderReview;
    #Selected;
    #Rejected;
  };

  public type Hackathon = {
    id: HackathonId;
    organizer: Principal;
    title: Text;
    tagline: Text;
    summary: Text;
    bannerUrl: Text;
    heroVideoUrl: Text;
    location: Text;
    theme: Text;
    prizePool: Nat64;
    faq: [Text];
    resources: [Text];
    minTeamSize: Nat;
    maxTeamSize: Nat;
    maxTeamsPerCategory: Nat;
    submissionsOpenAt: Int;
    submissionsCloseAt: Int;
    startAt: Int;
    endAt: Int;
    createdAt: Int;
    status: HackathonStatus;
    categories: [CategoryId];
    rewards: [RewardId];
  };

  public type Category = {
    id: CategoryId;
    hackathonId: HackathonId;
    name: Text;
    description: Text;
    rewardSlots: Nat;
    judgingCriteria: [Text];
  };

  public type RewardTier = {
    id: RewardId;
    hackathonId: HackathonId;
    title: Text;
    description: Text;
    amount: Nat64;
    rank: Nat;
    categoryId: ?CategoryId;
    perks: [Text];
    awardedSubmissionId: ?SubmissionId;
    awardedTeamId: ?TeamId;
    awardedAt: ?Int;
    awardedBy: ?Principal;
    note: ?Text;
  };

  public type Participant = {
    principal: Principal;
    displayName: Text;
    email: Text;
    joinedAt: Int;
  };

  public type TeamMember = {
    principal: Principal;
    accepted: Bool;
    invitedAt: Int;
    acceptedAt: ?Int;
  };

  public type Team = {
    id: TeamId;
    hackathonId: HackathonId;
    name: Text;
    categoryId: ?CategoryId;
    leader: Principal;
    members: [TeamMember];
    createdAt: Int;
    submissionId: ?SubmissionId;
  };

  public type Submission = {
    id: SubmissionId;
    hackathonId: HackathonId;
    teamId: TeamId;
    categoryId: CategoryId;
    title: Text;
    summary: Text;
    description: Text;
    repoUrl: Text;
    demoUrl: Text;
    gallery: [Text];
    submittedAt: Int;
    status: SubmissionStatus;
  };

  public type HackQuestError = {
    #NotFound: Text;
    #NotAuthorized;
    #ValidationError: Text;
    #InvalidState: Text;
  };

  public type CreateHackathonRequest = {
    title: Text;
    tagline: Text;
    summary: Text;
    bannerUrl: Text;
    heroVideoUrl: Text;
    location: Text;
    theme: Text;
    prizePool: Nat64;
    faq: [Text];
    resources: [Text];
    minTeamSize: Nat;
    maxTeamSize: Nat;
    maxTeamsPerCategory: Nat;
    submissionsOpenAt: Int;
    submissionsCloseAt: Int;
    startAt: Int;
    endAt: Int;
    categories: [CategoryInput];
    rewards: [RewardInput];
  };

  public type CategoryInput = {
    name: Text;
    description: Text;
    rewardSlots: Nat;
    judgingCriteria: [Text];
  };

  public type RewardInput = {
    title: Text;
    description: Text;
    amount: Nat64;
    rank: Nat;
    categoryName: ?Text;
    perks: [Text];
  };

  public type CreateTeamRequest = {
    hackathonId: HackathonId;
    name: Text;
    categoryId: ?CategoryId;
    leader: Principal;
    invitees: [Principal];
  };

  public type SubmitProjectRequest = {
    teamId: TeamId;
    title: Text;
    summary: Text;
    description: Text;
    repoUrl: Text;
    demoUrl: Text;
    gallery: [Text];
  };

  // ===============================
  // STORAGE
  // ===============================
  stable var hackathonEntries: [(HackathonId, Hackathon)] = [];
  stable var categoryEntries: [(CategoryId, Category)] = [];
  stable var rewardEntries: [(RewardId, RewardTier)] = [];
  stable var participantEntries: [(Principal, Participant)] = [];
  stable var teamEntries: [(TeamId, Team)] = [];
  stable var submissionEntries: [(SubmissionId, Submission)] = [];
  // Track hackathon-specific registrations: hackathonId -> principal -> registration timestamp
  stable var hackathonRegistrationEntries: [(HackathonId, [(Principal, Int)])] = [];

  stable var hackathonCounter: Nat = 0;
  stable var categoryCounter: Nat = 0;
  stable var rewardCounter: Nat = 0;
  stable var teamCounter: Nat = 0;
  stable var submissionCounter: Nat = 0;

  var hackathons = HashMap.HashMap<HackathonId, Hackathon>(0, Text.equal, Text.hash);
  var categories = HashMap.HashMap<CategoryId, Category>(0, Text.equal, Text.hash);
  var rewards = HashMap.HashMap<RewardId, RewardTier>(0, Text.equal, Text.hash);
  var participants = HashMap.HashMap<Principal, Participant>(0, Principal.equal, Principal.hash);
  var teams = HashMap.HashMap<TeamId, Team>(0, Text.equal, Text.hash);
  var submissions = HashMap.HashMap<SubmissionId, Submission>(0, Text.equal, Text.hash);
  // Hackathon-specific registrations: hackathonId -> principal -> registration timestamp
  var hackathonRegistrations = HashMap.HashMap<HackathonId, HashMap.HashMap<Principal, Int>>(0, Text.equal, Text.hash);

  // ===============================
  // HELPERS
  // ===============================
  func now() : Int {
    Time.now();
  };

  func genId(prefix: Text, _counter: Nat) : Text {
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

  func ensureHackathonExists(hackathonId: HackathonId) : Result.Result<Hackathon, HackQuestError> {
    switch (hackathons.get(hackathonId)) {
      case (?h) { #ok(h) };
      case null { #err(#NotFound("Hackathon not found")) };
    };
  };

  func ensureCategoryInHackathon(hackathonId: HackathonId, categoryId: CategoryId) : Result.Result<Category, HackQuestError> {
    switch (categories.get(categoryId)) {
      case (?cat) {
        if (cat.hackathonId == hackathonId) {
          #ok(cat);
        } else {
          #err(#ValidationError("Category does not belong to hackathon"));
        };
      };
      case null { #err(#NotFound("Category not found")) };
    };
  };

  func ensureTeamExists(teamId: TeamId) : Result.Result<Team, HackQuestError> {
    switch (teams.get(teamId)) {
      case (?team) { #ok(team) };
      case null { #err(#NotFound("Team not found")) };
    };
  };

  func ensureRewardInHackathon(hackathonId: HackathonId, rewardId: RewardId) : Result.Result<RewardTier, HackQuestError> {
    switch (rewards.get(rewardId)) {
      case (?reward) {
        if (reward.hackathonId == hackathonId) {
          #ok(reward);
        } else {
          #err(#ValidationError("Reward tier not part of hackathon"));
        };
      };
      case null { #err(#NotFound("Reward tier not found")) };
    };
  };

  func ensureSubmissionInHackathon(hackathonId: HackathonId, submissionId: SubmissionId) : Result.Result<Submission, HackQuestError> {
    switch (submissions.get(submissionId)) {
      case (?submission) {
        if (submission.hackathonId == hackathonId) {
          #ok(submission);
        } else {
          #err(#ValidationError("Submission not part of hackathon"));
        };
      };
      case null { #err(#NotFound("Submission not found")) };
    };
  };

  func isAcceptedMember(team: Team, principal: Principal) : Bool {
    for (member in team.members.vals()) {
      if (member.principal == principal and member.accepted) {
        return true;
      };
    };
    false;
  };

  func isOrganizer(hackathonId: HackathonId, principal: Principal) : Result.Result<Hackathon, HackQuestError> {
    switch (hackathons.get(hackathonId)) {
      case (?h) {
        if (h.organizer == principal) {
          #ok(h);
        } else {
          #err(#NotAuthorized);
        };
      };
      case null { #err(#NotFound("Hackathon not found")) };
    };
  };

  // ===============================
  // PARTICIPANT APIs
  // ===============================
  // Register participant - accepts principal as parameter (no wallet required)
  // Principal should be deterministically generated from email to ensure uniqueness
  public shared func registerParticipant(principal: Principal, displayName: Text, email: Text) : async Result.Result<Participant, HackQuestError> {
    if (displayName == "") {
      return #err(#ValidationError("Display name required"));
    };
    if (email == "") {
      return #err(#ValidationError("Email required"));
    };
    // Check if already registered
    switch (participants.get(principal)) {
      case (?existing) {
        // If participant exists, verify email matches to prevent email hijacking
        // Since principal is deterministic from email, same principal should mean same email
        if (existing.email != email) {
          return #err(#ValidationError("Email mismatch: this principal is already registered with a different email"));
        };
        // Update display name only, keep original email and join date
        let updated: Participant = {
          principal = principal;
          displayName = displayName;
          email = existing.email; // Keep original email
          joinedAt = existing.joinedAt; // Keep original join date
        };
        participants.put(principal, updated);
        #ok(updated);
      };
      case null {
        // Create new participant
        let profile: Participant = {
          principal = principal;
          displayName = displayName;
          email = email;
          joinedAt = now();
        };
        participants.put(principal, profile);
        #ok(profile);
      };
    };
  };

  public query func getParticipant(principal: Principal) : async ?Participant {
    return participants.get(principal);
  };

  // Register a participant for a specific hackathon
  // This should be called after registerParticipant to link the participant to a hackathon
  public shared func registerForHackathon(hackathonId: HackathonId, principal: Principal) : async Result.Result<(), HackQuestError> {
    // Ensure hackathon exists
    switch (ensureHackathonExists(hackathonId)) {
      case (#err(e)) { return #err(e) };
      case (#ok(_)) {
        // Ensure participant exists (must be registered globally first)
        switch (participants.get(principal)) {
          case null {
            return #err(#ValidationError("Participant must be registered globally before registering for a hackathon"));
          };
          case (?participant) {
            // Get or create the hackathon's registration map
            switch (hackathonRegistrations.get(hackathonId)) {
              case (?regMap) {
                // Check if already registered
                switch (regMap.get(principal)) {
                  case (?_) {
                    // Already registered, return success
                    #ok(());
                  };
                  case null {
                    // Add registration
                    regMap.put(principal, now());
                    #ok(());
                  };
                };
              };
              case null {
                // Create new registration map for this hackathon
                let newRegMap = HashMap.HashMap<Principal, Int>(0, Principal.equal, Principal.hash);
                newRegMap.put(principal, now());
                hackathonRegistrations.put(hackathonId, newRegMap);
                #ok(());
              };
            };
          };
        };
      };
    };
  };

  // List all participants associated with a specific hackathon
  // This includes: registered participants, team leaders, team members, and the organizer
  public query func listParticipantsForHackathon(hackathonId: HackathonId) : async [Participant] {
    switch (hackathons.get(hackathonId)) {
      case null { return [] };
      case (?hackathon) {
        let participantSet = HashMap.HashMap<Principal, Participant>(0, Principal.equal, Principal.hash);
        
        // Add organizer
        switch (participants.get(hackathon.organizer)) {
          case (?orgParticipant) {
            participantSet.put(hackathon.organizer, orgParticipant);
          };
          case null {};
        };
        
        // Add all participants who registered for this hackathon
        switch (hackathonRegistrations.get(hackathonId)) {
          case (?regMap) {
            for ((principal, _) in regMap.entries()) {
              switch (participants.get(principal)) {
                case (?participant) {
                  participantSet.put(principal, participant);
                };
                case null {};
              };
            };
          };
          case null {};
        };
        
        // Add all team leaders and members
        for ((teamId, team) in teams.entries()) {
          if (team.hackathonId == hackathonId) {
            // Add team leader
            switch (participants.get(team.leader)) {
              case (?leaderParticipant) {
                participantSet.put(team.leader, leaderParticipant);
              };
              case null {};
            };
            
            // Add all team members
            for (member in team.members.vals()) {
              switch (participants.get(member.principal)) {
                case (?memberParticipant) {
                  participantSet.put(member.principal, memberParticipant);
                };
                case null {};
              };
            };
          };
        };
        
        // Convert HashMap to array
        let result = Buffer.Buffer<Participant>(participantSet.size());
        for (participant in participantSet.vals()) {
          result.add(participant);
        };
        return Buffer.toArray(result);
      };
    };
  };

  // ===============================
  // HACKATHON MANAGEMENT
  // ===============================
  // Create hackathon - accepts organizer principal as parameter (no wallet required)
  public shared func createHackathon(request: CreateHackathonRequest, organizer: Principal) : async Result.Result<Hackathon, HackQuestError> {
    if (request.title == "" or request.categories.size() == 0) {
      return #err(#ValidationError("Title and at least one category required"));
    };
    if (request.minTeamSize == 0 or request.minTeamSize > request.maxTeamSize) {
      return #err(#ValidationError("Invalid team size range"));
    };
    if (request.submissionsOpenAt >= request.submissionsCloseAt) {
      return #err(#ValidationError("Submission window invalid: registration closes before it opens"));
    };
    if (request.startAt >= request.endAt) {
      return #err(#ValidationError("Event window invalid: end date must be after start date"));
    };
    if (request.startAt < now()) {
      return #err(#ValidationError("Start date cannot be in the past"));
    };

    hackathonCounter += 1;
    let hackathonId = genId("hack", hackathonCounter);
    let createdAt = now();

    let categoryBuffer = Buffer.Buffer<CategoryId>(request.categories.size());
    for (catInput in request.categories.vals()) {
      categoryCounter += 1;
      let categoryId = genId("cat", categoryCounter);
      let category: Category = {
        id = categoryId;
        hackathonId = hackathonId;
        name = catInput.name;
        description = catInput.description;
        rewardSlots = catInput.rewardSlots;
        judgingCriteria = catInput.judgingCriteria;
      };
      categories.put(categoryId, category);
      categoryBuffer.add(categoryId);
    };
    let categoryIds = Buffer.toArray(categoryBuffer);

    let rewardBuffer = Buffer.Buffer<RewardId>(request.rewards.size());
    for (rewardInput in request.rewards.vals()) {
      rewardCounter += 1;
      let rewardId = genId("reward", rewardCounter);
      let categoryId: ?CategoryId = switch (rewardInput.categoryName) {
        case null { null };
        case (?name) {
          var match: ?CategoryId = null;
          for (cid in categoryIds.vals()) {
            switch (categories.get(cid)) {
              case (?cat) {
                if (Text.equal(Text.toLowercase(cat.name), Text.toLowercase(name))) {
                  match := ?cid;
                };
              };
              case null {};
            };
          };
          match;
        };
      };
      let reward: RewardTier = {
        id = rewardId;
        hackathonId = hackathonId;
        title = rewardInput.title;
        description = rewardInput.description;
        amount = rewardInput.amount;
        rank = rewardInput.rank;
        categoryId = categoryId;
        perks = rewardInput.perks;
        awardedSubmissionId = null;
        awardedTeamId = null;
        awardedAt = null;
        awardedBy = null;
        note = null;
      };
      rewards.put(rewardId, reward);
      rewardBuffer.add(rewardId);
    };
    let rewardIds = Buffer.toArray(rewardBuffer);

    let hackathon: Hackathon = {
      id = hackathonId;
      organizer = organizer;
      title = request.title;
      tagline = request.tagline;
      summary = request.summary;
      bannerUrl = request.bannerUrl;
      heroVideoUrl = request.heroVideoUrl;
      location = request.location;
      theme = request.theme;
      prizePool = request.prizePool;
      faq = request.faq;
      resources = request.resources;
      minTeamSize = request.minTeamSize;
      maxTeamSize = request.maxTeamSize;
      maxTeamsPerCategory = request.maxTeamsPerCategory;
      submissionsOpenAt = request.submissionsOpenAt;
      submissionsCloseAt = request.submissionsCloseAt;
      startAt = request.startAt;
      endAt = request.endAt;
      createdAt = createdAt;
      status = #Draft;
      categories = categoryIds;
      rewards = rewardIds;
    };

    hackathons.put(hackathonId, hackathon);
    #ok(hackathon);
  };

  // Update hackathon details
  public shared func updateHackathon(hackathonId: HackathonId, request: CreateHackathonRequest, organizer: Principal) : async Result.Result<Hackathon, HackQuestError> {
    switch (isOrganizer(hackathonId, organizer)) {
      case (#err(e)) { return #err(e) };
      case (#ok(existing)) {
        if (request.title == "") {
          return #err(#ValidationError("Title required"));
        };
        if (request.submissionsOpenAt >= request.submissionsCloseAt) {
          return #err(#ValidationError("Submission window invalid: registration closes before it opens"));
        };
        if (request.startAt >= request.endAt) {
          return #err(#ValidationError("Event window invalid: end date must be after start date"));
        };
        
        // 1. Clean up old categories
        // 1. Store existing winners to preserve them
        let winnersToPreserve = HashMap.HashMap<Text, RewardTier>(existing.rewards.size(), Text.equal, Text.hash);
        for (rid in existing.rewards.vals()) {
          switch (rewards.get(rid)) {
            case (?r) {
              if (r.awardedSubmissionId != null) {
                winnersToPreserve.put(r.title, r);
              };
            };
            case null {};
          };
        };

        // 2. Clean up old categories
        for (cid in existing.categories.vals()) {
          ignore categories.remove(cid);
        };
        
        // 3. Clean up old rewards
        for (rid in existing.rewards.vals()) {
          ignore rewards.remove(rid);
        };

        // 4. Create new categories
        let categoryBuffer = Buffer.Buffer<CategoryId>(request.categories.size());
        for (catInput in request.categories.vals()) {
          categoryCounter += 1;
          let categoryId = genId("cat", categoryCounter);
          let category: Category = {
            id = categoryId;
            hackathonId = hackathonId;
            name = catInput.name;
            description = catInput.description;
            rewardSlots = catInput.rewardSlots;
            judgingCriteria = catInput.judgingCriteria;
          };
          categories.put(categoryId, category);
          categoryBuffer.add(categoryId);
        };
        let categoryIds = Buffer.toArray(categoryBuffer);

        // 5. Create new rewards (preserving winners if title matches)
        let rewardBuffer = Buffer.Buffer<RewardId>(request.rewards.size());
        for (rewardInput in request.rewards.vals()) {
          rewardCounter += 1;
          let rewardId = genId("reward", rewardCounter);
          let categoryId: ?CategoryId = switch (rewardInput.categoryName) {
            case null { null };
            case (?name) {
              var match: ?CategoryId = null;
              for (cid in categoryIds.vals()) {
                switch (categories.get(cid)) {
                  case (?cat) {
                    if (Text.equal(Text.toLowercase(cat.name), Text.toLowercase(name))) {
                      match := ?cid;
                    };
                  };
                  case null {};
                };
              };
              match;
            };
          };

          // Check if we should preserve a winner for this reward title
          let existingWinner = winnersToPreserve.get(rewardInput.title);

          let reward: RewardTier = {
            id = rewardId;
            hackathonId = hackathonId;
            title = rewardInput.title;
            description = rewardInput.description;
            amount = rewardInput.amount;
            rank = rewardInput.rank;
            categoryId = categoryId;
            perks = rewardInput.perks;
            awardedSubmissionId = switch (existingWinner) { case (?w) { w.awardedSubmissionId } ; case null { null } };
            awardedTeamId = switch (existingWinner) { case (?w) { w.awardedTeamId } ; case null { null } };
            awardedAt = switch (existingWinner) { case (?w) { w.awardedAt } ; case null { null } };
            awardedBy = switch (existingWinner) { case (?w) { w.awardedBy } ; case null { null } };
            note = switch (existingWinner) { case (?w) { w.note } ; case null { null } };
          };
          rewards.put(rewardId, reward);
          rewardBuffer.add(rewardId);
        };
        let rewardIds = Buffer.toArray(rewardBuffer);

        // Update core fields
        let updated: Hackathon = {
          existing with
          title = request.title;
          tagline = request.tagline;
          summary = request.summary;
          bannerUrl = request.bannerUrl;
          heroVideoUrl = request.heroVideoUrl;
          location = request.location;
          theme = request.theme;
          prizePool = request.prizePool;
          faq = request.faq;
          resources = request.resources;
          minTeamSize = request.minTeamSize;
          maxTeamSize = request.maxTeamSize;
          maxTeamsPerCategory = request.maxTeamsPerCategory;
          submissionsOpenAt = request.submissionsOpenAt;
          submissionsCloseAt = request.submissionsCloseAt;
          startAt = request.startAt;
          endAt = request.endAt;
          categories = categoryIds;
          rewards = rewardIds;
        };

        hackathons.put(hackathonId, updated);
        #ok(updated);
      };
    };
  };

  // Delete hackathon
  public shared func deleteHackathon(hackathonId: HackathonId, organizer: Principal) : async Result.Result<Bool, HackQuestError> {
    switch (isOrganizer(hackathonId, organizer)) {
      case (#err(e)) { return #err(e) };
      case (#ok(_)) {
        ignore hackathons.remove(hackathonId);
        #ok(true)
      };
    };
  };

  public shared func updateHackathonStatus(hackathonId: HackathonId, status: HackathonStatus, organizer: Principal) : async Result.Result<Hackathon, HackQuestError> {
    switch (isOrganizer(hackathonId, organizer)) {
      case (#err(e)) { return #err(e) };
      case (#ok(existing)) {
        let updated = {
          existing with
          status = status;
        };
        hackathons.put(hackathonId, updated);
        #ok(updated);
      };
    };
  };

  public query func getHackathonDetails(hackathonId: HackathonId) : async ?{
    hackathon: Hackathon;
    categories: [Category];
    rewards: [RewardTier];
  } {
    switch (hackathons.get(hackathonId)) {
      case (?h) {
        let cats = Buffer.Buffer<Category>(h.categories.size());
        for (cid in h.categories.vals()) {
          switch (categories.get(cid)) {
            case (?cat) { cats.add(cat) };
            case null {};
          };
        };
        let rws = Buffer.Buffer<RewardTier>(h.rewards.size());
        for (rid in h.rewards.vals()) {
          switch (rewards.get(rid)) {
            case (?reward) { rws.add(reward) };
            case null {};
          };
        };
        return ?{
          hackathon = h;
          categories = Buffer.toArray(cats);
          rewards = Buffer.toArray(rws);
        };
      };
      case null { return null };
    };
  };

  public query func listHackathons(limit: Nat, offset: Nat, status: ?HackathonStatus) : async [Hackathon] {
    let buffer = Buffer.Buffer<Hackathon>(hackathons.size());
    for ((_, hackathon) in hackathons.entries()) {
      var include = true;
      switch (status) {
        case (?s) {
          // Compare status variants by pattern matching
          switch (hackathon.status, s) {
            case (#Draft, #Draft) {};
            case (#Upcoming, #Upcoming) {};
            case (#Ongoing, #Ongoing) {};
            case (#Judging, #Judging) {};
            case (#Completed, #Completed) {};
            case (#Cancelled, #Cancelled) {};
            case (_, _) { include := false };
          };
        };
        case null {};
      };
      if (include) { buffer.add(hackathon) };
    };
    let start = offset;
    let end = offset + (if (limit == 0) buffer.size() else limit);
    let slice = Buffer.Buffer<Hackathon>(buffer.size());
    var idx = 0;
    for (item in buffer.vals()) {
      if (idx >= start and idx < end) {
        slice.add(item);
      };
      idx += 1;
    };
    return Buffer.toArray(slice);
  };

  // ===============================
  // TEAM MANAGEMENT
  // ===============================
  public shared func createTeam(request: CreateTeamRequest) : async Result.Result<Team, HackQuestError> {
    switch (ensureHackathonExists(request.hackathonId)) {
      case (#err(e)) { return #err(e) };
      case (#ok(hackathon)) {
        // Check category if provided
        switch (request.categoryId) {
          case (?categoryId) {
            switch (ensureCategoryInHackathon(request.hackathonId, categoryId)) {
              case (#err(e)) { return #err(e) };
              case (#ok(_)) {};
            };
          };
          case null {};
        };
        
        if (request.name == "") {
          return #err(#ValidationError("Team name required"));
        };
        
        teamCounter += 1;
        let teamId = genId("team", teamCounter);
        let totalSeats = 1 + request.invitees.size();
        if (totalSeats < hackathon.minTeamSize) {
          return #err(#ValidationError("Team below minimum size (including invites)"));
        };
        if (totalSeats > hackathon.maxTeamSize) {
          return #err(#ValidationError("Team exceeds maximum size"));
        };

        let timestamp = now();
        let memberBuffer = Buffer.Buffer<TeamMember>(totalSeats);
        memberBuffer.add({
          principal = request.leader;
          accepted = true;
          invitedAt = timestamp;
          acceptedAt = ?timestamp;
        });
        for (invitee in request.invitees.vals()) {
          memberBuffer.add({
            principal = invitee;
            accepted = false;
            invitedAt = timestamp;
            acceptedAt = null;
          });
        };

        let team: Team = {
          id = teamId;
          hackathonId = request.hackathonId;
          name = request.name;
          categoryId = request.categoryId;
          leader = request.leader;
          members = Buffer.toArray(memberBuffer);
          createdAt = now();
          submissionId = null;
        };
        teams.put(teamId, team);
        #ok(team);
      };
    };
  };

  // Respond to team invitation - accepts principal as parameter (no wallet required)
  public shared func respondToInvite(teamId: TeamId, principal: Principal, accept: Bool) : async Result.Result<Team, HackQuestError> {
    switch (ensureTeamExists(teamId)) {
      case (#err(e)) { return #err(e) };
      case (#ok(team)) {
        var found = false;
        let updatedMembers = Buffer.Buffer<TeamMember>(team.members.size());
        let timestamp = now();
        for (member in team.members.vals()) {
          if (member.principal == principal) {
            found := true;
            if (member.accepted and accept) {
              return #err(#InvalidState("Invite already accepted"));
            };
            if (accept) {
              updatedMembers.add({
                member with
                accepted = true;
                acceptedAt = ?timestamp;
              });
            } else {
              // Decline: omit member record
            };
          } else {
            updatedMembers.add(member);
          };
        };
        if (not found) {
          return #err(#InvalidState("No pending invite for this principal"));
        };
        let updatedTeam: Team = {
          team with
          members = Buffer.toArray(updatedMembers);
        };
        teams.put(teamId, updatedTeam);
        #ok(updatedTeam);
      };
    };
  };

  // Update team category - accepts principal as parameter (no wallet required)
  public shared func updateTeamCategory(teamId: TeamId, principal: Principal, categoryId: ?CategoryId) : async Result.Result<Team, HackQuestError> {
    switch (ensureTeamExists(teamId)) {
      case (#err(e)) { return #err(e) };
      case (#ok(team)) {
        // Only team leader can update category
        if (team.leader != principal) {
          return #err(#NotAuthorized);
        };
        // Cannot update category if team already has a submission
        switch (team.submissionId) {
          case (?_) { return #err(#InvalidState("Cannot update category after submission")) };
          case null {};
        };
        let updatedTeam: Team = {
          team with
          categoryId = categoryId;
        };
        teams.put(teamId, updatedTeam);
        #ok(updatedTeam);
      };
    };
  };

  public query func listTeams(hackathonId: HackathonId, categoryId: ?CategoryId) : async [Team] {
    let buffer = Buffer.Buffer<Team>(teams.size());
    for ((_, team) in teams.entries()) {
      if (team.hackathonId == hackathonId) {
        switch (categoryId) {
          case (?cid) {
            switch (team.categoryId) {
              case (?teamCid) {
                if (teamCid == cid) { buffer.add(team) };
              };
              case null {};
            };
          };
          case null { buffer.add(team) };
        };
      };
    };
    return Buffer.toArray(buffer);
  };

  // ===============================
  // SUBMISSIONS & GALLERY
  // ===============================
  // Submit project - accepts principal as parameter (no wallet required)
  public shared func submitProject(request: SubmitProjectRequest, principal: Principal) : async Result.Result<Submission, HackQuestError> {
    switch (ensureTeamExists(request.teamId)) {
      case (#err(e)) { return #err(e) };
      case (#ok(team)) {
        if (team.leader != principal and not isAcceptedMember(team, principal)) {
          return #err(#NotAuthorized);
        };
        switch (ensureHackathonExists(team.hackathonId)) {
          case (#err(e)) { return #err(e) };
          case (#ok(hackathon)) {
            let currentTime = now();
            if (currentTime < hackathon.submissionsOpenAt or currentTime > hackathon.submissionsCloseAt) {
              return #err(#InvalidState("Submission window closed"));
            };
            // Team must have a categoryId to submit
            switch (team.categoryId) {
              case null {
                return #err(#ValidationError("Team must have a category to submit a project"));
              };
              case (?teamCategoryId) {
                submissionCounter += 1;
                let submissionId = genId("submission", submissionCounter);
                let submission: Submission = {
                  id = submissionId;
                  hackathonId = team.hackathonId;
                  teamId = team.id;
                  categoryId = teamCategoryId;
                  title = request.title;
              summary = request.summary;
              description = request.description;
              repoUrl = request.repoUrl;
              demoUrl = request.demoUrl;
              gallery = request.gallery;
              submittedAt = currentTime;
              status = #Submitted;
                };
                submissions.put(submissionId, submission);
                let updatedTeam: Team = {
                  team with
                  submissionId = ?submissionId;
                };
                teams.put(team.id, updatedTeam);
                #ok(submission);
              };
            };
          };
        };
      };
    };
  };

  // Update submission - accepts principal as parameter (no wallet required)
  public shared func updateSubmission(submissionId: SubmissionId, principal: Principal, data: {
    title: ?Text;
    summary: ?Text;
    description: ?Text;
    repoUrl: ?Text;
    demoUrl: ?Text;
    status: ?SubmissionStatus;
  }) : async Result.Result<Submission, HackQuestError> {
    switch (submissions.get(submissionId)) {
      case null { return #err(#NotFound("Submission not found")) };
      case (?submission) {
        switch (ensureTeamExists(submission.teamId)) {
          case (#err(e)) { return #err(e) };
          case (#ok(team)) {
            if (team.leader != principal and not isAcceptedMember(team, principal)) {
              return #err(#NotAuthorized);
            };
            // Prevent editing if status is Selected (unless you're the leader)
            if (submission.status == #Selected and team.leader != principal) {
              return #err(#NotAuthorized);
            };
            let updated: Submission = {
              submission with
              title = switch (data.title) { case null { submission.title }; case (?v) { v } };
              summary = switch (data.summary) { case null { submission.summary }; case (?v) { v } };
              description = switch (data.description) { case null { submission.description }; case (?v) { v } };
              repoUrl = switch (data.repoUrl) { case null { submission.repoUrl }; case (?v) { v } };
              demoUrl = switch (data.demoUrl) { case null { submission.demoUrl }; case (?v) { v } };
              status = switch (data.status) { case null { submission.status }; case (?v) { v } };
            };
            submissions.put(submissionId, updated);
            #ok(updated);
          };
        };
      };
    };
  };

  public shared ({ caller }) func addGalleryImage(submissionId: SubmissionId, imageUrl: Text) : async Result.Result<Submission, HackQuestError> {
    if (imageUrl == "") {
      return #err(#ValidationError("Image URL required"));
    };
    switch (submissions.get(submissionId)) {
      case null { return #err(#NotFound("Submission not found")) };
      case (?submission) {
        switch (ensureTeamExists(submission.teamId)) {
          case (#err(e)) { return #err(e) };
          case (#ok(team)) {
            if (team.leader != caller and not isAcceptedMember(team, caller)) {
              return #err(#NotAuthorized);
            };
            let gallery = Buffer.Buffer<Text>(submission.gallery.size() + 1);
            for (img in submission.gallery.vals()) { gallery.add(img) };
            gallery.add(imageUrl);
            let updated: Submission = {
              submission with
              gallery = Buffer.toArray(gallery);
            };
            submissions.put(submissionId, updated);
            #ok(updated);
          };
        };
      };
    };
  };

  public query func listSubmissions(hackathonId: HackathonId, categoryId: ?CategoryId) : async [Submission] {
    let buffer = Buffer.Buffer<Submission>(submissions.size());
    for ((_, submission) in submissions.entries()) {
      if (submission.hackathonId == hackathonId) {
        switch (categoryId) {
          case (?cid) {
            if (submission.categoryId == cid) {
              buffer.add(submission);
            };
          };
          case null {
            buffer.add(submission);
          };
        };
      };
    };
    return Buffer.toArray(buffer);
  };

  // ===============================
  // WINNER MANAGEMENT
  // ===============================
  public shared func assignWinner(hackathonId: HackathonId, rewardId: RewardId, submissionId: SubmissionId, organizer: Principal, note: ?Text) : async Result.Result<RewardTier, HackQuestError> {
    switch (ensureHackathonExists(hackathonId)) {
      case (#err(e)) { return #err(e) };
      case (#ok(hackathon)) {
        if (hackathon.organizer != organizer) {
          return #err(#NotAuthorized);
        };
        switch (ensureRewardInHackathon(hackathonId, rewardId)) {
          case (#err(e)) { return #err(e) };
          case (#ok(reward)) {
            switch (ensureSubmissionInHackathon(hackathonId, submissionId)) {
              case (#err(e)) { return #err(e) };
              case (#ok(submission)) {
                switch (reward.categoryId) {
                  case (?cid) {
                    if (submission.categoryId != cid) {
                      return #err(#ValidationError("Submission not in reward category"));
                    };
                  };
                  case null {};
                };
                let timestamp = now();
                let updatedReward: RewardTier = {
                  reward with
                  awardedSubmissionId = ?submissionId;
                  awardedTeamId = ?submission.teamId;
                  awardedAt = ?timestamp;
                  awardedBy = ?organizer;
                  note = note;
                };
                rewards.put(rewardId, updatedReward);
                submissions.put(submissionId, {
                  submission with
                  status = #Selected;
                });
                #ok(updatedReward);
              };
            };
          };
        };
      };
    };
  };

  public query func listWinners(hackathonId: HackathonId) : async [RewardTier] {
    let buffer = Buffer.Buffer<RewardTier>(rewards.size());
    for ((_, reward) in rewards.entries()) {
      if (reward.hackathonId == hackathonId and reward.awardedSubmissionId != null) {
        buffer.add(reward);
      };
    };
    return Buffer.toArray(buffer);
  };

  // ===============================
  // SYSTEM HOOKS
  // ===============================
  system func preupgrade() {
    hackathonEntries := Iter.toArray(hackathons.entries());
    categoryEntries := Iter.toArray(categories.entries());
    rewardEntries := Iter.toArray(rewards.entries());
    participantEntries := Iter.toArray(participants.entries());
    teamEntries := Iter.toArray(teams.entries());
    submissionEntries := Iter.toArray(submissions.entries());
    // Serialize hackathon registrations
    let regEntries = Buffer.Buffer<(HackathonId, [(Principal, Int)])>(hackathonRegistrations.size());
    for ((hackId, regMap) in hackathonRegistrations.entries()) {
      regEntries.add((hackId, Iter.toArray(regMap.entries())));
    };
    hackathonRegistrationEntries := Buffer.toArray(regEntries);
  };

  system func postupgrade() {
    hackathons := HashMap.fromIter<HackathonId, Hackathon>(hackathonEntries.vals(), 0, Text.equal, Text.hash);
    categories := HashMap.fromIter<CategoryId, Category>(categoryEntries.vals(), 0, Text.equal, Text.hash);
    rewards := HashMap.fromIter<RewardId, RewardTier>(rewardEntries.vals(), 0, Text.equal, Text.hash);
    participants := HashMap.fromIter<Principal, Participant>(participantEntries.vals(), 0, Principal.equal, Principal.hash);
    teams := HashMap.fromIter<TeamId, Team>(teamEntries.vals(), 0, Text.equal, Text.hash);
    submissions := HashMap.fromIter<SubmissionId, Submission>(submissionEntries.vals(), 0, Text.equal, Text.hash);
    // Restore hackathon registrations
    hackathonRegistrations := HashMap.HashMap<HackathonId, HashMap.HashMap<Principal, Int>>(0, Text.equal, Text.hash);
    for ((hackId, regArray) in hackathonRegistrationEntries.vals()) {
      let regMap = HashMap.fromIter<Principal, Int>(regArray.vals(), 0, Principal.equal, Principal.hash);
      hackathonRegistrations.put(hackId, regMap);
    };
  };
};


