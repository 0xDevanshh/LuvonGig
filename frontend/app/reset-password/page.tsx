import { Suspense } from 'react';

import { AuthShell } from '@/components/auth/AuthShell';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <Suspense fallback={<div className="h-40" />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
