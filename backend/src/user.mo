import Time "mo:base/Time";
import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Hash "mo:base/Hash";
import Int "mo:base/Int";
import Bool "mo:base/Bool";
import Option "mo:base/Option";
import Iter "mo:base/Iter";
import Buffer "mo:base/Buffer";

actor UserCanister {

  // Type definitions matching frontend expectations
  public type UserId = Text;
  public type Email = Text;
  public type PasswordHash = Text;

  public type OTPData = {
    code: Text;
    expiresAt: Int;
    attempts: Nat;
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

  public type Experience = {
    id: Text;
    company: Text;
    position: Text;
    startDate: Text;
    endDate: ?Text;
    description: ?Text;
    current: Bool;
  };

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
  };

  public type User = {
    id: UserId;
    email: Email;
    passwordHash: PasswordHash;
    isVerified: Bool;
    createdAt: Int;
    lastLoginAt: ?Int;
    profile: ?ProfileData;
    otpData: ?OTPData;
  };

  public type Result<Ok, Err> = {
    #ok: Ok;
    #err: Err;
  };

  // Storage
  private var users = HashMap.HashMap<UserId, User>(0, Text.equal, Text.hash);
  private var usersByEmail = HashMap.HashMap<Email, UserId>(0, Text.equal, Text.hash);
  private var otpStore = HashMap.HashMap<Email, OTPData>(0, Text.equal, Text.hash);
  private var nextUserId = 1;

  // Helper functions
  private func generateUserId(): UserId {
    let id = "user_" # Nat.toText(nextUserId);
    nextUserId += 1;
    return id;
  };

  private func generateOTPCode(): Text {
    // Generate 6-digit OTP code
    let code = (nextUserId * 123456) % 1000000;
    let finalCode = if (code < 100000) { code + 100000 } else { code };
    return Nat.toText(finalCode);
  };

  private func isOTPExpired(otp: OTPData): Bool {
    return otp.expiresAt < Time.now();
  };

  private func cleanExpiredOTP(email: Email) {
    switch(otpStore.get(email)) {
      case (?otp) {
        if (isOTPExpired(otp)) {
          otpStore.delete(email);
        };
      };
      case null {};
    };
  };

  // Public API methods matching frontend expectations

  // Create a new user
  public shared({caller}) func createUser(email: Email, passwordHash: PasswordHash): async Result<UserId, Text> {
    // Check if user already exists
    switch(usersByEmail.get(email)) {
      case (?existingUserId) {
        return #err("User with this email already exists");
      };
      case null {};
    };

    let userId = generateUserId();
    let newUser: User = {
      id = userId;
      email = email;
      passwordHash = passwordHash;
      isVerified = false;
      createdAt = Time.now();
      lastLoginAt = null;
      profile = null;
      otpData = null;
    };

    users.put(userId, newUser);
    usersByEmail.put(email, userId);

    return #ok(userId);
  };

  // Get user by email
  public query func getUserByEmail(email: Email): async ?User {
    switch(usersByEmail.get(email)) {
      case (?userId) {
        return users.get(userId);
      };
      case null {
        return null;
      };
    };
  };

  // Get user by ID
  public query func getUserById(userId: UserId): async ?User {
    return users.get(userId);
  };

  // Create OTP for email verification
  public func createOTP(email: Email): async Result<Text, Text> {
    cleanExpiredOTP(email);

    let code = generateOTPCode();
    let otp: OTPData = {
      code = code;
      expiresAt = Time.now() + (10 * 60 * 1_000_000_000); // 10 minutes
      attempts = 0;
    };

    otpStore.put(email, otp);

    return #ok(code);
  };

  // Verify OTP
  public func verifyOTP(email: Email, code: Text): async Result<Bool, Text> {
    cleanExpiredOTP(email);

    switch(otpStore.get(email)) {
      case (?otp) {
        if (isOTPExpired(otp)) {
          return #err("OTP has expired");
        };

        if (otp.attempts >= 3) {
          otpStore.delete(email);
          return #err("Too many OTP attempts. Please request a new OTP.");
        };

        // Update attempts
        let updatedOtp: OTPData = {
          code = otp.code;
          expiresAt = otp.expiresAt;
          attempts = otp.attempts + 1;
        };
        otpStore.put(email, updatedOtp);

        if (otp.code == code) {
          // OTP is correct, mark user as verified
          switch(usersByEmail.get(email)) {
            case (?userId) {
              switch(users.get(userId)) {
                case (?user) {
                  let updatedUser: User = {
                    id = user.id;
                    email = user.email;
                    passwordHash = user.passwordHash;
                    isVerified = true;
                    createdAt = user.createdAt;
                    lastLoginAt = user.lastLoginAt;
                    profile = user.profile;
                    otpData = null;
                  };
                  users.put(userId, updatedUser);
                  otpStore.delete(email);
                  return #ok(true);
                };
                case null {};
              };
            };
            case null {};
          };
        };

        return #ok(false);
      };
      case null {
        return #err("OTP not found. Please request a new OTP.");
      };
    };
  };

  // Update last login time
  public func updateLastLogin(userId: UserId): async Result<(), Text> {
    switch(users.get(userId)) {
      case (?user) {
        let updatedUser: User = {
          id = user.id;
          email = user.email;
          passwordHash = user.passwordHash;
          isVerified = user.isVerified;
          createdAt = user.createdAt;
          lastLoginAt = ?Time.now();
          profile = user.profile;
          otpData = user.otpData;
        };
        users.put(userId, updatedUser);
        return #ok(());
      };
      case null {
        return #err("User not found");
      };
    };
  };

  // Update password
  public func updatePassword(userId: UserId, newPasswordHash: PasswordHash): async Result<(), Text> {
    switch(users.get(userId)) {
      case (?user) {
        let updatedUser: User = {
          id = user.id;
          email = user.email;
          passwordHash = newPasswordHash;
          isVerified = user.isVerified;
          createdAt = user.createdAt;
          lastLoginAt = user.lastLoginAt;
          profile = user.profile;
          otpData = user.otpData;
        };
        users.put(userId, updatedUser);
        return #ok(());
      };
      case null {
        return #err("User not found");
      };
    };
  };

  // Update profile
  public func updateProfile(userId: UserId, profileData: ProfileData): async Result<(), Text> {
    switch(users.get(userId)) {
      case (?user) {
        let updatedUser: User = {
          id = user.id;
          email = user.email;
          passwordHash = user.passwordHash;
          isVerified = user.isVerified;
          createdAt = user.createdAt;
          lastLoginAt = user.lastLoginAt;
          profile = ?profileData;
          otpData = user.otpData;
        };
        users.put(userId, updatedUser);
        return #ok(());
      };
      case null {
        return #err("User not found");
      };
    };
  };

  // Get profile
  public query func getProfile(userId: UserId): async ?ProfileData {
    switch(users.get(userId)) {
      case (?user) {
        return user.profile;
      };
      case null {
        return null;
      };
    };
  };

  // Verify email (alternative to OTP verification)
  public func verifyEmail(userId: UserId): async Result<(), Text> {
    switch(users.get(userId)) {
      case (?user) {
        let updatedUser: User = {
          id = user.id;
          email = user.email;
          passwordHash = user.passwordHash;
          isVerified = true;
          createdAt = user.createdAt;
          lastLoginAt = user.lastLoginAt;
          profile = user.profile;
          otpData = user.otpData;
        };
        users.put(userId, updatedUser);
        return #ok(());
      };
      case null {
        return #err("User not found");
      };
    };
  };

  // Delete user
  public func deleteUser(userId: UserId): async Result<(), Text> {
    switch(users.get(userId)) {
      case (?user) {
        users.delete(userId);
        usersByEmail.delete(user.email);
        return #ok(());
      };
      case null {
        return #err("User not found");
      };
    };
  };

  // Delete OTP
  public func deleteOTP(email: Email): async () {
    otpStore.delete(email);
  };

  // Get all users (admin function)
  public query func getAllUsers(): async [User] {
    let userArray = Buffer.Buffer<User>(0);
    for (user in users.vals()) {
      userArray.add(user);
    };
    return Buffer.toArray(userArray);
  };

  // Get OTP count for rate limiting
  public query func getOTPCount(email: Email): async Nat {
    cleanExpiredOTP(email);
    switch(otpStore.get(email)) {
      case (?otp) {
        return otp.attempts;
      };
      case null {
        return 0;
      };
    };
  };
}