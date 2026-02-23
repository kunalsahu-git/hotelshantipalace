'use client';

import { useState } from 'react';
import { collection, query, orderBy, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { type Guest } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Users, Sparkles } from 'lucide-react';

const getInitialGuests = () => {
    return [
        {
            name: 'Rohan Sharma',
            phone: '9876543210',
            email: 'rohan.sharma@example.com',
            totalStays: 2,
            source: 'website',
            tags: ['VIP', 'Repeat'],
            createdAt: serverTimestamp(),
        },
        {
            name: 'Priya Singh',
            phone: '8765432109',
            email: 'priya.singh@example.com',
            totalStays: 1,
            source: 'walkin',
            tags: ['Corporate'],
            createdAt: serverTimestamp(),
        },
        {
            name: 'Amit Patel',
            phone: '7654321098',
            email: 'amit.patel@example.com',
            totalStays: 1,
            source: 'website',
            createdAt: serverTimestamp(),
        },
    ];
}

function GuestRow({ guest }: { guest: Guest }) {
  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{guest.name}</div>
        <div className="text-sm text-muted-foreground">{guest.email}</div>
      </TableCell>
      <TableCell className="hidden md:table-cell">{guest.phone}</TableCell>
      <TableCell className="text-center">{guest.totalStays}</TableCell>
      <TableCell>
         <Badge variant={guest.source === 'website' ? 'default' : 'secondary'} className="capitalize">{guest.source}</Badge>
      </TableCell>
      <TableCell className="text-right">
        {guest.createdAt?.toDate && (
          <div className="text-sm">
            {format(guest.createdAt.toDate(), 'dd MMM yyyy')}
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}

export default function GuestsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);

  const guestsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'guests'), orderBy('createdAt', 'desc'))
        : null,
    [firestore]
  );
  const { data: guests, isLoading } = useCollection<Guest>(guestsQuery);

  const handleSeedData = async () => {
    if (!firestore) return;
    setIsSeeding(true);
    
    try {
      const batch = writeBatch(firestore);
      const initialGuests = getInitialGuests();
      const guestsCollection = collection(firestore, 'guests');

      initialGuests.forEach(guestData => {
        const newGuestRef = doc(guestsCollection);
        batch.set(newGuestRef, guestData);
      });

      await batch.commit();

      toast({
        title: 'Success!',
        description: `${initialGuests.length} sample guests have been created.`,
      });
    } catch (error) {
      console.error("Error seeding guests:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not seed guests. Check console for details.',
      });
    } finally {
      setIsSeeding(false);
    }
  };
  
  const hasGuests = guests && guests.length > 0;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Guests</h1>
        <Button>Add New Guest</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Guest Directory</CardTitle>
          <CardDescription>
            View and manage all guest profiles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="text-center">Total Stays</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && !hasGuests && (
                 <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <Users className="w-16 h-16 text-muted-foreground" />
                        <h3 className="text-xl font-bold">No Guests Found</h3>
                        <p className="text-muted-foreground">Get started by seeding some sample guest data.</p>
                         <Button onClick={handleSeedData} disabled={isSeeding}>
                            <Sparkles className="mr-2 h-4 w-4" />
                            {isSeeding ? 'Creating Guests...' : 'Seed Initial Guests'}
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {guests?.map((guest) => (
                <GuestRow key={guest.id} guest={guest} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
