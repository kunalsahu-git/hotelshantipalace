import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Wifi, Tv, Wind, Users, ArrowLeft } from 'lucide-react';
import { roomCategories } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RoomBookingWidget } from './_components/room-booking-widget';
import Link from 'next/link';
import type { RoomCategory } from '@/lib/types';
import { RoomGallery } from './_components/room-gallery';

const amenityIcons: { [key: string]: React.ElementType } = {
  'Free WiFi': Wifi,
  'Flat-screen TV': Tv,
  'Air Conditioning': Wind,
};

export async function generateStaticParams() {
  return roomCategories.map((room) => ({
    id: room.id,
  }));
}

export default function RoomDetailPage({ params }: { params: { id: string } }) {
  const room = roomCategories.find((r) => r.id === params.id) as RoomCategory;

  if (!room) {
    notFound();
  }

  return (
    <div className="container py-12 md:py-20">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/rooms">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Rooms
          </Link>
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
        <div className="lg:col-span-2">
            <div className="mb-6">
                 <h1 className="text-4xl md:text-5xl font-bold ">{room.name}</h1>
            </div>
            
            <RoomGallery room={room} />
            
            <div className="max-w-none text-lg text-muted-foreground mb-8">
                <p>{room.description}</p>
            </div>
            
            <div className="space-y-8">
                <div>
                    <h3 className="text-2xl font-semibold mb-4">Key Features</h3>
                     <div className="flex items-center gap-3 text-lg text-muted-foreground">
                        <Users className="w-5 h-5 text-primary" />
                        <span>Sleeps up to {room.maxOccupancy} guests</span>
                    </div>
                </div>
                <div>
                    <h3 className="text-2xl font-semibold mb-4">Amenities</h3>
                    <div className="flex flex-wrap gap-2">
                        {room.amenities.map((amenity, index) => {
                             const Icon = amenityIcons[amenity];
                             return (
                                <Badge key={index} variant="secondary" className="flex items-center gap-2 py-1.5 px-3 text-sm">
                                     {Icon && <Icon className="w-4 h-4" />}
                                     <span>{amenity}</span>
                                </Badge>
                             )
                        })}
                    </div>
                </div>
            </div>
        </div>

        <div className="lg:col-span-1">
            <div className="sticky top-28">
                 <RoomBookingWidget room={room} />
            </div>
        </div>
      </div>
    </div>
  );
}
