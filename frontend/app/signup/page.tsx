import { AuthShell } from '@/components/auth/AuthShell';
import SignupForm from '@/components/auth/SignupForm';

export default function SignUpPage() {
  return (
    <AuthShell cta={{ question: 'Already have an account?', label: 'Log in', href: '/login' }}>
      <SignupForm />
    </AuthShell>
  );
}
