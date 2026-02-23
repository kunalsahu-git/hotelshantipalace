'use client';

import React from 'react';
import Image from 'next/image';
import Autoplay from 'embla-carousel-autoplay';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import type { RoomCategory } from '@/lib/types';

interface RoomGalleryProps {
  room: RoomCategory;
}

export function RoomGallery({ room }: RoomGalleryProps) {
  const plugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true })
  );

  return (
    <Carousel
      opts={{ loop: true }}
      plugins={[plugin.current]}
      className="w-full mb-8 rounded-lg overflow-hidden shadow-lg relative"
    >
      <CarouselContent>
        {room.gallery.map((photo, index) => (
          <CarouselItem key={index}>
            <div className="relative aspect-[16/10] w-full">
              <Image
                src={photo.url}
                alt={`Photo of ${room.name} ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 66vw"
                priority={index === 0}
                data-ai-hint={photo.hint}
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10" />
      <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10" />
    </Carousel>
  );
}
