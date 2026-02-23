import Image from 'next/image';
import Link from 'next/link';
import { Wifi, Tv, Wind, Users, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RoomCategory } from '@/lib/types';
import { Badge } from './ui/badge';
import { format } from 'date-fns';

const amenityIcons: { [key: string]: React.ElementType } = {
  'Free WiFi': Wifi,
  'Flat-screen TV': Tv,
  'Air Conditioning': Wind,
};

interface RoomResultCardProps {
    category: RoomCategory;
    checkInDate?: Date;
    checkOutDate?: Date;
}

// Dummy availability check for demonstration
function checkAvailability(roomId: string, checkIn?: Date, checkOut?: Date): boolean {
    if (!checkIn || !checkOut) return true;
    // In a real app, this would check a database.
    // For now, let's make some rooms unavailable for certain dates.
    if (roomId === 'suite' && checkIn.getDate() === 15) {
        return false;
    }
    return true;
}


export function RoomResultCard({ category, checkInDate, checkOutDate }: RoomResultCardProps) {
  const isAvailable = checkAvailability(category.id, checkInDate, checkOutDate);
  const datesSelected = !!(checkInDate && checkOutDate);

  const params = new URLSearchParams();
  if (checkInDate) {
    params.set('checkin', format(checkInDate, 'yyyy-MM-dd'));
  }
  if (checkOutDate) {
    params.set('checkout', format(checkOutDate, 'yyyy-MM-dd'));
  }


  return (
    <div className="bg-card text-card-foreground rounded-lg border shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-3 gap-0">
      <div className="relative md:col-span-1 min-h-[250px] md:min-h-full">
        <Image
          src={category.photoUrl}
          alt={`Photo of ${category.name}`}
          fill
          className="object-cover"
          data-ai-hint={category.imageHint}
        />
      </div>

      <div className="md:col-span-2 flex flex-col">
        <div className="p-6 pb-2 flex-grow">
            <h3 className="text-3xl font-headline font-bold mb-2">{category.name}</h3>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Up to {category.maxOccupancy} guests</span>
            </div>
            <p className="text-muted-foreground mb-4">{category.description}</p>
            <div className="flex flex-wrap gap-2">
                {category.amenities.map((amenity, index) => {
                     const Icon = amenityIcons[amenity];
                     return (
                        <Badge key={index} variant="secondary" className="flex items-center gap-2 py-1 px-2">
                             {Icon && <Icon className="w-4 h-4" />}
                             <span>{amenity}</span>
                        </Badge>
                     )
                })}
            </div>
        </div>
        
        <div className="p-6 pt-2 bg-background/50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground">From</p>
              <p className="text-3xl font-bold text-primary">₹{category.basePrice.toLocaleString()}<span className="text-base font-normal text-muted-foreground">/night</span></p>
            </div>
            <div className="flex flex-col items-center gap-2 w-full sm:w-auto">
                 {datesSelected ? (
                    isAvailable ? (
                        <div className="flex items-center gap-2 text-green-600 font-semibold">
                            <CheckCircle className="w-5 h-5" />
                            <span>Available</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-muted-foreground font-semibold">
                            <XCircle className="w-5 h-5" />
                            <span>Not available for these dates</span>
                        </div>
                    )
                 ) : (
                    <p className="text-sm text-muted-foreground">Select dates for availability</p>
                 )}
                 <Button asChild size="lg" className="w-full font-bold">
                   <Link href={`/rooms/${category.id}?${params.toString()}`}>
                    View Details
                   </Link>
                 </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
