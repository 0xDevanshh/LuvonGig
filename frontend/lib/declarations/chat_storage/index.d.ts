import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';
import type { _SERVICE } from './chat_storage.did.d';

export declare const idlFactory: IDL.InterfaceFactory;
export declare const canisterId: string;

/**
 * Intialized Actor using default settings, ready to talk to a canister using its candid interface
 */
export declare const chat_storage: ActorMethod<any, any> | undefined;

/**
 * Creates an actor with using the candid interface and the HttpAgent
 * @param {string | Principal} canisterId - ID of the canister the {@link Actor} will talk to
 * @param {Object} options - {@link HttpAgentOptions} & {@link ActorConfig}
 */
export declare const createActor: (
  canisterId: string | Principal,
  options?: {
    agentOptions?: HttpAgentOptions;
    actorOptions?: ActorConfig;
  }
) => ActorMethod<any, any>;

export type HttpAgentOptions = {
  host?: string;
  identity?: any;
};

export type ActorConfig = {
  queryCallTransform?: any;
  updateCallTransform?: any;
};
