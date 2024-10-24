import { useSession, signIn } from 'next-auth/react';
import { useEffect } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useRouter } from 'next/navigation';

const AuthWrapper = ({ children, requiredRole }) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session && requiredRole && session.user.role !== requiredRole) {
      router.push('/dashboard'); // Redirect to dashboard if role is insufficient
    }
  }, [status, session, requiredRole, router]);

  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  if (!session) {
    return null;
  }

  return children;
};

export default AuthWrapper;
