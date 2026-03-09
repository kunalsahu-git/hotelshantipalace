'use client';

import React from 'react';
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
  Play,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookingBar } from '@/components/booking-bar';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselDots,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RoomCategoryCard } from '@/components/room-category-card';
import { roomCategories } from '@/lib/mock-data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { LotusIcon } from '@/components/icons/lotus-icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageGallery } from '@/components/about/image-gallery';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AnimateIn } from '@/components/animate-in';
import { type CarouselApi } from '@/components/ui/carousel';

const heroImage = PlaceHolderImages.find((img) => img.id === 'hilton-hero');
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
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  const roomsPlugin = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

  const testimonialPlugin = React.useRef(
    Autoplay({ delay: 7000, stopOnInteraction: true })
  );

  const [galleryApi, setGalleryApi] = React.useState<CarouselApi>();

  const adPlugin = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: false })
  );

  const galleryImages = Array.from({ length: 18 }, (_, i) =>
    PlaceHolderImages.find(p => p.id === `gallery-${i + 1}`)
  );
  const faqImage = PlaceHolderImages.find((img) => img.id === 'faq-image');

  const faqs = [
    {
      question: "What makes your hotel unique?",
      answer: "Hotel Shanti Palace is crafted with a focus on tranquility and personalized service. Our serene design, elite craftsmanship, and location in a peaceful area ensure a luxurious and restful experience away from the city's hustle.",
    },
    {
      question: "Do you offer customization options for stays?",
      answer: "Yes, we are happy to help you customize your stay for special occasions like anniversaries or birthdays. We can arrange for decorations, cakes, or other special requests. Please contact our concierge service to learn more.",
    },
    {
      question: "What amenities are included with the rooms?",
      answer: "All our rooms include complimentary high-speed Wi-Fi, a flat-screen TV, premium toiletries, and daily housekeeping. Deluxe rooms and suites offer additional amenities such as a mini-bar, a coffee machine, and access to our exclusive lounge.",
    },
    {
      question: "How can I book a stay or schedule a visit?",
      answer: "You can book your stay directly through our website using the 'Book Your Stay' button. If you would like to visit the hotel before booking, please contact us via the form on our contact page to schedule a tour with our staff.",
    },
  ];


  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[90vh] w-full flex items-center pb-48">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt="Luxurious and peaceful hotel with a pool"
            fill
            className="object-cover"
            priority
            sizes="100vw"
            data-ai-hint={heroImage.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
        
        <div className="relative z-10 container mx-auto px-4">
            <div className="max-w-xl text-left mt-16">
                <h1 className="text-5xl md:text-7xl font-headline font-bold text-white animate-fade-up">
                    A Sanctuary Of Elegance And Comfort.
                </h1>
                <p className="mt-4 text-lg text-gray-200 animate-fade-up delay-150">
                    Nestled in the heart of the city, our hotel offers an exquisite retreat where timeless elegance meets modern sophistication.
                </p>
                <div className="flex items-center gap-6 mt-8 animate-fade-up delay-300">
                    <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg py-7 px-10 rounded-full">
                        <Link href="/book">Book Now</Link>
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="link" className="text-white text-lg font-semibold">
                            <Play className="mr-2 h-5 w-5 fill-white" />
                            Watch video
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl w-full p-0 border-0 bg-black/80 backdrop-blur-sm">
                        <DialogHeader className="sr-only">
                          <DialogTitle>Hotel Promotional Video</DialogTitle>
                          <DialogDescription>A short video showcasing the hotel&apos;s amenities and atmosphere.</DialogDescription>
                        </DialogHeader>
                        <div className="aspect-video">
                          <iframe
                            className="w-full h-full"
                            src="https://www.youtube.com/embed/uSJy222xhpw?autoplay=1&rel=0"
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          ></iframe>
                        </div>
                      </DialogContent>
                    </Dialog>
                </div>
                 <div className="flex gap-2 items-center mt-12">
                    <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-white/50"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-white/50"></span>
                    <span className="h-1.5 w-6 rounded-full bg-white"></span>
                 </div>
            </div>
        </div>

        <div className="absolute bottom-48 right-12 z-10 w-72 hidden lg:block">
          <Carousel
            opts={{
              loop: true,
            }}
            plugins={[plugin.current]}
            className="w-full"
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.reset}
          >
            <CarouselContent>
              {roomCategories.map((category) => (
                <CarouselItem key={category.id}>
                  <Link href={`/rooms/${category.id}`}>
                    <Card className="rounded-2xl overflow-hidden backdrop-blur-sm bg-black/20 border-white/20">
                      <div className="relative h-40 w-full">
                        <Image
                          src={category.photoUrl}
                          alt={category.name}
                          fill
                          className="object-cover"
                          data-ai-hint={category.imageHint}
                        />
                      </div>
                      <CardContent className="p-4 flex justify-between items-center text-white">
                        <div>
                          <p className="font-bold">{category.name}</p>
                          <p className="text-sm">View Details</p>
                        </div>
                        <div className="text-right flex-shrink-0 pl-2">
                          <p className="text-2xl font-bold">₹{category.basePrice}</p>
                          <p className="text-xs">per night</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </section>

      {/* Quick Booking Bar */}
      <div className="-mt-32 relative z-20 container px-4">
        <BookingBar />
      </div>

      {/* Ad Banner Section */}
      <div className="container mx-auto px-4 pt-8">
        <Carousel
          opts={{ loop: true, align: 'center' }}
          plugins={[adPlugin.current]}
          className="w-full"
        >
          <CarouselContent>
            {[
              {
                img: '/pehnava/traditional-dress.jpg',
                tag: 'Exclusive Fashion Partner',
                headline: 'Pehnava By Neha',
                sub: 'Traditional & Modern Women\'s Wear · Boutique Collections · Accessories',
                color: 'from-rose-950/90 via-rose-900/75 to-pink-800/50',
              },
              {
                img: '/pehnava/accessories.jpg',
                tag: 'Now Available at Hotel Shanti Palace',
                headline: 'Ethnic to Contemporary — All in One Boutique',
                sub: 'Sarees · Suits · Kurtis · Jewellery & Accessories · Pehnava By Neha',
                color: 'from-fuchsia-950/90 via-fuchsia-900/75 to-purple-800/50',
              },
              {
                img: '/pehnava/red-handbag.jpg',
                tag: 'Women\'s Fashion Boutique',
                headline: 'Dress to Impress with Pehnava By Neha',
                sub: 'Curated collections for every occasion — weddings, festivals, everyday elegance',
                color: 'from-amber-950/90 via-amber-900/75 to-orange-800/50',
              },
            ].map((ad, i) => (
              <CarouselItem key={i}>
                <div className="relative w-full overflow-hidden rounded-lg h-[72px] sm:h-[90px]">
                  <Image
                    src={ad.img}
                    alt={ad.headline}
                    fill
                    className="object-cover"
                    sizes="100vw"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-r ${ad.color} flex items-center px-3 sm:px-6 md:px-12 gap-2 sm:gap-4 md:gap-8`}>
                    <div className="shrink-0 min-w-0">
                      <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-rose-200 font-semibold">{ad.tag}</span>
                      <p className="text-white font-headline font-bold text-sm sm:text-xl md:text-3xl leading-tight truncate">{ad.headline}</p>
                    </div>
                    <div className="border-l border-white/30 pl-4 sm:pl-6 md:pl-8 hidden sm:block min-w-0">
                      <p className="text-white/90 text-xs sm:text-sm md:text-base leading-snug line-clamp-2">{ad.sub}</p>
                    </div>
                    <div className="ml-auto shrink-0">
                      <a
                        href="https://www.instagram.com/pehnavabyneha/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block border border-white/60 text-white text-[10px] sm:text-xs font-semibold px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full hover:bg-white hover:text-rose-900 transition-colors whitespace-nowrap"
                      >
                        Explore →
                      </a>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
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
              <AnimateIn key={index} delay={index * 100} className="flex flex-col items-center group">
                <div className="bg-primary/10 p-4 rounded-full transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
                  <feature.icon className="w-10 h-10 text-primary" />
                </div>
                <h3 className="mt-4 text-2xl font-semibold">{feature.title}</h3>
                <p className="mt-2 text-muted-foreground">{feature.description}</p>
              </AnimateIn>
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
              opts={{ align: 'start', loop: true }}
              plugins={[roomsPlugin.current]}
              onMouseEnter={roomsPlugin.current.stop}
              onMouseLeave={roomsPlugin.current.reset}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {roomCategories.map((category) => (
                  <CarouselItem key={category.id} className="pl-4 basis-[85%] sm:basis-1/2 lg:basis-1/3">
                    <div className="h-full">
                      <RoomCategoryCard category={category} />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="-left-5 shadow-md" />
              <CarouselNext className="-right-5 shadow-md" />
              <CarouselDots />
            </Carousel>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-foreground mb-12">
            What Our Guests Say
          </h2>
          <div className="relative">
            <Carousel
              opts={{ align: 'start', loop: true }}
              plugins={[testimonialPlugin.current]}
              onMouseEnter={testimonialPlugin.current.stop}
              onMouseLeave={testimonialPlugin.current.reset}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {testimonials.map((testimonial, index) => (
                  <CarouselItem key={index} className="pl-4 basis-[85%] md:basis-1/2 lg:basis-1/3">
                    <div className="p-2 h-full">
                      <Card className="bg-card border-border shadow-lg h-full flex flex-col">
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
                        <CardContent className="flex-grow">
                          <p className="text-muted-foreground italic">&ldquo;{testimonial.review}&rdquo;</p>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="-left-5 shadow-md" />
              <CarouselNext className="-right-5 shadow-md" />
              <CarouselDots />
            </Carousel>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              A Glimpse of Shanti
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => galleryApi?.scrollPrev()}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full"
                onClick={() => galleryApi?.scrollNext()}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <ImageGallery images={galleryImages} onApiReady={setGalleryApi} />
        </div>
      </section>

      {/* Fashion Partner Section */}
      <section className="py-20 bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left — branding */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <span className="h-px w-8 bg-rose-400" />
                <p className="text-xs uppercase tracking-widest text-rose-500 font-semibold">Exclusive Fashion Partner</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-white rounded-2xl p-3 shadow-md">
                  <Image src="/pehnava-logo.svg" alt="Pehnava By Neha" width={64} height={64} className="object-contain" />
                </div>
                <div>
                  <h2 className="text-4xl md:text-5xl font-headline font-bold text-rose-900">Pehnava</h2>
                  <p className="text-lg text-rose-600 font-medium -mt-1">By Neha</p>
                </div>
              </div>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
                Our exclusive fashion partner, offering a curated range of women&apos;s clothing — from timeless traditional wear to contemporary styles — along with accessories to complete every look.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Traditional Wear', desc: 'Sarees, Suits & Lehengas' },
                  { label: 'Modern Wear', desc: 'Kurtis, Co-ords & Dresses' },
                  { label: 'Accessories', desc: 'Jewellery & Fashion Extras' },
                  { label: 'Occasion Wear', desc: 'Weddings, Festivals & More' },
                ].map((item) => (
                  <div key={item.label} className="bg-white/70 rounded-xl p-4 border border-rose-100">
                    <p className="font-semibold text-rose-800 text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <a
                  href="https://www.instagram.com/pehnavabyneha/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-6 py-3 rounded-full transition-colors"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                  Follow on Instagram
                </a>
                <a
                  href="https://www.instagram.com/pehnavabyneha/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-rose-300 text-rose-700 hover:bg-rose-100 font-semibold px-6 py-3 rounded-full transition-colors"
                >
                  View Collection →
                </a>
              </div>
            </div>

            {/* Right — visual */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    src: '/pehnava/traditional-dress.jpg',
                    alt: 'Traditional Ethnic Wear',
                    tall: true,
                  },
                  {
                    src: '/pehnava/accessories.jpg',
                    alt: 'Women Fashion Accessories',
                    tall: false,
                  },
                  {
                    src: '/pehnava/red-handbag.jpg',
                    alt: 'Designer Handbag',
                    tall: false,
                  },
                  {
                    src: '/pehnava/scarf-blazer.jpg',
                    alt: 'Modern Fashion Collection',
                    tall: false,
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`relative overflow-hidden rounded-2xl shadow-lg ${i === 0 ? 'row-span-2' : ''}`}
                    style={{ aspectRatio: i === 0 ? '3/4' : '1/1' }}
                  >
                    <Image
                      src={item.src}
                      alt={item.alt}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-rose-900/30 to-transparent" />
                  </div>
                ))}
              </div>
              {/* Floating tag */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl px-5 py-3 border border-rose-100">
                <p className="text-xs text-rose-400 font-semibold uppercase tracking-wider">Fashion Partner</p>
                <p className="font-headline font-bold text-rose-800 text-lg leading-tight">Pehnava By Neha</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-6 lg:sticky lg:top-28">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Everything you need to know right now
              </h2>
              {faqImage && (
                <div className="relative rounded-2xl overflow-hidden shadow-lg aspect-[4/3] mt-8">
                  <Image
                    src={faqImage.imageUrl}
                    alt={faqImage.description}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    data-ai-hint={faqImage.imageHint}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              )}
            </div>

            <div>
              <Accordion type="single" collapsible defaultValue="item-0" className="w-full space-y-4">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="bg-card rounded-lg px-6 border-b-0 shadow-sm">
                    <AccordionTrigger className="text-lg font-semibold text-left hover:no-underline py-6">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground text-base pt-0 pb-6">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
