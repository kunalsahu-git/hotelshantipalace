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
    // Timestamps are added on the server, so we order by when the document was created.
    return query(collection(firestore, 'bookings'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: bookings, isLoading, error } = useCollection<Booking & {id: string}>(bookingsQuery);

  return (
    <div className="container py-12 md:py-20">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-4xl font-bold mb-2">Bookings</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Here are the latest booking requests from the website.
        </p>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <Table>
            <TableCaption>{isLoading ? "Loading..." : (bookings?.length === 0 ? "No bookings found." : "A list of recent bookings.")}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Guest Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-destructive">
                    Error loading bookings. Please ensure security rules allow read access.
                  </TableCell>
                </TableRow>
              ) : (
                bookings?.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.fullName}</TableCell>
                    <TableCell>
                        <div>{booking.email}</div>
                        <div className="text-muted-foreground text-sm">{booking.phone}</div>
                    </TableCell>
                    <TableCell>{booking.roomTypeName}</TableCell>
                    <TableCell>
                        {/* The date is parsed as UTC, so we add the timezone offset to display it correctly */}
                        {format(new Date(new Date(booking.checkIn).valueOf() + new Date().getTimezoneOffset() * 60 * 1000), 'dd MMM yyyy')} - {format(new Date(new Date(booking.checkOut).valueOf() + new Date().getTimezoneOffset() * 60 * 1000), 'dd MMM yyyy')}
                        <div className="text-muted-foreground text-sm">{booking.numberOfNights} nights</div>
                    </TableCell>
                    <TableCell className="text-right">
                        <Badge variant={booking.status === 'reserved' ? 'secondary' : 'default'}>{booking.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
