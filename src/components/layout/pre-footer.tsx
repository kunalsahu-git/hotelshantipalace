import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ArrowRight, Globe2 } from 'lucide-react';

export function PreFooter() {
  const mainImage = PlaceHolderImages.find((p) => p.id === 'pre-footer-main');
  const subImage = PlaceHolderImages.find((p) => p.id === 'pre-footer-sub');
  
  return (
    <section className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="flex flex-col gap-8">
            <Card className="bg-foreground text-background p-10 flex flex-col justify-between overflow-hidden relative rounded-2xl">
              <div className="absolute inset-0 bg-black/30 z-10"></div>
              <div className="relative z-20">
                <div className="bg-white/10 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                  <Globe2 className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-4xl font-bold text-white">
                  Explore more to get your comfort zone
                </h2>
                <p className="mt-2 text-white/80">
                  Book your perfect stay with us.
                </p>
              </div>
              <div className="relative z-20 mt-auto pt-6">
                <Button variant="secondary" asChild className="bg-white text-foreground hover:bg-gray-200">
                  <Link href="/book">
                    Booking Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </Card>
            <Card className="relative text-white overflow-hidden flex items-end p-8 min-h-[300px] rounded-2xl">
              {subImage && (
                 <Image
                    src={subImage.imageUrl}
                    alt={subImage.description}
                    fill
                    className="object-cover"
                    data-ai-hint={subImage.imageHint}
                 />
              )}
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
               <div className="relative z-10">
                 <p className="text-lg">Hotel Available</p>
                 <p className="text-5xl font-bold tracking-tight">1,764,980</p>
               </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="relative text-white rounded-2xl overflow-hidden flex items-end p-10 min-h-[500px] lg:min-h-full">
             {mainImage && (
                 <Image
                    src={mainImage.imageUrl}
                    alt={mainImage.description}
                    fill
                    className="object-cover"
                    data-ai-hint={mainImage.imageHint}
                 />
              )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="relative z-10">
              <h2 className="text-5xl font-bold leading-tight">
                Beyond accommodation, creating memories of a lifetime
              </h2>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

    