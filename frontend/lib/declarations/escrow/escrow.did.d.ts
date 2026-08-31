import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Account {
  'owner' : Principal,
  'subaccount' : [] | [Uint8Array | number[]],
}
export interface Escrow {
  'status' : EscrowStatus,
  'client' : Principal,
  'subaccount' : Uint8Array | number[],
  'createdAtNs' : bigint,
  'projectId' : string,
  'expectedE8s' : bigint,
  'escrowId' : EscrowId,
  'ledgerBlockIndex' : [] | [bigint],
  'freelancer' : Principal,
  'releaseAtNs' : [] | [bigint],
  'fundedAtNs' : [] | [bigint],
}
export type EscrowId = string;
export type EscrowStatus = { 'created' : null } |
  { 'refunded' : null } |
  { 'funded' : null } |
  { 'released' : null };
export interface RefreshResult { 'funded' : boolean, 'balanceE8s' : bigint }
export type TransferResult = { 'ok' : bigint } |
  { 'err' : string };
export interface _SERVICE {
  'create' : ActorMethod<
    [string, Principal, Principal, bigint],
    [EscrowId, Account]
  >,
  'get' : ActorMethod<[EscrowId], Escrow>,
  'get_deposit_account' : ActorMethod<[EscrowId], Account>,
  'get_relayer' : ActorMethod<[], [] | [Principal]>,
  'get_treasury' : ActorMethod<[], Principal>,
  'refresh_funding' : ActorMethod<[EscrowId], RefreshResult>,
  'refund' : ActorMethod<[EscrowId], TransferResult>,
  'release' : ActorMethod<[EscrowId, bigint], TransferResult>,
  'set_relayer' : ActorMethod<[[] | [Principal]], undefined>,
  'set_treasury' : ActorMethod<[Principal], undefined>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
