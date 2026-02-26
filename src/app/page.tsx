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
import { ImageGallery } from '@/components/about/image-gallery';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

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
      <section className="relative h-[60vh] md:h-[80vh] w-full flex items-center justify-center text-white">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt="Luxurious and peaceful hotel lobby"
            fill
            className="object-cover"
            priority
            sizes="100vw"
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
              }}
              className="w-full"
            >
              <CarouselContent>
                {roomCategories.map((category) => (
                  <CarouselItem key={category.id} className="md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                    <div className="p-1 h-full">
                      <RoomCategoryCard category={category} />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute left-[-20px] top-1/2 -translate-y-1/2 hidden lg:flex" />
              <CarouselNext className="absolute right-[-20px] top-1/2 -translate-y-1/2 hidden lg:flex" />
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

      {/* Gallery Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-foreground mb-12">
            A Glimpse of Shanti
          </h2>
          <ImageGallery images={galleryImages} />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-6 lg:sticky lg:top-28">
              <p className="font-bold text-primary text-sm uppercase tracking-wider">FAQ</p>
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
                  <h3 className="absolute bottom-8 left-8 text-5xl font-bold text-white font-headline">FAQ</h3>
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

      {/* Contact Strip */}
      <section className="bg-muted-foreground text-background/90 py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-primary">Get In Touch</h2>
          <p className="mt-4 text-lg">
            Have questions or need assistance? Our team is here to help.
          </p>
          <div className="mt-6 flex flex-col md:flex-row justify-center items-center gap-8 text-lg">
            <a href="tel:+911234567890" className="hover:text-primary transition-colors">
              +91 123 456 7890
            </a>
            <span className="hidden md:block text-background/50">|</span>
            <a href="mailto:reservations@shantipalace.com" className="hover:text-primary transition-colors">
              reservations@shantipalace.com
            </a>
          </div>
          <p className="mt-4 text-background/70">
            123 Peace Avenue, Serenity City, India
          </p>
        </div>
      </section>
    </div>
  );
}

    