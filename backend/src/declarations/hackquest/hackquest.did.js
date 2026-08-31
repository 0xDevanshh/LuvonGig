export const idlFactory = ({ IDL }) => {
  const SubmissionId = IDL.Text;
  const HackathonId = IDL.Text;
  const CategoryId = IDL.Text;
  const SubmissionStatus = IDL.Variant({
    'UnderReview' : IDL.Null,
    'Draft' : IDL.Null,
    'Rejected' : IDL.Null,
    'Selected' : IDL.Null,
    'Submitted' : IDL.Null,
  });
  const TeamId = IDL.Text;
  const Submission = IDL.Record({
    'id' : SubmissionId,
    'hackathonId' : HackathonId,
    'categoryId' : CategoryId,
    'status' : SubmissionStatus,
    'title' : IDL.Text,
    'submittedAt' : IDL.Int,
    'description' : IDL.Text,
    'summary' : IDL.Text,
    'demoUrl' : IDL.Text,
    'repoUrl' : IDL.Text,
    'teamId' : TeamId,
    'gallery' : IDL.Vec(IDL.Text),
  });
  const HackQuestError = IDL.Variant({
    'NotFound' : IDL.Text,
    'ValidationError' : IDL.Text,
    'NotAuthorized' : IDL.Null,
    'InvalidState' : IDL.Text,
  });
  const Result = IDL.Variant({ 'ok' : Submission, 'err' : HackQuestError });
  const RewardId = IDL.Text;
  const RewardTier = IDL.Record({
    'id' : RewardId,
    'hackathonId' : HackathonId,
    'categoryId' : IDL.Opt(CategoryId),
    'title' : IDL.Text,
    'note' : IDL.Opt(IDL.Text),
    'rank' : IDL.Nat,
    'description' : IDL.Text,
    'awardedSubmissionId' : IDL.Opt(SubmissionId),
    'awardedTeamId' : IDL.Opt(TeamId),
    'awardedAt' : IDL.Opt(IDL.Int),
    'awardedBy' : IDL.Opt(IDL.Principal),
    'perks' : IDL.Vec(IDL.Text),
    'amount' : IDL.Nat64,
  });
  const Result_4 = IDL.Variant({ 'ok' : RewardTier, 'err' : HackQuestError });
  const CategoryInput = IDL.Record({
    'judgingCriteria' : IDL.Vec(IDL.Text),
    'name' : IDL.Text,
    'description' : IDL.Text,
    'rewardSlots' : IDL.Nat,
  });
  const RewardInput = IDL.Record({
    'title' : IDL.Text,
    'categoryName' : IDL.Opt(IDL.Text),
    'rank' : IDL.Nat,
    'description' : IDL.Text,
    'perks' : IDL.Vec(IDL.Text),
    'amount' : IDL.Nat64,
  });
  const CreateHackathonRequest = IDL.Record({
    'faq' : IDL.Vec(IDL.Text),
    'categories' : IDL.Vec(CategoryInput),
    'theme' : IDL.Text,
    'title' : IDL.Text,
    'startAt' : IDL.Int,
    'tagline' : IDL.Text,
    'resources' : IDL.Vec(IDL.Text),
    'maxTeamsPerCategory' : IDL.Nat,
    'minTeamSize' : IDL.Nat,
    'heroVideoUrl' : IDL.Text,
    'submissionsCloseAt' : IDL.Int,
    'endAt' : IDL.Int,
    'summary' : IDL.Text,
    'maxTeamSize' : IDL.Nat,
    'rewards' : IDL.Vec(RewardInput),
    'bannerUrl' : IDL.Text,
    'submissionsOpenAt' : IDL.Int,
    'location' : IDL.Text,
    'prizePool' : IDL.Nat64,
  });
  const HackathonStatus = IDL.Variant({
    'Ongoing' : IDL.Null,
    'Draft' : IDL.Null,
    'Judging' : IDL.Null,
    'Cancelled' : IDL.Null,
    'Completed' : IDL.Null,
    'Upcoming' : IDL.Null,
  });
  const Hackathon = IDL.Record({
    'id' : HackathonId,
    'faq' : IDL.Vec(IDL.Text),
    'categories' : IDL.Vec(CategoryId),
    'status' : HackathonStatus,
    'organizer' : IDL.Principal,
    'theme' : IDL.Text,
    'title' : IDL.Text,
    'startAt' : IDL.Int,
    'tagline' : IDL.Text,
    'resources' : IDL.Vec(IDL.Text),
    'maxTeamsPerCategory' : IDL.Nat,
    'createdAt' : IDL.Int,
    'minTeamSize' : IDL.Nat,
    'heroVideoUrl' : IDL.Text,
    'submissionsCloseAt' : IDL.Int,
    'endAt' : IDL.Int,
    'summary' : IDL.Text,
    'maxTeamSize' : IDL.Nat,
    'rewards' : IDL.Vec(RewardId),
    'bannerUrl' : IDL.Text,
    'submissionsOpenAt' : IDL.Int,
    'location' : IDL.Text,
    'prizePool' : IDL.Nat64,
  });
  const Result_1 = IDL.Variant({ 'ok' : Hackathon, 'err' : HackQuestError });
  const CreateTeamRequest = IDL.Record({
    'hackathonId' : HackathonId,
    'categoryId' : IDL.Opt(CategoryId),
    'invitees' : IDL.Vec(IDL.Principal),
    'name' : IDL.Text,
    'leader' : IDL.Principal,
  });
  const TeamMember = IDL.Record({
    'principal' : IDL.Principal,
    'invitedAt' : IDL.Int,
    'accepted' : IDL.Bool,
    'acceptedAt' : IDL.Opt(IDL.Int),
  });
  const Team = IDL.Record({
    'id' : TeamId,
    'hackathonId' : HackathonId,
    'categoryId' : IDL.Opt(CategoryId),
    'members' : IDL.Vec(TeamMember),
    'name' : IDL.Text,
    'createdAt' : IDL.Int,
    'leader' : IDL.Principal,
    'submissionId' : IDL.Opt(SubmissionId),
  });
  const Result_2 = IDL.Variant({ 'ok' : Team, 'err' : HackQuestError });
  const Category = IDL.Record({
    'id' : CategoryId,
    'hackathonId' : HackathonId,
    'judgingCriteria' : IDL.Vec(IDL.Text),
    'name' : IDL.Text,
    'description' : IDL.Text,
    'rewardSlots' : IDL.Nat,
  });
  const Participant = IDL.Record({
    'principal' : IDL.Principal,
    'displayName' : IDL.Text,
    'joinedAt' : IDL.Int,
    'email' : IDL.Text,
  });
  const Result_3 = IDL.Variant({ 'ok' : Participant, 'err' : HackQuestError });
  const SubmitProjectRequest = IDL.Record({
    'title' : IDL.Text,
    'description' : IDL.Text,
    'summary' : IDL.Text,
    'demoUrl' : IDL.Text,
    'repoUrl' : IDL.Text,
    'teamId' : TeamId,
    'gallery' : IDL.Vec(IDL.Text),
  });
  return IDL.Service({
    'addGalleryImage' : IDL.Func([SubmissionId, IDL.Text], [Result], []),
    'assignWinner' : IDL.Func(
        [HackathonId, RewardId, SubmissionId, IDL.Opt(IDL.Text)],
        [Result_4],
        [],
      ),
    'createHackathon' : IDL.Func([CreateHackathonRequest], [Result_1], []),
    'createTeam' : IDL.Func([CreateTeamRequest], [Result_2], []),
    'getHackathonDetails' : IDL.Func(
        [HackathonId],
        [
          IDL.Opt(
            IDL.Record({
              'categories' : IDL.Vec(Category),
              'hackathon' : Hackathon,
              'rewards' : IDL.Vec(RewardTier),
            })
          ),
        ],
        ['query'],
      ),
    'getParticipant' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(Participant)],
        ['query'],
      ),
    'listHackathons' : IDL.Func(
        [IDL.Nat, IDL.Nat, IDL.Opt(HackathonStatus)],
        [IDL.Vec(Hackathon)],
        ['query'],
      ),
    'listParticipantsForHackathon' : IDL.Func(
        [HackathonId],
        [IDL.Vec(Participant)],
        ['query'],
      ),
    'listSubmissions' : IDL.Func(
        [HackathonId, IDL.Opt(CategoryId)],
        [IDL.Vec(Submission)],
        ['query'],
      ),
    'listTeams' : IDL.Func(
        [HackathonId, IDL.Opt(CategoryId)],
        [IDL.Vec(Team)],
        ['query'],
      ),
    'listWinners' : IDL.Func([HackathonId], [IDL.Vec(RewardTier)], ['query']),
    'registerParticipant' : IDL.Func(
        [IDL.Principal, IDL.Text, IDL.Text],
        [Result_3],
        [],
      ),
    'respondToInvite' : IDL.Func([TeamId, IDL.Bool], [Result_2], []),
    'submitProject' : IDL.Func([SubmitProjectRequest], [Result], []),
    'updateHackathonStatus' : IDL.Func(
        [HackathonId, HackathonStatus],
        [Result_1],
        [],
      ),
    'updateSubmission' : IDL.Func(
        [
          SubmissionId,
          IDL.Record({
            'status' : IDL.Opt(SubmissionStatus),
            'title' : IDL.Opt(IDL.Text),
            'description' : IDL.Opt(IDL.Text),
            'summary' : IDL.Opt(IDL.Text),
            'demoUrl' : IDL.Opt(IDL.Text),
            'repoUrl' : IDL.Opt(IDL.Text),
          }),
        ],
        [Result],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
