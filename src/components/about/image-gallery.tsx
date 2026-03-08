'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselApi,
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import type { ImagePlaceholder } from '@/lib/placeholder-images';

interface ImageGalleryProps {
  images: (ImagePlaceholder | undefined)[];
  onApiReady?: (api: CarouselApi) => void;
}

export function ImageGallery({ images, onApiReady }: ImageGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [api, setApi] = useState<CarouselApi>();

  const validImages = images.filter((img): img is ImagePlaceholder => !!img);

  const openGallery = (index: number) => {
    setStartIndex(index);
    setIsOpen(true);
  };

  const chunk = <T,>(arr: T[], size: number): T[][] =>
    Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
      arr.slice(i * size, i * size + size)
    );

  const chunkedImages = chunk(validImages, 6);

  return (
    <div>
      <Carousel
        opts={{ align: 'start', loop: true }}
        setApi={(a) => { setApi(a); onApiReady?.(a); }}
        className="w-full"
      >
        <CarouselContent>
          {chunkedImages.map((chunk, chunkIndex) => (
            <CarouselItem key={chunkIndex}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {chunk.map((image, imageIndex) => {
                  const overallIndex = chunkIndex * 6 + imageIndex;
                  return (
                    <div
                      key={image.id}
                      className="relative aspect-square rounded-lg overflow-hidden shadow-lg cursor-pointer group"
                      onClick={() => openGallery(overallIndex)}
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
                  );
                })}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl w-full p-0 border-0 bg-transparent">
          <Carousel 
            opts={{ startIndex, loop: true }} 
            className="w-full"
          >
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
