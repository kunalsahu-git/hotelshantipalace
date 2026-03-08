"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle, SheetDescription } from '../ui/sheet';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';
import { roomCategories } from '@/lib/mock-data';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function Header() {
  const pathname = usePathname();
  const [roomsOpen, setRoomsOpen] = useState(false);
  const [mobileRoomsOpen, setMobileRoomsOpen] = useState(false);

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
          <Link href="/">
            <Logo />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <NavLink href="/" label="Home" />
            <NavLink href="/about" label="About" />

            <NavLink href="/contact" label="Contact" />

            {/* Rooms dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setRoomsOpen(true)}
              onMouseLeave={() => setRoomsOpen(false)}
            >
              <Link href="/rooms">
                <span
                  className={cn(
                    "flex items-center gap-1 transition-colors hover:text-primary font-medium text-base",
                    pathname.startsWith('/rooms') ? "text-primary" : "text-foreground"
                  )}
                >
                  Rooms <ChevronDown className={cn("h-4 w-4 transition-transform", roomsOpen && "rotate-180")} />
                </span>
              </Link>

              {roomsOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50">
                  <div className="bg-background border rounded-lg shadow-lg py-1 min-w-48">
                    <Link
                      href="/rooms"
                      className="block px-4 py-2 text-sm hover:bg-muted transition-colors font-medium"
                    >
                      All Rooms
                    </Link>
                    <div className="border-t my-1" />
                    {roomCategories.filter(c => c.isActive).map(cat => (
                      <Link
                        key={cat.id}
                        href={`/rooms?category=${cat.id}`}
                        className="block px-4 py-2 text-sm hover:bg-muted transition-colors"
                      >
                        <span>{cat.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">₹{cat.basePrice.toLocaleString('en-IN')}/night</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </nav>

          <div className="flex items-center gap-2">
            <Button asChild className="hidden md:flex bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-bold">
              <Link href="/book">Book Now</Link>
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
                    <div className="flex items-center px-6 py-4 border-b">
                      <Link href="/">
                        <Logo />
                      </Link>
                    </div>
                    <nav className="flex flex-col flex-grow px-6 py-8 gap-1">
                      {navLinks.map((link) => (
                        <SheetClose asChild key={link.href}>
                          <Link
                            href={link.href}
                            className={cn(
                              "text-lg font-medium py-3 px-2 rounded-lg transition-colors hover:text-primary hover:bg-muted",
                              pathname === link.href ? "text-primary bg-muted" : "text-foreground"
                            )}
                          >
                            {link.label}
                          </Link>
                        </SheetClose>
                      ))}

                      {/* Mobile Rooms accordion */}
                      <div className="flex flex-col">
                        <button
                          onClick={() => setMobileRoomsOpen(v => !v)}
                          className={cn(
                            "flex items-center justify-between text-lg font-medium py-3 px-2 rounded-lg transition-colors hover:text-primary hover:bg-muted",
                            pathname.startsWith('/rooms') ? "text-primary bg-muted" : "text-foreground"
                          )}
                        >
                          Rooms
                          <ChevronDown className={cn("h-5 w-5 transition-transform", mobileRoomsOpen && "rotate-180")} />
                        </button>
                        {mobileRoomsOpen && (
                          <div className="flex flex-col ml-4 border-l pl-4 mt-1 gap-1">
                            <SheetClose asChild>
                              <Link href="/rooms" className="text-base py-2 text-muted-foreground hover:text-primary transition-colors font-medium">
                                All Rooms
                              </Link>
                            </SheetClose>
                            {roomCategories.filter(c => c.isActive).map(cat => (
                              <SheetClose asChild key={cat.id}>
                                <Link
                                  href={`/rooms?category=${cat.id}`}
                                  className="text-base py-2 text-muted-foreground hover:text-primary transition-colors"
                                >
                                  {cat.name}
                                </Link>
                              </SheetClose>
                            ))}
                          </div>
                        )}
                      </div>
                    </nav>
                    <div className="px-6 py-4 border-t">
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
