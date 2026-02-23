'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
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
    if (isUserLoading) {
      // Keep loading true while the initial auth check is happening
      setIsStaffLoading(true);
      return;
    }

    const isLoginPage = pathname === '/admin/login';

    if (!user) {
      // Auth check is complete, but no user.
      if (!isLoginPage) {
        router.push('/admin/login');
      }
      setStaffInfo({ user: null, role: null });
      setIsStaffLoading(false); // Auth is ready (no user)
    } else {
      // Auth check is complete, and we have a user.
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
      setIsStaffLoading(false); // Auth is ready (user found)
    }
  }, [user, isUserLoading, pathname, router]);
  
  const contextValue = useMemo(() => ({ ...staffInfo, isStaffLoading }), [staffInfo, isStaffLoading]);

  // Gate the rendering of the children until authentication state is fully resolved.
  // This prevents any child component from attempting to fetch data before auth is ready.
  if (isStaffLoading && pathname !== '/admin/login') {
     return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <div className="p-8 w-full">
          <h2 className="text-3xl font-bold tracking-tight mb-8">Dashboard</h2>
          <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28" />)}
              </div>
               <Skeleton className="h-48" />
               <div className="grid gap-4 md:grid-cols-7">
                  <Skeleton className="h-80 md:col-span-4" />
                  <Skeleton className="h-80 md:col-span-3" />
              </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminContext.Provider value={contextValue}>
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
