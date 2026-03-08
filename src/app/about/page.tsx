import Image from 'next/image';
import { Bed, Users, ShieldCheck } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { LotusIcon } from '@/components/icons/lotus-icon';
import { ImageGallery } from '@/components/about/image-gallery';

const heroImage = PlaceHolderImages.find(p => p.id === 'about-hero');

const galleryImages = Array.from({ length: 18 }, (_, i) =>
  PlaceHolderImages.find(p => p.id === `gallery-${i + 1}`)
);

const features = [
  {
    icon: Bed,
    title: 'Comfortable Rooms',
    description: 'Each room is a sanctuary designed for ultimate relaxation and tranquility.',
  },
  {
    icon: Users,
    title: 'Attentive Service',
    description: 'Our staff is dedicated to providing personalized service with genuine warmth.',
  },
  {
    icon: ShieldCheck,
    title: 'Clean & Safe',
    description: 'We adhere to the highest standards of cleanliness for your peace of mind.',
  },
  {
    icon: LotusIcon,
    title: 'Peaceful Environment',
    description: 'Find your calm in our serene spaces, away from the hustle and bustle.',
  },
];

export default function AboutPage() {
  return (
    <div className="bg-background">
      {/* Hero Section */}
      <section className="relative h-[50vh] w-full flex items-center justify-center text-white">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt="The serene exterior of Hotel Shanti Palace"
            fill
            className="object-cover"
            priority
            sizes="100vw"
            data-ai-hint={heroImage.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center p-4">
          <h1 className="text-5xl md:text-7xl font-bold">About Shanti Palace</h1>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Our Story
          </h2>
          <div className="text-lg text-muted-foreground space-y-6 text-left md:text-center">
            <p>
              Hotel Shanti Palace was born from a simple vision: to create a sanctuary of peace in the heart of the city. We believe that true luxury lies not in opulence, but in tranquility and heartfelt hospitality. Our journey began with the desire to offer a space where weary travelers could find rest, and curious explorers could find a welcoming base.
            </p>
            <p>
              Our name, &ldquo;Shanti,&rdquo; means peace in Sanskrit, and it is the guiding principle behind everything we do. From the carefully curated design of our rooms to the quiet corners of our garden, every detail is intended to soothe the mind and soul. We are more than just a hotel; we are a family dedicated to making your stay a memorable experience of comfort and calm.
            </p>
          </div>
        </div>
      </section>
      
      {/* Quote Section */}
      <section className="bg-card py-20">
        <div className="container mx-auto px-4 text-center">
          <p className="font-headline text-4xl md:text-5xl italic text-primary">
            &ldquo;Every guest is family. Every stay is a memory.&rdquo;
          </p>
        </div>
      </section>

      {/* What We Offer Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            What We Offer
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            Experience comfort and hospitality that feels like home.
          </p>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {features.map((feature, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="bg-primary/10 p-4 rounded-full">
                  <feature.icon className="w-10 h-10 text-primary" />
                </div>
                <h3 className="mt-4 text-2xl font-semibold">{feature.title}</h3>
                <p className="mt-2 text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-20 bg-card">
         <div className="container mx-auto px-4">
           <h2 className="text-4xl md:text-5xl font-bold text-center text-foreground mb-12">
             A Glimpse of Shanti
           </h2>
            <ImageGallery images={galleryImages} />
         </div>
      </section>

    </div>
  );
}
