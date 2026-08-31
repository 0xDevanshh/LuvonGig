import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Buffer "mo:base/Buffer";
import Result "mo:base/Result";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Iter "mo:base/Iter";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Bool "mo:base/Bool";

persistent actor HackathonCanister {
    // ========================================
    // TYPE DEFINITIONS
    // ========================================

    public type HackathonId = Text;
    public type ParticipantId = Text;
    public type TeamId = Text;
    public type RegistrationId = Text;

    public type HackathonStatus = {
        #Upcoming;
        #Ongoing;
        #Completed;
        #Cancelled;
    };

    public type RegistrationStatus = {
        #Pending;
        #Approved;
        #Rejected;
        #Cancelled;
    };

    public type PaymentStatus = {
        #Free;
        #Paid;
        #Pending;
        #Failed;
    };

    public type HackathonMode = {
        #Online;
        #Offline;
        #Hybrid;
    };

    public type Hackathon = {
        hackathon_id: HackathonId;
        title: Text;
        tagline: Text;
        short_description: Text;
        full_description: Text;
        theme: Text;
        banner_image_url: Text;
        gallery_images: [Text];
        mode: HackathonMode;
        location: Text;
        start_date: Text;
        end_date: Text;
        registration_start: Text;
        registration_end: Text;
        min_team_size: Nat;
        max_team_size: Nat;
        max_participants: Nat;
        registration_fee: Float;
        prize_pool: Text;
        rules: Text;
        tech_stack: Text;
        experience_level: Text;
        organizer_id: Principal;
        status: HackathonStatus;
        created_at: Text;
        updated_at: Text;
    };

    public type Participant = {
        participant_id: ParticipantId;
        full_name: Text;
        email: Text;
        phone: Text;
        college: Text;
        year_of_study: Text;
        skills: [Text];
        created_at: Text;
    };

    public type Team = {
        team_id: TeamId;
        team_name: Text;
        leader_id: ParticipantId;
        hackathon_id: HackathonId;
        project_title: Text;
        project_idea: Text;
        created_at: Text;
        member_ids: [ParticipantId];
    };

    public type Registration = {
        registration_id: RegistrationId;
        hackathon_id: HackathonId;
        participant_id: ?ParticipantId;
        team_id: ?TeamId;
        status: RegistrationStatus;
        payment_status: PaymentStatus;
        transaction_id: Text;
        registration_date: Text;
    };

    public type HackathonError = {
        #NotFound: Text;
        #AlreadyExists: Text;
        #InvalidInput: Text;
        #Unauthorized: Text;
        #HackathonNotFound;
        #ParticipantNotFound;
        #TeamNotFound;
        #RegistrationNotFound;
        #TeamFull;
        #RegistrationClosed;
        #InvalidTeamSize;
        #DuplicateRegistration;
        #InvalidDateRange;
    };

    public type CreateHackathonRequest = {
        title: Text;
        tagline: Text;
        short_description: Text;
        full_description: Text;
        theme: Text;
        banner_image_url: Text;
        gallery_images: [Text];
        mode: HackathonMode;
        location: Text;
        start_date: Text;
        end_date: Text;
        registration_start: Text;
        registration_end: Text;
        min_team_size: Nat;
        max_team_size: Nat;
        max_participants: Nat;
        registration_fee: Float;
        prize_pool: Text;
        rules: Text;
        tech_stack: Text;
        experience_level: Text;
    };

    public type CreateParticipantRequest = {
        full_name: Text;
        email: Text;
        phone: Text;
        college: Text;
        year_of_study: Text;
        skills: [Text];
    };

    public type CreateTeamRequest = {
        team_name: Text;
        leader_id: ParticipantId;
        hackathon_id: HackathonId;
        project_title: Text;
        project_idea: Text;
    };

    public type CreateRegistrationRequest = {
        hackathon_id: HackathonId;
        participant_id: ?ParticipantId;
        team_id: ?TeamId;
    };

    public type HackathonFilter = {
        status: ?HackathonStatus;
        mode: ?HackathonMode;
        theme: Text;
        limit: Nat;
        offset: Nat;
    };

    public type ParticipantFilter = {
        college: Text;
        skills: [Text];
        limit: Nat;
        offset: Nat;
    };

    public type RegistrationFilter = {
        hackathon_id: ?HackathonId;
        participant_id: ?ParticipantId;
        status: ?RegistrationStatus;
        limit: Nat;
        offset: Nat;
    };

    // ========================================
    // STORAGE
    // ========================================

    private var hackathonsEntries: [(HackathonId, Hackathon)] = [];
    private var participantsEntries: [(ParticipantId, Participant)] = [];
    private var teamsEntries: [(TeamId, Team)] = [];
    private var registrationsEntries: [(RegistrationId, Registration)] = [];

    private transient var hackathons = HashMap.HashMap<HackathonId, Hackathon>(0, Text.equal, Text.hash);
    private transient var participants = HashMap.HashMap<ParticipantId, Participant>(0, Text.equal, Text.hash);
    private transient var teams = HashMap.HashMap<TeamId, Team>(0, Text.equal, Text.hash);
    private transient var registrations = HashMap.HashMap<RegistrationId, Registration>(0, Text.equal, Text.hash);

    // ========================================
    // HELPER FUNCTIONS
    // ========================================

    private func getCurrentTime(): Text {
        Int.toText(Time.now());
    };

    private func generateId(prefix: Text): Text {
        prefix # "_" # Int.toText(Time.now()) # "_" # Nat.toText(hackathons.size() + participants.size() + teams.size() + registrations.size());
    };

    private func validateEmail(email: Text): Bool {
        Text.contains(email, "@") and Text.contains(email, ".");
    };

    private func validateDateRange(start_date: Text, end_date: Text): Bool {
        start_date != "" and end_date != "" and start_date <= end_date;
    };

    private func validateTeamSize(hackathon: Hackathon, team_size: Nat): Bool {
        team_size >= hackathon.min_team_size and team_size <= hackathon.max_team_size;
    };

    private func isRegistrationOpen(hackathon: Hackathon): Bool {
        let now = getCurrentTime();
        hackathon.registration_start <= now and now <= hackathon.registration_end;
    };

    // ========================================
    // HACKATHON CRUD OPERATIONS
    // ========================================

    public shared ({ caller }) func createHackathon(request: CreateHackathonRequest): async Result.Result<Hackathon, HackathonError> {
        // Validate input
        if (request.title == "") {
            return #err(#InvalidInput("Title cannot be empty"));
        };
        if (not validateDateRange(request.start_date, request.end_date)) {
            return #err(#InvalidDateRange);
        };
        if (not validateDateRange(request.registration_start, request.registration_end)) {
            return #err(#InvalidDateRange);
        };
        if (request.min_team_size == 0 or request.max_team_size == 0) {
            return #err(#InvalidInput("Team size cannot be zero"));
        };
        if (request.min_team_size > request.max_team_size) {
            return #err(#InvalidInput("Min team size cannot be greater than max team size"));
        };

        let hackathon_id = generateId("HACK");

        let now = getCurrentTime();
        let hackathon: Hackathon = {
            hackathon_id = hackathon_id;
            title = request.title;
            tagline = request.tagline;
            short_description = request.short_description;
            full_description = request.full_description;
            theme = request.theme;
            banner_image_url = request.banner_image_url;
            gallery_images = request.gallery_images;
            mode = request.mode;
            location = request.location;
            start_date = request.start_date;
            end_date = request.end_date;
            registration_start = request.registration_start;
            registration_end = request.registration_end;
            min_team_size = request.min_team_size;
            max_team_size = request.max_team_size;
            max_participants = request.max_participants;
            registration_fee = request.registration_fee;
            prize_pool = request.prize_pool;
            rules = request.rules;
            tech_stack = request.tech_stack;
            experience_level = request.experience_level;
            organizer_id = caller;
            status = #Upcoming;
            created_at = now;
            updated_at = now;
        };

        hackathons.put(hackathon_id, hackathon);
        Debug.print("Created hackathon: " # hackathon_id);
        #ok(hackathon);
    };

    public query func getHackathonById(hackathon_id: HackathonId): Result.Result<Hackathon, HackathonError> {
        switch (hackathons.get(hackathon_id)) {
            case (?hackathon) { #ok(hackathon) };
            case null { #err(#HackathonNotFound) };
        };
    };

    public shared ({ caller }) func updateHackathon(hackathon_id: HackathonId, updatedData: Hackathon): async Result.Result<Hackathon, HackathonError> {
        switch (hackathons.get(hackathon_id)) {
            case (?existingHackathon) {
                let updatedHackathon: Hackathon = {
                    hackathon_id = hackathon_id;
                    title = updatedData.title;
                    tagline = updatedData.tagline;
                    short_description = updatedData.short_description;
                    full_description = updatedData.full_description;
                    theme = updatedData.theme;
                    banner_image_url = updatedData.banner_image_url;
                    gallery_images = updatedData.gallery_images;
                    mode = updatedData.mode;
                    location = updatedData.location;
                    start_date = updatedData.start_date;
                    end_date = updatedData.end_date;
                    registration_start = updatedData.registration_start;
                    registration_end = updatedData.registration_end;
                    min_team_size = updatedData.min_team_size;
                    max_team_size = updatedData.max_team_size;
                    max_participants = updatedData.max_participants;
                    registration_fee = updatedData.registration_fee;
                    prize_pool = updatedData.prize_pool;
                    rules = updatedData.rules;
                    tech_stack = updatedData.tech_stack;
                    experience_level = updatedData.experience_level;
                    organizer_id = existingHackathon.organizer_id;
                    status = updatedData.status;
                    created_at = existingHackathon.created_at;
                    updated_at = getCurrentTime();
                };

                hackathons.put(hackathon_id, updatedHackathon);
                #ok(updatedHackathon);
            };
            case null { #err(#HackathonNotFound) };
        };
    };

    // ========================================
    // HACKATHON IMAGE MANAGEMENT
    // ========================================

    public shared ({ caller }) func updateBannerImage(hackathon_id: HackathonId, banner_image_url: Text): async Result.Result<Hackathon, HackathonError> {
        switch (hackathons.get(hackathon_id)) {
            case (?existingHackathon) {
                // Check if caller is the organizer
                if (existingHackathon.organizer_id != caller) {
                    return #err(#Unauthorized);
                };

                let updatedHackathon: Hackathon = {
                    hackathon_id = existingHackathon.hackathon_id;
                    title = existingHackathon.title;
                    tagline = existingHackathon.tagline;
                    short_description = existingHackathon.short_description;
                    full_description = existingHackathon.full_description;
                    theme = existingHackathon.theme;
                    banner_image_url = banner_image_url;
                    gallery_images = existingHackathon.gallery_images;
                    mode = existingHackathon.mode;
                    location = existingHackathon.location;
                    start_date = existingHackathon.start_date;
                    end_date = existingHackathon.end_date;
                    registration_start = existingHackathon.registration_start;
                    registration_end = existingHackathon.registration_end;
                    min_team_size = existingHackathon.min_team_size;
                    max_team_size = existingHackathon.max_team_size;
                    max_participants = existingHackathon.max_participants;
                    registration_fee = existingHackathon.registration_fee;
                    prize_pool = existingHackathon.prize_pool;
                    rules = existingHackathon.rules;
                    tech_stack = existingHackathon.tech_stack;
                    experience_level = existingHackathon.experience_level;
                    organizer_id = existingHackathon.organizer_id;
                    status = existingHackathon.status;
                    created_at = existingHackathon.created_at;
                    updated_at = getCurrentTime();
                };

                hackathons.put(hackathon_id, updatedHackathon);
                Debug.print("Updated banner image for hackathon: " # hackathon_id);
                #ok(updatedHackathon);
            };
            case null { #err(#HackathonNotFound) };
        };
    };

    public shared ({ caller }) func addGalleryImage(hackathon_id: HackathonId, image_url: Text): async Result.Result<Hackathon, HackathonError> {
        switch (hackathons.get(hackathon_id)) {
            case (?existingHackathon) {
                // Check if caller is the organizer
                if (existingHackathon.organizer_id != caller) {
                    return #err(#Unauthorized);
                };

                // Validate image URL
                if (image_url == "") {
                    return #err(#InvalidInput("Image URL cannot be empty"));
                };

                // Check if image already exists in gallery
                for (existingUrl in existingHackathon.gallery_images.vals()) {
                    if (existingUrl == image_url) {
                        return #err(#AlreadyExists("Image already exists in gallery"));
                    };
                };

                // Limit gallery images to reasonable number (e.g., 10)
                if (existingHackathon.gallery_images.size() >= 10) {
                    return #err(#InvalidInput("Maximum number of gallery images reached (10)"));
                };

                let updatedGallery = Buffer.Buffer<Text>(existingHackathon.gallery_images.size() + 1);
                for (url in existingHackathon.gallery_images.vals()) {
                    updatedGallery.add(url);
                };
                updatedGallery.add(image_url);

                let updatedHackathon: Hackathon = {
                    hackathon_id = existingHackathon.hackathon_id;
                    title = existingHackathon.title;
                    tagline = existingHackathon.tagline;
                    short_description = existingHackathon.short_description;
                    full_description = existingHackathon.full_description;
                    theme = existingHackathon.theme;
                    banner_image_url = existingHackathon.banner_image_url;
                    gallery_images = Buffer.toArray(updatedGallery);
                    mode = existingHackathon.mode;
                    location = existingHackathon.location;
                    start_date = existingHackathon.start_date;
                    end_date = existingHackathon.end_date;
                    registration_start = existingHackathon.registration_start;
                    registration_end = existingHackathon.registration_end;
                    min_team_size = existingHackathon.min_team_size;
                    max_team_size = existingHackathon.max_team_size;
                    max_participants = existingHackathon.max_participants;
                    registration_fee = existingHackathon.registration_fee;
                    prize_pool = existingHackathon.prize_pool;
                    rules = existingHackathon.rules;
                    tech_stack = existingHackathon.tech_stack;
                    experience_level = existingHackathon.experience_level;
                    organizer_id = existingHackathon.organizer_id;
                    status = existingHackathon.status;
                    created_at = existingHackathon.created_at;
                    updated_at = getCurrentTime();
                };

                hackathons.put(hackathon_id, updatedHackathon);
                Debug.print("Added gallery image for hackathon: " # hackathon_id);
                #ok(updatedHackathon);
            };
            case null { #err(#HackathonNotFound) };
        };
    };

    public shared ({ caller }) func removeGalleryImage(hackathon_id: HackathonId, image_url: Text): async Result.Result<Hackathon, HackathonError> {
        switch (hackathons.get(hackathon_id)) {
            case (?existingHackathon) {
                // Check if caller is the organizer
                if (existingHackathon.organizer_id != caller) {
                    return #err(#Unauthorized);
                };

                var found = false;
                let updatedGallery = Buffer.Buffer<Text>(existingHackathon.gallery_images.size());
                for (url in existingHackathon.gallery_images.vals()) {
                    if (url != image_url) {
                        updatedGallery.add(url);
                    } else {
                        found := true;
                    };
                };

                if (not found) {
                    return #err(#NotFound("Image not found in gallery"));
                };

                let updatedHackathon: Hackathon = {
                    hackathon_id = existingHackathon.hackathon_id;
                    title = existingHackathon.title;
                    tagline = existingHackathon.tagline;
                    short_description = existingHackathon.short_description;
                    full_description = existingHackathon.full_description;
                    theme = existingHackathon.theme;
                    banner_image_url = existingHackathon.banner_image_url;
                    gallery_images = Buffer.toArray(updatedGallery);
                    mode = existingHackathon.mode;
                    location = existingHackathon.location;
                    start_date = existingHackathon.start_date;
                    end_date = existingHackathon.end_date;
                    registration_start = existingHackathon.registration_start;
                    registration_end = existingHackathon.registration_end;
                    min_team_size = existingHackathon.min_team_size;
                    max_team_size = existingHackathon.max_team_size;
                    max_participants = existingHackathon.max_participants;
                    registration_fee = existingHackathon.registration_fee;
                    prize_pool = existingHackathon.prize_pool;
                    rules = existingHackathon.rules;
                    tech_stack = existingHackathon.tech_stack;
                    experience_level = existingHackathon.experience_level;
                    organizer_id = existingHackathon.organizer_id;
                    status = existingHackathon.status;
                    created_at = existingHackathon.created_at;
                    updated_at = getCurrentTime();
                };

                hackathons.put(hackathon_id, updatedHackathon);
                Debug.print("Removed gallery image from hackathon: " # hackathon_id);
                #ok(updatedHackathon);
            };
            case null { #err(#HackathonNotFound) };
        };
    };

    public shared ({ caller }) func deleteHackathon(hackathon_id: HackathonId): async Result.Result<Text, HackathonError> {
        // Check if hackathon exists
        switch (hackathons.get(hackathon_id)) {
            case null { return #err(#HackathonNotFound) };
            case (?_) {};
        };

        // Check if there are any registrations for this hackathon
        for ((id, registration) in registrations.entries()) {
            if (registration.hackathon_id == hackathon_id) {
                return #err(#InvalidInput("Cannot delete hackathon with active registrations"));
            };
        };

        // Check if there are any teams for this hackathon
        for ((id, team) in teams.entries()) {
            if (team.hackathon_id == hackathon_id) {
                return #err(#InvalidInput("Cannot delete hackathon with active teams"));
            };
        };

        hackathons.delete(hackathon_id);
        #ok("Hackathon deleted successfully");
    };

    public query func listHackathons(filter: HackathonFilter): Result.Result<[Hackathon], HackathonError> {
        let results = Buffer.Buffer<Hackathon>(hackathons.size());

        for ((id, hackathon) in hackathons.entries()) {
            var include = true;

            // Filter by status
            switch (filter.status) {
                case (?status) {
                    if (hackathon.status != status) include := false;
                };
                case null {};
            };

            // Filter by mode
            switch (filter.mode) {
                case (?mode) {
                    if (hackathon.mode != mode) include := false;
                };
                case null {};
            };

            // Filter by theme
            if (filter.theme != "" and not Text.contains(Text.toLowercase(hackathon.theme), Text.toLowercase(filter.theme))) {
                include := false;
            };

            if (include) {
                results.add(hackathon);
            };
        };

        // Apply pagination
        let limit = if (filter.limit == 0) 10 else filter.limit;
        let offset = filter.offset;

        var resultArray = Buffer.Buffer<Hackathon>(results.size());
        var i = 0;
        for (item in results.vals()) {
            if (i >= offset and i < offset + limit) {
                resultArray.add(item);
            };
            i += 1;
        };

        #ok(Buffer.toArray(resultArray));
    };

    // ========================================
    // PARTICIPANT CRUD OPERATIONS
    // ========================================

    public shared ({ caller }) func createParticipant(request: CreateParticipantRequest): async Result.Result<Participant, HackathonError> {
        // Validate input
        if (request.full_name == "") {
            return #err(#InvalidInput("Full name cannot be empty"));
        };
        if (not validateEmail(request.email)) {
            return #err(#InvalidInput("Invalid email format"));
        };

        let participant_id = generateId("PART");

        // Check if participant with this email already exists
        for ((id, participant) in participants.entries()) {
            if (participant.email == request.email) {
                return #err(#AlreadyExists("Participant with this email already exists"));
            };
        };

        let now = getCurrentTime();
        let participant: Participant = {
            participant_id = participant_id;
            full_name = request.full_name;
            email = request.email;
            phone = request.phone;
            college = request.college;
            year_of_study = request.year_of_study;
            skills = request.skills;
            created_at = now;
        };

        participants.put(participant_id, participant);
        Debug.print("Created participant: " # participant_id);
        #ok(participant);
    };

    public query func getParticipantById(participant_id: ParticipantId): Result.Result<Participant, HackathonError> {
        switch (participants.get(participant_id)) {
            case (?participant) { #ok(participant) };
            case null { #err(#ParticipantNotFound) };
        };
    };

    public shared ({ caller }) func updateParticipant(participant_id: ParticipantId, updatedData: Participant): async Result.Result<Participant, HackathonError> {
        switch (participants.get(participant_id)) {
            case (?existingParticipant) {
                // Check if email is being changed and if it conflicts with existing
                if (updatedData.email != existingParticipant.email) {
                    for ((id, participant) in participants.entries()) {
                        if (participant.email == updatedData.email and id != participant_id) {
                            return #err(#AlreadyExists("Email already exists"));
                        };
                    };
                };

                let updatedParticipant: Participant = {
                    participant_id = participant_id;
                    full_name = updatedData.full_name;
                    email = updatedData.email;
                    phone = updatedData.phone;
                    college = updatedData.college;
                    year_of_study = updatedData.year_of_study;
                    skills = updatedData.skills;
                    created_at = existingParticipant.created_at;
                };

                participants.put(participant_id, updatedParticipant);
                #ok(updatedParticipant);
            };
            case null { #err(#ParticipantNotFound) };
        };
    };

    public shared ({ caller }) func deleteParticipant(participant_id: ParticipantId): async Result.Result<Text, HackathonError> {
        // Check if participant exists
        switch (participants.get(participant_id)) {
            case null { return #err(#ParticipantNotFound) };
            case (?_) {};
        };

        // Check if participant is a team leader
        for ((id, team) in teams.entries()) {
            if (team.leader_id == participant_id) {
                return #err(#InvalidInput("Cannot delete participant who is a team leader"));
            };
        };

        // Check if participant has active registrations
        for ((id, registration) in registrations.entries()) {
            switch (registration.participant_id) {
                case (?pid) {
                    if (pid == participant_id) {
                        return #err(#InvalidInput("Cannot delete participant with active registrations"));
                    };
                };
                case null {};
            };
        };

        participants.delete(participant_id);
        #ok("Participant deleted successfully");
    };

    public query func listParticipants(filter: ParticipantFilter): Result.Result<[Participant], HackathonError> {
        let results = Buffer.Buffer<Participant>(participants.size());

        for ((id, participant) in participants.entries()) {
            var include = true;

            // Filter by college
            if (filter.college != "" and not Text.contains(Text.toLowercase(participant.college), Text.toLowercase(filter.college))) {
                include := false;
            };

            // Filter by skills
            if (filter.skills.size() > 0) {
                var hasRequiredSkill = false;
                for (requiredSkill in filter.skills.vals()) {
                    for (skill in participant.skills.vals()) {
                        if (Text.contains(Text.toLowercase(skill), Text.toLowercase(requiredSkill))) {
                            hasRequiredSkill := true;
                        };
                    };
                };
                if (not hasRequiredSkill) include := false;
            };

            if (include) {
                results.add(participant);
            };
        };

        // Apply pagination
        let limit = if (filter.limit == 0) 10 else filter.limit;
        let offset = filter.offset;

        var resultArray = Buffer.Buffer<Participant>(results.size());
        var i = 0;
        for (item in results.vals()) {
            if (i >= offset and i < offset + limit) {
                resultArray.add(item);
            };
            i += 1;
        };

        #ok(Buffer.toArray(resultArray));
    };

    // ========================================
    // TEAM CRUD OPERATIONS
    // ========================================

    public shared ({ caller }) func createTeam(request: CreateTeamRequest): async Result.Result<Team, HackathonError> {
        // Validate input
        if (request.team_name == "") {
            return #err(#InvalidInput("Team name cannot be empty"));
        };

        // Check if hackathon exists
        switch (hackathons.get(request.hackathon_id)) {
            case null { return #err(#HackathonNotFound) };
            case (?_) {};
        };

        // Check if leader exists
        switch (participants.get(request.leader_id)) {
            case null { return #err(#ParticipantNotFound) };
            case (?_) {};
        };

        let team_id = generateId("TEAM");

        let now = getCurrentTime();
        let team: Team = {
            team_id = team_id;
            team_name = request.team_name;
            leader_id = request.leader_id;
            hackathon_id = request.hackathon_id;
            project_title = request.project_title;
            project_idea = request.project_idea;
            created_at = now;
            member_ids = [request.leader_id];
        };

        teams.put(team_id, team);
        Debug.print("Created team: " # team_id);
        #ok(team);
    };

    public query func getTeamById(team_id: TeamId): Result.Result<Team, HackathonError> {
        switch (teams.get(team_id)) {
            case (?team) { #ok(team) };
            case null { #err(#TeamNotFound) };
        };
    };

    public shared ({ caller }) func updateTeam(team_id: TeamId, updatedData: Team): async Result.Result<Team, HackathonError> {
        switch (teams.get(team_id)) {
            case (?existingTeam) {
                let updatedTeam: Team = {
                    team_id = team_id;
                    team_name = updatedData.team_name;
                    leader_id = updatedData.leader_id;
                    hackathon_id = updatedData.hackathon_id;
                    project_title = updatedData.project_title;
                    project_idea = updatedData.project_idea;
                    created_at = existingTeam.created_at;
                    member_ids = updatedData.member_ids;
                };

                teams.put(team_id, updatedTeam);
                #ok(updatedTeam);
            };
            case null { #err(#TeamNotFound) };
        };
    };

    public shared ({ caller }) func deleteTeam(team_id: TeamId): async Result.Result<Text, HackathonError> {
        // Check if team exists
        switch (teams.get(team_id)) {
            case null { return #err(#TeamNotFound) };
            case (?_) {};
        };

        // Check if team has active registrations
        for ((id, registration) in registrations.entries()) {
            switch (registration.team_id) {
                case (?tid) {
                    if (tid == team_id) {
                        return #err(#InvalidInput("Cannot delete team with active registrations"));
                    };
                };
                case null {};
            };
        };

        teams.delete(team_id);
        #ok("Team deleted successfully");
    };

    public query func listTeams(hackathon_id: ?HackathonId, limit: Nat, offset: Nat): Result.Result<[Team], HackathonError> {
        let results = Buffer.Buffer<Team>(teams.size());

        for ((id, team) in teams.entries()) {
            var include = true;

            // Filter by hackathon if provided
            switch (hackathon_id) {
                case (?hid) {
                    if (team.hackathon_id != hid) include := false;
                };
                case null {};
            };

            if (include) {
                results.add(team);
            };
        };

        // Apply pagination
        let limit_final = if (limit == 0) 10 else limit;

        var resultArray = Buffer.Buffer<Team>(results.size());
        var i = 0;
        for (item in results.vals()) {
            if (i >= offset and i < offset_final) {
                resultArray.add(item);
            };
            i += 1;
        };

        #ok(Buffer.toArray(resultArray));
    };

    public shared ({ caller }) func joinTeam(team_id: TeamId, participant_id: ParticipantId): async Result.Result<Team, HackathonError> {
        switch (teams.get(team_id)) {
            case (?team) {
                // Check if participant exists
                switch (participants.get(participant_id)) {
                    case null { return #err(#ParticipantNotFound) };
                    case (?_) {};
                };

                // Check if participant is already in the team
                for (member in team.member_ids.vals()) {
                    if (member == participant_id) {
                        return #err(#AlreadyExists("Participant is already in this team"));
                    };
                };

                // Get hackathon to check team size limits
                switch (hackathons.get(team.hackathon_id)) {
                    case null { return #err(#HackathonNotFound) };
                    case (?hackathon) {
                        if (not validateTeamSize(hackathon, team.member_ids.size() + 1)) {
                            return #err(#TeamFull);
                        };
                    };
                };

                // Add participant to team
                let updated_members = Buffer.Buffer<ParticipantId>(team.member_ids.size() + 1);
                for (member in team.member_ids.vals()) {
                    updated_members.add(member);
                };
                updated_members.add(participant_id);

                let updatedTeam: Team = {
                    team_id = team_id;
                    team_name = team.team_name;
                    leader_id = team.leader_id;
                    hackathon_id = team.hackathon_id;
                    project_title = team.project_title;
                    project_idea = team.project_idea;
                    created_at = team.created_at;
                    member_ids = Buffer.toArray(updated_members);
                };

                teams.put(team_id, updatedTeam);
                #ok(updatedTeam);
            };
            case null { #err(#TeamNotFound) };
        };
    };

    public shared ({ caller }) func leaveTeam(team_id: TeamId, participant_id: ParticipantId): async Result.Result<Team, HackathonError> {
        switch (teams.get(team_id)) {
            case (?team) {
                // Check if participant is the leader
                if (team.leader_id == participant_id) {
                    return #err(#InvalidInput("Team leader cannot leave the team"));
                };

                // Check if participant is in the team
                var participantFound = false;
                for (member in team.member_ids.vals()) {
                    if (member == participant_id) {
                        participantFound := true;
                    };
                };

                if (not participantFound) {
                    return #err(#NotFound("Participant is not in this team"));
                };

                // Remove participant from team
                let updated_members = Buffer.Buffer<ParticipantId>(team.member_ids.size() - 1);
                for (member in team.member_ids.vals()) {
                    if (member != participant_id) {
                        updated_members.add(member);
                    };
                };

                let updatedTeam: Team = {
                    team_id = team_id;
                    team_name = team.team_name;
                    leader_id = team.leader_id;
                    hackathon_id = team.hackathon_id;
                    project_title = team.project_title;
                    project_idea = team.project_idea;
                    created_at = team.created_at;
                    member_ids = Buffer.toArray(updated_members);
                };

                teams.put(team_id, updatedTeam);
                #ok(updatedTeam);
            };
            case null { #err(#TeamNotFound) };
        };
    };

    // ========================================
    // REGISTRATION CRUD OPERATIONS
    // ========================================

    public shared ({ caller }) func createRegistration(request: CreateRegistrationRequest): async Result.Result<Registration, HackathonError> {
        // Validate input
        switch (hackathons.get(request.hackathon_id)) {
            case null { return #err(#HackathonNotFound) };
            case (?hackathon) {
                // Check if registration is open
                if (not isRegistrationOpen(hackathon)) {
                    return #err(#RegistrationClosed);
                };
            };
        };

        // Validate that either participant_id or team_id is provided, but not both
        switch (request.participant_id) {
            case (?pid) {
                // Check if participant exists
                switch (participants.get(pid)) {
                    case null { return #err(#ParticipantNotFound) };
                    case (?_) {};
                };
            };
            case null {};
        };

        switch (request.team_id) {
            case (?tid) {
                // Check if team exists
                switch (teams.get(tid)) {
                    case null { return #err(#TeamNotFound) };
                    case (?team) {
                        // Validate team size
                        switch (hackathons.get(team.hackathon_id)) {
                            case null { return #err(#HackathonNotFound) };
                            case (?hackathon) {
                                if (not validateTeamSize(hackathon, team.member_ids.size())) {
                                    return #err(#InvalidTeamSize);
                                };
                            };
                        };
                    };
                };
            };
            case null {};
        };

        if (request.participant_id == null and request.team_id == null) {
            return #err(#InvalidInput("Either participant_id or team_id must be provided"));
        };

        if (request.participant_id != null and request.team_id != null) {
            return #err(#InvalidInput("Cannot register both participant and team simultaneously"));
        };

        // Check for duplicate registrations
        for ((id, registration) in registrations.entries()) {
            if (registration.hackathon_id == request.hackathon_id) {
                switch (request.participant_id) {
                    case (?pid) {
                        switch (registration.participant_id) {
                            case (?existing_pid) {
                                if (existing_pid == pid) {
                                    return #err(#DuplicateRegistration);
                                };
                            };
                            case null {};
                        };
                    };
                    case null {};
                };

                switch (request.team_id) {
                    case (?tid) {
                        switch (registration.team_id) {
                            case (?existing_tid) {
                                if (existing_tid == tid) {
                                    return #err(#DuplicateRegistration);
                                };
                            };
                            case null {};
                        };
                    };
                    case null {};
                };
            };
        };

        let registration_id = generateId("REG");
        let now = getCurrentTime();
        let registration: Registration = {
            registration_id = registration_id;
            hackathon_id = request.hackathon_id;
            participant_id = request.participant_id;
            team_id = request.team_id;
            status = #Pending;
            payment_status = #Free;
            transaction_id = "";
            registration_date = now;
        };

        registrations.put(registration_id, registration);
        Debug.print("Created registration: " # registration_id);
        #ok(registration);
    };

    public query func getRegistrationById(registration_id: RegistrationId): Result.Result<Registration, HackathonError> {
        switch (registrations.get(registration_id)) {
            case (?registration) { #ok(registration) };
            case null { #err(#RegistrationNotFound) };
        };
    };

    public shared ({ caller }) func updateRegistrationStatus(registration_id: RegistrationId, status: RegistrationStatus): async Result.Result<Registration, HackathonError> {
        switch (registrations.get(registration_id)) {
            case (?existingRegistration) {
                let updatedRegistration: Registration = {
                    registration_id = registration_id;
                    hackathon_id = existingRegistration.hackathon_id;
                    participant_id = existingRegistration.participant_id;
                    team_id = existingRegistration.team_id;
                    status = status;
                    payment_status = existingRegistration.payment_status;
                    transaction_id = existingRegistration.transaction_id;
                    registration_date = existingRegistration.registration_date;
                };

                registrations.put(registration_id, updatedRegistration);
                #ok(updatedRegistration);
            };
            case null { #err(#RegistrationNotFound) };
        };
    };

    public shared ({ caller }) func deleteRegistration(registration_id: RegistrationId): async Result.Result<Text, HackathonError> {
        switch (registrations.get(registration_id)) {
            case null { return #err(#RegistrationNotFound) };
            case (?_) {};
        };

        registrations.delete(registration_id);
        #ok("Registration deleted successfully");
    };

    public query func listRegistrations(filter: RegistrationFilter): Result.Result<[Registration], HackathonError> {
        let results = Buffer.Buffer<Registration>(registrations.size());

        for ((id, registration) in registrations.entries()) {
            var include = true;

            // Filter by hackathon_id
            switch (filter.hackathon_id) {
                case (?hid) {
                    if (registration.hackathon_id != hid) include := false;
                };
                case null {};
            };

            // Filter by participant_id
            switch (filter.participant_id) {
                case (?pid) {
                    switch (registration.participant_id) {
                        case (?existing_pid) {
                            if (existing_pid != pid) include := false;
                        };
                        case null {};
                    };
                };
                case null {};
            };

            // Filter by status
            switch (filter.status) {
                case (?status) {
                    if (registration.status != status) include := false;
                };
                case null {};
            };

            if (include) {
                results.add(registration);
            };
        };

        // Apply pagination
        let limit = if (filter.limit == 0) 10 else filter.limit;
        let offset = filter.offset;

        var resultArray = Buffer.Buffer<Registration>(results.size());
        var i = 0;
        for (item in results.vals()) {
            if (i >= offset and i < offset + limit) {
                resultArray.add(item);
            };
            i += 1;
        };

        #ok(Buffer.toArray(resultArray));
    };

    // ========================================
    // UTILITY FUNCTIONS
    // ========================================

    public query func getHackathonStats(): Result.Result<{
        total_hackathons: Nat;
        upcoming_hackathons: Nat;
        ongoing_hackathons: Nat;
        completed_hackathons: Nat;
    }, HackathonError> {
        var total = 0;
        var upcoming = 0;
        var ongoing = 0;
        var completed = 0;

        for ((id, hackathon) in hackathons.entries()) {
            total += 1;
            switch (hackathon.status) {
                case (#Upcoming) { upcoming += 1 };
                case (#Ongoing) { ongoing += 1 };
                case (#Completed) { completed += 1 };
                case (#Cancelled) {};
            };
        };

        #ok({
            total_hackathons = total;
            upcoming_hackathons = upcoming;
            ongoing_hackathons = ongoing;
            completed_hackathons = completed;
        });
    };

    public query func getParticipantStats(): Result.Result<{
        total_participants: Nat;
        total_teams: Nat;
        total_registrations: Nat;
    }, HackathonError> {
        #ok({
            total_participants = participants.size();
            total_teams = teams.size();
            total_registrations = registrations.size();
        });
    };

    // ========================================
    // ORGANIZER-SPECIFIC OPERATIONS
    // ========================================

    public query func getHackathonsByOrganizer(organizer_id: Principal, limit: Nat, offset: Nat, status: ?HackathonStatus): Result.Result<[Hackathon], HackathonError> {
        let results = Buffer.Buffer<Hackathon>(hackathons.size());

        for ((id, hackathon) in hackathons.entries()) {
            var include = true;

            // Filter by status if provided
            switch (status) {
                case (?filter_status) {
                    if (hackathon.status != filter_status) include := false;
                };
                case null {};
            };

            // For now, include all hackathons (organizer filtering would require storing organizer info)
            if (include) {
                results.add(hackathon);
            };
        };

        // Apply pagination
        let limit_final = if (limit == 0) 10 else limit;

        var resultArray = Buffer.Buffer<Hackathon>(results.size());
        var i = 0;
        for (item in results.vals()) {
            if (i >= offset and i < offset_final) {
                resultArray.add(item);
            };
            i += 1;
        };

        #ok(Buffer.toArray(resultArray));
    };

    public shared ({ caller }) func updateHackathonStatus(hackathon_id: HackathonId, status: HackathonStatus, organizer_id: Principal): async Result.Result<Hackathon, HackathonError> {
        switch (hackathons.get(hackathon_id)) {
            case (?existingHackathon) {
                // For now, allow any caller to update status (organizer verification would require storing organizer info)
                let updatedHackathon: Hackathon = {
                    hackathon_id = hackathon_id;
                    title = existingHackathon.title;
                    tagline = existingHackathon.tagline;
                    description = existingHackathon.description;
                    theme = existingHackathon.theme;
                    mode = existingHackathon.mode;
                    location = existingHackathon.location;
                    start_date = existingHackathon.start_date;
                    end_date = existingHackathon.end_date;
                    registration_start = existingHackathon.registration_start;
                    registration_end = existingHackathon.registration_end;
                    min_team_size = existingHackathon.min_team_size;
                    max_team_size = existingHackathon.max_team_size;
                    prize_pool = existingHackathon.prize_pool;
                    rules = existingHackathon.rules;
                    status = status;
                    created_at = existingHackathon.created_at;
                    updated_at = getCurrentTime();
                };

                hackathons.put(hackathon_id, updatedHackathon);
                #ok(updatedHackathon);
            };
            case null { #err(#HackathonNotFound) };
        };
    };

    public shared ({ caller }) func deleteHackathonAsOrganizer(hackathon_id: HackathonId, organizer_id: Principal): async Result.Result<Text, HackathonError> {
        // Check if hackathon exists
        switch (hackathons.get(hackathon_id)) {
            case null { return #err(#HackathonNotFound) };
            case (?_) {};
        };

        // For now, allow any caller to delete (organizer verification would require storing organizer info)

        // Check if there are any registrations for this hackathon
        for ((id, registration) in registrations.entries()) {
            if (registration.hackathon_id == hackathon_id) {
                return #err(#InvalidInput("Cannot delete hackathon with active registrations"));
            };
        };

        // Check if there are any teams for this hackathon
        for ((id, team) in teams.entries()) {
            if (team.hackathon_id == hackathon_id) {
                return #err(#InvalidInput("Cannot delete hackathon with active teams"));
            };
        };

        hackathons.delete(hackathon_id);
        #ok("Hackathon deleted successfully");
    };

    public shared ({ caller }) func duplicateHackathon(hackathon_id: HackathonId, organizer_id: Principal): async Result.Result<Hackathon, HackathonError> {
        switch (hackathons.get(hackathon_id)) {
            case (?originalHackathon) {
                // Create a new hackathon based on the original
                let new_hackathon_id = generateId("HACK");
                let now = getCurrentTime();

                let duplicatedHackathon: Hackathon = {
                    hackathon_id = new_hackathon_id;
                    title = originalHackathon.title # " (Copy)";
                    tagline = originalHackathon.tagline;
                    description = originalHackathon.description;
                    theme = originalHackathon.theme;
                    mode = originalHackathon.mode;
                    location = originalHackathon.location;
                    start_date = originalHackathon.start_date;
                    end_date = originalHackathon.end_date;
                    registration_start = originalHackathon.registration_start;
                    registration_end = originalHackathon.registration_end;
                    min_team_size = originalHackathon.min_team_size;
                    max_team_size = originalHackathon.max_team_size;
                    prize_pool = originalHackathon.prize_pool;
                    rules = originalHackathon.rules;
                    status = #Upcoming;
                    created_at = now;
                    updated_at = now;
                };

                hackathons.put(new_hackathon_id, duplicatedHackathon);
                Debug.print("Duplicated hackathon: " # new_hackathon_id);
                #ok(duplicatedHackathon);
            };
            case null { #err(#HackathonNotFound) };
        };
    };

    // ========================================
    // SYSTEM FUNCTIONS
    // ========================================

    system func preupgrade() {
        hackathonsEntries := Iter.toArray(hackathons.entries());
        participantsEntries := Iter.toArray(participants.entries());
        teamsEntries := Iter.toArray(teams.entries());
        registrationsEntries := Iter.toArray(registrations.entries());
    };

    system func postupgrade() {
        hackathons := HashMap.fromIter<HackathonId, Hackathon>(hackathonsEntries.vals(), 0, Text.equal, Text.hash);
        participants := HashMap.fromIter<ParticipantId, Participant>(participantsEntries.vals(), 0, Text.equal, Text.hash);
        teams := HashMap.fromIter<TeamId, Team>(teamsEntries.vals(), 0, Text.equal, Text.hash);
        registrations := HashMap.fromIter<RegistrationId, Registration>(registrationsEntries.vals(), 0, Text.equal, Text.hash);
    };
};