import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import Header from '../../components/auth/Header';
export default function ForgotPasswordPage() {
  return <div className="flex flex-col min-h-screen bg-white">
  <Header />
  <div className="flex-1 flex items-center justify-center py-12">
    <ForgotPasswordForm />
  </div>
</div>;
}
