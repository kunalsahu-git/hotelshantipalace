'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/firebase';
import type { User as StaffUser, StaffRole } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

interface AdminContextType {
  user: StaffUser | null;
  role: StaffRole | null;
  isStaffLoading: boolean;
}

const AdminContext = createContext<AdminContextType>({
  user: null,
  role: null,
  isStaffLoading: true,
});

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [staffInfo, setStaffInfo] = useState<{ user: StaffUser | null; role: StaffRole | null }>({ user: null, role: null });
  const [isStaffLoading, setIsStaffLoading] = useState(true);

  useEffect(() => {
    const isLoginPage = pathname === '/admin/login';

    if (isUserLoading) {
      // Still waiting for Firebase to determine auth state
      setIsStaffLoading(true);
      return;
    }

    if (!user) {
      // User is not logged in
      if (!isLoginPage) {
        router.push('/admin/login');
      }
      setStaffInfo({ user: null, role: null });
      setIsStaffLoading(false);
      return;
    }

    // User is logged in
    if (isLoginPage) {
      router.push('/admin/dashboard');
      return;
    }

    // Since rules are simplified, any logged-in user is an admin.
    const pseudoStaffUser: StaffUser = {
      id: user.uid,
      name: user.displayName || user.email?.split('@')[0] || 'Admin',
      email: user.email || 'unknown',
      role: 'admin',
      isActive: true,
      createdAt: user.metadata.creationTime,
    };
    
    setStaffInfo({ user: pseudoStaffUser, role: 'admin' });
    setIsStaffLoading(false);

  }, [user, isUserLoading, pathname, router]);

  // Always render the provider. The children will decide what to do based on the context values.
  // This prevents the race condition where children don't see the initial loading state.
  return (
    <AdminContext.Provider value={{ ...staffInfo, isStaffLoading }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
