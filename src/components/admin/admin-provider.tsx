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
  const [isStaffLoading, setIsStaffLoading] = useState(true);

  useEffect(() => {
    console.log('[AdminProvider] Auth state change detected. isUserLoading:', isUserLoading, 'User UID:', user?.uid);
    const isLoginPage = pathname === '/admin/login';

    if (isUserLoading) {
      console.log('[AdminProvider] Auth state is still loading, ensuring isStaffLoading is true.');
      setIsStaffLoading(true);
      return;
    }

    if (!user) {
      console.log('[AdminProvider] User is confirmed to be logged out.');
      if (!isLoginPage) {
        console.log('[AdminProvider] Not on login page, redirecting to /admin/login.');
        router.push('/admin/login');
      }
      setStaffInfo({ user: null, role: null });
      setIsStaffLoading(false);
      console.log('[AdminProvider] Set isStaffLoading to false for logged-out user.');
      return;
    }

    // User is logged in
    console.log('[AdminProvider] User is confirmed to be logged in:', user.uid);
    if (isLoginPage) {
      console.log('[AdminProvider] User is on login page, redirecting to /admin/dashboard.');
      router.push('/admin/dashboard');
      return;
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
    setIsStaffLoading(false);
    console.log('[AdminProvider] Set staff info and set isStaffLoading to false for logged-in user.');

  }, [user, isUserLoading, pathname, router]);

  // Always render the provider.
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
