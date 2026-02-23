'use client';

import { useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Booking } from '@/lib/types';
import { format } from 'date-fns';

export default function BookingsPage() {
  const firestore = useFirestore();

  const bookingsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'bookings'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: bookings, isLoading, error } = useCollection<Booking>(bookingsQuery);

  const getSourceVariant = (source: string) => {
    switch(source) {
      case 'website': return 'default';
      case 'admin': return 'secondary';
      default: return 'outline';
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Bookings</h1>
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableCaption>{isLoading ? "Loading..." : (bookings?.length === 0 ? "No bookings found." : "A list of recent bookings.")}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Guest</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-destructive">
                  Error loading bookings: {error.message}
                </TableCell>
              </TableRow>
            ) : (
              bookings?.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">
                    <div>{booking.guestName}</div>
                    <div className="text-muted-foreground text-sm">{booking.guestEmail}</div>
                  </TableCell>
                  <TableCell>{booking.categoryName}</TableCell>
                  <TableCell>
                    {format(new Date(booking.checkIn), 'dd MMM yyyy')} - {format(new Date(booking.checkOut), 'dd MMM yyyy')}
                    <div className="text-muted-foreground text-sm">{booking.numberOfNights} nights</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getSourceVariant(booking.source)} className="capitalize">{booking.source}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                      <Badge variant={booking.status === 'reserved' ? 'secondary' : 'default'} className="capitalize">{booking.status}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
