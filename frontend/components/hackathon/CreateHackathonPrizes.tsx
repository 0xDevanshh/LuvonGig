'use client'
import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Trophy,
  DollarSign,
  Gift,
  Star,
  Target,
  Award,
  ChevronUp,
  ChevronDown,
  GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHackathonForm } from '@/context/HackathonFormContext';
import { Prize } from '@/context/HackathonFormContext';

interface CreateHackathonPrizesProps {
  className?: string;
}

export default function CreateHackathonPrizes({ className }: CreateHackathonPrizesProps) {
  const { formData, updateFormData, setSaved } = useHackathonForm();

  const predefinedPositions = [
    '1st Place',
    '2nd Place',
    '3rd Place',
    'Honorable Mention',
    'Best Innovation',
    'Best Design',
    'Best Technical Implementation',
    'People\'s Choice',
    'Most Creative',
    'Best Presentation'
  ];

  const addPrize = (position?: string) => {
    const newPrize: Prize = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      position: position || '',
      title: '',
      description: '',
      amount: 0,
      currency: 'USD',
      type: 'cash'
    };
    updateFormData({ prizes: [...formData.prizes, newPrize] });
    setSaved('prizes', true);
  };

  const updatePrize = (id: string, field: keyof Prize, value: string | number) => {
    const updatedPrizes = formData.prizes.map(prize =>
      prize.id === id ? { ...prize, [field]: value } : prize
    );
    updateFormData({ prizes: updatedPrizes });
    setSaved('prizes', true);
  };

  const removePrize = (id: string) => {
    updateFormData({ prizes: formData.prizes.filter(prize => prize.id !== id) });
    setSaved('prizes', true);
  };

  const movePrize = (index: number, direction: 'up' | 'down') => {
    const newPrizes = [...formData.prizes];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newPrizes.length) {
      [newPrizes[index], newPrizes[targetIndex]] = [newPrizes[targetIndex], newPrizes[index]];
      updateFormData({ prizes: newPrizes });
      setSaved('prizes', true);
    }
  };

  const getTotalPrizePool = () => {
    return formData.prizes
      .filter(prize => prize.type === 'cash')
      .reduce((total, prize) => total + prize.amount, 0);
  };

  const getPositionIcon = (position: string) => {
    if (position.toLowerCase().includes('1st')) {
      return <Trophy className="w-5 h-5 text-yellow-500" />;
    } else if (position.toLowerCase().includes('2nd')) {
      return <Award className="w-5 h-5 text-gray-400" />;
    } else if (position.toLowerCase().includes('3rd')) {
      return <Star className="w-5 h-5 text-orange-600" />;
    } else if (position.toLowerCase().includes('innovation') || position.toLowerCase().includes('design')) {
      return <Target className="w-5 h-5 text-purple-500" />;
    } else {
      return <Gift className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Prizes & Awards</h3>
        <p className="text-gray-600">Define the prizes and awards that will motivate participants.</p>
      </div>

      {/* Prize Pool Summary */}
      {formData.prizes.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900">Total Prize Pool</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              ${getTotalPrizePool().toLocaleString()}
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {formData.prizes.length} prize{formData.prizes.length !== 1 ? 's' : ''} total
          </div>
        </div>
      )}

      {/* Quick Add Predefined Prizes */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Quick Add Common Prizes</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {predefinedPositions.map((position) => (
            <button
              key={position}
              onClick={() => addPrize(position)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              + {position}
            </button>
          ))}
        </div>
      </div>

      {/* Prize List */}
      <div className="space-y-4">
        {formData.prizes.map((prize, index) => (
          <div
            key={prize.id}
            className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
          >
            {/* Prize Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  {index > 0 && (
                    <button
                      onClick={() => movePrize(index, 'up')}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <ChevronUp size={16} />
                    </button>
                  )}
                  {index < formData.prizes.length - 1 && (
                    <button
                      onClick={() => movePrize(index, 'down')}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <ChevronDown size={16} />
                    </button>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {getPositionIcon(prize.position)}
                  <span className="font-semibold text-gray-900">
                    {prize.position || 'New Prize'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => removePrize(prize.id)}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Position */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position/Category *
                </label>
                <div className="flex space-x-2">
                  <select
                    value={prize.position}
                    onChange={(e) => updatePrize(prize.id, 'position', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select position</option>
                    {predefinedPositions.map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={prize.position}
                    onChange={(e) => updatePrize(prize.id, 'position', e.target.value)}
                    placeholder="Or enter custom..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Prize Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prize Type *
                </label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => updatePrize(prize.id, 'type', 'cash')}
                    className={cn(
                      'flex-1 px-3 py-2 rounded-md border transition-colors',
                      prize.type === 'cash'
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'border-gray-300 hover:border-gray-400'
                    )}
                  >
                    <DollarSign className="w-4 h-4 inline mr-1" />
                    Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => updatePrize(prize.id, 'type', 'non-cash')}
                    className={cn(
                      'flex-1 px-3 py-2 rounded-md border transition-colors',
                      prize.type === 'non-cash'
                        ? 'bg-purple-50 border-purple-500 text-purple-700'
                        : 'border-gray-300 hover:border-gray-400'
                    )}
                  >
                    <Gift className="w-4 h-4 inline mr-1" />
                    Non-Cash
                  </button>
                </div>
              </div>

              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prize Title *
                </label>
                <input
                  type="text"
                  value={prize.title}
                  onChange={(e) => updatePrize(prize.id, 'title', e.target.value)}
                  placeholder={prize.type === 'cash' ? 'e.g., "$1,000 Cash Prize"' : 'e.g., "Latest Smartphone"'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Amount (for cash prizes) */}
              {prize.type === 'cash' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={prize.currency}
                      onChange={(e) => updatePrize(prize.id, 'currency', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="BTC">BTC</option>
                      <option value="ETH">ETH</option>
                    </select>
                    <input
                      type="number"
                      value={prize.amount}
                      onChange={(e) => updatePrize(prize.id, 'amount', Number(e.target.value))}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Description */}
              <div className={prize.type === 'cash' ? 'md:col-span-1' : 'md:col-span-2'}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={prize.description}
                  onChange={(e) => updatePrize(prize.id, 'description', e.target.value)}
                  placeholder={
                    prize.type === 'cash'
                      ? 'Describe what this cash prize recognizes'
                      : 'Describe the non-cash prize and its value'
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Value Display for Non-Cash */}
              {prize.type === 'non-cash' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Value
                  </label>
                  <input
                    type="text"
                    value={prize.amount ? `$${prize.amount.toLocaleString()}` : ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      updatePrize(prize.id, 'amount', Number(value));
                    }}
                    placeholder="e.g., 500"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">For tracking total value (optional)</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Custom Prize Button */}
      <div className="flex justify-center">
        <button
          onClick={() => addPrize()}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Add Custom Prize</span>
        </button>
      </div>

      {/* Empty State */}
      {formData.prizes.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Prizes Added Yet</h3>
          <p className="text-gray-500 mb-4">Add prizes to motivate participants and make your hackathon more attractive.</p>
          <button
            onClick={() => addPrize('1st Place')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Your First Prize
          </button>
        </div>
      )}
    </div>
  );
}