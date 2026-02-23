import Link from 'next/link';
import { LotusIcon } from '@/components/icons/lotus-icon';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LotusIcon className="h-10 w-10 text-primary" />
      <div>
        <p className="font-headline text-2xl font-bold tracking-tight text-foreground">
          Hotel Shanti Palace
        </p>
        <p className="text-sm font-body text-muted-foreground -mt-1">
          Discover The Peace
        </p>
      </div>
    </div>
  );
}
