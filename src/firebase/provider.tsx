'use client';
import { createContext, useContext, useEffect } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from './error-emitter';
import { FirestorePermissionError } from './errors';

interface FirebaseContextType {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export const FirebaseProvider = ({
  children,
  app,
  auth,
  firestore,
}: {
  children: React.ReactNode;
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}) => {
  return (
    <FirebaseContext.Provider value={{ app, auth, firestore }}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
    const context = useContext(FirebaseContext);
    if (!context) {
        throw new Error('useFirebase must be used within a FirebaseProvider');
    }
    return context;
}

export const useFirebaseApp = () => useFirebase().app;
export const useAuth = () => useFirebase().auth;
export const useFirestore = () => useFirebase().firestore;


function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // The console.error was causing issues with the Next.js dev overlay and promise chains.
      // It has been removed to align with the project's error handling strategy.
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "You do not have permission to perform this action.",
      });
    };

    errorEmitter.on('permission-error', handleError);
    
    // No cleanup function needed if errorEmitter is a singleton
  }, [toast]);

  return null;
}
