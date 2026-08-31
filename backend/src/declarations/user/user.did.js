export const idlFactory = ({ IDL }) => {
  const Email = IDL.Text;
  const Result_3 = IDL.Variant({ 'ok' : IDL.Text, 'err' : IDL.Text });
  const PasswordHash = IDL.Text;
  const UserId = IDL.Text;
  const Result_2 = IDL.Variant({ 'ok' : UserId, 'err' : IDL.Text });
  const Result_1 = IDL.Variant({ 'ok' : IDL.Null, 'err' : IDL.Text });
  const OTPData = IDL.Record({
    'expiresAt' : IDL.Int,
    'code' : IDL.Text,
    'attempts' : IDL.Nat,
  });
  const Education = IDL.Record({
    'id' : IDL.Text,
    'gpa' : IDL.Opt(IDL.Text),
    'field' : IDL.Text,
    'endDate' : IDL.Opt(IDL.Text),
    'institution' : IDL.Text,
    'description' : IDL.Opt(IDL.Text),
    'degree' : IDL.Text,
    'startDate' : IDL.Text,
  });
  const Experience = IDL.Record({
    'id' : IDL.Text,
    'endDate' : IDL.Opt(IDL.Text),
    'description' : IDL.Opt(IDL.Text),
    'company' : IDL.Text,
    'position' : IDL.Text,
    'current' : IDL.Bool,
    'startDate' : IDL.Text,
  });
  const ProfileData = IDL.Record({
    'bio' : IDL.Opt(IDL.Text),
    'linkedin' : IDL.Opt(IDL.Text),
    'twitter' : IDL.Opt(IDL.Text),
    'education' : IDL.Vec(Education),
    'website' : IDL.Opt(IDL.Text),
    'experience' : IDL.Vec(Experience),
    'phone' : IDL.Opt(IDL.Text),
    'lastName' : IDL.Text,
    'skills' : IDL.Vec(IDL.Text),
    'profileImageUrl' : IDL.Opt(IDL.Text),
    'location' : IDL.Opt(IDL.Text),
    'github' : IDL.Opt(IDL.Text),
    'resumeUrl' : IDL.Opt(IDL.Text),
    'firstName' : IDL.Text,
  });
  const User = IDL.Record({
    'id' : UserId,
    'otpData' : IDL.Opt(OTPData),
    'lastLoginAt' : IDL.Opt(IDL.Int),
    'createdAt' : IDL.Int,
    'email' : Email,
    'isVerified' : IDL.Bool,
    'profileSubmitted' : IDL.Bool,
    'passwordHash' : PasswordHash,
    'walletPrincipal' : IDL.Opt(IDL.Principal),
    'walletAccountId' : IDL.Opt(IDL.Text),
    'profile' : IDL.Opt(ProfileData),
  });
  const Result = IDL.Variant({ 'ok' : IDL.Bool, 'err' : IDL.Text });
  return IDL.Service({
    'createOTP' : IDL.Func([Email], [Result_3], []),
    'createUser' : IDL.Func([Email, PasswordHash], [Result_2], []),
    'deleteOTP' : IDL.Func([Email], [], []),
    'deleteUser' : IDL.Func([UserId], [Result_1], []),
    'getAllUsers' : IDL.Func([], [IDL.Vec(User)], []),
    'getOTPCount' : IDL.Func([Email], [IDL.Nat], []),
    'getProfile' : IDL.Func([UserId], [IDL.Opt(ProfileData)], []),
    'getUserByEmail' : IDL.Func([Email], [IDL.Opt(User)], []),
    'getUserById' : IDL.Func([UserId], [IDL.Opt(User)], []),
    'getWalletInfo' : IDL.Func(
        [UserId],
        [IDL.Opt(IDL.Tuple(IDL.Principal, IDL.Text))],
        [],
      ),
    'isProfileSubmitted' : IDL.Func([UserId], [IDL.Bool], []),
    'markProfileAsSubmitted' : IDL.Func([UserId], [Result_1], []),
    'updateLastLogin' : IDL.Func([UserId], [Result_1], []),
    'updatePassword' : IDL.Func([UserId, PasswordHash], [Result_1], []),
    'updateProfile' : IDL.Func([UserId, ProfileData], [Result_1], []),
    'updateProfileSubmissionStatus' : IDL.Func(
        [UserId, IDL.Bool],
        [Result_1],
        [],
      ),
    'updateWalletInfo' : IDL.Func(
        [UserId, IDL.Opt(IDL.Principal), IDL.Opt(IDL.Text)],
        [Result_1],
        [],
      ),
    'verifyEmail' : IDL.Func([UserId], [Result_1], []),
    'verifyOTP' : IDL.Func([Email, IDL.Text], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
