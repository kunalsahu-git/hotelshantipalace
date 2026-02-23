import { BookingWizard } from '@/components/booking/booking-wizard';
import { roomCategories } from '@/lib/mock-data';

export default function BookPage() {
  return (
    <div className="container py-12 md:py-20">
      <div className="mx-auto max-w-4xl">
        <BookingWizard allRooms={roomCategories} />
      </div>
    </div>
  );
}
