import { AuthShell } from '@/components/auth/AuthShell';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <AuthShell cta={{ question: "Don't have an account?", label: 'Sign up', href: '/signup' }}>
      <LoginForm />
    </AuthShell>
  );
}
