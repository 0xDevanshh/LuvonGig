import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Category {
  'id' : CategoryId,
  'hackathonId' : HackathonId,
  'judgingCriteria' : Array<string>,
  'name' : string,
  'description' : string,
  'rewardSlots' : bigint,
}
export type CategoryId = string;
export interface CategoryInput {
  'judgingCriteria' : Array<string>,
  'name' : string,
  'description' : string,
  'rewardSlots' : bigint,
}
export interface CreateHackathonRequest {
  'faq' : Array<string>,
  'categories' : Array<CategoryInput>,
  'theme' : string,
  'title' : string,
  'startAt' : bigint,
  'tagline' : string,
  'resources' : Array<string>,
  'maxTeamsPerCategory' : bigint,
  'minTeamSize' : bigint,
  'heroVideoUrl' : string,
  'submissionsCloseAt' : bigint,
  'endAt' : bigint,
  'summary' : string,
  'maxTeamSize' : bigint,
  'rewards' : Array<RewardInput>,
  'bannerUrl' : string,
  'submissionsOpenAt' : bigint,
  'location' : string,
  'prizePool' : bigint,
}
export interface CreateTeamRequest {
  'hackathonId' : HackathonId,
  'categoryId' : [] | [CategoryId],
  'invitees' : Array<Principal>,
  'name' : string,
  'leader' : Principal,
}
export type HackQuestError = { 'NotFound' : string } |
  { 'ValidationError' : string } |
  { 'NotAuthorized' : null } |
  { 'InvalidState' : string };
export interface Hackathon {
  'id' : HackathonId,
  'faq' : Array<string>,
  'categories' : Array<CategoryId>,
  'status' : HackathonStatus,
  'organizer' : Principal,
  'theme' : string,
  'title' : string,
  'startAt' : bigint,
  'tagline' : string,
  'resources' : Array<string>,
  'maxTeamsPerCategory' : bigint,
  'createdAt' : bigint,
  'minTeamSize' : bigint,
  'heroVideoUrl' : string,
  'submissionsCloseAt' : bigint,
  'endAt' : bigint,
  'summary' : string,
  'maxTeamSize' : bigint,
  'rewards' : Array<RewardId>,
  'bannerUrl' : string,
  'submissionsOpenAt' : bigint,
  'location' : string,
  'prizePool' : bigint,
}
export type HackathonId = string;
export type HackathonStatus = { 'Ongoing' : null } |
  { 'Draft' : null } |
  { 'Judging' : null } |
  { 'Cancelled' : null } |
  { 'Completed' : null } |
  { 'Upcoming' : null };
export interface Participant {
  'principal' : Principal,
  'displayName' : string,
  'joinedAt' : bigint,
  'email' : string,
}
export type Result = { 'ok' : Submission } |
  { 'err' : HackQuestError };
export type Result_1 = { 'ok' : Hackathon } |
  { 'err' : HackQuestError };
export type Result_2 = { 'ok' : Team } |
  { 'err' : HackQuestError };
export type Result_3 = { 'ok' : Participant } |
  { 'err' : HackQuestError };
export type Result_4 = { 'ok' : RewardTier } |
  { 'err' : HackQuestError };
export type RewardId = string;
export interface RewardInput {
  'title' : string,
  'categoryName' : [] | [string],
  'rank' : bigint,
  'description' : string,
  'perks' : Array<string>,
  'amount' : bigint,
}
export interface RewardTier {
  'id' : RewardId,
  'hackathonId' : HackathonId,
  'categoryId' : [] | [CategoryId],
  'title' : string,
  'note' : [] | [string],
  'rank' : bigint,
  'description' : string,
  'awardedSubmissionId' : [] | [SubmissionId],
  'awardedTeamId' : [] | [TeamId],
  'awardedAt' : [] | [bigint],
  'awardedBy' : [] | [Principal],
  'perks' : Array<string>,
  'amount' : bigint,
}
export interface Submission {
  'id' : SubmissionId,
  'hackathonId' : HackathonId,
  'categoryId' : CategoryId,
  'status' : SubmissionStatus,
  'title' : string,
  'submittedAt' : bigint,
  'description' : string,
  'summary' : string,
  'demoUrl' : string,
  'repoUrl' : string,
  'teamId' : TeamId,
  'gallery' : Array<string>,
}
export type SubmissionId = string;
export type SubmissionStatus = { 'UnderReview' : null } |
  { 'Draft' : null } |
  { 'Rejected' : null } |
  { 'Selected' : null } |
  { 'Submitted' : null };
export interface SubmitProjectRequest {
  'title' : string,
  'description' : string,
  'summary' : string,
  'demoUrl' : string,
  'repoUrl' : string,
  'teamId' : TeamId,
  'gallery' : Array<string>,
}
export interface Team {
  'id' : TeamId,
  'hackathonId' : HackathonId,
  'categoryId' : [] | [CategoryId],
  'members' : Array<TeamMember>,
  'name' : string,
  'createdAt' : bigint,
  'leader' : Principal,
  'submissionId' : [] | [SubmissionId],
}
export type TeamId = string;
export interface TeamMember {
  'principal' : Principal,
  'invitedAt' : bigint,
  'accepted' : boolean,
  'acceptedAt' : [] | [bigint],
}
export interface _SERVICE {
  'addGalleryImage' : ActorMethod<[SubmissionId, string], Result>,
  'assignWinner' : ActorMethod<
    [HackathonId, RewardId, SubmissionId, [] | [string]],
    Result_4
  >,
  'createHackathon' : ActorMethod<[CreateHackathonRequest], Result_1>,
  'createTeam' : ActorMethod<[CreateTeamRequest], Result_2>,
  'getHackathonDetails' : ActorMethod<
    [HackathonId],
    [] | [
      {
        'categories' : Array<Category>,
        'hackathon' : Hackathon,
        'rewards' : Array<RewardTier>,
      }
    ]
  >,
  'getParticipant' : ActorMethod<[Principal], [] | [Participant]>,
  'listHackathons' : ActorMethod<
    [bigint, bigint, [] | [HackathonStatus]],
    Array<Hackathon>
  >,
  'listParticipantsForHackathon' : ActorMethod<
    [HackathonId],
    Array<Participant>
  >,
  'listSubmissions' : ActorMethod<
    [HackathonId, [] | [CategoryId]],
    Array<Submission>
  >,
  'listTeams' : ActorMethod<[HackathonId, [] | [CategoryId]], Array<Team>>,
  'listWinners' : ActorMethod<[HackathonId], Array<RewardTier>>,
  'registerParticipant' : ActorMethod<[Principal, string, string], Result_3>,
  'respondToInvite' : ActorMethod<[TeamId, boolean], Result_2>,
  'submitProject' : ActorMethod<[SubmitProjectRequest], Result>,
  'updateHackathonStatus' : ActorMethod<
    [HackathonId, HackathonStatus],
    Result_1
  >,
  'updateSubmission' : ActorMethod<
    [
      SubmissionId,
      {
        'status' : [] | [SubmissionStatus],
        'title' : [] | [string],
        'description' : [] | [string],
        'summary' : [] | [string],
        'demoUrl' : [] | [string],
        'repoUrl' : [] | [string],
      },
    ],
    Result
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
