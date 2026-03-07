'use client';

import { usePathname } from 'next/navigation';
import { Header } from './header';
import { Footer } from './footer';

export function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideChrome = pathname.startsWith('/admin') || pathname.startsWith('/bill');

  return (
    <>
      {!hideChrome && <Header />}
      <main className="flex-grow">{children}</main>
      {!hideChrome && <Footer />}
    </>
  );
}
