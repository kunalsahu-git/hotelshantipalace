import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';

export function LotusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12,5.5C12,5.5,12,2,15,2s3,3.5,3,3.5" />
      <path d="M12,5.5C12,5.5,12,2,9,2S6,5.5,6,5.5" />
      <path d="M12,14.5c0,0,0,3.5-3,3.5s-3-3.5-3-3.5" />
      <path d="M12,14.5c0,0,0,3.5,3,3.5s3-3.5,3-3.5" />
      <path d="M12,22c-3.14,0-6-2-6-5.5s3-5.5,6-5.5" />
      <path d="M12,22c3.14,0,6-2,6-5.5s-3-5.5-6-5.5" />
    </svg>
  );
}
