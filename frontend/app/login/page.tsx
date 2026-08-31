import LoginForm from '@/components/auth/LoginForm';
import Header from '../../components/auth/Header';

export default function LoginPage() {
  return <div className="flex flex-col min-h-screen bg-white">
    <Header />
    <div className="flex-1 flex items-center justify-center py-12">
      <LoginForm />
    </div>
  </div>;
}
