'use client'
import React, { useState, useEffect } from 'react'
import { Principal } from '@dfinity/principal'
import { Actor, HttpAgent } from '@dfinity/agent'
import { IDL } from '@dfinity/candid'
import { createSwapActor, getPlugAgent } from '@/lib/swap-agent'
import { ArrowDownUp, Wallet, Loader2, AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Token {
  symbol: string
  name: string
  canisterId: string
  tokenId?: number
  decimals: number
  fee: bigint
  chain: string
  balance?: bigint
  logo?: string
  isLP?: boolean
}

interface SwapState {
  fromToken: Token | null
  toToken: Token | null
  fromAmount: string
  toAmount: string
  quote: {
    receive_amount: bigint
    pay_amount: bigint
    price: number
    slippage: number
    lp_fee: bigint
    gas_fee: bigint
  } | null
  loading: boolean
  error: string | null
  success: string | null
}

export default function WorkbuddSwap() {
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [walletPrincipal, setWalletPrincipal] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [swapState, setSwapState] = useState<SwapState>({
    fromToken: null,
    toToken: null,
    fromAmount: '',
    toAmount: '',
    quote: null,
    loading: false,
    error: null,
    success: null,
  })
  const [supportedTokens, setSupportedTokens] = useState<Token[]>([])
  const [loadingTokens, setLoadingTokens] = useState(false)
  const [tokenBalances, setTokenBalances] = useState<Map<string, bigint>>(new Map())
  const [loadingBalances, setLoadingBalances] = useState(false)
  const [tokenAllowances, setTokenAllowances] = useState<Map<string, bigint>>(new Map())
  const [approving, setApproving] = useState(false)
  const [fromDropdownOpen, setFromDropdownOpen] = useState(false)
  const [toDropdownOpen, setToDropdownOpen] = useState(false)

  // Supported tokens - ICP, ckUSDC, ckBTC, and ckUSDT
  const defaultTokens: Token[] = [
    {
      symbol: 'ICP',
      name: 'Internet Computer',
      canisterId: 'ryjl3-tyaaa-aaaaa-aaaba-cai',
      decimals: 8,
      fee: BigInt(10000),
      chain: 'IC',
      logo: 'https://cryptologos.cc/logos/internet-computer-icp-logo.png',
    },
    {
      symbol: 'ckBTC',
      name: 'Chain Key Bitcoin',
      canisterId: 'mxzaz-hqaaa-aaaar-qaada-cai',
      decimals: 8,
      fee: BigInt(10000),
      chain: 'IC',
      logo: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
    },
    {
      symbol: 'ckUSDC',
      name: 'Chain Key USDC',
      canisterId: 'xevnm-gaaaa-aaaar-qafnq-cai',
      decimals: 6,
      fee: BigInt(10000),
      chain: 'IC',
      logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
    },
    {
      symbol: 'ckUSDT',
      name: 'Chain Key USDT',
      canisterId: 'cngnf-vqaaa-aaaar-qag4q-cai',
      decimals: 6,
      fee: BigInt(10000),
      chain: 'IC',
      logo: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
    },
  ]

  // Connect Plug wallet
  const connectWallet = async () => {
    setConnecting(true)
    setSwapState(prev => ({ ...prev, error: null }))

    try {
      if (typeof window === 'undefined' || !(window as any).ic?.plug) {
        throw new Error('Plug wallet not found. Please install Plug wallet extension.')
      }

      const plug = (window as any).ic.plug
      const swapCanisterId = process.env.NEXT_PUBLIC_SWAP_CANISTER_ID || ''

      // Check if already connected
      const isConnected = await plug.isConnected()
      if (!isConnected) {
        // Request connection
        const connected = await plug.requestConnect({
          whitelist: swapCanisterId ? [swapCanisterId] : [],
          host: process.env.NEXT_PUBLIC_IC_HOST || 'https://icp0.io',
        })

        if (!connected) {
          throw new Error('Wallet connection was cancelled or failed')
        }
      }

      // Wait a bit for wallet to initialize
      await new Promise(resolve => setTimeout(resolve, 500))

      // Get principal - try multiple methods
      let principal = null
      try {
        principal = await plug.getPrincipal()
      } catch (err) {
        console.warn('getPrincipal() failed, trying alternative methods:', err)
        // Try alternative methods
        if (plug.sessionManager?.principalId) {
          principal = plug.sessionManager.principalId
        } else if (plug.sessionManager?.sessionData?.principalId) {
          principal = plug.sessionManager.sessionData.principalId
        }
      }

      if (!principal) {
        throw new Error('No keychain found for account. Please create an account in Plug wallet first.')
      }

      const principalText = typeof principal === 'string'
        ? principal
        : principal.toText ? principal.toText() : String(principal)

      if (!principalText || principalText.trim().length === 0) {
        throw new Error('Invalid principal received from wallet. Please try reconnecting.')
      }

      setWalletPrincipal(principalText)
      setIsWalletConnected(true)

      // Wait a bit more to ensure wallet is fully ready
      await new Promise(resolve => setTimeout(resolve, 300))

      // Verify agent is available before loading tokens
      try {
        const agent = await getPlugAgent()
        if (!agent) {
          throw new Error('Failed to get wallet agent')
        }
        console.log('✅ Wallet agent ready, loading tokens...')
      } catch (agentError) {
        console.warn('Agent check failed, will retry in loadSupportedTokens:', agentError)
      }

      // Load tokens after successful connection
      await loadSupportedTokens()
    } catch (error: any) {
      console.error('Wallet connection error:', error)
      const errorMessage = error.message || 'Failed to connect wallet'

      // Provide more helpful error messages
      let userFriendlyMessage = errorMessage
      if (errorMessage.includes('keychain') || errorMessage.includes('account')) {
        userFriendlyMessage = 'No account found in Plug wallet. Please create an account in Plug wallet first, then try again.'
      } else if (errorMessage.includes('cancelled')) {
        userFriendlyMessage = 'Wallet connection was cancelled. Please try again.'
      }

      setSwapState(prev => ({
        ...prev,
        error: userFriendlyMessage,
      }))
    } finally {
      setConnecting(false)
    }
  }

  // Load supported tokens from canister
  const loadSupportedTokens = async () => {
    if (!isWalletConnected || !walletPrincipal) {
      console.warn('⚠️ Wallet not connected, skipping token load')
      return
    }

    setLoadingTokens(true)
    try {
      // Verify wallet is still connected
      if (typeof window !== 'undefined' && (window as any).ic?.plug) {
        const plug = (window as any).ic.plug
        const stillConnected = await plug.isConnected()
        if (!stillConnected) {
          throw new Error('Wallet disconnected. Please reconnect.')
        }
      }

      // COMMENTED OUT: Not using canister tokens function - using default tokens list instead
      // console.log('🔍 Getting Plug agent...')
      // const agent = await getPlugAgent()
      // if (!agent) {
      //   throw new Error('Failed to get wallet agent')
      // }
      // 
      // console.log('🔍 Creating swap actor...')
      // const actor = await createSwapActor(agent)

      // COMMENTED OUT: Get tokens from canister - using default tokens instead
      // try {
      //   console.log('🔍 Fetching tokens from canister...')
      //   // Use empty array [] for optional Text parameter (means no filter)
      //   // In Candid, ?Text is represented as [] for None or [text] for Some(text)
      //   const tokensResult = await actor.tokens([]) // Empty array = no filter (None)
      //   
      //   console.log('📦 Tokens result:', tokensResult)
      //   
      //   if ('Ok' in tokensResult && tokensResult.Ok) {
      //     console.log(`✅ Found ${tokensResult.Ok.length} tokens from canister`)
      //     
      //     const tokenList: Token[] = tokensResult.Ok
      //       .map((tokenReply: any) => {
      //         try {
      //           if ('IC' in tokenReply) {
      //             const icToken = tokenReply.IC
      //             // Only include tokens that are not removed
      //             if (icToken.is_removed) {
      //               console.log(`⏭️ Skipping removed token: ${icToken.symbol}`)
      //               return null
      //             }
      //             return {
      //               symbol: icToken.symbol,
      //               name: icToken.name,
      //               canisterId: icToken.canister_id,
      //               tokenId: Number(icToken.token_id),
      //               decimals: Number(icToken.decimals),
      //               fee: BigInt(icToken.fee),
      //               chain: icToken.chain,
      //               isLP: false,
      //             }
      //           } else if ('LP' in tokenReply) {
      //             const lpToken = tokenReply.LP
      //             // Include LP tokens as well, but mark them
      //             if (lpToken.is_removed) {
      //               console.log(`⏭️ Skipping removed LP token: ${lpToken.symbol}`)
      //               return null
      //             }
      //             return {
      //               symbol: lpToken.symbol,
      //               name: lpToken.name,
      //               canisterId: lpToken.address,
      //               tokenId: Number(lpToken.token_id),
      //               decimals: Number(lpToken.decimals),
      //               fee: BigInt(lpToken.fee),
      //               chain: lpToken.chain,
      //               isLP: true,
      //             }
      //           }
      //           return null
      //         } catch (err) {
      //           console.warn('Error parsing token:', err, tokenReply)
      //           return null
      //         }
      //       })
      //       .filter((t: Token | null) => t !== null) as Token[]
      //     
      //     console.log(`📊 Processed ${tokenList.length} valid tokens (${tokenList.filter(t => !t.isLP).length} IC tokens, ${tokenList.filter(t => t.isLP).length} LP tokens)`)
      //     
      //     // Include both IC and LP tokens, but prioritize IC tokens
      //     const icTokens = tokenList.filter(t => !t.isLP)
      //     const lpTokens = tokenList.filter(t => t.isLP)
      //     
      //     // Combine: IC tokens first, then LP tokens
      //     const allTokens = [...icTokens, ...lpTokens]
      //     
      //     // Deduplicate by canisterId to avoid React key conflicts
      //     const uniqueTokens = Array.from(
      //       new Map(allTokens.map(token => [token.canisterId, token])).values()
      //     )
      //     
      //     // Filter to only ICP, ckUSDC, and ckBTC
      //     const allowedSymbols = ['ICP', 'ckUSDC', 'ckBTC']
      //     const filteredTokens = uniqueTokens.filter(token => 
      //       allowedSymbols.includes(token.symbol)
      //     )
      //     
      //     // Merge with default tokens to ensure we have all three
      //     const defaultMap = new Map(defaultTokens.map(t => [t.canisterId, t]))
      //     filteredTokens.forEach(token => {
      //       defaultMap.set(token.canisterId, token)
      //     })
      //     const finalTokens = Array.from(defaultMap.values()).filter(token =>
      //       allowedSymbols.includes(token.symbol)
      //     )
      //     
      //     if (finalTokens.length > 0) {
      //       console.log('✅ Using tokens:', finalTokens.map(t => t.symbol).join(', '))
      //       setSupportedTokens(finalTokens)
      //     } else {
      //       console.warn('⚠️ No valid tokens found, using defaults')
      //       setSupportedTokens(defaultTokens)
      //     }
      //   } else {
      //     const errorMsg = 'Err' in tokensResult ? tokensResult.Err : 'Unknown error'
      //     console.warn('❌ Could not fetch tokens from canister:', errorMsg)
      //     console.log('📋 Using default tokens:', defaultTokens.map(t => t.symbol).join(', '))
      //     // Already filtered to only ICP, ckUSDC, ckBTC
      //     setSupportedTokens(defaultTokens)
      //   }
      // } catch (err: any) {
      //   // Better error extraction
      //   let errorMsg = 'Unknown error'
      //   if (err) {
      //     if (typeof err === 'string') {
      //       errorMsg = err
      //     } else if (err.message) {
      //       errorMsg = err.message
      //     } else if (err.toString && err.toString() !== '[object Object]') {
      //       errorMsg = err.toString()
      //     } else {
      //       // Try to extract useful info from error object
      //       errorMsg = JSON.stringify(err, Object.getOwnPropertyNames(err))
      //     }
      //   }
      //   
      //   console.error('❌ Error fetching tokens from canister:', errorMsg)
      //   console.error('Error object:', err)
      //   console.error('Error type:', typeof err)
      //   console.error('Error keys:', err ? Object.keys(err) : 'no keys')
      //   
      //   // If it's a wallet/connection error, don't set tokens - let user reconnect
      //   if (errorMsg.toLowerCase().includes('wallet') || 
      //       errorMsg.toLowerCase().includes('agent') || 
      //       errorMsg.toLowerCase().includes('connection') ||
      //       errorMsg.toLowerCase().includes('keychain')) {
      //     console.warn('⚠️ Wallet connection issue, not loading default tokens')
      //     setSwapState(prev => ({
      //       ...prev,
      //       error: 'Wallet connection issue. Please try reconnecting.',
      //     }))
      //   } else {
      //     // For other errors (like canister not responding), use default tokens as fallback
      //     // This is expected behavior - we show default tokens if canister call fails
      //     console.log('📋 Canister token fetch failed, using default tokens as fallback:', defaultTokens.map(t => t.symbol).join(', '))
      //     console.log('ℹ️ This is normal if the swap canister is not fully configured or tokens are not registered yet.')
      //     setSupportedTokens(defaultTokens)
      //   }
      // }

      // Use default tokens directly (ICP, ckUSDC, ckBTC)
      console.log('📋 Using default tokens:', defaultTokens.map(t => t.symbol).join(', '))
      setSupportedTokens(defaultTokens)

      // Load token balances and user balances if principal is available
      // Don't let balance loading errors affect token display
      if (walletPrincipal) {
        try {
          // Load ICRC-1 token balances
          await loadTokenBalances()
          // Load LP balances from swap canister
          await loadUserBalances()
        } catch (balanceError: any) {
          // Balance loading errors are non-critical, just log them
          console.warn('⚠️ Could not load user balances (non-critical):', balanceError?.message || balanceError)
        }
      }
    } catch (error: any) {
      // Outer catch for any errors in the entire function
      const errorMsg = error?.message || String(error) || 'Unknown error'
      console.error('❌ Error in loadSupportedTokens:', errorMsg)
      console.error('Full error:', error)

      // Always fall back to default tokens if there's a critical error
      console.log('📋 Using default tokens due to critical error:', defaultTokens.map(t => t.symbol).join(', '))
      setSupportedTokens(defaultTokens)
    } finally {
      setLoadingTokens(false)
    }
  }

  // Fetch ICRC-1 token balance from ledger canister
  const fetchTokenBalance = async (canisterId: string, decimals: number): Promise<bigint | null> => {
    if (!walletPrincipal || !isWalletConnected) return null

    try {
      const agent = await getPlugAgent()
      const principal = Principal.fromText(walletPrincipal)
      const ledgerPrincipal = Principal.fromText(canisterId)

      // Fetch root key for local development
      const IC_HOST = process.env.NEXT_PUBLIC_IC_HOST || 'https://icp0.io'
      if (IC_HOST.includes('localhost') || IC_HOST.includes('127.0.0.1')) {
        try {
          await agent.fetchRootKey()
        } catch (rootKeyErr) {
          // Root key might already be fetched, ignore
          console.warn('Root key fetch warning (may already be fetched):', rootKeyErr)
        }
      }

      // ICRC-1 balance_of IDL
      const icrc1Idl = ({ IDL }: typeof import('@dfinity/candid')) => {
        const Account = IDL.Record({
          owner: IDL.Principal,
          subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
        })
        return IDL.Service({
          icrc1_balance_of: IDL.Func([Account], [IDL.Nat], ['query']),
        })
      }

      const ledgerActor = Actor.createActor(icrc1Idl as any, {
        agent,
        canisterId: ledgerPrincipal,
      })

      const balance = await (ledgerActor as any).icrc1_balance_of({
        owner: principal,
        subaccount: [],
      })

      return BigInt(balance)
    } catch (error: any) {
      console.warn(`Could not fetch balance for ${canisterId}:`, error?.message || error)
      return null
    }
  }

  // Fetch ICRC-2 allowance for swap canister
  const fetchTokenAllowance = async (canisterId: string): Promise<bigint | null> => {
    if (!walletPrincipal || !isWalletConnected) return null

    try {
      const agent = await getPlugAgent()
      const principal = Principal.fromText(walletPrincipal)
      const ledgerPrincipal = Principal.fromText(canisterId)
      const swapCanisterId = process.env.NEXT_PUBLIC_SWAP_CANISTER_ID || ''
      if (!swapCanisterId) return null

      const spender = Principal.fromText(swapCanisterId)

      // Fetch root key for local development
      const IC_HOST = process.env.NEXT_PUBLIC_IC_HOST || 'https://icp0.io'
      if (IC_HOST.includes('localhost') || IC_HOST.includes('127.0.0.1')) {
        try {
          await agent.fetchRootKey()
        } catch (rootKeyErr) {
          // Ignore
        }
      }

      // ICRC-2 allowance IDL
      const icrc2Idl = ({ IDL }: typeof import('@dfinity/candid')) => {
        const Account = IDL.Record({
          owner: IDL.Principal,
          subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
        })
        return IDL.Service({
          icrc2_allowance: IDL.Func(
            [
              IDL.Record({
                account: Account,
                spender: Account,
              }),
            ],
            [IDL.Record({
              allowance: IDL.Nat,
              expires_at: IDL.Opt(IDL.Nat64),
            })],
            ['query']
          ),
        })
      }

      const ledgerActor = Actor.createActor(icrc2Idl as any, {
        agent,
        canisterId: ledgerPrincipal,
      })

      const allowanceResult = await (ledgerActor as any).icrc2_allowance({
        account: {
          owner: principal,
          subaccount: [],
        },
        spender: {
          owner: spender,
          subaccount: [],
        },
      })

      return BigInt(allowanceResult.allowance)
    } catch (error: any) {
      // Not all tokens support ICRC-2, so this is expected for some tokens
      console.warn(`Could not fetch allowance for ${canisterId} (may not support ICRC-2):`, error?.message || error)
      return null
    }
  }

  // Approve swap canister to spend tokens
  const approveToken = async (canisterId: string, amount: bigint): Promise<boolean> => {
    if (!walletPrincipal || !isWalletConnected) return false

    setApproving(true)
    setSwapState(prev => ({ ...prev, error: null }))

    try {
      const agent = await getPlugAgent()
      const principal = Principal.fromText(walletPrincipal)
      const ledgerPrincipal = Principal.fromText(canisterId)
      const swapCanisterId = process.env.NEXT_PUBLIC_SWAP_CANISTER_ID || ''
      if (!swapCanisterId) {
        throw new Error('Swap canister ID not configured')
      }

      const spender = Principal.fromText(swapCanisterId)

      // Fetch root key for local development
      const IC_HOST = process.env.NEXT_PUBLIC_IC_HOST || 'https://icp0.io'
      if (IC_HOST.includes('localhost') || IC_HOST.includes('127.0.0.1')) {
        try {
          await agent.fetchRootKey()
        } catch (rootKeyErr) {
          // Ignore
        }
      }

      // ICRC-2 approve IDL (with more complete error variants)
      const icrc2Idl = ({ IDL }: typeof import('@dfinity/candid')) => {
        const Account = IDL.Record({
          owner: IDL.Principal,
          subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
        })
        const ApproveError = IDL.Variant({
          InsufficientFunds: IDL.Null,
          GenericError: IDL.Record({ error_code: IDL.Nat, message: IDL.Text }),
          TemporarilyUnavailable: IDL.Null,
          Duplicate: IDL.Record({ duplicate_of: IDL.Nat }),
          CreatedInFuture: IDL.Record({ ledger_time: IDL.Nat64 }),
          TooOld: IDL.Null,
          Expired: IDL.Record({ ledger_time: IDL.Nat64 }),
        })
        return IDL.Service({
          icrc2_approve: IDL.Func(
            [
              IDL.Record({
                spender: Account,
                amount: IDL.Nat,
                expires_at: IDL.Opt(IDL.Nat64),
                expected_allowance: IDL.Opt(IDL.Nat),
                fee: IDL.Opt(IDL.Nat),
                memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
                created_at_time: IDL.Opt(IDL.Nat64),
              }),
            ],
            [IDL.Variant({ Ok: IDL.Nat, Err: ApproveError })],
            []
          ),
        })
      }

      const ledgerActor = Actor.createActor(icrc2Idl as any, {
        agent,
        canisterId: ledgerPrincipal,
      })

      // Approve with a large amount (effectively unlimited for practical purposes)
      // Using 2^128 - 1 as a very large number, or use amount * 1000 for a reasonable buffer
      const maxApproval = BigInt('340282366920938463463374607431768211455') // 2^128 - 1
      const approveAmount = amount * BigInt(1000) > maxApproval ? maxApproval : amount * BigInt(1000)

      console.log('🔐 Requesting approval:', {
        canisterId,
        amount: approveAmount.toString(),
        spender: swapCanisterId,
      })

      const approveResult = await (ledgerActor as any).icrc2_approve({
        spender: {
          owner: spender,
          subaccount: [],
        },
        amount: approveAmount,
        expires_at: [],
        expected_allowance: [],
        fee: [],
        memo: [],
        created_at_time: [],
      })

      if ('Ok' in approveResult) {
        console.log('✅ Approval successful! Block index:', approveResult.Ok)
        // Refresh allowance after a short delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        const newAllowance = await fetchTokenAllowance(canisterId)
        if (newAllowance !== null) {
          setTokenAllowances(prev => {
            const updated = new Map(prev)
            updated.set(canisterId, newAllowance)
            return updated
          })
          setSwapState(prev => ({
            ...prev,
            success: 'Token approved successfully! You can now proceed with the swap.',
          }))
        }
        return true
      } else {
        const error = approveResult.Err
        let errorMsg = 'Approval failed'
        if ('GenericError' in error) {
          errorMsg = error.GenericError.message
        } else if ('InsufficientFunds' in error) {
          errorMsg = 'Insufficient funds for approval fee'
        } else if ('TemporarilyUnavailable' in error) {
          errorMsg = 'Service temporarily unavailable. Please try again.'
        } else {
          errorMsg = `Approval failed: ${Object.keys(error)[0]}`
        }
        throw new Error(errorMsg)
      }
    } catch (error: any) {
      console.error('❌ Approval error:', error)
      const errorMsg = error?.message || String(error) || 'Failed to approve token'

      // Check if token doesn't support ICRC-2
      if (errorMsg.includes('no update method') || errorMsg.includes('not found') || errorMsg.includes('ICRC-2')) {
        setSwapState(prev => ({
          ...prev,
          error: `This token (${canisterId}) does not support ICRC-2 approvals. The swap may require a different approval mechanism.`,
        }))
      } else {
        setSwapState(prev => ({
          ...prev,
          error: `Approval failed: ${errorMsg}. Please try again.`,
        }))
      }
      return false
    } finally {
      setApproving(false)
    }
  }

  // Load token balances and allowances for all supported tokens
  const loadTokenBalances = async () => {
    if (!walletPrincipal || !isWalletConnected || supportedTokens.length === 0) {
      return
    }

    setLoadingBalances(true)
    const balances = new Map<string, bigint>()
    const allowances = new Map<string, bigint>()

    try {
      // Fetch balances and allowances for all tokens in parallel
      const promises = supportedTokens.map(async (token) => {
        const [balance, allowance] = await Promise.all([
          fetchTokenBalance(token.canisterId, token.decimals),
          fetchTokenAllowance(token.canisterId),
        ])
        if (balance !== null) {
          balances.set(token.canisterId, balance)
        }
        if (allowance !== null) {
          allowances.set(token.canisterId, allowance)
        }
        return { canisterId: token.canisterId, balance, allowance }
      })

      await Promise.all(promises)
      setTokenBalances(balances)
      setTokenAllowances(allowances)
      console.log('✅ Token balances and allowances loaded')
    } catch (error) {
      console.error('Error loading token balances:', error)
    } finally {
      setLoadingBalances(false)
    }
  }

  // Load user balances from swap canister (LP balances)
  const loadUserBalances = async () => {
    if (!walletPrincipal || !isWalletConnected) return

    try {
      const agent = await getPlugAgent()
      const actor = await createSwapActor(agent)

      // Get user balances from swap canister (LP balances)
      const balancesResult = await actor.user_balances(walletPrincipal)

      if ('Ok' in balancesResult && balancesResult.Ok) {
        console.log('LP balances from swap canister:', balancesResult.Ok)
        // Note: These are LP token balances, not regular token balances
      }
    } catch (error) {
      console.warn('Could not load LP balances from swap canister (non-critical):', error)
    }
  }


  // Get quote for swap using swap_amounts
  const getQuote = async () => {
    if (!swapState.fromToken || !swapState.toToken || !swapState.fromAmount) {
      return
    }

    if (!isWalletConnected || !walletPrincipal) {
      setSwapState(prev => ({
        ...prev,
        error: 'Wallet not connected. Please connect your wallet first.',
      }))
      return
    }

    try {
      // Verify wallet is still connected
      if (typeof window !== 'undefined' && (window as any).ic?.plug) {
        const plug = (window as any).ic.plug
        const stillConnected = await plug.isConnected()
        if (!stillConnected) {
          throw new Error('Wallet disconnected. Please reconnect.')
        }
      }

      const agent = await getPlugAgent()
      const actor = await createSwapActor(agent)

      // The swap canister might expect canister ID or token symbol
      // Try canister ID first, but the canister might need tokens to be registered
      const payToken = swapState.fromToken.canisterId
      const receiveToken = swapState.toToken.canisterId

      console.log('🔄 Getting quote:', {
        payToken,
        receiveToken,
        paySymbol: swapState.fromToken.symbol,
        receiveSymbol: swapState.toToken.symbol,
      })

      // Calculate amount with decimals
      const decimals = swapState.fromToken.decimals || 8
      const amountIn = BigInt(Math.floor(parseFloat(swapState.fromAmount) * Math.pow(10, decimals)))

      const quoteResult = await actor.swap_amounts(payToken, amountIn, receiveToken)

      if ('Ok' in quoteResult && quoteResult.Ok) {
        const quote = quoteResult.Ok
        const receiveDecimals = swapState.toToken.decimals || 8

        setSwapState(prev => ({
          ...prev,
          quote: {
            receive_amount: quote.receive_amount,
            pay_amount: quote.pay_amount,
            price: quote.price,
            slippage: quote.slippage,
            lp_fee: quote.txs && quote.txs.length > 0 ? quote.txs[0].lp_fee : BigInt(0),
            gas_fee: quote.txs && quote.txs.length > 0 ? quote.txs[0].gas_fee : BigInt(0),
          },
          toAmount: (Number(quote.receive_amount) / Math.pow(10, receiveDecimals)).toFixed(8),
          error: null,
        }))
      } else {
        const errorMsg = 'Err' in quoteResult ? quoteResult.Err : 'Failed to get quote'
        console.error('❌ Quote error:', errorMsg)

        // If error mentions token not found, suggest checking token registration
        if (errorMsg.includes('not found') || errorMsg.includes('duplicate')) {
          console.warn('⚠️ Token might not be registered in swap canister. The swap canister may need tokens to be added via add_token first.')
        }

        setSwapState(prev => ({
          ...prev,
          error: errorMsg,
          quote: null,
        }))
      }
    } catch (error: any) {
      console.error('Error getting quote:', error)
      setSwapState(prev => ({
        ...prev,
        error: error.message || 'Failed to get quote',
        quote: null,
      }))
    }
  }

  // Execute swap
  const executeSwap = async () => {
    if (!swapState.fromToken || !swapState.toToken || !swapState.fromAmount) {
      setSwapState(prev => ({ ...prev, error: 'Please fill in all fields' }))
      return
    }

    if (!swapState.quote) {
      setSwapState(prev => ({ ...prev, error: 'Please get a quote first' }))
      return
    }

    if (!isWalletConnected || !walletPrincipal) {
      setSwapState(prev => ({
        ...prev,
        error: 'Wallet not connected. Please connect your wallet first.',
      }))
      return
    }

    setSwapState(prev => ({ ...prev, loading: true, error: null, success: null }))

    try {
      // Verify wallet is still connected
      if (typeof window !== 'undefined' && (window as any).ic?.plug) {
        const plug = (window as any).ic.plug
        const stillConnected = await plug.isConnected()
        if (!stillConnected) {
          throw new Error('Wallet disconnected. Please reconnect before swapping.')
        }
      }

      const decimals = swapState.fromToken.decimals || 8
      const amountIn = BigInt(Math.floor(parseFloat(swapState.fromAmount) * Math.pow(10, decimals)))

      // Check if approval is needed
      const currentAllowance = tokenAllowances.get(swapState.fromToken.canisterId) || BigInt(0)
      const requiredAmount = amountIn + swapState.quote.lp_fee + swapState.quote.gas_fee

      if (currentAllowance < requiredAmount) {
        // Need to approve - show error with instruction
        console.log('⚠️ Insufficient allowance. Current:', currentAllowance.toString(), 'Required:', requiredAmount.toString())
        const tokenSymbol = swapState.fromToken?.symbol || 'token'
        const tokenDecimals = swapState.fromToken?.decimals || 8
        setSwapState(prev => ({
          ...prev,
          loading: false,
          error: `Insufficient token allowance (${formatBalance(currentAllowance, tokenDecimals)} ${tokenSymbol}). Please click "Approve" to allow the swap canister to spend your tokens.`,
        }))
        return
      }

      const agent = await getPlugAgent()
      const actor = await createSwapActor(agent)

      // Calculate max slippage (default 1%)
      const maxSlippage = swapState.quote.slippage > 0
        ? swapState.quote.slippage * 1.01 // Add 1% buffer
        : 0.01

      // Build SwapArgs
      const swapArgs = {
        pay_token: swapState.fromToken.canisterId,
        receive_token: swapState.toToken.canisterId,
        pay_amount: amountIn,
        receive_amount: [swapState.quote.receive_amount], // Optional min receive amount
        max_slippage: [maxSlippage],
        receive_address: [],
        referred_by: [],
        pay_tx_id: [],
      }

      const result = await actor.swap(swapArgs)

      if ('Ok' in result && result.Ok) {
        const swapReply = result.Ok
        setSwapState(prev => ({
          ...prev,
          success: `Swap successful! Request ID: ${swapReply.request_id}, Status: ${swapReply.status}`,
          fromAmount: '',
          toAmount: '',
          quote: null,
        }))
        // Reload token balances after successful swap
        await loadTokenBalances()
        await loadUserBalances()
      } else {
        const errorMsg = 'Err' in result ? result.Err : 'Swap failed'
        setSwapState(prev => ({
          ...prev,
          error: errorMsg,
        }))
      }
    } catch (error: any) {
      console.error('Swap error:', error)
      setSwapState(prev => ({
        ...prev,
        error: error.message || 'Swap failed',
      }))
    } finally {
      setSwapState(prev => ({ ...prev, loading: false }))
    }
  }

  // Update quote when inputs change
  useEffect(() => {
    if (swapState.fromToken && swapState.toToken && swapState.fromAmount && isWalletConnected) {
      const timeoutId = setTimeout(() => {
        getQuote()
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [swapState.fromToken, swapState.toToken, swapState.fromAmount, isWalletConnected])

  // Load tokens on wallet connect
  useEffect(() => {
    if (isWalletConnected) {
      loadSupportedTokens()
    }
  }, [isWalletConnected])

  // Load token balances when tokens are available and wallet is connected
  useEffect(() => {
    if (isWalletConnected && walletPrincipal && supportedTokens.length > 0) {
      loadTokenBalances()
    }
  }, [supportedTokens, isWalletConnected, walletPrincipal])

  const swapTokens = () => {
    setSwapState(prev => ({
      ...prev,
      fromToken: prev.toToken,
      toToken: prev.fromToken,
      fromAmount: prev.toAmount,
      toAmount: prev.fromAmount,
    }))
    // Close dropdowns when swapping
    setFromDropdownOpen(false)
    setToDropdownOpen(false)
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.token-dropdown-container')) {
        setFromDropdownOpen(false)
        setToDropdownOpen(false)
      }
    }

    if (fromDropdownOpen || toDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [fromDropdownOpen, toDropdownOpen])

  const formatBalance = (balance?: bigint, decimals: number = 8) => {
    if (!balance) return '0.00'
    return (Number(balance) / Math.pow(10, decimals)).toFixed(4)
  }


  // Get USD value (placeholder - would need price API)
  const getUsdValue = (amount: string, token: Token | null): string => {
    if (!token || !amount || parseFloat(amount) === 0) return '≈$0.00'
    // Placeholder USD values - in production, fetch from price API
    const prices: Record<string, number> = {
      'ICP': 4.5,
      'ckBTC': 65000,
      'ckUSDC': 1,
      'ckUSDT': 1,
    }
    const price = prices[token.symbol] || 0
    return `≈$${(parseFloat(amount) * price).toFixed(4)}`
  }

  // Percentage buttons handler
  const setPercentage = (percentage: number) => {
    if (!swapState.fromToken) return
    const balance = tokenBalances.get(swapState.fromToken.canisterId)
    if (balance) {
      const decimals = swapState.fromToken.decimals || 8
      const total = Number(balance) / Math.pow(10, decimals)
      const amount = (total * percentage / 100).toFixed(8)
      setSwapState(prev => ({ ...prev, fromAmount: amount, quote: null }))
    }
  }

  // Get exchange rate
  const getExchangeRate = (): string => {
    if (!swapState.fromToken || !swapState.toToken || !swapState.quote) return ''
    const fromAmount = parseFloat(swapState.fromAmount) || 0
    const toAmount = swapState.toToken && swapState.quote
      ? Number(swapState.quote.receive_amount) / Math.pow(10, swapState.toToken.decimals || 8)
      : 0
    if (fromAmount === 0 || toAmount === 0) return ''
    const rate = toAmount / fromAmount
    return `1 ${swapState.toToken.symbol} = ${rate.toFixed(8)} ${swapState.fromToken.symbol}`
  }

  // Token logo component
  const TokenLogo = ({ token }: { token: Token | null }) => {
    if (!token) return <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
    if (token.logo) {
      return <img src={token.logo} alt={token.symbol} className="w-8 h-8 rounded-full" />
    }
    return (
      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
        {token.symbol.substring(0, 2)}
      </div>
    )
  }

  // Custom Token Dropdown Component
  const TokenDropdown = ({
    selectedToken,
    onSelect,
    isOpen,
    setIsOpen,
    label
  }: {
    selectedToken: Token | null
    onSelect: (token: Token) => void
    isOpen: boolean
    setIsOpen: (open: boolean) => void
    label: string
  }) => {
    return (
      <div className="relative flex-1 token-dropdown-container">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 w-full text-left bg-transparent border-none outline-none text-lg font-semibold cursor-pointer hover:opacity-80 transition-opacity"
        >
          {selectedToken ? (
            <>
              <TokenLogo token={selectedToken} />
              <span className="flex-1">{selectedToken.symbol}</span>
            </>
          ) : (
            <>
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <span className="flex-1 text-gray-400">Select token</span>
            </>
          )}
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            ></div>
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl z-20 max-h-64 overflow-y-auto" style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e1 #f1f5f9'
            }}>
              {supportedTokens.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">No tokens available</div>
              ) : (
                supportedTokens.map((token, index) => {
                  const balance = tokenBalances.get(token.canisterId)
                  const isSelected = selectedToken?.canisterId === token.canisterId
                  return (
                    <button
                      key={`${token.canisterId}-${index}`}
                      type="button"
                      onClick={() => {
                        onSelect(token)
                        setIsOpen(false)
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl ${isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                        }`}
                    >
                      <TokenLogo token={token} />
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{token.symbol}</div>
                        <div className="text-xs text-gray-500 truncate">{token.name}</div>
                      </div>
                      {balance !== undefined && (
                        <div className="text-xs text-gray-500 whitespace-nowrap ml-2">
                          {formatBalance(balance, token.decimals)}
                        </div>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <p className="text-gray-600 text-sm">Transfer your tokens from one network to another.</p>
            <div className="flex items-center gap-2">
              {!isWalletConnected ? (
                <Button
                  onClick={connectWallet}
                  disabled={connecting}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4 mr-2" />
                      Connect Wallet
                    </>
                  )}
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-600">
                    {walletPrincipal?.substring(0, 6)}...{walletPrincipal?.substring(walletPrincipal.length - 4)}
                  </span>
                  <Button
                    onClick={() => {
                      setIsWalletConnected(false)
                      setWalletPrincipal(null)
                      setSupportedTokens([])
                    }}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Disconnect
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Swap Interface */}
        {isWalletConnected && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6">
            {/* From Token */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">From</span>
                {swapState.fromToken && (
                  <div className="flex items-center gap-2">
                    {loadingBalances ? (
                      <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                    ) : (
                      <span className="text-xs text-gray-500">
                        Balance: {formatBalance(
                          tokenBalances.get(swapState.fromToken.canisterId),
                          swapState.fromToken.decimals
                        )} {swapState.fromToken.symbol}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <TokenDropdown
                  selectedToken={swapState.fromToken}
                  onSelect={(token) => {
                    setSwapState(prev => ({ ...prev, fromToken: token, quote: null }))
                  }}
                  isOpen={fromDropdownOpen}
                  setIsOpen={setFromDropdownOpen}
                  label="From"
                />
                <div className="flex flex-col items-end">
                  <input
                    type="number"
                    placeholder="0.00"
                    value={swapState.fromAmount}
                    onChange={(e) => {
                      setSwapState(prev => ({ ...prev, fromAmount: e.target.value, quote: null }))
                    }}
                    className="text-right text-2xl font-semibold bg-transparent border-none outline-none w-32"
                    step="0.00000001"
                    min="0"
                  />
                </div>
              </div>
              {swapState.fromToken && (
                <div className="mt-2 text-xs text-gray-500">
                  {swapState.fromToken.name}
                </div>
              )}
            </div>

            {/* Swap Button */}
            <div className="flex justify-center my-2">
              <button
                onClick={swapTokens}
                className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                <ArrowDownUp className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* To Token */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">To</span>
                {swapState.toToken && (
                  <div className="flex items-center gap-2">
                    {loadingBalances ? (
                      <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                    ) : (
                      <span className="text-xs text-gray-500">
                        Balance: {formatBalance(
                          tokenBalances.get(swapState.toToken.canisterId),
                          swapState.toToken.decimals
                        )} {swapState.toToken.symbol}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <TokenDropdown
                  selectedToken={swapState.toToken}
                  onSelect={(token) => {
                    setSwapState(prev => ({ ...prev, toToken: token, quote: null }))
                  }}
                  isOpen={toDropdownOpen}
                  setIsOpen={setToDropdownOpen}
                  label="To"
                />
                <div className="flex flex-col items-end">
                  <input
                    type="text"
                    placeholder="0.00"
                    value={swapState.toAmount || '0.00'}
                    readOnly
                    className="text-right text-2xl font-semibold bg-transparent border-none outline-none w-32 text-gray-400"
                  />
                </div>
              </div>
              {swapState.toToken && (
                <div className="mt-2 text-xs text-gray-500">
                  {swapState.toToken.name}
                </div>
              )}
            </div>

            {/* Exchange Rate */}
            {getExchangeRate() && (
              <div className="mb-4 text-center text-sm text-gray-600">
                {getExchangeRate()}
              </div>
            )}

            {/* Percentage Buttons */}
            {swapState.fromToken && tokenBalances.has(swapState.fromToken.canisterId) && (
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setPercentage(0)}
                  className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Min
                </button>
                <button
                  onClick={() => setPercentage(10)}
                  className="flex-1 px-4 py-2 bg-purple-100 border border-purple-300 rounded-lg text-sm font-medium text-purple-700 hover:bg-purple-200 transition-colors"
                >
                  +10%
                </button>
                <button
                  onClick={() => setPercentage(20)}
                  className="flex-1 px-4 py-2 bg-purple-100 border border-purple-300 rounded-lg text-sm font-medium text-purple-700 hover:bg-purple-200 transition-colors"
                >
                  +20%
                </button>
                <button
                  onClick={() => setPercentage(50)}
                  className="flex-1 px-4 py-2 bg-purple-100 border border-purple-300 rounded-lg text-sm font-medium text-purple-700 hover:bg-purple-200 transition-colors"
                >
                  +50%
                </button>
                <button
                  onClick={() => {
                    const balance = tokenBalances.get(swapState.fromToken!.canisterId)
                    if (balance) {
                      const decimals = swapState.fromToken!.decimals || 8
                      const formatted = (Number(balance) / Math.pow(10, decimals)).toFixed(8)
                      setSwapState(prev => ({ ...prev, fromAmount: formatted, quote: null }))
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-purple-100 border border-purple-300 rounded-lg text-sm font-medium text-purple-700 hover:bg-purple-200 transition-colors"
                >
                  Max
                </button>
              </div>
            )}

            {/* Quote Info */}
            {swapState.quote && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Estimated Output:</span>
                  <span className="font-medium">
                    {swapState.toToken && (Number(swapState.quote.receive_amount) / Math.pow(10, swapState.toToken.decimals || 8)).toFixed(8)} {swapState.toToken?.symbol}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Price:</span>
                  <span>{swapState.quote.price.toFixed(8)}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>LP Fee:</span>
                  <span>
                    {swapState.fromToken && (Number(swapState.quote.lp_fee) / Math.pow(10, swapState.fromToken.decimals || 8)).toFixed(8)} {swapState.fromToken?.symbol}
                  </span>
                </div>
                {swapState.quote.slippage > 0 && (
                  <div className="flex justify-between mt-1">
                    <span>Slippage:</span>
                    <span className={swapState.quote.slippage > 5 ? 'text-red-600' : ''}>
                      {(swapState.quote.slippage * 100).toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Approval Status and Button */}
            {swapState.fromToken && swapState.fromAmount && parseFloat(swapState.fromAmount) > 0 && (
              (() => {
                const decimals = swapState.fromToken.decimals || 8
                const amountIn = BigInt(Math.floor(parseFloat(swapState.fromAmount) * Math.pow(10, decimals)))
                const currentAllowance = tokenAllowances.get(swapState.fromToken.canisterId) || BigInt(0)
                const requiredAmount = swapState.quote
                  ? amountIn + swapState.quote.lp_fee + swapState.quote.gas_fee
                  : amountIn
                const needsApproval = currentAllowance < requiredAmount

                if (!needsApproval && currentAllowance <= BigInt(0)) {
                  return null
                }

                return needsApproval ? (
                  <div key={`approval-${swapState.fromToken.canisterId}`} className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">
                          Token Approval Required
                        </span>
                      </div>
                      <span className="text-xs text-yellow-600">
                        Allowance: {formatBalance(currentAllowance, swapState.fromToken.decimals)} {swapState.fromToken.symbol}
                      </span>
                    </div>
                    <p className="text-sm text-yellow-700 mb-3">
                      The swap canister needs permission to spend your {swapState.fromToken.symbol} tokens.
                      Click "Approve" to grant permission.
                    </p>
                    <Button
                      onClick={async () => {
                        const success = await approveToken(
                          swapState.fromToken!.canisterId,
                          requiredAmount
                        )
                        if (success) {
                          setSwapState(prev => ({ ...prev, error: null }))
                        }
                      }}
                      disabled={approving}
                      className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2"
                    >
                      {approving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Approving...
                        </>
                      ) : (
                        `Approve ${swapState.fromToken.symbol}`
                      )}
                    </Button>
                  </div>
                ) : (
                  <div key={`approved-${swapState.fromToken.canisterId}`} className="mb-4 p-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Token approved. Allowance: {formatBalance(currentAllowance, swapState.fromToken.decimals)} {swapState.fromToken.symbol}</span>
                    </div>
                  </div>
                )
              })()
            )}

            {/* Error/Success Messages */}
            {swapState.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <span>{swapState.error}</span>
              </div>
            )}

            {swapState.success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
                <CheckCircle2 className="w-5 h-5" />
                <span>{swapState.success}</span>
              </div>
            )}

            {/* Swap Button */}
            <Button
              onClick={executeSwap}
              disabled={
                !swapState.fromToken ||
                !swapState.toToken ||
                !swapState.fromAmount ||
                swapState.loading ||
                !swapState.quote ||
                (() => {
                  if (!swapState.fromToken || !swapState.fromAmount) return false
                  const decimals = swapState.fromToken.decimals || 8
                  const amountIn = BigInt(Math.floor(parseFloat(swapState.fromAmount) * Math.pow(10, decimals)))
                  const currentAllowance = tokenAllowances.get(swapState.fromToken.canisterId) || BigInt(0)
                  const requiredAmount = swapState.quote
                    ? amountIn + swapState.quote.lp_fee + swapState.quote.gas_fee
                    : amountIn
                  return currentAllowance < requiredAmount
                })()
              }
              className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 hover:from-blue-600 hover:via-purple-600 hover:to-orange-600 text-white py-4 rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {swapState.loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin inline" />
                  Swapping...
                </>
              ) : (
                'Swap'
              )}
            </Button>
          </div>
        )}

        {!isWalletConnected && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-8 text-center">
            <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Connect your wallet to start swapping</p>
            <Button
              onClick={connectWallet}
              disabled={connecting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {connecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect Wallet
                </>
              )}
            </Button>
          </div>
        )}

        {loadingTokens && (
          <div className="mt-4 text-center text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
            Loading tokens...
          </div>
        )}
      </div>
    </div>
  )
}
