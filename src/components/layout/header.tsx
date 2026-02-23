"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Home, BedDouble, Info, Mail, Menu, X } from 'lucide-react';
import { Logo } from '../logo';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '../ui/sheet';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/rooms', label: 'Rooms', icon: BedDouble },
  { href: '/about', label: 'About', icon: Info },
  { href: '/contact', label: 'Contact', icon: Mail },
];

export function Header() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const NavLink = ({ href, label, icon: Icon, isMobile = false }: { href: string; label: string; icon: React.ElementType; isMobile?: boolean }) => (
    <Link href={href}>
      <span
        className={cn(
          "flex items-center gap-2 transition-colors hover:text-primary",
          pathname === href ? "text-primary font-semibold" : "text-foreground/80",
          isMobile ? "text-2xl p-4" : "text-base"
        )}
      >
        <Icon className="w-5 h-5" />
        {label}
      </span>
    </Link>
  );

  return (
    <header className={cn("sticky top-0 z-50 w-full transition-all duration-300", isScrolled ? 'bg-background/80 backdrop-blur-sm shadow-md' : 'bg-transparent')}>
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink key={link.href} {...link} />
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild className="hidden md:flex bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
              <Link href="/book">Book Now</Link>
            </Button>
            
            {/* Mobile Navigation */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full bg-background p-0">
                  <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center p-4 border-b">
                       <Logo />
                      <SheetClose asChild>
                         <Button variant="ghost" size="icon">
                           <X className="h-6 w-6" />
                         </Button>
                      </SheetClose>
                    </div>
                    <nav className="flex flex-col items-center justify-center flex-grow gap-6">
                      {navLinks.map((link) => (
                         <SheetClose asChild key={link.href}>
                           <NavLink {...link} isMobile />
                         </SheetClose>
                      ))}
                    </nav>
                    <div className="p-4 border-t">
                      <SheetClose asChild>
                        <Button asChild size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                          <Link href="/book">Book Now</Link>
                        </Button>
                      </SheetClose>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
