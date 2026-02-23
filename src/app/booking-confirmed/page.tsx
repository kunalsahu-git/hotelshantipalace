'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function BookingConfirmation() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const bookingId = searchParams.get('id');

  // In a real app, you would fetch the full booking details using the ID
  // For this prototype, we'll just show the ID.

  if (!bookingId) {
    // Redirect home if no ID is present.
    // This needs to be in a useEffect to avoid server/client mismatch issues with router.
    if (typeof window !== 'undefined') {
        router.push('/');
    }
    return null;
  }

  return (
    <div className="container py-20 text-center flex flex-col items-center">
      <Card className="w-full max-w-2xl text-left">
        <CardHeader className="items-center text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mb-4" />
          <CardTitle className="text-4xl">Booking Request Sent!</CardTitle>
          <p className="text-muted-foreground pt-2">
            Our team will review your request and contact you shortly to confirm.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
            <p className="font-semibold text-muted-foreground">Booking Reference</p>
            <p className="text-2xl font-mono text-primary font-bold tracking-wider">
              {bookingId.substring(0, 10).toUpperCase()}
            </p>
          </div>

          <div className="space-y-4">
             <h3 className="font-semibold text-lg border-b pb-2">Your Details</h3>
             <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="secondary">Pending Confirmation</Badge>
             </div>
             {/* In a real app, you would fetch and display the full booking details using the ID */}
          </div>
          
          <div className="text-center text-muted-foreground text-sm pt-4">
            <p>No payment is needed online. You can pay at the hotel during check-in or check-out.</p>
            <p className="mt-4">Have questions? Contact us at <a href="tel:+911234567890" className="text-primary font-semibold hover:underline">+91 123 456 7890</a> or <a href="mailto:reservations@shantipalace.com" className="text-primary font-semibold hover:underline">reservations@shantipalace.com</a>.</p>
          </div>

          <Button asChild size="lg" className="w-full mt-6">
            <Link href="/">Back to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BookingConfirmedPage() {
    return (
        <Suspense fallback={<div>Loading confirmation...</div>}>
            <BookingConfirmation />
        </Suspense>
    )
}
