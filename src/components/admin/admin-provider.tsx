'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/firebase';
import type { User as StaffUser, StaffRole } from '@/lib/types';

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
  
  // isStaffLoading now directly reflects the authentication loading state from the core Firebase hook.
  const isStaffLoading = isUserLoading;

  useEffect(() => {
    // Don't run logic until auth state is determined.
    if (isStaffLoading) {
      return;
    }

    const isLoginPage = pathname === '/admin/login';

    if (!user) {
      // Auth is done, but no user.
      if (!isLoginPage) {
        router.push('/admin/login');
      }
      setStaffInfo({ user: null, role: null });
    } else {
      // Auth is done, and we have a user.
      if (isLoginPage) {
        router.push('/admin/dashboard');
      }
      
      const pseudoStaffUser: StaffUser = {
        id: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Admin',
        email: user.email || 'unknown',
        role: 'admin',
        isActive: true,
        createdAt: user.metadata.creationTime,
      };
      
      setStaffInfo({ user: pseudoStaffUser, role: 'admin' });
    }
  }, [user, isStaffLoading, pathname, router]);

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
