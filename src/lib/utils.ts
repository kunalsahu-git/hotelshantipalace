import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Timestamp } from "firebase/firestore"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Safely converts a Firestore Timestamp or ISO string to a JS Date, returns null if invalid. */
export function toDate(value: Timestamp | string | null | undefined): Date | null {
  if (!value) return null;
  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof (value as Timestamp).toDate === 'function') {
    return (value as Timestamp).toDate();
  }
  return null;
}
