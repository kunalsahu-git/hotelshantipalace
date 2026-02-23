import Link from 'next/link';
import { Logo } from '../logo';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/rooms', label: 'Rooms' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center md:items-start">
            <Logo />
          </div>
          <div className="text-center">
            <h3 className="font-headline text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="text-center md:text-right">
             <h3 className="font-headline text-lg font-semibold mb-4">Contact Us</h3>
             <address className="not-italic text-muted-foreground space-y-2">
                <p>123 Peace Avenue, Serenity City, India</p>
                <p>Phone: <a href="tel:+911234567890" className="hover:text-primary">+91 123 456 7890</a></p>
                <p>Email: <a href="mailto:reservations@shantipalace.com" className="hover:text-primary">reservations@shantipalace.com</a></p>
             </address>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Hotel Shanti Palace. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
