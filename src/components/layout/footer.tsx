import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Instagram, Twitter, Facebook, MessageSquare, Music } from 'lucide-react';
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

const socialLinks = [
  { icon: Instagram, href: '#', name: 'Instagram' },
  { icon: Twitter, href: '#', name: 'X' },
  { icon: Facebook, href: '#', name: 'Facebook' },
  { icon: MessageSquare, href: '#', name: 'Discord' },
  { icon: Music, href: '#', name: 'TikTok' },
];

export function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Column 1: Logo & Mission */}
          <div className="md:col-span-2 lg:col-span-1">
             <FooterLogo/>
             <p className="mt-6 text-base">
                Our mission is to provide a sanctuary of peace, comfort, and heartfelt hospitality for every guest.
             </p>
          </div>

          {/* Column 2: About */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">About</h3>
            <ul className="space-y-3">
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
            </ul>
          </div>

          {/* Column 3: Support */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Support</h3>
            <ul className="space-y-3">
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Returns</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Column 4: Get Updates */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Get Updates</h3>
            <form className="flex gap-2">
              <Input 
                type="email" 
                placeholder="Enter your email" 
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:ring-primary"
                aria-label="Email for newsletter"
              />
              <Button type="submit" variant="secondary" className="bg-white text-black hover:bg-gray-200">
                Subscribe
              </Button>
            </form>
            <div className="flex gap-3 mt-6">
              {socialLinks.map((social, index) => (
                <Link key={index} href={social.href} aria-label={social.name} target="_blank" rel="noopener noreferrer">
                  <span className="bg-gray-800 hover:bg-gray-700 p-3 rounded-full inline-block transition-colors">
                    <social.icon className="w-5 h-5" />
                  </span>
                </Link>
              ))}
            </div>
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

    