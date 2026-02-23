'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { format, differenceInDays } from 'date-fns';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { BookingFormData } from '@/lib/schemas';
import { roomCategories } from '@/lib/mock-data';
import type { Booking } from '@/lib/types';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, PartyPopper } from 'lucide-react';

export function Step3Review({ prevStep }: { prevStep: () => void }) {
  const { getValues } = useFormContext<BookingFormData>();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const data = getValues();
  const room = roomCategories.find((r) => r.id === data.roomTypeId);
  
  if (!room || !data.checkIn || !data.checkOut) {
    // This should not happen if steps are followed correctly.
    return (
      <div className="text-center">
        <p className="text-destructive mb-4">Something went wrong. Please go back and fill out the form correctly.</p>
        <Button type="button" variant="outline" size="lg" onClick={prevStep}>
          <ArrowLeft className="mr-2 h-5 w-5" /> Go Back
        </Button>
      </div>
    );
  }
  
  const numberOfNights = differenceInDays(data.checkOut, data.checkIn);
  const totalPrice = numberOfNights * room.basePrice;


  const handleConfirmBooking = async () => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Database connection not found.' });
      return;
    }
    setIsSubmitting(true);

    const bookingPayload: Omit<Booking, 'id' | 'createdAt'> = {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      guests: data.guests,
      specialRequests: data.specialRequests || '',
      roomTypeId: room.id,
      roomTypeName: room.name,
      checkIn: format(data.checkIn, 'yyyy-MM-dd'),
      checkOut: format(data.checkOut, 'yyyy-MM-dd'),
      totalPrice: totalPrice,
      numberOfNights: numberOfNights,
      status: 'reserved',
      bookingType: 'advance',
      source: 'website',
    };

    const bookingsCollection = collection(firestore, 'bookings');
    
    addDoc(bookingsCollection, {
        ...bookingPayload,
        createdAt: serverTimestamp(),
    })
    .then(docRef => {
        router.push(`/booking-confirmed?id=${docRef.id}`);
    })
    .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'bookings',
            operation: 'create',
            requestResourceData: bookingPayload,
          });
        errorEmitter.emit('permission-error', permissionError);
    }).finally(() => {
        setIsSubmitting(false);
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Review & Confirm</h2>
        <p className="text-muted-foreground">Please review your booking details before confirming.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <div><strong className="block text-muted-foreground">Full Name</strong> {data.fullName}</div>
                <div><strong className="block text-muted-foreground">Phone</strong> {data.phone}</div>
                <div><strong className="block text-muted-foreground">Email</strong> {data.email}</div>
                <div><strong className="block text-muted-foreground">Guests</strong> {data.guests}</div>
            </div>
            <hr />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                 <div><strong className="block text-muted-foreground">Room Type</strong> {room.name}</div>
                 <div><strong className="block text-muted-foreground">Stay</strong> {numberOfNights} night{numberOfNights > 1 ? 's' : ''}</div>
                 <div><strong className="block text-muted-foreground">Check-in</strong> {format(data.checkIn, "EEE, dd MMM yyyy")}</div>
                 <div><strong className="block text-muted-foreground">Check-out</strong> {format(data.checkOut, "EEE, dd MMM yyyy")}</div>
            </div>
            {data.specialRequests && (
                <>
                  <hr />
                  <div>
                    <strong className="block text-muted-foreground">Special Requests</strong>
                    <p className="italic text-muted-foreground">"{data.specialRequests}"</p>
                  </div>
                </>
            )}
             <hr />
             <div className="flex justify-between items-center font-bold text-xl">
                <span>Estimated Total</span>
                <span className="text-primary">₹{totalPrice.toLocaleString()}</span>
             </div>
        </CardContent>
      </Card>

       <Alert className="bg-primary/5 border-primary/20 text-primary-foreground">
          <PartyPopper className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary font-bold">No Payment Needed Now</AlertTitle>
          <AlertDescription className="text-primary/90">
            Your booking request will be confirmed by our team. You can pay at the hotel during check-in or check-out.
          </AlertDescription>
        </Alert>

      <div className="flex justify-between">
        <Button type="button" variant="outline" size="lg" onClick={prevStep} disabled={isSubmitting}>
          <ArrowLeft className="mr-2 h-5 w-5" /> Back
        </Button>
        <Button type="button" size="lg" onClick={handleConfirmBooking} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Confirm My Booking'}
        </Button>
      </div>
    </div>
  );
}
