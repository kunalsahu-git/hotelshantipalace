"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle, SheetDescription } from '../ui/sheet';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';
import { roomCategories } from '@/lib/mock-data';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
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
            <Button asChild className="hidden md:flex bg-white text-black hover:bg-gray-200 rounded-full font-bold">
              <Link href="/contact">Contact Us</Link>
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
                      <Link href="/">
                        <Logo />
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

                      {/* Mobile Rooms accordion */}
                      <div className="flex flex-col items-center gap-2">
                        <button
                          onClick={() => setMobileRoomsOpen(v => !v)}
                          className={cn(
                            "flex items-center gap-1 text-2xl p-4 font-medium transition-colors hover:text-primary",
                            pathname.startsWith('/rooms') ? "text-primary" : "text-foreground"
                          )}
                        >
                          Rooms <ChevronDown className={cn("h-5 w-5 transition-transform", mobileRoomsOpen && "rotate-180")} />
                        </button>
                        {mobileRoomsOpen && (
                          <div className="flex flex-col items-center gap-2">
                            <SheetClose asChild>
                              <Link href="/rooms" className="text-base text-muted-foreground hover:text-primary transition-colors">
                                All Rooms
                              </Link>
                            </SheetClose>
                            {roomCategories.filter(c => c.isActive).map(cat => (
                              <SheetClose asChild key={cat.id}>
                                <Link
                                  href={`/rooms?category=${cat.id}`}
                                  className="text-base text-muted-foreground hover:text-primary transition-colors"
                                >
                                  {cat.name}
                                </Link>
                              </SheetClose>
                            ))}
                          </div>
                        )}
                      </div>
                    </nav>
                    <div className="p-4 border-t">
                      <SheetClose asChild>
                        <Button asChild size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                          <Link href="/contact">Contact Us</Link>
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
