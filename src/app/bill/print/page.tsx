'use client';

import { Suspense, useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import { useSearchParams } from 'next/navigation';
import { Printer, XCircle } from 'lucide-react';

import { useFirestore } from '@/firebase';
import { toDate } from '@/lib/utils';
import type { Bill, HotelSetting } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

type BillWithId = Bill & { id: string };

function SingleInvoice({
  bill,
  hotelName,
  hotelAddress,
  hotelPhone,
  hotelEmail,
  isLast,
}: {
  bill: BillWithId;
  hotelName: string;
  hotelAddress: string;
  hotelPhone: string;
  hotelEmail: string;
  isLast: boolean;
}) {
  const billRef = `INV-${bill.id.slice(-8).toUpperCase()}`;
  const generatedDate = toDate(bill.generatedAt);

  return (
    <div className={!isLast ? 'break-after-page' : ''}>
      <div className="max-w-2xl mx-auto p-8 print:p-6">

        {/* Hotel Header */}
        <div className="text-center mb-8 pb-6 border-b-2 border-gray-200">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{hotelName}</h1>
          {hotelAddress && <p className="text-sm text-gray-500 mt-1">{hotelAddress}</p>}
          {(hotelPhone || hotelEmail) && (
            <p className="text-sm text-gray-500 mt-0.5">
              {hotelPhone}
              {hotelPhone && hotelEmail && ' · '}
              {hotelEmail}
            </p>
          )}
        </div>

        {/* Invoice Meta */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">INVOICE</h2>
            <p className="text-sm text-gray-500 mt-0.5">Ref: {billRef}</p>
          </div>
          <div className="text-right">
            {generatedDate && (
              <p className="text-sm text-gray-600">
                <span className="text-gray-400">Date: </span>
                {format(generatedDate, 'dd MMM yyyy')}
              </p>
            )}
            {bill.generatedBy && (
              <p className="text-sm text-gray-400">Issued by: {bill.generatedBy}</p>
            )}
          </div>
        </div>

        {/* Guest & Stay Details */}
        <div className="grid grid-cols-2 gap-6 mb-8 bg-gray-50 rounded-lg p-4">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Bill To</p>
            <p className="font-semibold text-gray-900">{bill.guestName}</p>
          </div>
          {bill.roomNumber && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Room</p>
              <p className="font-semibold text-gray-900">Room {bill.roomNumber}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Check-in</p>
            <p className="text-gray-800">{format(parseISO(bill.checkIn), 'dd MMM yyyy')}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Check-out</p>
            <p className="text-gray-800">{format(parseISO(bill.checkOut), 'dd MMM yyyy')}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Duration</p>
            <p className="text-gray-800">{bill.numberOfNights} night{bill.numberOfNights !== 1 ? 's' : ''}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Payment</p>
            <p className={`text-sm font-semibold capitalize ${
              bill.paymentStatus === 'paid' ? 'text-green-700' :
              bill.paymentStatus === 'partial' ? 'text-yellow-700' : 'text-red-700'
            }`}>
              {bill.paymentStatus}
            </p>
          </div>
        </div>

        {/* Charge Breakdown */}
        <div className="mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-gray-400 font-medium pb-2 text-xs uppercase tracking-wide">Description</th>
                <th className="text-right text-gray-400 font-medium pb-2 text-xs uppercase tracking-wide">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-2.5 text-gray-700">
                  Room Charges
                  {bill.numberOfNights > 0 && (
                    <span className="ml-1.5 text-gray-400 text-xs">
                      ({formatCurrency(bill.roomCharges / bill.numberOfNights)}/night × {bill.numberOfNights} night{bill.numberOfNights !== 1 ? 's' : ''})
                    </span>
                  )}
                </td>
                <td className="py-2.5 text-right text-gray-800">{formatCurrency(bill.roomCharges)}</td>
              </tr>
              {bill.extraCharges && bill.extraCharges.length > 0 && (
                <>
                  <tr>
                    <td colSpan={2} className="pt-3 pb-1">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                        Extra Charges
                      </span>
                    </td>
                  </tr>
                  {bill.extraCharges.map((charge, i) => (
                    <tr key={i}>
                      <td className="py-2 pl-3 text-gray-700">{charge.name}</td>
                      <td className="py-2 text-right text-gray-800">{formatCurrency(charge.amount)}</td>
                    </tr>
                  ))}
                </>
              )}
              {bill.discountAmount && bill.discountAmount > 0 && (
                <tr>
                  <td className="py-2.5 text-green-700">
                    Discount
                    {bill.discountType === 'percentage' ? ` (${bill.discountValue}%)` : ' (Fixed)'}
                  </td>
                  <td className="py-2.5 text-right text-green-700">- {formatCurrency(bill.discountAmount)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="space-y-2 text-sm mb-6">
          <Separator />
          <div className="flex justify-between text-gray-600 py-1">
            <span>Subtotal</span>
            <span>{formatCurrency(bill.subtotal)}</span>
          </div>
          {bill.serviceChargeAmount && bill.serviceChargeAmount > 0 && (
            <div className="flex justify-between text-gray-600 py-1">
              <span>Service Charge ({bill.serviceChargeRate}%)</span>
              <span>{formatCurrency(bill.serviceChargeAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600 py-1">
            <span>CGST ({bill.taxRate / 2}%)</span>
            <span>{formatCurrency(bill.taxAmount / 2)}</span>
          </div>
          <div className="flex justify-between text-gray-600 py-1">
            <span>SGST ({bill.taxRate / 2}%)</span>
            <span>{formatCurrency(bill.taxAmount / 2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-lg py-1">
            <span className="text-gray-900">Total Amount</span>
            <span className="text-gray-900">{formatCurrency(bill.totalAmount)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
          <p>Thank you for staying with us. We hope to welcome you again soon.</p>
          <p className="mt-1">{hotelName}{hotelAddress ? ` · ${hotelAddress}` : ''}</p>
        </div>
      </div>
    </div>
  );
}

function BulkPrintContent() {
  const searchParams = useSearchParams();
  const firestore = useFirestore();
  const ids = (searchParams.get('ids') ?? '').split(',').filter(Boolean);

  const [bills, setBills] = useState<BillWithId[]>([]);
  const [settings, setSettings] = useState<HotelSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ids.length === 0) {
      setError('No bill IDs provided.');
      setLoading(false);
      return;
    }

    async function fetchAll() {
      try {
        const [settingsSnap, ...billSnaps] = await Promise.all([
          getDoc(doc(firestore, 'settings', 'main')),
          ...ids.map(id => getDoc(doc(firestore, 'bills', id))),
        ]);

        if (settingsSnap.exists()) setSettings(settingsSnap.data() as HotelSetting);

        const fetched: BillWithId[] = billSnaps
          .filter(s => s.exists())
          .map(s => ({ ...(s.data() as Bill), id: s.id }));

        if (fetched.length === 0) {
          setError('None of the requested bills were found.');
          return;
        }

        setBills(fetched);
      } catch {
        setError('Failed to load bills. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firestore]);

  // Auto-trigger print once all bills are loaded
  useEffect(() => {
    if (!loading && bills.length > 0) {
      const timer = setTimeout(() => window.print(), 600);
      return () => clearTimeout(timer);
    }
  }, [loading, bills]);

  const hotelName = settings?.hotelName ?? 'Hotel Shanti Palace';
  const hotelAddress = settings?.address ?? '';
  const hotelPhone = settings?.phone ?? '';
  const hotelEmail = settings?.email ?? '';

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-8 max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-8">
          <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-700 mb-2">Error</h1>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Toolbar — hidden during print */}
      <div className="print:hidden bg-gray-50 border-b px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <p className="text-sm text-gray-600 font-medium">
          {bills.length} invoice{bills.length > 1 ? 's' : ''} ready to print
        </p>
        <Button onClick={() => window.print()} size="sm">
          <Printer className="h-4 w-4 mr-2" /> Print All / Save as PDF
        </Button>
      </div>

      {/* All invoices stacked — one per page when printed */}
      <div className="bg-white">
        {bills.map((bill, index) => (
          <SingleInvoice
            key={bill.id}
            bill={bill}
            hotelName={hotelName}
            hotelAddress={hotelAddress}
            hotelPhone={hotelPhone}
            hotelEmail={hotelEmail}
            isLast={index === bills.length - 1}
          />
        ))}
      </div>
    </>
  );
}

export default function BulkPrintPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white p-8 max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    }>
      <BulkPrintContent />
    </Suspense>
  );
}
