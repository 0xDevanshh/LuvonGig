'use client'
import React, { useEffect, useState } from 'react';
import { Wallet, Shield, CheckCircle, AlertCircle, Loader2, Coins } from 'lucide-react';

export function PaymentProcessing() {
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const processingSteps = [
    {
      title: 'Connecting Wallet',
      description: 'Establishing secure connection to your ICP wallet...',
      icon: Wallet,
      duration: 800
    },
    {
      title: 'Verifying Transaction',
      description: 'Authenticating payment on the Internet Computer...',
      icon: Shield,
      duration: 1200
    },
    {
      title: 'Transferring Tokens',
      description: 'Processing secure token transfer via ICPay...',
      icon: Coins,
      duration: 2000
    },
    {
      title: 'Confirming Booking',
      description: 'Creating your service order and initializing chat...',
      icon: CheckCircle,
      duration: 1500
    }
  ];

  useEffect(() => {
    const runProcessingSequence = async () => {
      for (let i = 0; i < processingSteps.length; i++) {
        if (error) break;

        setCurrentStep(i);
        await new Promise(resolve => setTimeout(resolve, processingSteps[i].duration));
      }
    };

    runProcessingSequence();
  }, [error]);

  const currentStepData = processingSteps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-purple-100">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
            {error ? (
              <AlertCircle size={40} className="text-white" />
            ) : (
              <div className="relative">
                <Wallet size={40} className="text-white" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <Loader2 size={14} className="text-white animate-spin" />
                </div>
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error ? 'Payment Failed' : 'Processing Payment'}
          </h1>
          <p className="text-gray-600 text-sm">
            {error ? error : currentStepData.description}
          </p>
        </div>

        {!error && (
          <>
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                {processingSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index === currentStep;
                  const isCompleted = index < currentStep;

                  return (
                    <React.Fragment key={index}>
                      <div className="flex flex-col items-center flex-1">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                          isCompleted
                            ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                            : isActive
                            ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30 scale-110'
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle size={24} />
                          ) : isActive ? (
                            <Icon size={24} className="animate-pulse" />
                          ) : (
                            <Icon size={24} />
                          )}
                        </div>
                        <div className={`mt-2 text-xs font-medium text-center transition-colors ${
                          isActive ? 'text-purple-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          {step.title}
                        </div>
                      </div>
                      {index < processingSteps.length - 1 && (
                        <div className="flex-1 h-1 mx-2 rounded-full bg-gray-200 overflow-hidden">
                          <div className={`h-full transition-all duration-500 ${
                            index < currentStep 
                              ? 'w-full bg-gradient-to-r from-green-500 to-emerald-600' 
                              : 'w-0 bg-gray-200'
                          }`} />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Loading Animation */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-purple-100 rounded-full"></div>
                <div className="absolute top-0 left-0 w-20 h-20 border-4 border-t-purple-600 border-r-blue-600 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Coins size={32} className="text-purple-600 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <Shield className="text-purple-600 mt-0.5" size={20} />
                <div className="text-sm text-purple-900">
                  <div className="font-semibold mb-1">Secure Payment Processing</div>
                  <p className="text-purple-700">Your payment is being processed securely on the Internet Computer blockchain with zero gas fees.</p>
                </div>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50 rounded-lg p-3">
                <Wallet size={20} className="mx-auto mb-1 text-purple-600" />
                <div className="text-xs text-gray-600 font-medium">ICP Wallet</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <Shield size={20} className="mx-auto mb-1 text-blue-600" />
                <div className="text-xs text-gray-600 font-medium">Encrypted</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <Coins size={20} className="mx-auto mb-1 text-green-600" />
                <div className="text-xs text-gray-600 font-medium">No Fees</div>
              </div>
            </div>
          </>
        )}

        {error && (
          <div className="text-center space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium shadow-lg shadow-purple-500/30">
              Try Again
            </button>
            <button className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
              Contact Support
            </button>
          </div>
        )}

        {/* Additional Info */}
        <div className="mt-6 text-center text-xs text-gray-500">
          ⚡ Please don't close this window while your transaction is being processed on the blockchain.
        </div>
      </div>
    </div>
  );
}
