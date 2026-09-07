'use client'
import React, { useEffect, useState } from 'react';
import { CreditCard, Shield, CheckCircle, AlertCircle, Loader2, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PaymentProcessing() {
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const processingSteps = [
    {
      title: 'Verifying Card',
      description: 'Confirming your payment details with Stripe...',
      icon: CreditCard,
      duration: 800
    },
    {
      title: 'Processing Payment',
      description: 'Charging your card securely...',
      icon: Shield,
      duration: 1200
    },
    {
      title: 'Recording Transaction',
      description: 'Saving your receipt and payment record...',
      icon: Receipt,
      duration: 1200
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
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="relative mx-auto mb-4 flex size-20 items-center justify-center rounded-full bg-primary shadow-lg">
            {error ? (
              <AlertCircle size={40} className="text-primary-foreground" />
            ) : (
              <div className="relative">
                <CreditCard size={40} className="text-primary-foreground" />
                <div className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border-2 border-card bg-success">
                  <Loader2 size={14} className="animate-spin text-success-foreground" />
                </div>
              </div>
            )}
          </div>
          <h1 className="mb-2 font-heading text-h2 font-semibold text-foreground">
            {error ? 'Payment Failed' : 'Processing Payment'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {error ? error : currentStepData.description}
          </p>
        </div>

        {!error && (
          <>
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="mb-6 flex items-center justify-between">
                {processingSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index === currentStep;
                  const isCompleted = index < currentStep;

                  return (
                    <React.Fragment key={index}>
                      <div className="flex flex-1 flex-col items-center">
                        <div className={`flex size-12 items-center justify-center rounded-full transition-all duration-300 ${
                          isCompleted
                            ? 'bg-success text-success-foreground shadow-lg'
                            : isActive
                            ? 'scale-110 bg-primary text-primary-foreground shadow-lg'
                            : 'bg-secondary text-muted-foreground'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle size={24} />
                          ) : isActive ? (
                            <Icon size={24} className="animate-pulse" />
                          ) : (
                            <Icon size={24} />
                          )}
                        </div>
                        <div className={`mt-2 text-center text-xs font-medium transition-colors ${
                          isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-muted-foreground'
                        }`}>
                          {step.title}
                        </div>
                      </div>
                      {index < processingSteps.length - 1 && (
                        <div className="mx-2 h-1 flex-1 overflow-hidden rounded-full bg-secondary">
                          <div className={`h-full transition-all duration-500 ${
                            index < currentStep
                              ? 'w-full bg-success'
                              : 'w-0 bg-secondary'
                          }`} />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Loading Animation */}
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <div className="size-20 rounded-full border-4 border-primary-soft"></div>
                <div className="absolute left-0 top-0 size-20 animate-spin rounded-full border-4 border-b-transparent border-l-transparent border-t-primary border-r-primary-hover"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Shield size={32} className="animate-pulse text-primary" />
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="mb-4 rounded-lg border border-primary/20 bg-primary-soft p-4">
              <div className="flex items-start space-x-3">
                <Shield className="mt-0.5 text-primary" size={20} />
                <div className="text-sm text-foreground">
                  <div className="mb-1 font-semibold">Secure Payment Processing</div>
                  <p className="text-muted-foreground">Your payment is being processed securely by Stripe. Your card details never touch our servers.</p>
                </div>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-secondary p-3">
                <CreditCard size={20} className="mx-auto mb-1 text-primary" />
                <div className="text-xs font-medium text-muted-foreground">Card Payment</div>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <Shield size={20} className="mx-auto mb-1 text-primary" />
                <div className="text-xs font-medium text-muted-foreground">Encrypted</div>
              </div>
              <div className="rounded-lg bg-secondary p-3">
                <Receipt size={20} className="mx-auto mb-1 text-primary" />
                <div className="text-xs font-medium text-muted-foreground">Receipt Emailed</div>
              </div>
            </div>
          </>
        )}

        {error && (
          <div className="space-y-3 text-center">
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
            <Button className="w-full" size="lg">
              Try Again
            </Button>
            <Button variant="secondary" className="w-full" size="lg">
              Contact Support
            </Button>
          </div>
        )}

        {/* Additional Info */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          Please don't close this window while your payment is being processed.
        </div>
      </div>
    </div>
  );
}
