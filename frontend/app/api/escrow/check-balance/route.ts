import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/actions/auth';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { idlFactory as escrowIdlFactory } from '@/lib/declarations/escrow/escrow.did.js';
import { getUserActor } from '@/lib/ic-agent';

// Get escrow actor for ICP mainnet
async function getMainnetEscrowActor() {
  const IC_HOST = process.env.NEXT_PUBLIC_IC_HOST || 'https://icp0.io';
  const agent = new HttpAgent({ host: IC_HOST });

  if (IC_HOST.includes('localhost') || IC_HOST.includes('127.0.0.1')) {
    await agent.fetchRootKey();
  }

  if (!process.env.NEXT_PUBLIC_ESCROW_CANISTER_ID) {
    throw new Error('NEXT_PUBLIC_ESCROW_CANISTER_ID is required');
  }

  const canisterId = Principal.fromText(process.env.NEXT_PUBLIC_ESCROW_CANISTER_ID);
  return Actor.createActor(escrowIdlFactory, {
    agent,
    canisterId,
  });
}

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
      }, { status: 401 });
    }

    // Get user's wallet principal
    const userActor = await getUserActor();
    const user = await userActor.getUserById(session.userId);
    
    if (!user || user.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 });
    }

    const userData = user[0];
    if (!userData.walletPrincipal || userData.walletPrincipal.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User wallet not connected',
      }, { status: 400 });
    }

    const userPrincipal = userData.walletPrincipal[0];
    const escrowActor = await getMainnetEscrowActor();
    const escrowCanisterId = process.env.NEXT_PUBLIC_ESCROW_CANISTER_ID!;

    // Check escrow canister's total balance
    // Note: This checks the canister's main account, not individual escrow subaccounts
    const IC_HOST = process.env.NEXT_PUBLIC_IC_HOST || 'https://icp0.io';
    const agent = new HttpAgent({ host: IC_HOST });
    
    if (IC_HOST.includes('localhost') || IC_HOST.includes('127.0.0.1')) {
      await agent.fetchRootKey();
    }

    // Get ICP Ledger actor
    const ICP_LEDGER_CANISTER_ID = 'ryjl3-tyaaa-aaaaa-aaaba-cai';
    const ledgerPrincipal = Principal.fromText(ICP_LEDGER_CANISTER_ID);
    
    const icrc1Idl = ({ IDL }: typeof import('@dfinity/candid')) => {
      const Account = IDL.Record({
        owner: IDL.Principal,
        subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
      });
      return IDL.Service({
        icrc1_balance_of: IDL.Func([Account], [IDL.Nat], ['query']),
      });
    };

    const ledgerActor = Actor.createActor(icrc1Idl as any, {
      agent,
      canisterId: ledgerPrincipal,
    });

    const escrowCanisterPrincipal = Principal.fromText(escrowCanisterId);
    const canisterBalance = await (ledgerActor as any).icrc1_balance_of({
      owner: escrowCanisterPrincipal,
      subaccount: [],
    });

    return NextResponse.json({
      success: true,
      message: 'This shows the escrow canister\'s main balance. Individual escrows use subaccounts.',
      data: {
        escrowCanisterId,
        canisterBalanceE8s: Number(canisterBalance),
        canisterBalanceICP: Number(canisterBalance) / 100000000,
        note: 'To find your specific escrows, you need the escrow IDs. Check:',
        suggestions: [
          '1. Browser console/network tab when you created escrows',
          '2. Check your "My Projects" page - escrow IDs might be shown there',
          '3. Check browser localStorage/sessionStorage',
          '4. If you know the projectId/serviceId, try patterns like: projectId:0, projectId:1, etc.',
        ],
      },
    });

  } catch (error) {
    console.error('❌ Check balance error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check balance',
    }, { status: 500 });
  }
}


