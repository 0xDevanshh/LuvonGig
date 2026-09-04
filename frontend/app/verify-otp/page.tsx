import { Suspense } from 'react';

import { AuthShell } from '@/components/auth/AuthShell';
import VerifyCodeForm from '@/components/auth/VerifyCodeForm';

export default function VerifyOTPPage() {
  return (
    <AuthShell>
      <Suspense fallback={<div className="h-40" />}>
        <VerifyCodeForm />
      </Suspense>
    </AuthShell>
  );
}
