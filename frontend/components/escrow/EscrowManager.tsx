'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, Wallet, RefreshCw, Loader2 } from 'lucide-react';
import { Principal } from '@dfinity/principal';
import { Actor, HttpAgent } from '@dfinity/agent';
import { IDL } from '@dfinity/candid';

interface EscrowData {
  escrowId: string;
  depositAccount: {
    owner: string;
    subaccount: number[] | null;
  };
}

interface FundingStatus {
  funded: boolean;
  balanceE8s: number;
}

interface EscrowManagerProps {
  projectId: string;
  freelancerUserId: string;
  expectedAmountICP: number; // Amount in ICP (not e8s)
  isClient?: boolean; // Whether current user is the client
  packageId?: string; // Optional: for creating booking
  proposalId?: string; // Optional: for accepting proposal
  serviceTitle?: string; // Optional: for creating booking
  packageTitle?: string; // Optional: for creating booking
  specialInstructions?: string; // Optional: for creating booking
  onEscrowCreated?: (escrowData: EscrowData) => void;
  onEscrowReleased?: () => void;
  onPaymentSuccess?: (transactionId: string) => void;
}

export default function EscrowManager({
  projectId,
  freelancerUserId,
  expectedAmountICP,
  isClient = true,
  packageId,
  proposalId,
  serviceTitle,
  packageTitle,
  specialInstructions,
  onEscrowCreated,
  onEscrowReleased,
  onPaymentSuccess,
}: EscrowManagerProps) {
  const [escrowData, setEscrowData] = useState<EscrowData | null>(null);
  const [fundingStatus, setFundingStatus] = useState<FundingStatus | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletPrincipal, setWalletPrincipal] = useState<string | null>(null);
  const [connectingWallet, setConnectingWallet] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  // Round to 6 decimal places first to match Order Summary, then convert to e8s
  const roundedAmountICP = parseFloat(expectedAmountICP.toFixed(8));
  const expectedAmountE8s = Math.floor(roundedAmountICP * 100000000); // Convert ICP to e8s

  // ICP Ledger Canister ID (mainnet)
  const ICP_LEDGER_CANISTER_ID = 'ryjl3-tyaaa-aaaaa-aaaba-cai';
  const IC_HOST = process.env.NEXT_PUBLIC_IC_HOST || 'https://icp0.io';

  // Connect Plug wallet
  const connectWallet = async () => {
    setConnectingWallet(true);
    setError(null);

    try {
      if (typeof window === 'undefined' || !(window as any).ic?.plug) {
        throw new Error('Plug wallet not found. Please install Plug wallet extension.');
      }

      const plug = (window as any).ic.plug;
      const escrowCanisterId = process.env.NEXT_PUBLIC_ESCROW_CANISTER_ID || '';

      const isConnected = await plug.isConnected();
      if (!isConnected) {
        const connected = await plug.requestConnect({
          whitelist: escrowCanisterId ? [escrowCanisterId] : [],
          host: IC_HOST,
        });

        if (!connected) {
          throw new Error('Wallet connection was cancelled or failed');
        }
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      let principal = null;
      try {
        principal = await plug.getPrincipal();
      } catch (err) {
        if (plug.sessionManager?.principalId) {
          principal = plug.sessionManager.principalId;
        } else if (plug.sessionManager?.sessionData?.principalId) {
          principal = plug.sessionManager.sessionData.principalId;
        }
      }

      if (!principal) {
        throw new Error('No keychain found for account. Please create an account in Plug wallet first.');
      }

      const principalText = typeof principal === 'string'
        ? principal
        : principal.toText ? principal.toText() : String(principal);

      if (!principalText || principalText.trim().length === 0) {
        throw new Error('Invalid principal received from wallet.');
      }

      setWalletPrincipal(principalText);
      setIsWalletConnected(true);

      // Wallet saving removed - not needed when connecting to escrow
      // Clear any previous errors
      setError(null);

      // Fetch wallet balance
      await fetchWalletBalance(principalText);
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setConnectingWallet(false);
    }
  };

  // Fetch ICP balance from wallet
  const fetchWalletBalance = async (principalText: string) => {
    try {
      if (typeof window === 'undefined' || !(window as any).ic?.plug) return;

      const plug = (window as any).ic.plug;
      const agent = plug.agent || plug.createAgent?.() || plug.getAgent?.();

      if (!agent) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const agent2 = plug.agent;
        if (!agent2) return;
      }

      const finalAgent = agent || plug.agent;
      if (IC_HOST.includes('localhost') || IC_HOST.includes('127.0.0.1')) {
        try {
          await finalAgent.fetchRootKey();
        } catch (e) {
          // Ignore
        }
      }

      const principal = Principal.fromText(principalText);
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
        agent: finalAgent,
        canisterId: ledgerPrincipal,
      });

      const balance = await (ledgerActor as any).icrc1_balance_of({
        owner: principal,
        subaccount: [],
      });

      setWalletBalance(Number(balance) / 100000000); // Convert e8s to ICP
    } catch (err: any) {
      console.warn('Could not fetch wallet balance:', err);
    }
  };

  // Transfer ICP from wallet to escrow deposit account
  const payFromWallet = async () => {
    if (!escrowData || !walletPrincipal || !isWalletConnected) {
      setError('Wallet not connected');
      return;
    }

    setIsPaying(true);
    setError(null);

    try {
      if (typeof window === 'undefined' || !(window as any).ic?.plug) {
        throw new Error('Plug wallet not found');
      }

      const plug = (window as any).ic.plug;
      let agent = plug.agent || plug.createAgent?.() || plug.getAgent?.();

      if (!agent) {
        await new Promise(resolve => setTimeout(resolve, 500));
        agent = plug.agent;
      }

      if (!agent) {
        throw new Error('Failed to get wallet agent');
      }

      if (IC_HOST.includes('localhost') || IC_HOST.includes('127.0.0.1')) {
        try {
          await agent.fetchRootKey();
        } catch (e) {
          // Ignore
        }
      }

      const principal = Principal.fromText(walletPrincipal);
      const ledgerPrincipal = Principal.fromText(ICP_LEDGER_CANISTER_ID);
      const escrowPrincipal = Principal.fromText(escrowData.depositAccount.owner);

      // Convert subaccount from number array to blob
      const subaccountBytes = escrowData.depositAccount.subaccount
        ? new Uint8Array(escrowData.depositAccount.subaccount)
        : null;

      // ICRC-1 transfer IDL
      const icrc1Idl = ({ IDL }: typeof import('@dfinity/candid')) => {
        const Account = IDL.Record({
          owner: IDL.Principal,
          subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
        });
        const TransferError = IDL.Variant({
          BadFee: IDL.Record({ expected_fee: IDL.Nat }),
          InsufficientFunds: IDL.Record({ balance: IDL.Nat }),
          InvalidReceiver: IDL.Record({ receiver: IDL.Principal }),
          GenericError: IDL.Record({ error_code: IDL.Nat, message: IDL.Text }),
        });
        return IDL.Service({
          icrc1_transfer: IDL.Func(
            [
              IDL.Record({
                from_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
                to: Account,
                amount: IDL.Nat,
                fee: IDL.Opt(IDL.Nat),
                memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
                created_at_time: IDL.Opt(IDL.Nat64),
              }),
            ],
            [IDL.Variant({ Ok: IDL.Nat, Err: TransferError })],
            []
          ),
        });
      };

      const ledgerActor = Actor.createActor(icrc1Idl as any, {
        agent,
        canisterId: ledgerPrincipal,
      });

      const transferArgs = {
        from_subaccount: [],
        to: {
          owner: escrowPrincipal,
          subaccount: subaccountBytes ? [Array.from(subaccountBytes)] : [],
        },
        amount: BigInt(expectedAmountE8s),
        fee: [],
        memo: [],
        created_at_time: [],
      };

      const result = await (ledgerActor as any).icrc1_transfer(transferArgs);

      if ('Ok' in result) {
        // Payment successful - wait a moment for blockchain to process, then refresh
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        await refreshFundingStatus();
        await fetchWalletBalance(walletPrincipal);

        // Accept proposal now that escrow is funded
        if (proposalId) {
          try {
            console.log('Accepting proposal after escrow funding:', proposalId);
            const acceptRes = await fetch('/api/job-marketplace/accept-proposal', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                proposalId,
                freelancerUserId,
                jobTitle: serviceTitle,
              }),
            });
            const acceptData = await acceptRes.json();
            if (acceptData.success) {
              console.log('Proposal accepted successfully after funding');
            } else {
              console.warn('Proposal acceptance failed:', acceptData.error);
            }
          } catch (acceptErr: any) {
            console.error('Error accepting proposal after funding:', acceptErr);
          }
        }

        onPaymentSuccess?.(result.Ok.toString());
      } else {
        const errorMsg = 'Err' in result ? JSON.stringify(result.Err) : 'Transfer failed';
        throw new Error(`Payment failed: ${errorMsg}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to transfer ICP');
    } finally {
      setIsPaying(false);
    }
  };

  // Create escrow
  const createEscrow = async () => {
    if (!walletPrincipal) {
      setError('Wallet not connected. Please connect your wallet first.');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/escrow/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          freelancerUserId,
          amountE8s: expectedAmountE8s,
          clientPrincipal: walletPrincipal, // Send principal directly from connected wallet
          packageId, // For creating booking
          proposalId, // For accepting proposal
          serviceTitle, // For creating booking
          packageTitle, // For creating booking
          specialInstructions, // For creating booking
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create escrow');
      }

      setEscrowData(result.data);
      onEscrowCreated?.(result.data);

      // Auto-refresh funding status
      await refreshFundingStatus(result.data.escrowId);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  // Refresh funding status
  const refreshFundingStatus = async (escrowId?: string) => {
    const id = escrowId || escrowData?.escrowId;
    if (!id) return;

    setIsRefreshing(true);
    setError(null);

    try {
      const response = await fetch(`/api/escrow/${id}/refresh`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to refresh funding status');
      }

      setFundingStatus(result.data);
      setLastRefresh(new Date());

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Release escrow
  const releaseEscrow = async () => {
    if (!escrowData) return;

    setIsReleasing(true);
    setError(null);

    try {
      const response = await fetch(`/api/escrow/${escrowData.escrowId}/release`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to release escrow');
      }

      onEscrowReleased?.();
      setEscrowData(null);
      setFundingStatus(null);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsReleasing(false);
    }
  };

  // No polling - user can manually refresh if needed

  // Format account for display
  const formatAccount = (account: { owner: string; subaccount: number[] | null }) => {
    const principal = account.owner;
    const subaccount = account.subaccount
      ? '0x' + Array.from(account.subaccount).map(b => b.toString(16).padStart(2, '0')).join('')
      : 'default';

    return `${principal}:${subaccount}`;
  };

  // Format ICP amount
  const formatICP = (e8s: number) => {
    return (e8s / 100000000).toFixed(4);
  };

  if (!isClient) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet size={20} />
            Escrow Payment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-600">
              Waiting for client to create escrow payment of {expectedAmountICP} ICP
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet size={20} />
          Escrow Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!escrowData ? (
          // Create escrow state
          <div className="text-center py-6">
            <div className="mb-4">
              <div className="text-2xl font-bold text-gray-900">
                {expectedAmountICP.toFixed(8)} ICP
              </div>
              <div className="text-sm text-gray-600">
                Escrow amount for this project
              </div>
            </div>

            {/* Wallet Connection Section */}
            {!isWalletConnected ? (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                <div className="text-sm font-medium mb-2 text-blue-900">
                  Connect Your Wallet First
                </div>
                <div className="text-xs text-blue-700 mb-3">
                  You need to connect your Plug wallet to create an escrow payment.
                </div>
                <Button
                  onClick={connectWallet}
                  disabled={connectingWallet}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {connectingWallet ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" size={16} />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet className="mr-2" size={16} />
                      Connect Plug Wallet
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-green-900">Wallet Connected</div>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <div className="text-xs text-green-700 mb-2">
                  {walletPrincipal?.substring(0, 10)}...{walletPrincipal?.substring(walletPrincipal.length - 6)}
                </div>
                {walletBalance !== null && (
                  <div className="text-xs text-green-600 mb-2">
                    Balance: {walletBalance.toFixed(4)} ICP
                  </div>
                )}
              </div>
            )}

            {/* Create Escrow Button - Only enabled when wallet is connected */}
            <Button
              onClick={createEscrow}
              disabled={isCreating || !isWalletConnected}
              className="w-full"
            >
              {isCreating ? (
                <>
                  <RefreshCw className="mr-2 animate-spin" size={16} />
                  Creating Escrow...
                </>
              ) : (
                'Create Escrow Payment'
              )}
            </Button>

            {!isWalletConnected && (
              <div className="mt-2 text-xs text-amber-600">
                ⚠️ Please connect your wallet first to create escrow payment
              </div>
            )}

            <div className="mt-4 text-xs text-gray-500">
              Funds will be held securely until project completion
            </div>
          </div>
        ) : (
          // Escrow created state
          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {fundingStatus?.funded ? (
                  <CheckCircle className="text-green-500" size={20} />
                ) : (
                  <Clock className="text-yellow-500" size={20} />
                )}
                <span className="font-medium">
                  {fundingStatus?.funded ? 'Funded' : 'Waiting for Payment'}
                </span>
              </div>

              <Badge variant={fundingStatus?.funded ? 'default' : 'secondary'}>
                {fundingStatus ? formatICP(fundingStatus.balanceE8s) : '0'} / {expectedAmountICP} ICP
              </Badge>
            </div>

            {/* Wallet Connection */}
            {!isWalletConnected ? (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-sm font-medium mb-2 text-blue-900">Connect Wallet to Pay</div>
                <div className="text-xs text-blue-700 mb-3">
                  Connect your Plug wallet to pay directly from your wallet
                </div>
                <Button
                  onClick={connectWallet}
                  disabled={connectingWallet}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {connectingWallet ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" size={16} />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet className="mr-2" size={16} />
                      Connect Plug Wallet
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-green-900">Wallet Connected</div>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <div className="text-xs text-green-700 mb-2">
                  {walletPrincipal?.substring(0, 10)}...{walletPrincipal?.substring(walletPrincipal.length - 6)}
                </div>
                {walletBalance !== null && (
                  <div className="text-xs text-green-600 mb-3">
                    Balance: {walletBalance.toFixed(4)} ICP
                  </div>
                )}
                {walletBalance !== null && walletBalance < expectedAmountICP && (
                  <div className="text-xs text-red-600 mb-3">
                    ⚠️ Insufficient balance. You need {expectedAmountICP} ICP but have {walletBalance.toFixed(4)} ICP
                  </div>
                )}
                {!fundingStatus?.funded && (
                  <Button
                    onClick={payFromWallet}
                    disabled={isPaying || (walletBalance !== null && walletBalance < expectedAmountICP)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isPaying ? (
                      <>
                        <Loader2 className="mr-2 animate-spin" size={16} />
                        Processing Payment...
                      </>
                    ) : (
                      <>
                        <Wallet className="mr-2" size={16} />
                        Pay {expectedAmountICP} ICP from Wallet
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Deposit Address (Manual Payment Option) */}
            {!fundingStatus?.funded && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium mb-2">Or Deposit Manually:</div>
                <div className="font-mono text-xs bg-white p-2 rounded border break-all">
                  {formatAccount(escrowData.depositAccount)}
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  Send exactly {expectedAmountICP} ICP to this address using any ICP-compatible wallet
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => refreshFundingStatus()}
                disabled={isRefreshing}
                className="flex-1"
              >
                {isRefreshing ? (
                  <>
                    <RefreshCw className="mr-2 animate-spin" size={16} />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2" size={16} />
                    Refresh Status
                  </>
                )}
              </Button>

              {fundingStatus?.funded && (
                <div className="text-sm text-green-700 font-medium text-center">
                  ✓ Escrow funded. Go to "My Projects" to release funds when work is complete.
                </div>
              )}
            </div>

            {lastRefresh && (
              <div className="text-xs text-gray-500 text-center">
                Last checked: {lastRefresh.toLocaleTimeString()}
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-red-500" size={16} />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


