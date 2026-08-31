'use client'
import React, { useEffect, useState, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface Token {
  id: string;
  symbol: string;
  name: string;
  logo: string;
  chain: 'EVM' | 'ICP';
  evmChain?: string;
}

interface TokenSelectorProps {
  selectedToken: Token;
  tokens: Token[];
  onSelectToken: (token: Token) => void;
}

export function TokenSelector({
  selectedToken,
  tokens,
  onSelectToken
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter tokens based on search query
  const filteredTokens = tokens.filter(token =>
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-gray-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
          {selectedToken.logo ? (
            <img src={selectedToken.logo} alt={selectedToken.name} className="w-6 h-6" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-300"></div>
          )}
        </div>
        <span className="font-medium">{selectedToken.symbol}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 max-h-60 overflow-y-auto bg-white rounded-lg shadow-lg border border-gray-200 z-30">
          <div className="p-2">
            <input
              type="text"
              placeholder="Search token"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <div className="p-2">
            {filteredTokens.length === 0 ? (
              <div className="text-center py-4 text-sm text-gray-500">
                No tokens found
              </div>
            ) : (
              filteredTokens.map(token => (
                <div
                  key={token.id}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-100 ${
                    token.id === selectedToken.id ? 'bg-gray-100' : ''
                  }`}
                  onClick={() => {
                    onSelectToken(token);
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {token.logo ? (
                      <img src={token.logo} alt={token.name} className="w-6 h-6" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-300"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{token.symbol}</div>
                    <div className="text-xs text-gray-500">{token.name}</div>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    {token.chain}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
