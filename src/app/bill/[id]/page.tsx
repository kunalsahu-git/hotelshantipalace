import type { Metadata } from 'next';
import { BillPageClient } from './bill-page-client';

const PROJECT_ID = 'studio-3769306278-2cbbf';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// Helper: extract a string value from a Firestore REST API field
function str(field: Record<string, unknown> | undefined): string {
  if (!field) return '';
  return (field.stringValue as string) ?? '';
}

// Helper: extract a number from a Firestore REST API field
function num(field: Record<string, unknown> | undefined): number {
  if (!field) return 0;
  return Number(field.doubleValue ?? field.integerValue ?? 0);
}

async function fetchBillMeta(id: string) {
  try {
    const [billRes, settingsRes] = await Promise.all([
      fetch(`${FIRESTORE_BASE}/bills/${id}`, { cache: 'no-store' }),
      fetch(`${FIRESTORE_BASE}/settings/main`, { cache: 'no-store' }),
    ]);

    const billData = billRes.ok ? await billRes.json() : null;
    const settingsData = settingsRes.ok ? await settingsRes.json() : null;

    const fields = billData?.fields as Record<string, Record<string, unknown>> | undefined;
    const settingsFields = settingsData?.fields as Record<string, Record<string, unknown>> | undefined;

    if (!fields) return null;

    return {
      guestName: str(fields.guestName),
      totalAmount: num(fields.totalAmount),
      checkIn: str(fields.checkIn),
      checkOut: str(fields.checkOut),
      numberOfNights: num(fields.numberOfNights),
      roomNumber: str(fields.roomNumber),
      paymentStatus: str(fields.paymentStatus),
      hotelName: settingsFields ? str(settingsFields.hotelName) : 'Hotel Shanti Palace',
    };
  } catch {
    return null;
  }
}

function formatRupees(amount: number) {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const meta = await fetchBillMeta(params.id);

  if (!meta) {
    return {
      title: 'Invoice | Hotel Shanti Palace',
      description: 'View your invoice from Hotel Shanti Palace.',
    };
  }

  const { guestName, totalAmount, numberOfNights, hotelName, paymentStatus } = meta;
  const paid = paymentStatus === 'paid' ? ' · Paid ✓' : '';

  const title = `Invoice for ${guestName} — ${hotelName}`;
  const description =
    `${numberOfNights} night${numberOfNights !== 1 ? 's' : ''} · Total: ${formatRupees(totalAmount)}${paid}. ` +
    `View your complete invoice including room charges, taxes, and payment details.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: hotelName,
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default function BillPage({ params }: { params: { id: string } }) {
  return <BillPageClient id={params.id} />;
}
