import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
const PasswordChangeSuccessMessage = () => {
  const router = useRouter();
  const [redirectCount, setRedirectCount] = useState(5);
  useEffect(() => {
    const timer = setInterval(() => {
      setRedirectCount(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(() => router.push('/login'), 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [router]);
  return <div className="max-w-xl w-full mx-auto px-6 py-12 bg-white rounded-3xl shadow-lg border border-gray-100 relative overflow-hidden">
      {/* Gradient background effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-100 via-pink-100 to-yellow-100 opacity-50 rounded-3xl"></div>
      <div className="relative z-10 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 flex items-center justify-center rounded-full border-2 border-green-500 mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Password Change Successfully
        </h1>
        <p className="text-gray-700 mb-8 max-w-md">
          Congratulations! You've successfully completed the verification
          process and are now officially a part of the Organaise community –
          where excellence meets opportunity.
        </p>
        <p className="text-green-600 text-lg font-medium">
          Redirecting to Login Page...
        </p>
      </div>
    </div>;
};
export default PasswordChangeSuccessMessage;