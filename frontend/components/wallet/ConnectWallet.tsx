'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Principal } from '@dfinity/principal';
import { sha224 } from '@noble/hashes/sha2';

interface ConnectWalletProps {
  onConnect?: (data: { principal: string; accountId: string }) => void;
  className?: string;
}

const ACCOUNT_DOMAIN_SEPARATOR = new TextEncoder().encode('\x0Aaccount-id');

const hexEncode = (bytes: Uint8Array) =>
  Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

const toUint8Array = (num: number) => {
  const arr = new Uint8Array(4);
  arr[0] = (num >>> 24) & 0xff;
  arr[1] = (num >>> 16) & 0xff;
  arr[2] = (num >>> 8) & 0xff;
  arr[3] = num & 0xff;
  return arr;
};

const crc32 = (bytes: Uint8Array) => {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    let byte = bytes[i];
    crc ^= byte;
    for (let j = 0; j < 8; j += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  crc = (crc ^ 0xffffffff) >>> 0;
  return toUint8Array(crc);
};

const deriveAccountId = (principal: Principal) => {
  const principalBytes = principal.toUint8Array();
  const subAccount = new Uint8Array(32); // default subaccount (all zeros)

  const data = new Uint8Array(
    ACCOUNT_DOMAIN_SEPARATOR.length + principalBytes.length + subAccount.length,
  );
  data.set(ACCOUNT_DOMAIN_SEPARATOR, 0);
  data.set(principalBytes, ACCOUNT_DOMAIN_SEPARATOR.length);
  data.set(subAccount, ACCOUNT_DOMAIN_SEPARATOR.length + principalBytes.length);

  const hash = sha224(data);
  const checksum = crc32(hash);
  const accountIdBytes = new Uint8Array(checksum.length + hash.length);
  accountIdBytes.set(checksum, 0);
  accountIdBytes.set(hash, checksum.length);

  return hexEncode(accountIdBytes);
};

const normalizePrincipal = (value: unknown): Principal => {
  if (!value) {
    throw new Error('No principal returned from Plug wallet');
  }

  if (typeof value === 'string') {
    try {
      return Principal.fromText(value.trim());
    } catch (err) {
      console.error('Failed to parse principal string from Plug wallet:', value, err);
    }
  }

  if (Array.isArray(value)) {
    try {
      return Principal.fromUint8Array(Uint8Array.from(value));
    } catch (err) {
      console.error('Failed to parse principal from array value', value, err);
    }
  }

  if (typeof value === 'object') {
    const possiblePrincipal = value as {
      toText?: () => string;
      toString?: () => string;
      _isPrincipal?: boolean;
      principalId?: string;
      toUint8Array?: () => Uint8Array;
      principal?: string;
    };

    if (typeof possiblePrincipal.toUint8Array === 'function') {
      try {
        const bytes = possiblePrincipal.toUint8Array();
        if (bytes instanceof Uint8Array) {
          return Principal.fromUint8Array(bytes);
        }
      } catch (err) {
        console.error('Failed to parse principal from toUint8Array()', err);
      }
    }

    if (typeof possiblePrincipal.toText === 'function') {
      try {
        const text = possiblePrincipal.toText();
        return Principal.fromText(text.trim());
      } catch (err) {
        console.error('Failed to parse principal from toText()', err);
      }
    }

    if (typeof possiblePrincipal.toString === 'function') {
      try {
        const asText = possiblePrincipal.toString();
        return Principal.fromText(asText.trim());
      } catch (err) {
        console.error('Failed to parse principal from toString()', err);
      }
    }

    /**
     * Plug returns a Principal instance, which includes `_isPrincipal: true`.
     * When available, we can detect this and create a new Principal from its bytes.
     */
    if (possiblePrincipal && possiblePrincipal._isPrincipal === true) {
      try {
        const internal = possiblePrincipal as unknown as {
          _arr?: Uint8Array;
          arr?: Uint8Array;
        };
        const bytes: Uint8Array | undefined = internal._arr || internal.arr;
        if (bytes instanceof Uint8Array) {
          return Principal.fromUint8Array(bytes);
        }
      } catch (err) {
        console.error('Failed to parse principal from internal _arr/arr property', err);
      }
    }

    if (typeof possiblePrincipal.principalId === 'string') {
      try {
        return Principal.fromText(possiblePrincipal.principalId.trim());
      } catch (err) {
        console.error('Failed to parse principal from principalId property', err);
      }
    }

    if (typeof possiblePrincipal.principal === 'string') {
      try {
        return Principal.fromText(possiblePrincipal.principal.trim());
      } catch (err) {
        console.error('Failed to parse principal from principal property', err);
      }
    }
  }

  console.error('Unsupported principal value returned from Plug wallet:', value);
  throw new Error('Invalid principal value received from Plug wallet');
};

export default function ConnectWallet({ onConnect, className = '' }: ConnectWalletProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Check if Plug wallet is available
      if (!(window as any).ic?.plug) {
        setError('Plug wallet not found. Please install Plug wallet extension.');
        setIsConnecting(false);
        return;
      }

      // Request connection to Plug
      await (window as any).ic.plug.requestConnect({
        whitelist: [process.env.NEXT_PUBLIC_ESCROW_CANISTER_ID!],
        host: process.env.NEXT_PUBLIC_IC_HOST || 'https://icp0.io',
      });

      // Get principal
      const plug = (window as any).ic.plug;
      let rawPrincipal: unknown = null;
      try {
        rawPrincipal = await plug.getPrincipal();
      } catch (principalError) {
        console.warn('Plug getPrincipal() threw, attempting fallback', principalError);
      }

      if (
        !rawPrincipal ||
        (typeof rawPrincipal === 'string' && rawPrincipal.trim().length === 0)
      ) {
        const sessionPrincipal =
          plug?.sessionManager?.principalId ||
          plug?.sessionManager?.sessionData?.principalId;
        if (sessionPrincipal) {
          rawPrincipal = sessionPrincipal;
        }
      }

      const principal = normalizePrincipal(rawPrincipal);
      const principalString = principal.toText();

      // Get account ID
      let accountId: string | undefined;
      if (typeof plug.getAccountId === 'function') {
        accountId = await plug.getAccountId();
      }

      if (!accountId) {
        accountId = deriveAccountId(principal);
      }

      // Save to backend
      const response = await fetch('/api/user/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          principal: principalString,
          accountId: accountId,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to save wallet information');
      }

      // Verify wallet was saved by fetching it back
      try {
        const verifyResponse = await fetch('/api/user/wallet', {
          method: 'GET',
        });
        const verifyResult = await verifyResponse.json();
        
        if (verifyResult.success && verifyResult.data) {
          console.log('✅ Wallet successfully saved to canister:', {
            principal: verifyResult.data.principal,
            accountId: verifyResult.data.accountId,
          });
        } else {
          console.warn('⚠️ Wallet saved but verification failed');
        }
      } catch (verifyErr) {
        console.warn('Could not verify wallet save:', verifyErr);
        // Don't throw - wallet might still be saved
      }

      setIsConnected(true);

      // Call onConnect callback if provided
      if (onConnect) {
        onConnect({
          principal: principalString,
          accountId: accountId,
        });
      }

    } catch (err: any) {
      console.error('Wallet connection error:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      await (window as any).ic.plug.disconnect();
      setIsConnected(false);
      setError(null);
    } catch (err) {
      console.error('Wallet disconnect error:', err);
    }
  };

  if (isConnected) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-2 text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium">Wallet Connected</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={disconnectWallet}
          className="text-xs"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-start gap-2 ${className}`}>
      <Button
        onClick={connectWallet}
        disabled={isConnecting}
        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
      >
        {isConnecting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Connecting...
          </>
        ) : (
          <>
            🔌 Connect Plug Wallet
          </>
        )}
      </Button>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded px-3 py-2 w-full">
          {error}
        </div>
      )}

      <div className="text-xs text-gray-500">
        Connect your Plug wallet to enable escrow payments and receive funds securely.
      </div>
    </div>
  );
}

