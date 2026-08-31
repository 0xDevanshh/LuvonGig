import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface CreateHackathonRequest {
  'theme' : string,
  'title' : string,
  'registration_start' : string,
  'tagline' : string,
  'mode' : HackathonMode,
  'description' : string,
  'end_date' : string,
  'start_date' : string,
  'prize_pool' : string,
  'registration_end' : string,
  'max_team_size' : bigint,
  'min_team_size' : bigint,
  'location' : string,
  'rules' : string,
}
export interface Hackathon {
  'status' : HackathonStatus,
  'theme' : string,
  'title' : string,
  'updated_at' : string,
  'registration_start' : string,
  'tagline' : string,
  'mode' : HackathonMode,
  'hackathon_id' : HackathonId,
  'description' : string,
  'end_date' : string,
  'created_at' : string,
  'start_date' : string,
  'prize_pool' : string,
  'registration_end' : string,
  'max_team_size' : bigint,
  'min_team_size' : bigint,
  'location' : string,
  'rules' : string,
}
export type HackathonId = string;
export type HackathonMode = { 'Online' : null } |
  { 'Offline' : null } |
  { 'Hybrid' : null };
export type HackathonStatus = { 'Ongoing' : null } |
  { 'Cancelled' : null } |
  { 'Completed' : null } |
  { 'Upcoming' : null };
export interface _SERVICE {
  'createHackathon' : ActorMethod<[CreateHackathonRequest], Hackathon>,
  'deleteHackathonAsOrganizer' : ActorMethod<[string, string], string>,
  'duplicateHackathon' : ActorMethod<[string, string], Hackathon>,
  'getHackathonsByOrganizer' : ActorMethod<
    [string, bigint, bigint, string],
    Array<Hackathon>
  >,
  'hello' : ActorMethod<[], string>,
  'listHackathons' : ActorMethod<[bigint, bigint], Array<Hackathon>>,
  'updateHackathonStatus' : ActorMethod<[string, string, string], Hackathon>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
