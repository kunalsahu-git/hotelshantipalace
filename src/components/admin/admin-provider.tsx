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
  const firestore = useFirestore();
  const [staffInfo, setStaffInfo] = useState<{ user: StaffUser | null, role: StaffRole | null }>({ user: null, role: null });
  const [isStaffLoading, setIsStaffLoading] = useState(true);

  useEffect(() => {
    const isLoginPage = pathname === '/admin/login';
    
    if (isUserLoading) return; // Wait for firebase auth to resolve

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

    const userDocRef = doc(firestore, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = { id: docSnap.id, ...docSnap.data() } as StaffUser;
        setStaffInfo({ user: userData, role: userData.role });
      } else {
        // This user is authenticated but doesn't have a user role document
        setStaffInfo({ user: null, role: null }); 
      }
      setIsStaffLoading(false);
    }, (error) => {
        console.error("Failed to fetch user role:", error);
        setIsStaffLoading(false);
        setStaffInfo({ user: null, role: null }); 
        const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
    });

    return () => unsubscribe();
  }, [user, isUserLoading, pathname, router, firestore]);

  const finalIsLoading = isUserLoading || (isStaffLoading && pathname !== '/admin/login');

  if (finalIsLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="w-full max-w-md space-y-4 p-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  // Only render children if we are not loading and not on the login page (or if user exists)
  // This avoids rendering children that depend on the context before it's ready.
  if (pathname === '/admin/login' && !user) {
    return (
        <AdminContext.Provider value={{ ...staffInfo, isStaffLoading: finalIsLoading }}>
            {children}
        </AdminContext.Provider>
    );
  }
  
  return (
    <AdminContext.Provider value={{ ...staffInfo, isStaffLoading: finalIsLoading }}>
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
