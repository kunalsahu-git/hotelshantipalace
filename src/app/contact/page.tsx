import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { EnquiryForm } from '@/components/contact/enquiry-form';

export default function ContactPage() {
  return (
    <div className="container py-12 md:py-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold">Contact Us</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          We'd love to hear from you. Get in touch with us for any questions or enquiries.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Contact Details */}
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold mb-6">Get in Touch</h2>
            <div className="space-y-6 text-lg">
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-full mt-1">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Address</h3>
                  <p className="text-muted-foreground">123 Peace Avenue, Serenity City, India</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-full mt-1">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Phone</h3>
                  <a href="tel:+911234567890" className="text-muted-foreground hover:text-primary transition-colors">
                    +91 123 456 7890
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-full mt-1">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Email</h3>
                  <a href="mailto:reservations@shantipalace.com" className="text-muted-foreground hover:text-primary transition-colors">
                    reservations@shantipalace.com
                  </a>
                </div>
              </div>
               <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-full mt-1">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Hotel Timings</h3>
                  <p className="text-muted-foreground">Check-in: From 2:00 PM</p>
                  <p className="text-muted-foreground">Check-out: Until 12:00 PM</p>
                </div>
              </div>
            </div>
          </div>
          <div className="aspect-video w-full rounded-lg overflow-hidden shadow-lg">
             <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d387193.3059694314!2d-74.25986613799694!3d40.69714941926399!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2sin!4v1628782379563!5m2!1sen!2sin" 
                width="100%" 
                height="100%" 
                style={{border:0}} 
                allowFullScreen={false}
                loading="lazy"
                title="Hotel Location Map"
             ></iframe>
          </div>
        </div>

        {/* Enquiry Form */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 md:p-8">
            <EnquiryForm />
        </div>
      </div>
    </div>
  );
}
