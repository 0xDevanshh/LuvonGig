import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Buffer "mo:base/Buffer";
import Result "mo:base/Result";
import Nat "mo:base/Nat";
import Iter "mo:base/Iter";
import Char "mo:base/Char";
import Int "mo:base/Int";

persistent actor UserCanisterV2 {
    // Types
    public type UserId = Text;
    public type Email = Text;
    public type PasswordHash = Text;
    public type ProfileData = {
        firstName: Text;
        lastName: Text;
        bio: ?Text;
        phone: ?Text;
        location: ?Text;
        website: ?Text;
        linkedin: ?Text;
        github: ?Text;
        twitter: ?Text;
        profileImageUrl: ?Text;
        resumeUrl: ?Text;
        skills: [Text];
        experience: [Experience];
        education: [Education];
        wallet_principal: ?Principal;
        wallet_account_id: ?Text;
    };

    public type Experience = {
        id: Text;
        company: Text;
        position: Text;
        startDate: Text;
        endDate: ?Text;
        description: ?Text;
        current: Bool;
    };

    public type Education = {
        id: Text;
        institution: Text;
        degree: Text;
        field: Text;
        startDate: Text;
        endDate: ?Text;
        gpa: ?Text;
        description: ?Text;
    };

    public type OTPData = {
        code: Text;
        expiresAt: Int;
        attempts: Nat;
    };

    public type User = {
        id: UserId;
        email: Email;
        passwordHash: PasswordHash;
        isVerified: Bool;
        createdAt: Int;
        lastLoginAt: ?Int;
        profile: ?ProfileData;
        profileSubmitted: Bool;
        otpData: ?OTPData;
    };

    // Storage - using arrays for stability
    private var usersArray: [(UserId, User)] = [];
    private var emailToUserIdArray: [(Email, UserId)] = [];
    private var otpArray: [(Email, OTPData)] = [];

    private flexible var users = HashMap.HashMap<UserId, User>(0, Text.equal, Text.hash);
    private flexible var emailToUserId = HashMap.HashMap<Email, UserId>(0, Text.equal, Text.hash);
    private flexible var otpStore = HashMap.HashMap<Email, OTPData>(0, Text.equal, Text.hash);

    // Initialize from stable storage
    system func preupgrade() {
        usersArray := Iter.toArray(users.entries());
        emailToUserIdArray := Iter.toArray(emailToUserId.entries());
        otpArray := Iter.toArray(otpStore.entries());
    };

    system func postupgrade() {
        for ((id, user) in usersArray.vals()) {
            users.put(id, user);
        };
        for ((email, userId) in emailToUserIdArray.vals()) {
            emailToUserId.put(email, userId);
        };
        for ((email, otp) in otpArray.vals()) {
            otpStore.put(email, otp);
        };
        usersArray := [];
        emailToUserIdArray := [];
        otpArray := [];
    };

    // Helper functions
    private func generateUserId(): UserId {
        let chars = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        let size = 8;
        var result = "";
        var i = 0;
        while (i < size) {
            let random = Int.abs(Time.now() + i) % 36;
            result := result # Char.toText(chars[random]);
            i += 1;
        };
        result
    };

    private func generateOTP(): Text {
        let chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
        let size = 6;
        var result = "";
        var i = 0;
        while (i < size) {
            let random = Int.abs(Time.now() + i) % 10;
            result := result # Char.toText(chars[random]);
            i += 1;
        };
        result
    };

    // Public functions
    public func createUser(email: Email, passwordHash: PasswordHash): async Result.Result<UserId, Text> {
        switch (emailToUserId.get(email)) {
            case (?_) { #err("User with this email already exists") };
            case null {
                let userId = generateUserId();
                let user: User = {
                    id = userId;
                    email = email;
                    passwordHash = passwordHash;
                    isVerified = false;
                    createdAt = Time.now();
                    lastLoginAt = null;
                    profile = null;
                    profileSubmitted = false;
                    otpData = null;
                };
                users.put(userId, user);
                emailToUserId.put(email, userId);
                #ok(userId)
            }
        }
    };

    public func getUserById(userId: UserId): async ?User {
        users.get(userId)
    };

    public func getUserByEmail(email: Email): async ?User {
        switch (emailToUserId.get(email)) {
            case (?userId) { users.get(userId) };
            case null { null }
        }
    };

    public func updatePassword(userId: UserId, newPasswordHash: PasswordHash): async Result.Result<(), Text> {
        switch (users.get(userId)) {
            case (?user) {
                let updatedUser = {
                    user with passwordHash = newPasswordHash
                };
                users.put(userId, updatedUser);
                #ok(())
            };
            case null { #err("User not found") }
        }
    };

    public func verifyEmail(userId: UserId): async Result.Result<(), Text> {
        switch (users.get(userId)) {
            case (?user) {
                let updatedUser = {
                    user with isVerified = true
                };
                users.put(userId, updatedUser);
                #ok(())
            };
            case null { #err("User not found") }
        }
    };

    public func updateLastLogin(userId: UserId): async Result.Result<(), Text> {
        switch (users.get(userId)) {
            case (?user) {
                let updatedUser = {
                    user with lastLoginAt = ?Time.now()
                };
                users.put(userId, updatedUser);
                #ok(())
            };
            case null { #err("User not found") }
        }
    };

    public func updateProfile(userId: UserId, profile: ProfileData): async Result.Result<(), Text> {
        switch (users.get(userId)) {
            case (?user) {
                let updatedUser = {
                    user with profile = ?profile
                };
                users.put(userId, updatedUser);
                #ok(())
            };
            case null { #err("User not found") }
        }
    };

    public func getProfile(userId: UserId): async ?ProfileData {
        switch (users.get(userId)) {
            case (?user) { user.profile };
            case null { null }
        }
    };

    // OTP Management
    public func createOTP(email: Email): async Result.Result<Text, Text> {
        let otp = generateOTP();
        let expiresAt = Time.now() + (10 * 60 * 1000 * 1000 * 1000); // 10 minutes in nanoseconds
        let otpData: OTPData = {
            code = otp;
            expiresAt = expiresAt;
            attempts = 0;
        };
        otpStore.put(email, otpData);
        #ok(otp)
    };

    public func verifyOTP(email: Email, code: Text): async Result.Result<Bool, Text> {
        switch (otpStore.get(email)) {
            case (?otpData) {
                if (Time.now() > otpData.expiresAt) {
                    otpStore.delete(email);
                    #err("OTP expired")
                } else if (otpData.attempts >= 5) {
                    otpStore.delete(email);
                    #err("Too many attempts")
                } else if (otpData.code == code) {
                    otpStore.delete(email);
                    #ok(true)
                } else {
                    let updatedOtp = {
                        otpData with attempts = otpData.attempts + 1
                    };
                    otpStore.put(email, updatedOtp);
                    #ok(false)
                }
            };
            case null { #err("No OTP found for this email") }
        }
    };

    public func deleteOTP(email: Email): async () {
        otpStore.delete(email)
    };

    public func getOTPCount(email: Email): async Nat {
        0 // Simple implementation
    };

    // Admin functions
    public func getAllUsers(): async [User] {
        let buffer = Buffer.Buffer<User>(0);
        for ((_, user) in users.entries()) {
            buffer.add(user);
        };
        Buffer.toArray(buffer)
    };

    public func deleteUser(userId: UserId): async Result.Result<(), Text> {
        switch (users.get(userId)) {
            case (?user) {
                users.delete(userId);
                emailToUserId.delete(user.email);
                #ok(())
            };
            case null { #err("User not found") }
        }
    };

    // Profile submission tracking functions
    public func markProfileAsSubmitted(userId: UserId): async Result.Result<(), Text> {
        switch (users.get(userId)) {
            case (?user) {
                let updatedUser = {
                    user with profileSubmitted = true
                };
                users.put(userId, updatedUser);
                #ok(())
            };
            case null { #err("User not found") }
        }
    };

    public func isProfileSubmitted(userId: UserId): async Bool {
        switch (users.get(userId)) {
            case (?user) { user.profileSubmitted };
            case null { false }
        }
    };

    public func updateProfileSubmissionStatus(userId: UserId, isSubmitted: Bool): async Result.Result<(), Text> {
        switch (users.get(userId)) {
            case (?user) {
                let updatedUser = {
                    user with profileSubmitted = isSubmitted
                };
                users.put(userId, updatedUser);
                #ok(())
            };
            case null { #err("User not found") }
        }
    };

    // Wallet management functions
    public func updateWalletInfo(userId: UserId, walletPrincipal: ?Principal, walletAccountId: ?Text): async Result.Result<(), Text> {
        switch (users.get(userId)) {
            case (?user) {
                switch (user.profile) {
                    case (?profile) {
                        let updatedProfile = {
                            profile with
                            wallet_principal = walletPrincipal;
                            wallet_account_id = walletAccountId;
                        };
                        let updatedUser = {
                            user with profile = ?updatedProfile
                        };
                        users.put(userId, updatedUser);
                        #ok(())
                    };
                    case null {
                        // Create minimal profile with wallet info
                        let newProfile: ProfileData = {
                            firstName = "";
                            lastName = "";
                            bio = null;
                            phone = null;
                            location = null;
                            website = null;
                            linkedin = null;
                            github = null;
                            twitter = null;
                            profileImageUrl = null;
                            resumeUrl = null;
                            skills = [];
                            experience = [];
                            education = [];
                            wallet_principal = walletPrincipal;
                            wallet_account_id = walletAccountId;
                        };
                        let updatedUser = {
                            user with profile = ?newProfile
                        };
                        users.put(userId, updatedUser);
                        #ok(())
                    }
                }
            };
            case null { #err("User not found") }
        }
    };

    public func getWalletInfo(userId: UserId): async Result.Result<{wallet_principal: ?Principal; wallet_account_id: ?Text}, Text> {
        switch (users.get(userId)) {
            case (?user) {
                switch (user.profile) {
                    case (?profile) {
                        #ok({
                            wallet_principal = profile.wallet_principal;
                            wallet_account_id = profile.wallet_account_id;
                        })
                    };
                    case null {
                        #ok({
                            wallet_principal = null;
                            wallet_account_id = null;
                        })
                    }
                }
            };
            case null { #err("User not found") }
        }
    };
}