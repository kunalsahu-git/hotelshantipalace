import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { PublicShell } from '@/components/layout/public-shell';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  title: 'Hotel Shanti Palace | Discover The Peace',
  description: 'Book your stay at Hotel Shanti Palace for a peaceful and luxurious experience in the heart of the city.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:opsz,wght@9..40,400;500;700&family=Fraunces:opsz,wght@9..144,400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-body antialiased flex flex-col'
        )}
      >
        <FirebaseClientProvider>
          <PublicShell>{children}</PublicShell>
          <Toaster />
        </FirebaseClientProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
