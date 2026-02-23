import Image from 'next/image';
import Link from 'next/link';
import {
  Bed,
  MapPin,
  UtensilsCrossed,
  Wind,
  Wifi,
  Tv,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookingBar } from '@/components/booking-bar';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RoomCategoryCard } from '@/components/room-category-card';
import { roomCategories } from '@/lib/mock-data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { LotusIcon } from '@/components/icons/lotus-icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const heroImage = PlaceHolderImages.find((img) => img.id === 'hero');
const testimonialImages = {
  t1: PlaceHolderImages.find((img) => img.id === 'testimonial-1'),
  t2: PlaceHolderImages.find((img) => img.id === 'testimonial-2'),
  t3: PlaceHolderImages.find((img) => img.id === 'testimonial-3'),
};

const features = [
  {
    icon: LotusIcon,
    title: 'Peaceful Atmosphere',
    description: 'Escape the city bustle in our serene and tranquil environment.',
  },
  {
    icon: Bed,
    title: 'Comfortable Rooms',
    description: 'Rest and recharge in our well-appointed, cozy rooms.',
  },
  {
    icon: UtensilsCrossed,
    title: 'Quality Service',
    description: 'Our dedicated staff is here to cater to your every need.',
  },
  {
    icon: MapPin,
    title: 'Prime Location',
    description: 'Conveniently located to explore the best attractions of the city.',
  },
];

const testimonials = [
  {
    name: 'Anjali P.',
    rating: 5,
    review: 'An absolutely wonderful experience. The atmosphere is so peaceful, it feels like a true retreat. The staff were incredibly attentive and made our stay special.',
    avatar: testimonialImages.t1?.imageUrl,
    avatarHint: testimonialImages.t1?.imageHint,
  },
  {
    name: 'Rohan & Priya S.',
    rating: 5,
    review: '"Shanti Palace" is the perfect name. We felt so relaxed from the moment we arrived. The deluxe room was spacious and immaculate. Highly recommended for couples!',
    avatar: testimonialImages.t2?.imageUrl,
    avatarHint: testimonialImages.t2?.imageHint,
  },
  {
    name: 'The Sharma Family',
    rating: 4,
    review: 'A great place for a family stay. The location is excellent, and the rooms are very comfortable. The restaurant served delicious food. We will be back!',
    avatar: testimonialImages.t3?.imageUrl,
    avatarHint: testimonialImages.t3?.imageHint,
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[60vh] md:h-[80vh] w-full flex items-center justify-center text-white">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt="Luxurious and peaceful hotel lobby"
            fill
            className="object-cover"
            priority
            data-ai-hint={heroImage.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center p-4 flex flex-col items-center">
          <LotusIcon className="w-20 h-20 text-white mb-4" />
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white">
            Hotel Shanti Palace
          </h1>
          <p className="mt-4 text-xl md:text-2xl font-body text-gray-200">
            Discover The Peace
          </p>
          <Button asChild size="lg" className="mt-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg py-7 px-10">
            <Link href="/book">Book Your Stay</Link>
          </Button>
        </div>
      </section>

      {/* Quick Booking Bar */}
      <div className="-mt-16 relative z-20 container px-4">
        <BookingBar />
      </div>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground">
            Why Choose Shanti Palace?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            We are committed to providing an unparalleled experience of peace, comfort, and hospitality.
          </p>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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

      {/* Room Highlights Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-foreground">
            Our Rooms & Suites
          </h2>
          <p className="mt-4 text-lg text-center text-muted-foreground max-w-3xl mx-auto">
            Each room is designed to be a sanctuary of comfort, offering a perfect blend of modern amenities and elegant decor.
          </p>
          <div className="mt-12 relative">
            <Carousel
              opts={{
                align: 'start',
                loop: roomCategories.length > 4, // Only loop if there are more items than fit
              }}
              className="w-full"
            >
              <CarouselContent>
                {roomCategories.map((category) => (
                  <CarouselItem key={category.id} className="md:basis-1/2 lg:basis-1/4">
                    <div className="p-1 h-full">
                      <RoomCategoryCard category={category} />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute left-[-20px] top-1/2 -translate-y-1/2 hidden md:flex" />
              <CarouselNext className="absolute right-[-20px] top-1/2 -translate-y-1/2 hidden md:flex" />
            </Carousel>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-foreground">
            What Our Guests Say
          </h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-card border-border shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    {testimonial.avatar && (
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={testimonial.avatar} alt={testimonial.name} data-ai-hint={testimonial.avatarHint} />
                        <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                      <CardTitle className="text-xl">{testimonial.name}</CardTitle>
                      <div className="flex text-primary mt-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground italic">"{testimonial.review}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Strip */}
      <section className="bg-mid-brown text-off-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-primary">Get In Touch</h2>
          <p className="mt-4 text-lg text-gray-300">
            Have questions or need assistance? Our team is here to help.
          </p>
          <div className="mt-6 flex flex-col md:flex-row justify-center items-center gap-8 text-lg">
            <a href="tel:+911234567890" className="hover:text-primary transition-colors">
              +91 123 456 7890
            </a>
            <span className="hidden md:block">|</span>
            <a href="mailto:reservations@shantipalace.com" className="hover:text-primary transition-colors">
              reservations@shantipalace.com
            </a>
          </div>
          <p className="mt-4 text-gray-400">
            123 Peace Avenue, Serenity City, India
          </p>
        </div>
      </section>
    </div>
  );
}
