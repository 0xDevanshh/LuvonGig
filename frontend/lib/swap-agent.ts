import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { IDL } from '@dfinity/candid';

const SWAP_CANISTER_ID = process.env.NEXT_PUBLIC_SWAP_CANISTER_ID || '';
const IC_HOST = process.env.NEXT_PUBLIC_IC_HOST || 'https://icp0.io';

// Define swap canister IDL based on the actual canister interface
export const swapCanisterIdl = ({ IDL }: typeof import('@dfinity/candid')) => {
  // TxId type
  const TxId = IDL.Variant({
    TransactionId: IDL.Text,
    BlockIndex: IDL.Nat,
  });

  // SwapArgs type
  const SwapArgs = IDL.Record({
    receive_token: IDL.Text,
    max_slippage: IDL.Opt(IDL.Float64),
    pay_amount: IDL.Nat,
    referred_by: IDL.Opt(IDL.Text),
    receive_amount: IDL.Opt(IDL.Nat),
    receive_address: IDL.Opt(IDL.Text),
    pay_token: IDL.Text,
    pay_tx_id: IDL.Opt(TxId),
  });

  // SwapAmountsTxReply type
  const SwapAmountsTxReply = IDL.Record({
    receive_chain: IDL.Text,
    pay_amount: IDL.Nat,
    receive_amount: IDL.Nat,
    pay_symbol: IDL.Text,
    receive_symbol: IDL.Text,
    receive_address: IDL.Text,
    pool_symbol: IDL.Text,
    pay_address: IDL.Text,
    price: IDL.Float64,
    pay_chain: IDL.Text,
    lp_fee: IDL.Nat,
    gas_fee: IDL.Nat,
  });

  // SwapAmountsReply type
  const SwapAmountsReply = IDL.Record({
    txs: IDL.Vec(SwapAmountsTxReply),
    receive_chain: IDL.Text,
    mid_price: IDL.Float64,
    pay_amount: IDL.Nat,
    receive_amount: IDL.Nat,
    pay_symbol: IDL.Text,
    receive_symbol: IDL.Text,
    receive_address: IDL.Text,
    pay_address: IDL.Text,
    price: IDL.Float64,
    pay_chain: IDL.Text,
    slippage: IDL.Float64,
  });

  // SwapAmountsResult type
  const SwapAmountsResult = IDL.Variant({
    Ok: SwapAmountsReply,
    Err: IDL.Text,
  });

  // SwapTxReply type
  const SwapTxReply = IDL.Record({
    ts: IDL.Nat64,
    receive_chain: IDL.Text,
    pay_amount: IDL.Nat,
    receive_amount: IDL.Nat,
    pay_symbol: IDL.Text,
    receive_symbol: IDL.Text,
    receive_address: IDL.Text,
    pool_symbol: IDL.Text,
    pay_address: IDL.Text,
    price: IDL.Float64,
    pay_chain: IDL.Text,
    lp_fee: IDL.Nat,
    gas_fee: IDL.Nat,
  });

  // TransferIdReply type
  const TransferIdReply = IDL.Record({
    transfer_id: IDL.Nat64,
    transfer: IDL.Variant({
      IC: IDL.Record({
        is_send: IDL.Bool,
        block_index: IDL.Nat,
        chain: IDL.Text,
        canister_id: IDL.Text,
        amount: IDL.Nat,
        symbol: IDL.Text,
      }),
    }),
  });

  // SwapReply type
  const SwapReply = IDL.Record({
    ts: IDL.Nat64,
    txs: IDL.Vec(SwapTxReply),
    request_id: IDL.Nat64,
    status: IDL.Text,
    tx_id: IDL.Nat64,
    transfer_ids: IDL.Vec(TransferIdReply),
    receive_chain: IDL.Text,
    mid_price: IDL.Float64,
    pay_amount: IDL.Nat,
    receive_amount: IDL.Nat,
    claim_ids: IDL.Vec(IDL.Nat64),
    pay_symbol: IDL.Text,
    receive_symbol: IDL.Text,
    receive_address: IDL.Text,
    pay_address: IDL.Text,
    price: IDL.Float64,
    pay_chain: IDL.Text,
    slippage: IDL.Float64,
  });

  // SwapResult type
  const SwapResult = IDL.Variant({
    Ok: SwapReply,
    Err: IDL.Text,
  });

  // ICTokenReply type
  const ICTokenReply = IDL.Record({
    fee: IDL.Nat,
    decimals: IDL.Nat8,
    token_id: IDL.Nat32,
    chain: IDL.Text,
    name: IDL.Text,
    canister_id: IDL.Text,
    icrc1: IDL.Bool,
    icrc2: IDL.Bool,
    icrc3: IDL.Bool,
    is_removed: IDL.Bool,
    symbol: IDL.Text,
  });

  // LPTokenReply type
  const LPTokenReply = IDL.Record({
    fee: IDL.Nat,
    decimals: IDL.Nat8,
    token_id: IDL.Nat32,
    chain: IDL.Text,
    name: IDL.Text,
    address: IDL.Text,
    pool_id_of: IDL.Nat32,
    is_removed: IDL.Bool,
    total_supply: IDL.Nat,
    symbol: IDL.Text,
  });

  // TokenReply type
  const TokenReply = IDL.Variant({
    IC: ICTokenReply,
    LP: LPTokenReply,
  });

  // TokensResult type
  const TokensResult = IDL.Variant({
    Ok: IDL.Vec(TokenReply),
    Err: IDL.Text,
  });

  // LPBalancesReply type
  const LPBalancesReply = IDL.Record({
    ts: IDL.Nat64,
    usd_balance: IDL.Float64,
    balance: IDL.Float64,
    name: IDL.Text,
    amount_0: IDL.Float64,
    amount_1: IDL.Float64,
    address_0: IDL.Text,
    address_1: IDL.Text,
    symbol_0: IDL.Text,
    symbol_1: IDL.Text,
    usd_amount_0: IDL.Float64,
    usd_amount_1: IDL.Float64,
    chain_0: IDL.Text,
    chain_1: IDL.Text,
    symbol: IDL.Text,
    lp_token_id: IDL.Nat64,
  });

  // UserBalancesReply type
  const UserBalancesReply = IDL.Variant({
    LP: LPBalancesReply,
  });

  // UserBalancesResult type
  const UserBalancesResult = IDL.Variant({
    Ok: IDL.Vec(UserBalancesReply),
    Err: IDL.Text,
  });

  // UserReply type
  const UserReply = IDL.Record({
    account_id: IDL.Text,
    fee_level_expires_at: IDL.Opt(IDL.Nat64),
    referred_by: IDL.Opt(IDL.Text),
    user_id: IDL.Nat32,
    fee_level: IDL.Nat8,
    principal_id: IDL.Text,
    referred_by_expires_at: IDL.Opt(IDL.Nat64),
    my_referral_code: IDL.Text,
  });

  // UserResult type
  const UserResult = IDL.Variant({
    Ok: UserReply,
    Err: IDL.Text,
  });

  return IDL.Service({
    // Swap function - takes SwapArgs and returns SwapResult
    swap: IDL.Func([SwapArgs], [SwapResult], []),
    
    // Get swap amounts (quote) - query function
    swap_amounts: IDL.Func(
      [IDL.Text, IDL.Nat, IDL.Text], // pay_token, pay_amount, receive_token
      [SwapAmountsResult],
      ['query']
    ),
    
    // Get tokens list - query function
    tokens: IDL.Func(
      [IDL.Opt(IDL.Text)], // optional filter
      [TokensResult],
      ['query']
    ),
    
    // Get user balances - query function
    user_balances: IDL.Func(
      [IDL.Text], // address/principal
      [UserBalancesResult],
      ['query']
    ),
    
    // Get user info - query function
    get_user: IDL.Func([], [UserResult], ['query']),
  });
};

// Create swap actor with Plug wallet agent
export async function createSwapActor(plugAgent?: any) {
  if (!SWAP_CANISTER_ID) {
    throw new Error('NEXT_PUBLIC_SWAP_CANISTER_ID is not configured');
  }

  let agent: HttpAgent;
  
  if (plugAgent) {
    // Use Plug's agent which already has identity configured
    agent = plugAgent;
  } else {
    // Create anonymous agent
    agent = new HttpAgent({
      host: IC_HOST,
    });
  }

  // Fetch root key for local development
  if (IC_HOST.includes('localhost') || IC_HOST.includes('127.0.0.1')) {
    await agent.fetchRootKey();
  }

  const canisterId = Principal.fromText(SWAP_CANISTER_ID);
  const actor = Actor.createActor(swapCanisterIdl as any, {
    agent,
    canisterId,
  });

  return actor as any;
}

// Helper to get Plug wallet agent
export async function getPlugAgent() {
  if (typeof window === 'undefined' || !(window as any).ic?.plug) {
    throw new Error('Plug wallet not found');
  }

  const plug = (window as any).ic.plug;
  
  // Check if already connected
  const isConnected = await plug.isConnected();
  if (!isConnected) {
    throw new Error('Wallet not connected. Please connect your Plug wallet first.');
  }

  // Wait a bit to ensure agent is ready
  await new Promise(resolve => setTimeout(resolve, 300));

  // Get agent from Plug (it already has identity configured)
  // Plug should provide the agent after connection
  let agent = plug.agent;
  
  // If agent is not immediately available, try waiting a bit more
  if (!agent) {
    console.warn('Agent not immediately available, waiting...');
    await new Promise(resolve => setTimeout(resolve, 500));
    agent = plug.agent;
  }

  // If still no agent, try accessing it through different paths
  if (!agent) {
    agent = plug.createAgent?.() || plug.getAgent?.();
  }

  if (!agent) {
    throw new Error('Failed to get agent from Plug wallet. The wallet may not be fully initialized. Please try reconnecting.');
  }

  // Ensure root key is fetched for local development
  if (IC_HOST.includes('localhost') || IC_HOST.includes('127.0.0.1')) {
    try {
      await agent.fetchRootKey();
    } catch (rootKeyErr) {
      console.warn('Could not fetch root key (may already be fetched):', rootKeyErr);
    }
  }

  return agent;
}

