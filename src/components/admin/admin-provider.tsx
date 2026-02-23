'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import type { User as StaffUser, StaffRole } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

interface AdminContextType {
  user: StaffUser | null;
  role: StaffRole | null;
  isStaffLoading: boolean;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [staffInfo, setStaffInfo] = useState<{ user: StaffUser | null, role: StaffRole | null }>({ user: null, role: null });
  const [isStaffLoading, setIsStaffLoading] = useState(true);

  useEffect(() => {
    const isLoginPage = pathname === '/admin/login';
    
    if (isUserLoading) return;

    if (!user) {
      if (!isLoginPage) {
        router.push('/admin/login');
      }
      setIsStaffLoading(false);
      setStaffInfo({ user: null, role: null });
      return;
    }

    if (user && isLoginPage) {
        router.push('/admin/dashboard');
        return;
    }

    // With simplified rules, any authenticated user is an admin.
    // We no longer need to fetch a user document to determine the role.
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

  if (isUserLoading || (isStaffLoading && pathname !== '/admin/login')) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="w-full max-w-md space-y-4 p-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }
  
  return (
    <AdminContext.Provider value={{ ...staffInfo, isStaffLoading }}>
        {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};
