'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Phone, Mail } from 'lucide-react';
import { Logo } from '@/components/logo';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

function PrivacyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Privacy Policy</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground space-y-4">
          <p>Last updated: January 2025</p>

          <div>
            <h3 className="font-semibold text-foreground mb-1">1. Information We Collect</h3>
            <p>We collect information you provide when making a booking, including your name, phone number, email address, and government-issued ID as required by law for hotel check-in.</p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-1">2. How We Use Your Information</h3>
            <p>Your information is used solely to process reservations, communicate booking confirmations, and comply with legal requirements. We do not sell or share your data with third parties for marketing purposes.</p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-1">3. Data Storage</h3>
            <p>Your personal data is stored securely on our systems. ID proof documents are retained only for the legally required period and then deleted. All data is stored within India in compliance with applicable data protection laws.</p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-1">4. Cookies</h3>
            <p>Our website uses essential cookies only to ensure the booking process functions correctly. We do not use tracking or advertising cookies.</p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-1">5. Your Rights</h3>
            <p>You have the right to access, correct, or request deletion of your personal data. To exercise these rights, contact us at reservations@shantipalace.com.</p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-1">6. Contact</h3>
            <p>For any privacy-related queries, please write to us at Hotel Shanti Palace, 123 Peace Avenue, Serenity City, India, or email reservations@shantipalace.com.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TermsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Terms of Service</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground space-y-4">
          <p>Last updated: January 2025</p>

          <div>
            <h3 className="font-semibold text-foreground mb-1">1. Reservations</h3>
            <p>All bookings are subject to availability. A reservation is confirmed only upon receipt of full or advance payment as specified at time of booking. Hotel Shanti Palace reserves the right to cancel unconfirmed bookings.</p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-1">2. Check-in & Check-out</h3>
            <p>Standard check-in time is 2:00 PM and check-out is 11:00 AM. Early check-in and late check-out are subject to availability and may attract additional charges. A valid government-issued photo ID is mandatory at check-in.</p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-1">3. Cancellation Policy</h3>
            <p>Cancellations made more than 48 hours before the check-in date will receive a full refund. Cancellations within 48 hours of check-in will forfeit the first night&apos;s charge. No-shows will be charged the full booking amount.</p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-1">4. Guest Conduct</h3>
            <p>Guests are expected to maintain decorum and respect the peaceful environment of the hotel. The hotel reserves the right to ask guests to vacate without refund in case of disruptive or unlawful behaviour.</p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-1">5. Liability</h3>
            <p>Hotel Shanti Palace is not responsible for loss or damage to guest property. Guests are advised to use the in-room safe for valuables. The hotel&apos;s liability is limited to the room tariff paid for the stay.</p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-1">6. Governing Law</h3>
            <p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Serenity City, India.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function Footer() {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Column 1: Logo & Mission */}
          <div className="lg:col-span-2">
            <Link href="/">
              <Logo />
            </Link>
            <p className="mt-6 text-base max-w-sm">
              Our mission is to provide a sanctuary of peace, comfort, and heartfelt hospitality for every guest.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/rooms" className="hover:text-white transition-colors">Rooms</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
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
            <button onClick={() => setPrivacyOpen(true)} className="hover:text-white transition-colors">Privacy Policy</button>
            <button onClick={() => setTermsOpen(true)} className="hover:text-white transition-colors">Terms of Service</button>
            <Link href="/admin/login" className="hover:text-white text-gray-600">Staff Login</Link>
          </div>
        </div>
      </div>

      <PrivacyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
      <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />
    </footer>
  );
}
