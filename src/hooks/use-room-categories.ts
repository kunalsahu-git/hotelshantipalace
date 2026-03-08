'use client';

import { useMemo } from 'react';
import { collection } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { roomCategories as mockRoomCategories } from '@/lib/mock-data';
import type { RoomCategory } from '@/lib/types';

export function useRoomCategories(): { categories: RoomCategory[]; isLoading: boolean } {
  const firestore = useFirestore();

  const query = useMemoFirebase(
    () => (firestore ? collection(firestore, 'roomCategories') : null),
    [firestore]
  );

  const { data, isLoading } = useCollection<RoomCategory>(query);

  const categories = useMemo(() => {
    if (data && data.length > 0) return data as RoomCategory[];
    return mockRoomCategories;
  }, [data]);

  return { categories, isLoading };
}
