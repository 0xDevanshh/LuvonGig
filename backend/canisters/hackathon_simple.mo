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
        description: Text;
        theme: Text;
        mode: HackathonMode;
        location: Text;
        start_date: Text;
        end_date: Text;
        registration_start: Text;
        registration_end: Text;
        min_team_size: Nat;
        max_team_size: Nat;
        prize_pool: Text;
        rules: Text;
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

    public type CreateHackathonRequest = {
        title: Text;
        tagline: Text;
        description: Text;
        theme: Text;
        mode: HackathonMode;
        location: Text;
        start_date: Text;
        end_date: Text;
        registration_start: Text;
        registration_end: Text;
        min_team_size: Nat;
        max_team_size: Nat;
        prize_pool: Text;
        rules: Text;
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

    public shared ({ caller }) func createHackathon(request: CreateHackathonRequest): async Result<Hackathon, Text> {
        // Validate input
        if (request.title == "") {
            return #err("Title cannot be empty");
        };
        if (not validateDateRange(request.start_date, request.end_date)) {
            return #err("Invalid date range");
        };
        if (not validateDateRange(request.registration_start, request.registration_end)) {
            return #err("Invalid registration date range");
        };
        if (request.min_team_size == 0 or request.max_team_size == 0) {
            return #err("Team size cannot be zero");
        };
        if (request.min_team_size > request.max_team_size) {
            return #err("Min team size cannot be greater than max team size");
        };

        let hackathon_id = generateId("HACK");

        let now = getCurrentTime();
        let hackathon: Hackathon = {
            hackathon_id = hackathon_id;
            title = request.title;
            tagline = request.tagline;
            description = request.description;
            theme = request.theme;
            mode = request.mode;
            location = request.location;
            start_date = request.start_date;
            end_date = request.end_date;
            registration_start = request.registration_start;
            registration_end = request.registration_end;
            min_team_size = request.min_team_size;
            max_team_size = request.max_team_size;
            prize_pool = request.prize_pool;
            rules = request.rules;
            status = #Upcoming;
            created_at = now;
            updated_at = now;
        };

        hackathons.put(hackathon_id, hackathon);
        Debug.print("Created hackathon: " # hackathon_id);
        #ok(hackathon);
    };

    public query func getHackathonById(hackathon_id: HackathonId): Result<Hackathon, Text> {
        switch (hackathons.get(hackathon_id)) {
            case (?hackathon) { #ok(hackathon) };
            case null { #err("Hackathon not found") };
        };
    };

    public shared ({ caller }) func updateHackathon(hackathon_id: HackathonId, updatedData: Hackathon): async Result<Hackathon, Text> {
        switch (hackathons.get(hackathon_id)) {
            case (?existingHackathon) {
                let updatedHackathon: Hackathon = {
                    hackathon_id = hackathon_id;
                    title = updatedData.title;
                    tagline = updatedData.tagline;
                    description = updatedData.description;
                    theme = updatedData.theme;
                    mode = updatedData.mode;
                    location = updatedData.location;
                    start_date = updatedData.start_date;
                    end_date = updatedData.end_date;
                    registration_start = updatedData.registration_start;
                    registration_end = updatedData.registration_end;
                    min_team_size = updatedData.min_team_size;
                    max_team_size = updatedData.max_team_size;
                    prize_pool = updatedData.prize_pool;
                    rules = updatedData.rules;
                    status = updatedData.status;
                    created_at = existingHackathon.created_at;
                    updated_at = getCurrentTime();
                };

                hackathons.put(hackathon_id, updatedHackathon);
                #ok(updatedHackathon);
            };
            case null { #err("Hackathon not found") };
        };
    };

    public shared ({ caller }) func deleteHackathon(hackathon_id: HackathonId): async Result<Text, Text> {
        // Check if hackathon exists
        switch (hackathons.get(hackathon_id)) {
            case null { return #err("Hackathon not found") };
            case (?_) {};
        };

        // Check if there are any registrations for this hackathon
        for ((id, registration) in registrations.entries()) {
            if (registration.hackathon_id == hackathon_id) {
                return #err("Cannot delete hackathon with active registrations");
            };
        };

        // Check if there are any teams for this hackathon
        for ((id, team) in teams.entries()) {
            if (team.hackathon_id == hackathon_id) {
                return #err("Cannot delete hackathon with active teams");
            };
        };

        hackathons.delete(hackathon_id);
        #ok("Hackathon deleted successfully");
    };

    public query func listHackathons(limit: Nat, offset: Nat): Result<[Hackathon], Text> {
        let allHackathons = Iter.toArray(hackathons.entries());
        var results = Buffer.Buffer<Hackathon>(allHackathons.size());

        var i = 0;
        for ((id, hackathon) in allHackathons) {
            if (i >= offset and i < offset + limit) {
                results.add(hackathon);
            };
            i += 1;
        };

        #ok(Buffer.toArray(results));
    };

    // ========================================
    // PARTICIPANT CRUD OPERATIONS
    // ========================================

    public shared ({ caller }) func createParticipant(request: CreateParticipantRequest): async Result<Participant, Text> {
        // Validate input
        if (request.full_name == "") {
            return #err("Full name cannot be empty");
        };
        if (not validateEmail(request.email)) {
            return #err("Invalid email format");
        };

        let participant_id = generateId("PART");

        // Check if participant with this email already exists
        for ((id, participant) in participants.entries()) {
            if (participant.email == request.email) {
                return #err("Participant with this email already exists");
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

    public query func getParticipantById(participant_id: ParticipantId): Result<Participant, Text> {
        switch (participants.get(participant_id)) {
            case (?participant) { #ok(participant) };
            case null { #err("Participant not found") };
        };
    };

    public shared ({ caller }) func updateParticipant(participant_id: ParticipantId, updatedData: Participant): async Result<Participant, Text> {
        switch (participants.get(participant_id)) {
            case (?existingParticipant) {
                // Check if email is being changed and if it conflicts with existing
                if (updatedData.email != existingParticipant.email) {
                    for ((id, participant) in participants.entries()) {
                        if (participant.email == updatedData.email and id != participant_id) {
                            return #err("Email already exists");
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
            case null { #err("Participant not found") };
        };
    };

    public shared ({ caller }) func deleteParticipant(participant_id: ParticipantId): async Result<Text, Text> {
        // Check if participant exists
        switch (participants.get(participant_id)) {
            case null { return #err("Participant not found") };
            case (?_) {};
        };

        // Check if participant is a team leader
        for ((id, team) in teams.entries()) {
            if (team.leader_id == participant_id) {
                return #err("Cannot delete participant who is a team leader");
            };
        };

        // Check if participant has active registrations
        for ((id, registration) in registrations.entries()) {
            switch (registration.participant_id) {
                case (?pid) {
                    if (pid == participant_id) {
                        return #err("Cannot delete participant with active registrations");
                    };
                };
                case null {};
            };
        };

        participants.delete(participant_id);
        #ok("Participant deleted successfully");
    };

    public query func listParticipants(limit: Nat, offset: Nat): Result<[Participant], Text> {
        let allParticipants = Iter.toArray(participants.entries());
        var results = Buffer.Buffer<Participant>(allParticipants.size());

        var i = 0;
        for ((id, participant) in allParticipants) {
            if (i >= offset and i < offset + limit) {
                results.add(participant);
            };
            i += 1;
        };

        #ok(Buffer.toArray(results));
    };

    // ========================================
    // TEAM CRUD OPERATIONS
    // ========================================

    public shared ({ caller }) func createTeam(request: CreateTeamRequest): async Result<Team, Text> {
        // Validate input
        if (request.team_name == "") {
            return #err("Team name cannot be empty");
        };

        // Check if hackathon exists
        switch (hackathons.get(request.hackathon_id)) {
            case null { return #err("Hackathon not found") };
            case (?_) {};
        };

        // Check if leader exists
        switch (participants.get(request.leader_id)) {
            case null { return #err("Participant not found") };
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

    public query func getTeamById(team_id: TeamId): Result<Team, Text> {
        switch (teams.get(team_id)) {
            case (?team) { #ok(team) };
            case null { #err("Team not found") };
        };
    };

    public query func listTeams(hackathon_id: ?HackathonId, limit: Nat, offset: Nat): Result<[Team], Text> {
        let allTeams = Iter.toArray(teams.entries());
        var results = Buffer.Buffer<Team>(allTeams.size());

        var i = 0;
        for ((id, team) in allTeams) {
            var include = true;

            // Filter by hackathon if provided
            switch (hackathon_id) {
                case (?hid) {
                    if (team.hackathon_id != hid) include := false;
                };
                case null {};
            };

            if (include and i >= offset and i < offset + limit) {
                results.add(team);
            };
            i += 1;
        };

        #ok(Buffer.toArray(results));
    };

    // ========================================
    // REGISTRATION CRUD OPERATIONS
    // ========================================

    public shared ({ caller }) func createRegistration(request: CreateRegistrationRequest): async Result<Registration, Text> {
        // Validate input
        switch (hackathons.get(request.hackathon_id)) {
            case null { return #err("Hackathon not found") };
            case (?hackathon) {
                // Check if registration is open
                if (not isRegistrationOpen(hackathon)) {
                    return #err("Registration is closed");
                };
            };
        };

        // Validate that either participant_id or team_id is provided, but not both
        switch (request.participant_id) {
            case (?pid) {
                // Check if participant exists
                switch (participants.get(pid)) {
                    case null { return #err("Participant not found") };
                    case (?_) {};
                };
            };
            case null {};
        };

        switch (request.team_id) {
            case (?tid) {
                // Check if team exists
                switch (teams.get(tid)) {
                    case null { return #err("Team not found") };
                    case (?team) {
                        // Validate team size
                        switch (hackathons.get(team.hackathon_id)) {
                            case null { return #err("Hackathon not found") };
                            case (?hackathon) {
                                if (not validateTeamSize(hackathon, team.member_ids.size())) {
                                    return #err("Invalid team size");
                                };
                            };
                        };
                    };
                };
            };
            case null {};
        };

        if (request.participant_id == null and request.team_id == null) {
            return #err("Either participant_id or team_id must be provided");
        };

        if (request.participant_id != null and request.team_id != null) {
            return #err("Cannot register both participant and team simultaneously");
        };

        // Check for duplicate registrations
        for ((id, registration) in registrations.entries()) {
            if (registration.hackathon_id == request.hackathon_id) {
                switch (request.participant_id) {
                    case (?pid) {
                        switch (registration.participant_id) {
                            case (?existing_pid) {
                                if (existing_pid == pid) {
                                    return #err("Duplicate registration");
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
                                    return #err("Duplicate registration");
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

    public query func getRegistrationById(registration_id: RegistrationId): Result<Registration, Text> {
        switch (registrations.get(registration_id)) {
            case (?registration) { #ok(registration) };
            case null { #err("Registration not found") };
        };
    };

    public shared ({ caller }) func updateRegistrationStatus(registration_id: RegistrationId, status: RegistrationStatus): async Result<Registration, Text> {
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
            case null { #err("Registration not found") };
        };
    };

    public query func listRegistrations(hackathon_id: ?HackathonId, limit: Nat, offset: Nat): Result<[Registration], Text> {
        let allRegistrations = Iter.toArray(registrations.entries());
        var results = Buffer.Buffer<Registration>(allRegistrations.size());

        var i = 0;
        for ((id, registration) in allRegistrations) {
            var include = true;

            // Filter by hackathon_id if provided
            switch (hackathon_id) {
                case (?hid) {
                    if (registration.hackathon_id != hid) include := false;
                };
                case null {};
            };

            if (include and i >= offset and i < offset + limit) {
                results.add(registration);
            };
            i += 1;
        };

        #ok(Buffer.toArray(results));
    };

    // ========================================
    // UTILITY FUNCTIONS
    // ========================================

    public query func getHackathonStats(): Result<{
        total_hackathons: Nat;
        upcoming_hackathons: Nat;
        ongoing_hackathons: Nat;
        completed_hackathons: Nat;
    }, Text> {
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

    public query func getParticipantStats(): Result<{
        total_participants: Nat;
        total_teams: Nat;
        total_registrations: Nat;
    }, Text> {
        #ok({
            total_participants = participants.size();
            total_teams = teams.size();
            total_registrations = registrations.size();
        });
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