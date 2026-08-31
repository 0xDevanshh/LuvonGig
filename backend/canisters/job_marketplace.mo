import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Time "mo:base/Time";
import Result "mo:base/Result";
import Iter "mo:base/Iter";
import Buffer "mo:base/Buffer";
import Char "mo:base/Char";
import Int "mo:base/Int";
import Array "mo:base/Array";

actor JobMarketplace {
    // Types
    public type JobId = Text;
    public type ProposalId = Text;
    public type UserId = Text;
    
    public type JobStatus = {
        #OPEN;
        #CLOSED;
        #ASSIGNED: UserId;
        #COMPLETED;
        #PAID;
    };
    
    public type BudgetType = {
        #FIXED;
        #HOURLY;
    };
    
    public type Job = {
        id: JobId;
        clientId: UserId;
        title: Text;
        description: Text;
        requiredSkills: [Text];
        budgetType: BudgetType;
        budgetAmount: Nat;
        status: JobStatus;
        createdAt: Int;
        freelancerId: ?UserId;
        completedAt: ?Int;
        isPaid: Bool;
        clientReview: ?Text;
        clientRating: ?Nat;
    };
    
    public type ProposalStatus = {
        #PENDING;
        #SHORTLISTED;
        #REJECTED;
        #ACCEPTED;
    };
    
    public type Proposal = {
        id: ProposalId;
        jobId: JobId;
        freelancerId: UserId;
        coverLetter: Text;
        bidAmount: Nat;
        estimatedDeliveryDays: Nat;
        status: ProposalStatus;
        createdAt: Int;
    };

    public type JobFilter = {
        skills: ?[Text];
        minBudget: ?Nat;
        maxBudget: ?Nat;
    };

    // Storage
    // Transient storage (wiped on upgrade unless migrated)
    private flexible var jobs = HashMap.HashMap<JobId, Job>(0, Text.equal, Text.hash);
    private flexible var proposals = HashMap.HashMap<ProposalId, Proposal>(0, Text.equal, Text.hash);
    
    // Stable storage for persistence across upgrades
    private var stableJobs: [(JobId, Job)] = [];
    private var stableProposals: [(ProposalId, Proposal)] = [];

    // System functions for persistence
    system func preupgrade() {
        stableJobs := Iter.toArray(jobs.entries());
        stableProposals := Iter.toArray(proposals.entries());
    };

    system func postupgrade() {
        for ((id, job) in stableJobs.vals()) {
            jobs.put(id, job);
        };
        for ((id, prop) in stableProposals.vals()) {
            proposals.put(id, prop);
        };
        stableJobs := [];
        stableProposals := [];
    };

    // Helper functions
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

    // Step 1: Client can post a job
    public shared func createJob(
        clientId: UserId,
        title: Text,
        description: Text,
        requiredSkills: [Text],
        budgetType: BudgetType,
        budgetAmount: Nat
    ): async Result.Result<JobId, Text> {
        if (Text.size(title) == 0) return #err("Title is required");
        if (Text.size(description) == 0) return #err("Description is required");
        
        let jobId = generateId("JOB");
        let newJob: Job = {
            id = jobId;
            clientId = clientId;
            title = title;
            description = description;
            requiredSkills = requiredSkills;
            budgetType = budgetType;
            budgetAmount = budgetAmount;
            status = #OPEN;
            createdAt = Time.now();
            freelancerId = null;
            completedAt = null;
            isPaid = false;
            clientReview = null;
            clientRating = null;
        };
        
        jobs.put(jobId, newJob);
        #ok(jobId)
    };

    // Step 2: Freelancers discover jobs with filtering and pagination
    public query func getJobs(
        filter: ?JobFilter,
        limit: Nat,
        offset: Nat
    ): async { jobs: [Job]; total: Nat } {
        let buffer = Buffer.Buffer<Job>(0);
        let allJobs = jobs.vals();
        
        for (job in allJobs) {
            if (job.status == #OPEN) {
                var matches = true;
                
                switch (filter) {
                    case (?f) {
                        // Filter by skills (if job has at least one of the requested skills)
                        switch (f.skills) {
                            case (?reqSkills) {
                                if (reqSkills.size() > 0) {
                                    var hasSkill = false;
                                    label outer for (s in reqSkills.vals()) {
                                        for (js in job.requiredSkills.vals()) {
                                            if (s == js) {
                                                hasSkill := true;
                                                break outer;
                                            };
                                        };
                                    };
                                    if (not hasSkill) matches := false;
                                };
                            };
                            case null {};
                        };
                        
                        // Filter by budget range
                        if (matches) {
                            switch (f.minBudget) {
                                case (?min) { if (job.budgetAmount < min) matches := false };
                                case null {};
                            };
                        };
                        
                        if (matches) {
                            switch (f.maxBudget) {
                                case (?max) { if (job.budgetAmount > max) matches := false };
                                case null {};
                            };
                        };
                    };
                    case null {};
                };
                
                if (matches) {
                    buffer.add(job);
                };
            };
        };
        
        let filteredJobs = Buffer.toArray(buffer);
        let total = filteredJobs.size();
        
        // Apply pagination
        let start = offset;
        let end = if (start + limit > total) total else start + limit;
        
        if (start >= total) {
            return { jobs = []; total = total };
        };
        
        let result = Array.tabulate<Job>(end - start, func(i) {
            filteredJobs[start + i]
        });
        
        { jobs = result; total = total }
    };

    // Step 3: Freelancer can place a bid
    public shared func placeBid(
        jobId: JobId,
        freelancerId: UserId,
        coverLetter: Text,
        bidAmount: Nat,
        estimatedDeliveryDays: Nat
    ): async Result.Result<ProposalId, Text> {
        switch (jobs.get(jobId)) {
            case null return #err("Job not found");
            case (?job) {
                if (job.status != #OPEN) return #err("Job is no longer open");
                
                // Check if freelancer already bid (optional but good)
                for (p in proposals.vals()) {
                    if (p.jobId == jobId and p.freelancerId == freelancerId) {
                        return #err("You have already placed a bid on this job");
                    };
                };
                
                let proposalId = generateId("PROP");
                let newProposal: Proposal = {
                    id = proposalId;
                    jobId = jobId;
                    freelancerId = freelancerId;
                    coverLetter = coverLetter;
                    bidAmount = bidAmount;
                    estimatedDeliveryDays = estimatedDeliveryDays;
                    status = #PENDING;
                    createdAt = Time.now();
                };
                
                proposals.put(proposalId, newProposal);
                #ok(proposalId)
            }
        }
    };

    // Step 4: Client can view all proposals for their job
    public query func getProposalsByJob(jobId: JobId, clientId: UserId): async Result.Result<[Proposal], Text> {
        switch (jobs.get(jobId)) {
            case null return #err("Job not found");
            case (?job) {
                if (job.clientId != clientId) return #err("Not authorized: You are not the owner of this job");
                
                let buffer = Buffer.Buffer<Proposal>(0);
                for (prop in proposals.vals()) {
                    if (prop.jobId == jobId) {
                        buffer.add(prop);
                    };
                };
                #ok(Buffer.toArray(buffer))
            }
        }
    };

    // Step 4: Shortlist or reject
    public shared func updateProposalStatus(
        proposalId: ProposalId,
        clientId: UserId,
        newStatus: ProposalStatus
    ): async Result.Result<(), Text> {
        switch (proposals.get(proposalId)) {
            case null return #err("Proposal not found");
            case (?prop) {
                switch (jobs.get(prop.jobId)) {
                    case null return #err("Job associated with proposal not found");
                    case (?job) {
                        if (job.clientId != clientId) return #err("Not authorized");
                        
                        let updatedProp = {
                            prop with status = newStatus
                        };
                        proposals.put(proposalId, updatedProp);
                        #ok(())
                    }
                }
            }
        }
    };
    
    // Additional helper: Get job details
    public shared func updateJob(
        jobId: JobId,
        clientId: UserId,
        title: Text,
        description: Text,
        requiredSkills: [Text],
        budgetType: BudgetType,
        budgetAmount: Nat
    ): async Result.Result<(), Text> {
        switch (jobs.get(jobId)) {
            case (?job) {
                if (job.clientId != clientId) {
                    return #err("Unauthorized: Only the creator can update the job");
                };
                let updatedJob: Job = {
                    job with
                    title = title;
                    description = description;
                    requiredSkills = requiredSkills;
                    budgetType = budgetType;
                    budgetAmount = budgetAmount;
                };
                jobs.put(jobId, updatedJob);
                #ok(())
            };
            case null { #err("Job not found") };
        }
    };

    public shared func deleteJob(
        jobId: JobId,
        clientId: UserId
    ): async Result.Result<(), Text> {
        switch (jobs.get(jobId)) {
            case (?job) {
                if (job.clientId != clientId) {
                    return #err("Unauthorized: Only the creator can delete the job");
                };
                // We'll set it to CLOSED instead of removing to maintain history
                let closedJob: Job = {
                    job with status = #CLOSED;
                };
                jobs.put(jobId, closedJob);
                #ok(())
            };
            case null { #err("Job not found") };
        }
    };

    public shared func acceptProposal(
        proposalId: ProposalId,
        clientId: UserId
    ): async Result.Result<(), Text> {
        switch (proposals.get(proposalId)) {
            case (?proposal) {
                switch (jobs.get(proposal.jobId)) {
                    case (?job) {
                        if (job.clientId != clientId) {
                            return #err("Unauthorized: Only the job creator can accept proposals");
                        };
                        
                        // Update Job Status
                        let updatedJob: Job = {
                            job with 
                            status = #ASSIGNED(proposal.freelancerId);
                            freelancerId = ?proposal.freelancerId;
                        };
                        jobs.put(proposal.jobId, updatedJob);
                        
                        // Update Proposal Status
                        let updatedProposal: Proposal = {
                            proposal with status = #ACCEPTED;
                        };
                        proposals.put(proposalId, updatedProposal);
                        
                        #ok(())
                    };
                    case null { #err("Job not found") };
                }
            };
            case null { #err("Proposal not found") };
        }
    };

    public query func getAssignedJobs(
        _userId: UserId,
        _role: Text // "client" or "freelancer"
    ): async [Job] {
        let buffer = Buffer.Buffer<Job>(0);
        for (job in jobs.vals()) {
            if (_role == "client") {
                if (job.clientId == _userId) {
                    buffer.add(job);
                }
            } else if (_role == "freelancer") {
                switch (job.freelancerId) {
                    case (?fid) {
                        if (fid == _userId) {
                            buffer.add(job);
                        }
                    };
                    case null {};
                }
            };
        };
        Buffer.toArray(buffer)
    };

    public shared func completeJob(
        jobId: JobId,
        freelancerId: UserId
    ): async Result.Result<(), Text> {
        switch (jobs.get(jobId)) {
            case (?job) {
                switch (job.status) {
                    case (#ASSIGNED(fid)) {
                        if (fid != freelancerId) return #err("Not authorized: You are not the assigned freelancer");
                        
                        let updatedJob: Job = {
                            job with 
                            status = #COMPLETED;
                            completedAt = ?Time.now();
                        };
                        jobs.put(jobId, updatedJob);
                        #ok(())
                    };
                    case (_) return #err("Job is not in ASSIGNED state");
                }
            };
            case null return #err("Job not found");
        }
    };

    public shared func submitJobReview(
        jobId: JobId,
        clientId: UserId,
        rating: Nat,
        comment: Text
    ): async Result.Result<(), Text> {
        switch (jobs.get(jobId)) {
            case (?job) {
                if (job.clientId != clientId) return #err("Not authorized: Only the client can submit a review");
                
                let updatedJob: Job = {
                    job with 
                    clientReview = ?comment;
                    clientRating = ?rating;
                };
                jobs.put(jobId, updatedJob);
                #ok(())
            };
            case null return #err("Job not found");
        }
    };

    public shared func markJobAsCompleted(
        jobId: JobId,
        clientId: UserId
    ): async Result.Result<(), Text> {
        switch (jobs.get(jobId)) {
            case (?job) {
                if (job.clientId != clientId) return #err("Not authorized: Only the client can mark job as completed");
                
                let updatedJob: Job = {
                    job with 
                    status = #COMPLETED;
                    completedAt = ?Time.now();
                };
                jobs.put(jobId, updatedJob);
                #ok(())
            };
            case null return #err("Job not found");
        }
    };

    public shared func markJobAsPaid(
        jobId: JobId,
        clientId: UserId
    ): async Result.Result<(), Text> {
        switch (jobs.get(jobId)) {
            case (?job) {
                if (job.clientId != clientId) return #err("Not authorized: Only the client can mark job as paid");
                
                let updatedJob: Job = {
                    job with 
                    status = #PAID;
                    isPaid = true;
                };
                jobs.put(jobId, updatedJob);
                #ok(())
            };
            case null return #err("Job not found");
        }
    };

    public query func getJobById(jobId: JobId): async ?Job {
        jobs.get(jobId)
    };
}
