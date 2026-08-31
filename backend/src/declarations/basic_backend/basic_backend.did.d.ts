import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Message {
  'from' : string,
  'text' : string,
  'timestamp' : bigint,
}
export interface _SERVICE {
  'addMessage' : ActorMethod<[string, string], undefined>,
  'clearMessages' : ActorMethod<[], undefined>,
  'getMessageCount' : ActorMethod<[], bigint>,
  'getMessages' : ActorMethod<[], Array<Message>>,
  'greet' : ActorMethod<[string], string>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
