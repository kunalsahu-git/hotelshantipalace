'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import type { ImagePlaceholder } from '@/lib/placeholder-images';

interface ImageGalleryProps {
  images: (ImagePlaceholder | undefined)[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [api, setApi] = useState<CarouselApi>();
  
  const validImages = images.filter((img): img is ImagePlaceholder => !!img);

  const openGallery = (index: number) => {
    setIsOpen(true);
    // Embla carousel API might not be ready instantly.
    // We use a timeout to ensure it is, then scroll to the selected image.
    setTimeout(() => {
      api?.scrollTo(index, true);
    }, 0);
  };

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {validImages.map((image, index) => (
          <div
            key={image.id}
            className="relative aspect-square rounded-lg overflow-hidden shadow-lg cursor-pointer group"
            onClick={() => openGallery(index)}
          >
            <Image
              src={image.imageUrl}
              alt={image.description}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 33vw"
              data-ai-hint={image.imageHint}
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
          </div>
        ))}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl w-full p-0 border-0 bg-transparent">
          <Carousel setApi={setApi} className="w-full">
            <CarouselContent>
              {validImages.map((image) => (
                <CarouselItem key={image.id}>
                  <div className="relative aspect-video">
                    <Image
                      src={image.imageUrl}
                      alt={image.description}
                      fill
                      className="object-contain"
                      sizes="100vw"
                      data-ai-hint={image.imageHint}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10" />
            <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10" />
          </Carousel>
        </DialogContent>
      </Dialog>
    </div>
  );
}
