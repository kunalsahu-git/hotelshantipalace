import { RoomsPageClient } from './rooms-page-client';
import { roomCategories } from '@/lib/mock-data';

export default function RoomsPage() {
  return (
    <div className="container py-12 md:py-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold">Our Rooms & Suites</h1>
        <p className="mt-4 text-lg text-muted-foreground">Choose the perfect room for a peaceful stay</p>
      </div>
      <RoomsPageClient allRooms={roomCategories} />
    </div>
  );
}
