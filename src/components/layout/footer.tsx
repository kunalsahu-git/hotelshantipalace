import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Instagram, Twitter, Facebook, MessageSquare, Music, Phone, Mail } from 'lucide-react';
import { LotusIcon } from '@/components/icons/lotus-icon';

function FooterLogo() {
  return (
    <Link href="/" className="flex items-center gap-3 group">
      <div className="bg-white/10 group-hover:bg-white/20 transition-colors rounded-full p-2">
        <LotusIcon className="h-8 w-8 text-white" />
      </div>
      <div>
        <p className="font-headline text-2xl font-bold tracking-tight text-white">
          Hotel Shanti Palace
        </p>
      </div>
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Column 1: Logo & Mission */}
          <div className="lg:col-span-2">
             <FooterLogo/>
             <p className="mt-6 text-base max-w-sm">
                Our mission is to provide a sanctuary of peace, comfort, and heartfelt hospitality for every guest.
             </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/rooms" className="hover:text-white transition-colors">Rooms & Suites</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/book" className="hover:text-white transition-colors">Book Now</Link></li>
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-500" />
                <a href="tel:+911234567890" className="hover:text-white transition-colors">
                  +91 123 456 7890
                </a>
              </li>
              <li className="flex items-center gap-3">
                 <Mail className="w-5 h-5 text-gray-500" />
                <a href="mailto:reservations@shantipalace.com" className="hover:text-white transition-colors">
                  reservations@shantipalace.com
                </a>
              </li>
              <li className="text-gray-400 pt-2">
                123 Peace Avenue, Serenity City, India
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center text-sm">
          <p className="mb-4 sm:mb-0 order-2 sm:order-1">&copy; {new Date().getFullYear()} Hotel Shanti Palace. All rights reserved.</p>
          <div className="flex gap-6 order-1 sm:order-2 mb-4 sm:mb-0">
             <Link href="#" className="hover:text-white">Privacy Policy</Link>
             <Link href="#" className="hover:text-white">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
