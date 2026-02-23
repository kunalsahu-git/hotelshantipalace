'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, Query, DocumentData, CollectionReference } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// This is a simplified hook. For production, consider a more robust solution
// that handles query memoization and more detailed error context.
export function useCollection<T>(q: Query<DocumentData> | CollectionReference<DocumentData> | null) {
  const [data, setData] = useState<(T & { id: string })[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!q) {
      setIsLoading(false);
      setData(null);
      return;
    }
    
    setIsLoading(true);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as (T & { id: string })[];
        setData(docs);
        setIsLoading(false);
      },
      (err) => {
        // In a real hook, you might try to extract the path from the query object
        // for better error messages, but it can be complex.
        const permissionError = new FirestorePermissionError({
          path: 'a collection', 
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(permissionError);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [q]);

  return { data, isLoading, error };
}
