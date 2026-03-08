import Image from 'next/image';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <Image src="/logo-2x.svg" alt="Hotel Shanti Palace" width={160} height={60} className={cn(className)} />
  );
}
