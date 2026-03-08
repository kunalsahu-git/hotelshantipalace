'use client';

import { BookingWizard } from '@/components/booking/booking-wizard';
import { useRoomCategories } from '@/hooks/use-room-categories';
import { Skeleton } from '@/components/ui/skeleton';

export default function BookPage() {
  const { categories, isLoading } = useRoomCategories();

  return (
    <div className="container py-12 md:py-20">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-4">Make a Reservation</h1>
        <p className="text-lg text-muted-foreground text-center mb-12">
          We&apos;re excited to welcome you. Please fill out the details below.
        </p>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        ) : (
          <BookingWizard allRooms={categories} />
        )}
      </div>
    </div>
  );
}
