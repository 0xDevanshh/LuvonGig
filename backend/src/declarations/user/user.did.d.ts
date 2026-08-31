import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Education {
  'id' : string,
  'gpa' : [] | [string],
  'field' : string,
  'endDate' : [] | [string],
  'institution' : string,
  'description' : [] | [string],
  'degree' : string,
  'startDate' : string,
}
export type Email = string;
export interface Experience {
  'id' : string,
  'endDate' : [] | [string],
  'description' : [] | [string],
  'company' : string,
  'position' : string,
  'current' : boolean,
  'startDate' : string,
}
export interface OTPData {
  'expiresAt' : bigint,
  'code' : string,
  'attempts' : bigint,
}
export type PasswordHash = string;
export interface ProfileData {
  'bio' : [] | [string],
  'linkedin' : [] | [string],
  'twitter' : [] | [string],
  'education' : Array<Education>,
  'website' : [] | [string],
  'experience' : Array<Experience>,
  'phone' : [] | [string],
  'lastName' : string,
  'skills' : Array<string>,
  'profileImageUrl' : [] | [string],
  'location' : [] | [string],
  'github' : [] | [string],
  'resumeUrl' : [] | [string],
  'firstName' : string,
}
export type Result = { 'ok' : boolean } |
  { 'err' : string };
export type Result_1 = { 'ok' : null } |
  { 'err' : string };
export type Result_2 = { 'ok' : UserId } |
  { 'err' : string };
export type Result_3 = { 'ok' : string } |
  { 'err' : string };
export interface User {
  'id' : UserId,
  'otpData' : [] | [OTPData],
  'lastLoginAt' : [] | [bigint],
  'createdAt' : bigint,
  'email' : Email,
  'isVerified' : boolean,
  'profileSubmitted' : boolean,
  'passwordHash' : PasswordHash,
  'walletPrincipal' : [] | [Principal],
  'walletAccountId' : [] | [string],
  'profile' : [] | [ProfileData],
}
export type UserId = string;
export interface _SERVICE {
  'createOTP' : ActorMethod<[Email], Result_3>,
  'createUser' : ActorMethod<[Email, PasswordHash], Result_2>,
  'deleteOTP' : ActorMethod<[Email], undefined>,
  'deleteUser' : ActorMethod<[UserId], Result_1>,
  'getAllUsers' : ActorMethod<[], Array<User>>,
  'getOTPCount' : ActorMethod<[Email], bigint>,
  'getProfile' : ActorMethod<[UserId], [] | [ProfileData]>,
  'getUserByEmail' : ActorMethod<[Email], [] | [User]>,
  'getUserById' : ActorMethod<[UserId], [] | [User]>,
  'getWalletInfo' : ActorMethod<[UserId], [] | [[Principal, string]]>,
  'isProfileSubmitted' : ActorMethod<[UserId], boolean>,
  'markProfileAsSubmitted' : ActorMethod<[UserId], Result_1>,
  'updateLastLogin' : ActorMethod<[UserId], Result_1>,
  'updatePassword' : ActorMethod<[UserId, PasswordHash], Result_1>,
  'updateProfile' : ActorMethod<[UserId, ProfileData], Result_1>,
  'updateProfileSubmissionStatus' : ActorMethod<[UserId, boolean], Result_1>,
  'updateWalletInfo' : ActorMethod<
    [UserId, [] | [Principal], [] | [string]],
    Result_1
  >,
  'verifyEmail' : ActorMethod<[UserId], Result_1>,
  'verifyOTP' : ActorMethod<[Email, string], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
