import { BookingWizard } from '@/components/booking/booking-wizard';
import { roomCategories } from '@/lib/mock-data';

export default function BookPage() {
  return (
    <div className="container py-12 md:py-20">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-4">Make a Reservation</h1>
        <p className="text-lg text-muted-foreground text-center mb-12">
          We're excited to welcome you. Please fill out the details below.
        </p>
        <BookingWizard allRooms={roomCategories} />
      </div>
    </div>
  );
}
