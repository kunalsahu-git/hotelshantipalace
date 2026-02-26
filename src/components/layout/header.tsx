"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle, SheetDescription } from '../ui/sheet';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/about', label: 'Hotel insights' },
  { href: '/rooms', label: 'Services' },
  { href: '#wellness', label: 'Wellness & spa' },
  { href: '#reviews', label: 'Reviews' },
  { href: '#offers', label: 'Summer offers' },
];

export function Header() {
  const pathname = usePathname();

  const headerClasses = "sticky top-0 z-50 w-full transition-all duration-300 bg-background shadow-md";
  
  const NavLink = ({ href, label, isMobile = false }: { href: string; label: string; isMobile?: boolean }) => (
    <Link href={href}>
      <span
        className={cn(
          "transition-colors hover:text-primary font-medium",
          pathname === href ? "text-primary" : "text-foreground",
          isMobile ? "text-2xl p-4" : "text-base"
        )}
      >
        {label}
      </span>
    </Link>
  );

  return (
    <header className={headerClasses}>
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          <Link href="/" className={cn("font-bold text-2xl tracking-wider uppercase text-foreground")}>
            HILTON
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink key={link.href} {...link} />
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild className="hidden md:flex bg-white text-black hover:bg-gray-200 rounded-full font-bold">
              <Link href="/contact">Contact Hilton</Link>
            </Button>
            
            {/* Mobile Navigation */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className={cn("hover:bg-accent/10 text-foreground")}>
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full bg-background p-0">
                  <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
                  <SheetDescription className="sr-only">
                    Main navigation links for the Hotel.
                  </SheetDescription>
                  <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center p-4 border-b">
                       <Link href="/" className="font-bold text-2xl tracking-wider uppercase text-foreground">
                         HILTON
                       </Link>
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
                          <Link href="/contact">Contact Hilton</Link>
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
