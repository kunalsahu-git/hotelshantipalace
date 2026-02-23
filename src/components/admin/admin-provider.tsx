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
    const isLoginPage = pathname === '/admin/login';

    if (isUserLoading) {
      setIsStaffLoading(true);
      return;
    }

    if (!user) {
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
