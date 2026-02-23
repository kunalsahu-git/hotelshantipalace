import Image from 'next/image';
import Link from 'next/link';
import { Wifi, Tv, Wind, Users } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { RoomCategory } from '@/lib/types';
import { Badge } from './ui/badge';

const amenityIcons: { [key: string]: React.ElementType } = {
  'Free WiFi': Wifi,
  'Flat-screen TV': Tv,
  'Air Conditioning': Wind,
};

export function RoomCategoryCard({ category }: { category: RoomCategory }) {
  return (
    <Card className="overflow-hidden h-full flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="p-0">
        <div className="relative aspect-video">
          <Image
            src={category.photoUrl}
            alt={`Photo of ${category.name}`}
            fill
            className="object-cover"
            data-ai-hint={category.imageHint}
          />
        </div>
      </CardHeader>
      <CardContent className="p-6 flex-grow">
        <CardTitle className="text-2xl mb-2">{category.name}</CardTitle>
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
      </CardContent>
      <CardFooter className="p-6 bg-background/50 flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">From</p>
          <p className="text-2xl font-bold text-primary">₹{category.basePrice.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/night</span></p>
        </div>
        <Button asChild size="lg">
          <Link href={`/book?roomType=${category.id}`}>View & Book</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
