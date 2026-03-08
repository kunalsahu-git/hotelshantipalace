'use client';

import { useState, useMemo, useEffect } from 'react';
import { usePagination } from '@/hooks/use-pagination';
import { TablePagination } from '@/components/admin/table-pagination';
import {
  collection,
  query,
  orderBy,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Plus,
  Trash2,
  FileText,
  Receipt,
  CreditCard,
  Eye,
  IndianRupee,
  Printer,
  MessageCircle,
  Mail,
  X,
  Ban,
  CalendarDays,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';

import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import type { Bill, Booking, HotelSetting } from '@/lib/types';
import { roomCategories } from '@/lib/mock-data';
import { toDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/components/admin/admin-provider';
import { Label } from '@/components/ui/label';

// ─── Types ───────────────────────────────────────────────────────────────────

type BillWithId = Bill & { id: string };
type BookingWithId = Booking & { id: string };

// ─── Schemas ─────────────────────────────────────────────────────────────────

const GenerateBillSchema = z.object({
  bookingId: z.string().min(1, 'Select a booking.'),
  extraCharges: z.array(z.object({
    name: z.string().min(1, 'Enter a description.'),
    amount: z.coerce.number().min(0, 'Amount must be positive.'),
  })),
  discountType: z.enum(['none', 'percentage', 'fixed']),
  discountValue: z.coerce.number().min(0).default(0),
});
type GenerateBillData = z.infer<typeof GenerateBillSchema>;

const PaymentSchema = z.object({
  paymentStatus: z.enum(['paid', 'partial']),
  paymentMethod: z.enum(['cash', 'card', 'upi', 'other']),
  paidAmount: z.coerce.number().min(0).default(0),
}).superRefine((data, ctx) => {
  if (data.paymentStatus === 'partial' && data.paidAmount <= 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['paidAmount'], message: 'Enter amount paid.' });
  }
});
type PaymentData = z.infer<typeof PaymentSchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function PaymentBadge({ status, isFinal }: { status: Bill['paymentStatus']; isFinal?: boolean }) {
  if (isFinal === false) return <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">Draft</Badge>;
  if (status === 'paid') return <Badge className="bg-green-600 hover:bg-green-600 text-white">Paid</Badge>;
  if (status === 'partial') return <Badge className="bg-yellow-500 hover:bg-yellow-500 text-white">Partial</Badge>;
  if (status === 'void') return <Badge variant="secondary" className="line-through opacity-60">Void</Badge>;
  return <Badge variant="destructive">Unpaid</Badge>;
}

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function buildShareContent(bill: BillWithId, hotelName: string) {
  const billUrl = `${window.location.origin}/bill/${bill.id}`;
  const checkIn = format(parseISO(bill.checkIn), 'dd MMM yyyy');
  const checkOut = format(parseISO(bill.checkOut), 'dd MMM yyyy');
  const total = formatCurrency(bill.totalAmount);

  const whatsappText =
    `Dear ${bill.guestName},\n\n` +
    `Thank you for staying at *${hotelName}*!\n\n` +
    `*Bill Summary*\n` +
    `• Check-in: ${checkIn}\n` +
    `• Check-out: ${checkOut}\n` +
    `• ${bill.numberOfNights} night${bill.numberOfNights !== 1 ? 's' : ''}\n` +
    `• Room Charges: ${formatCurrency(bill.roomCharges)}\n` +
    (bill.discountAmount && bill.discountAmount > 0
      ? `• Discount: -${formatCurrency(bill.discountAmount)}\n`
      : '') +
    `• CGST (${bill.taxRate / 2}%): ${formatCurrency(bill.taxAmount / 2)}\n• SGST (${bill.taxRate / 2}%): ${formatCurrency(bill.taxAmount / 2)}\n` +
    `• *Total: ${total}*\n` +
    `• Status: ${bill.paymentStatus.charAt(0).toUpperCase() + bill.paymentStatus.slice(1)}\n\n` +
    `View your invoice: ${billUrl}\n\n` +
    `We hope to see you again soon! 🙏`;

  const emailSubject = `Invoice from ${hotelName} — ${bill.guestName}`;
  const emailBody =
    `Dear ${bill.guestName},\n\n` +
    `Thank you for choosing ${hotelName}. Please find your invoice details below.\n\n` +
    `INVOICE SUMMARY\n` +
    `---------------\n` +
    `Check-in:  ${checkIn}\n` +
    `Check-out: ${checkOut}\n` +
    `Duration:  ${bill.numberOfNights} night${bill.numberOfNights !== 1 ? 's' : ''}\n` +
    (bill.roomNumber ? `Room:      ${bill.roomNumber}\n` : '') +
    `\nRoom Charges: ${formatCurrency(bill.roomCharges)}\n` +
    (bill.extraCharges?.map(e => `${e.name}: ${formatCurrency(e.amount)}`).join('\n') ?? '') +
    (bill.discountAmount && bill.discountAmount > 0
      ? `\nDiscount: -${formatCurrency(bill.discountAmount)}`
      : '') +
    `\nCGST (${bill.taxRate / 2}%): ${formatCurrency(bill.taxAmount / 2)}\nSGST (${bill.taxRate / 2}%): ${formatCurrency(bill.taxAmount / 2)}\n` +
    `\nTOTAL: ${total}\n` +
    `Payment Status: ${bill.paymentStatus.charAt(0).toUpperCase() + bill.paymentStatus.slice(1)}\n\n` +
    `View your full invoice online: ${billUrl}\n\n` +
    `Warm regards,\n${hotelName}`;

  return {
    billUrl,
    whatsappUrl: `https://wa.me/?text=${encodeURIComponent(whatsappText)}`,
    emailUrl: `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`,
  };
}

// ─── Per-row action buttons ───────────────────────────────────────────────────

function BillRowActions({
  bill,
  hotelName,
  onView,
  onEdit,
  onPay,
  onVoid,
  onDelete,
}: {
  bill: BillWithId;
  hotelName: string;
  onView: () => void;
  onEdit?: () => void;
  onPay: () => void;
  onVoid: () => void;
  onDelete: () => void;
}) {
  const handlePrint = () => window.open(`/bill/${bill.id}`, '_blank');
  const handleWhatsApp = () => {
    const { whatsappUrl } = buildShareContent(bill, hotelName);
    window.open(whatsappUrl, '_blank');
  };
  const handleEmail = () => {
    const { emailUrl } = buildShareContent(bill, hotelName);
    window.open(emailUrl, '_blank');
  };

  return (
    <div className="flex gap-1 justify-end">
      <Button size="sm" variant="ghost" onClick={onView} title="View bill">
        <Eye className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={handlePrint} title="Print / Save as PDF">
        <Printer className="h-4 w-4" />
      </Button>
      {bill.isFinal === false && onEdit && (
        <Button 
          size="sm" 
          variant="outline" 
          onClick={onEdit}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          title="Edit draft bill"
        >
          <FileText className="h-3.5 w-3.5 mr-1" /> Edit
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        onClick={handleWhatsApp}
        title="Share via WhatsApp"
        className="text-green-700 hover:text-green-800 hover:bg-green-50"
      >
        <MessageCircle className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={handleEmail} title="Share via Email">
        <Mail className="h-4 w-4" />
      </Button>
      {bill.paymentStatus !== 'paid' && bill.paymentStatus !== 'void' && (
        <Button size="sm" variant="outline" onClick={onPay}>
          <CreditCard className="h-3.5 w-3.5 mr-1" /> Pay
        </Button>
      )}
      {bill.paymentStatus !== 'void' && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onVoid}
          title="Void bill"
          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
        >
          <Ban className="h-4 w-4" />
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        onClick={onDelete}
        title="Delete bill"
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ─── Generate Bill Dialog ─────────────────────────────────────────────────────

function GenerateBillDialog({
  bookings,
  existingBillBookingIds,
  taxRate,
  serviceChargeRate,
  onCreated,
  initialBookingId,
}: {
  bookings: BookingWithId[];
  existingBillBookingIds: Set<string>;
  taxRate: number;
  serviceChargeRate: number;
  onCreated: () => void;
  initialBookingId?: string;
}) {
  const [open, setOpen] = useState(false);
  const firestore = useFirestore();
  const { user } = useAdmin();
  const { toast } = useToast();

  const eligibleBookings = bookings.filter(
    b => (b.status === 'checked_in' || b.status === 'checked_out') &&
      !existingBillBookingIds.has(b.id)
  );

  const form = useForm<GenerateBillData>({
    resolver: zodResolver(GenerateBillSchema),
    defaultValues: {
      bookingId: '',
      extraCharges: [],
      discountType: 'none',
      discountValue: 0,
    },
  });

  // Auto-open and pre-select booking when coming from checkout prompt
  useEffect(() => {
    if (!initialBookingId || bookings.length === 0) return;
    const match = bookings.find(b => b.id === initialBookingId);
    if (!match) return;
    form.setValue('bookingId', initialBookingId);
    setOpen(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialBookingId, bookings.length]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'extraCharges',
  });

  const watchedBookingId = form.watch('bookingId');
  const watchedExtra = form.watch('extraCharges');
  const watchedDiscountType = form.watch('discountType');
  const watchedDiscountValue = form.watch('discountValue');

  const selectedBooking = bookings.find(b => b.id === watchedBookingId);

  const roomCharges = useMemo(() => {
    if (!selectedBooking) return 0;
    if (selectedBooking.totalPrice) return selectedBooking.totalPrice;
    const cat = roomCategories.find(c => c.id === selectedBooking.categoryId);
    return cat ? selectedBooking.numberOfNights * cat.basePrice : 0;
  }, [selectedBooking]);

  // Compute inline — useMemo with array deps misses inner field mutations
  const extraTotal = watchedExtra.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const subtotalBeforeDiscount = roomCharges + extraTotal;
  const discountAmount = watchedDiscountType === 'percentage'
    ? Math.round((subtotalBeforeDiscount * (watchedDiscountValue || 0)) / 100)
    : watchedDiscountType === 'fixed' ? (watchedDiscountValue || 0) : 0;

  const subtotal = subtotalBeforeDiscount - discountAmount;
  const serviceChargeAmount = serviceChargeRate > 0 ? Math.round((subtotal * serviceChargeRate) / 100) : 0;
  const taxAmount = Math.round(((subtotal + serviceChargeAmount) * taxRate) / 100);
  const totalAmount = subtotal + serviceChargeAmount + taxAmount;

  const onSubmit = async (data: GenerateBillData) => {
    if (!firestore || !selectedBooking) return;

    const bill: Omit<Bill, 'id'> = {
      bookingId: selectedBooking.id!,
      guestId: selectedBooking.guestId ?? '',
      guestName: selectedBooking.guestName,
      checkIn: selectedBooking.checkIn,
      checkOut: selectedBooking.checkOut,
      numberOfNights: selectedBooking.numberOfNights,
      roomCharges,
      taxRate,
      taxAmount,
      subtotal,
      totalAmount,
      paymentStatus: 'unpaid',
      generatedAt: serverTimestamp() as any,
      generatedBy: user?.name ?? 'Admin',
      // Omit optional fields entirely instead of setting to undefined (Firestore throws on undefined)
      ...(serviceChargeRate > 0 ? { serviceChargeRate, serviceChargeAmount } : {}),
      ...(selectedBooking.roomNumber ? { roomNumber: selectedBooking.roomNumber } : {}),
      ...(data.extraCharges.length > 0 ? { extraCharges: data.extraCharges } : {}),
      ...(data.discountType !== 'none' ? {
        discountType: data.discountType,
        discountValue: data.discountValue,
        discountAmount: discountAmount,
      } : {}),
    };

    try {
      await addDoc(collection(firestore, 'bills'), bill);
      toast({ title: 'Bill Generated', description: `Bill for ${selectedBooking.guestName} created.` });
      form.reset();
      setOpen(false);
      onCreated();
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate bill.' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Generate Bill
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Bill</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            <FormField
              control={form.control}
              name="bookingId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Booking</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          eligibleBookings.length === 0
                            ? 'No eligible bookings (checked-in / checked-out without a bill)'
                            : 'Select a booking...'
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {eligibleBookings.map(b => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.guestName} — {b.categoryName}
                          {b.roomNumber ? ` (Room ${b.roomNumber})` : ''}
                          {' '}· {format(parseISO(b.checkIn), 'dd MMM')} – {format(parseISO(b.checkOut), 'dd MMM yyyy')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedBooking && (
              <div className="rounded-md border bg-muted/30 p-4 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Guest</span>
                  <span className="font-medium">{selectedBooking.guestName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Room Charges</span>
                  <span className="font-semibold">
                    {formatCurrency(selectedBooking.numberOfNights > 0 ? roomCharges / selectedBooking.numberOfNights : roomCharges)}
                    {' × '}{selectedBooking.numberOfNights} night{selectedBooking.numberOfNights > 1 ? 's' : ''}
                    {' = '}{formatCurrency(roomCharges)}
                  </span>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <FormLabel>Extra Charges</FormLabel>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => append({ name: '', amount: 0 })}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
                </Button>
              </div>
              {fields.length === 0 && (
                <p className="text-sm text-muted-foreground">No extra charges. Click &ldquo;Add Item&rdquo; to add room service, meals, etc.</p>
              )}
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-start">
                    <FormField
                      control={form.control}
                      name={`extraCharges.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="e.g. Room Service" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`extraCharges.${index}.amount`}
                      render={({ field }) => (
                        <FormItem className="w-32">
                          <FormControl>
                            <Input type="number" min={0} placeholder="₹ Amount" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive mt-0.5"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="discountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="none">No Discount</SelectItem>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {watchedDiscountType !== 'none' && (
                <FormField
                  control={form.control}
                  name="discountValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {watchedDiscountType === 'percentage' ? 'Discount %' : 'Discount ₹'}
                      </FormLabel>
                      <FormControl>
                        <Input type="number" min={0} max={watchedDiscountType === 'percentage' ? 100 : undefined} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {selectedBooking && (
              <div className="rounded-md border p-4 space-y-2 text-sm">
                <p className="font-semibold text-base mb-3">Bill Summary</p>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Room Charges
                    {selectedBooking && selectedBooking.numberOfNights > 0 && (
                      <span className="ml-1 text-xs opacity-60">
                        ({formatCurrency(roomCharges / selectedBooking.numberOfNights)} × {selectedBooking.numberOfNights}N)
                      </span>
                    )}
                  </span>
                  <span>{formatCurrency(roomCharges)}</span>
                </div>

                {/* Itemized extra charges */}
                {watchedExtra.some(e => e.name || Number(e.amount) > 0) && (
                  <>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-1">
                      Extra Charges
                    </div>
                    {watchedExtra.map((e, i) => {
                      const amt = Number(e.amount) || 0;
                      if (!e.name && amt === 0) return null;
                      return (
                        <div key={i} className="flex justify-between text-muted-foreground">
                          <span className="pl-3 before:content-['+'] before:mr-1.5 before:opacity-40">
                            {e.name || 'Extra item'}
                          </span>
                          <span>{formatCurrency(amt)}</span>
                        </div>
                      );
                    })}
                  </>
                )}

                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span>
                      Discount
                      {watchedDiscountType === 'percentage' ? ` (${watchedDiscountValue}%)` : ' (Fixed)'}
                    </span>
                    <span>- {formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {serviceChargeAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service Charge ({serviceChargeRate}%)</span>
                    <span>{formatCurrency(serviceChargeAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CGST ({taxRate / 2}%)</span>
                  <span>{formatCurrency(taxAmount / 2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SGST ({taxRate / 2}%)</span>
                  <span>{formatCurrency(taxAmount / 2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting || !selectedBooking}>
                {form.formState.isSubmitting ? 'Generating...' : 'Generate Bill'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── View Bill Dialog ─────────────────────────────────────────────────────────

function ViewBillDialog({
  bill,
  open,
  onOpenChange,
  hotelName,
}: {
  bill: BillWithId | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  hotelName: string;
}) {
  if (!bill) return null;

  const handlePrint = () => window.open(`/bill/${bill.id}`, '_blank');
  const handleWhatsApp = () => {
    const { whatsappUrl } = buildShareContent(bill, hotelName);
    window.open(whatsappUrl, '_blank');
  };
  const handleEmail = () => {
    const { emailUrl } = buildShareContent(bill, hotelName);
    window.open(emailUrl, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" /> Bill — {bill.guestName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="text-center border-b pb-3">
            <p className="font-bold text-lg">{hotelName}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Generated: {toDate(bill.generatedAt) ? format(toDate(bill.generatedAt)!, 'dd MMM yyyy, hh:mm a') : '—'}
              {bill.generatedBy ? ` · By ${bill.generatedBy}` : ''}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Guest</p>
              <p className="font-medium">{bill.guestName}</p>
            </div>
            {bill.roomNumber && (
              <div>
                <p className="text-xs text-muted-foreground">Room</p>
                <p className="font-medium">Room {bill.roomNumber}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Check-in</p>
              <p>{format(parseISO(bill.checkIn), 'dd MMM yyyy')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Check-out</p>
              <p>{format(parseISO(bill.checkOut), 'dd MMM yyyy')}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Nights</p>
              <p>{bill.numberOfNights}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Room Charges
                {bill.numberOfNights > 0 && (
                  <span className="ml-1 text-xs opacity-60">
                    ({formatCurrency(bill.roomCharges / bill.numberOfNights)} × {bill.numberOfNights}N)
                  </span>
                )}
              </span>
              <span>{formatCurrency(bill.roomCharges)}</span>
            </div>
            {bill.extraCharges?.map((e, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-muted-foreground">{e.name}</span>
                <span>{formatCurrency(e.amount)}</span>
              </div>
            ))}
            {bill.discountAmount && bill.discountAmount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>
                  Discount
                  {bill.discountType === 'percentage' ? ` (${bill.discountValue}%)` : ' (Fixed)'}
                </span>
                <span>- {formatCurrency(bill.discountAmount)}</span>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(bill.subtotal)}</span>
            </div>
            {bill.serviceChargeAmount && bill.serviceChargeAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Charge ({bill.serviceChargeRate}%)</span>
                <span>{formatCurrency(bill.serviceChargeAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">CGST ({bill.taxRate / 2}%)</span>
              <span>{formatCurrency(bill.taxAmount / 2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">SGST ({bill.taxRate / 2}%)</span>
              <span>{formatCurrency(bill.taxAmount / 2)}</span>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(bill.totalAmount)}</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-xs text-muted-foreground">Payment</p>
              <p className="font-medium capitalize">{bill.paymentStatus}</p>
              {bill.paymentMethod && (
                <p className="text-xs text-muted-foreground capitalize">{bill.paymentMethod}</p>
              )}
              {bill.paymentStatus === 'partial' && bill.paidAmount != null && (
                <div className="mt-1 space-y-0.5">
                  <p className="text-xs text-muted-foreground">
                    Paid: <span className="font-semibold text-foreground">{formatCurrency(bill.paidAmount)}</span>
                  </p>
                  <p className="text-xs text-destructive font-semibold">
                    Balance: {formatCurrency(Math.max(0, bill.totalAmount - bill.paidAmount))}
                  </p>
                </div>
              )}
            </div>
            <PaymentBadge status={bill.paymentStatus} />
          </div>

          <Separator />

          {/* Share & Print Actions */}
          <div className="flex gap-2 flex-wrap pt-1">
            <Button variant="outline" size="sm" onClick={handlePrint} className="flex-1">
              <Printer className="h-4 w-4 mr-1.5" /> Print / PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleWhatsApp}
              className="flex-1 text-green-700 border-green-300 hover:bg-green-50 hover:text-green-800"
            >
              <MessageCircle className="h-4 w-4 mr-1.5" /> WhatsApp
            </Button>
            <Button variant="outline" size="sm" onClick={handleEmail} className="flex-1">
              <Mail className="h-4 w-4 mr-1.5" /> Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Mark Payment Dialog ──────────────────────────────────────────────────────

function MarkPaymentDialog({
  bill,
  open,
  onOpenChange,
}: {
  bill: BillWithId | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<PaymentData>({
    resolver: zodResolver(PaymentSchema),
    defaultValues: { paymentStatus: 'paid', paymentMethod: 'cash', paidAmount: 0 },
  });

  const watchedStatus = form.watch('paymentStatus');
  const watchedPaid = form.watch('paidAmount') ?? 0;
  const balanceDue = bill ? Math.max(0, bill.totalAmount - Number(watchedPaid)) : 0;

  useEffect(() => {
    if (!open) return;
    form.reset({ paymentStatus: 'paid', paymentMethod: 'cash', paidAmount: bill?.totalAmount ?? 0 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, bill]);

  const onSubmit = async (data: PaymentData) => {
    if (!firestore || !bill) return;
    try {
      await updateDoc(doc(firestore, 'bills', bill.id), {
        paymentStatus: data.paymentStatus,
        paymentMethod: data.paymentMethod,
        ...(data.paymentStatus === 'partial' ? { paidAmount: data.paidAmount } : { paidAmount: bill.totalAmount }),
      });
      toast({ title: 'Payment Updated', description: `Marked as ${data.paymentStatus}.` });
      onOpenChange(false);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update payment.' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {bill && (
              <div className="text-sm bg-muted/40 rounded-md p-3 flex justify-between">
                <span className="text-muted-foreground">{bill.guestName}</span>
                <span className="font-bold text-primary">{formatCurrency(bill.totalAmount)}</span>
              </div>
            )}
            <FormField
              control={form.control}
              name="paymentStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Status</FormLabel>
                  <Select onValueChange={v => {
                    field.onChange(v);
                    if (v === 'paid') form.setValue('paidAmount', bill?.totalAmount ?? 0);
                    else form.setValue('paidAmount', 0);
                  }} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="paid">Paid in Full</SelectItem>
                      <SelectItem value="partial">Partial Payment</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {watchedStatus === 'partial' && (
              <FormField
                control={form.control}
                name="paidAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount Paid (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step={0.01} placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                    {bill && Number(watchedPaid) > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Balance due: <span className="font-semibold text-destructive">{formatCurrency(balanceDue)}</span>
                      </p>
                    )}
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                <CreditCard className="mr-2 h-4 w-4" />
                {form.formState.isSubmitting ? 'Saving...' : 'Confirm Payment'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Draft Bill Dialog ────────────────────────────────────────────────────

function EditDraftBillDialog({
  bill,
  bookings,
  open,
  onOpenChange,
  onUpdated,
}: {
  bill: BillWithId | null;
  bookings: BookingWithId[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUpdated: () => void;
}) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const booking = bookings.find(b => b.id === bill?.bookingId);
  const isCheckedOut = booking?.status === 'checked_out';

  const form = useForm<{
    extraCharges: { name: string; amount: number }[];
    discountType: 'none' | 'percentage' | 'fixed';
    discountValue: number;
  }>({
    defaultValues: {
      extraCharges: [],
      discountType: 'none',
      discountValue: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'extraCharges',
  });

  // Reset form when bill opens
  useEffect(() => {
    if (!open || !bill) return;
    form.reset({
      extraCharges: bill.extraCharges?.map(e => ({ name: e.name, amount: e.amount })) || [],
      discountType: bill.discountType || 'none',
      discountValue: bill.discountValue || 0,
    });
  }, [open, bill, form]);

  const watchedExtra = form.watch('extraCharges');
  const watchedDiscountType = form.watch('discountType');
  const watchedDiscountValue = form.watch('discountValue') || 0;

  // Get room rate from category
  const roomCharges = useMemo(() => {
    if (!booking || !bill) return 0;
    const cat = roomCategories.find(c => c.id === booking.categoryId);
    return cat ? bill.numberOfNights * cat.basePrice : 0;
  }, [booking, bill]);

  // Recalculate totals
  const extraTotal = watchedExtra.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const subtotalBeforeDiscount = roomCharges + extraTotal;
  const discountAmount = watchedDiscountType === 'percentage'
    ? Math.round((subtotalBeforeDiscount * watchedDiscountValue) / 100)
    : watchedDiscountType === 'fixed' ? watchedDiscountValue : 0;
  const subtotal = subtotalBeforeDiscount - discountAmount;
  const taxRate = 12;
  const taxAmount = Math.round((subtotal * taxRate) / 100);
  const totalAmount = subtotal + taxAmount;

  const advancePaid = bill?.advancePaid || 0;
  const balanceDue = Math.max(0, totalAmount - advancePaid);

  const onSubmit = async () => {
    if (!firestore || !bill) return;
    try {
      await updateDoc(doc(firestore, 'bills', bill.id), {
        extraCharges: watchedExtra.filter(e => e.name && e.amount > 0),
        discountType: watchedDiscountType !== 'none' ? watchedDiscountType : undefined,
        discountValue: watchedDiscountType !== 'none' ? watchedDiscountValue : undefined,
        discountAmount: discountAmount,
        subtotal,
        taxAmount,
        totalAmount,
        roomCharges,
      });
      toast({ title: 'Bill Updated', description: 'Draft bill has been updated.' });
      onOpenChange(false);
      onUpdated();
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update bill.' });
    }
  };

  const onFinalize = async (paymentStatus: 'paid' | 'partial', paymentMethod: string, paidAmount: number) => {
    if (!firestore || !bill) return;
    try {
      // Calculate total amount paid (advance + final payment)
      const finalPaymentAmount = paymentStatus === 'paid' ? totalAmount : paidAmount;
      const totalPaidAmount = advancePaid + finalPaymentAmount;

      await updateDoc(doc(firestore, 'bills', bill.id), {
        extraCharges: watchedExtra.filter(e => e.name && e.amount > 0),
        discountType: watchedDiscountType !== 'none' ? watchedDiscountType : undefined,
        discountValue: watchedDiscountType !== 'none' ? watchedDiscountValue : undefined,
        discountAmount: discountAmount,
        subtotal,
        taxAmount,
        totalAmount,
        roomCharges,
        isFinal: true,
        paymentStatus,
        paymentMethod,
        paidAmount: totalPaidAmount,
        finalPaymentAmount: finalPaymentAmount,
        checkoutPaidAt: serverTimestamp(),
      });
      toast({ title: 'Bill Finalized', description: 'Bill has been finalized and marked as paid.' });
      onOpenChange(false);
      onUpdated();
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to finalize bill.' });
    }
  };

  if (!bill) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Edit Draft Bill — {bill.guestName}
            <Badge variant="outline" className="ml-2">Draft</Badge>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">Add extra charges, apply discounts, or finalize this bill.</p>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-4">
            {/* Booking Summary */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Room:</span>
                <span className="font-medium">{bill.roomNumber || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stay:</span>
                <span className="font-medium">
                  {bill.checkIn} → {bill.checkOut} ({bill.numberOfNights} night{bill.numberOfNights > 1 ? 's' : ''})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge>{isCheckedOut ? 'Checked Out' : 'Checked In'}</Badge>
              </div>
              {advancePaid > 0 && (
                <div className="flex justify-between text-green-700">
                  <span className="text-muted-foreground">Advance Paid:</span>
                  <span className="font-medium">{formatCurrency(advancePaid)}</span>
                </div>
              )}
            </div>

            {/* Extra Charges */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Extra Charges</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ name: '', amount: 0 })}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>
              {fields.length === 0 ? (
                <p className="text-xs text-muted-foreground">No extra charges added.</p>
              ) : (
                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-start">
                      <FormField
                        name={`extraCharges.${index}.name`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="Description (e.g., Laundry)" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        name={`extraCharges.${index}.amount`}
                        render={({ field }) => (
                          <FormItem className="w-28">
                            <FormControl>
                              <Input type="number" min={0} placeholder="0" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Discount */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="discountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              {watchedDiscountType !== 'none' && (
                <FormField
                  control={form.control}
                  name="discountValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{watchedDiscountType === 'percentage' ? 'Discount %' : 'Discount Amount (₹)'}</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Totals */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Room Charges:</span>
                <span>{formatCurrency(roomCharges)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Extra Charges:</span>
                <span>{formatCurrency(extraTotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Discount:</span>
                  <span>- {formatCurrency(discountAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax ({taxRate}%):</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span className="text-primary">{formatCurrency(totalAmount)}</span>
              </div>
              {advancePaid > 0 && (
                <div className="flex justify-between font-semibold text-green-700">
                  <span>Paid:</span>
                  <span>- {formatCurrency(advancePaid)}</span>
                </div>
              )}
              {balanceDue > 0 && (
                <div className="flex justify-between font-bold text-destructive">
                  <span>Balance Due:</span>
                  <span>{formatCurrency(balanceDue)}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <DialogClose asChild>
                <Button variant="secondary">Cancel</Button>
              </DialogClose>
              <Button onClick={onSubmit}>
                Save Changes
              </Button>
              {isCheckedOut && (
                <FinalizeBillDialog
                  totalAmount={totalAmount}
                  advancePaid={advancePaid}
                  onFinalize={onFinalize}
                />
              )}
            </div>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Finalize Bill Dialog ───────────────────────────────────────────────────────

function FinalizeBillDialog({
  totalAmount,
  advancePaid,
  onFinalize,
}: {
  totalAmount: number;
  advancePaid: number;
  onFinalize: (paymentStatus: 'paid' | 'partial', paymentMethod: string, paidAmount: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'partial'>('paid');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paidAmount, setPaidAmount] = useState(totalAmount);

  const balanceDue = Math.max(0, totalAmount - advancePaid);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700">
          <CheckCircle2 className="mr-2 h-4 w-4" /> Finalize Bill
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Finalize Bill</DialogTitle>
          <p className="text-sm text-muted-foreground">Mark this bill as finalized. The guest has checked out.</p>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total Amount:</span>
              <span className="font-semibold">{formatCurrency(totalAmount)}</span>
            </div>
            {advancePaid > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Advance Paid:</span>
                <span>- {formatCurrency(advancePaid)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold border-t pt-2">
              <span>Balance Due:</span>
              <span className="text-destructive">{formatCurrency(balanceDue)}</span>
            </div>
          </div>

          <div>
            <Label className="text-sm">Payment Status</Label>
            <Select value={paymentStatus} onValueChange={v => { setPaymentStatus(v as 'paid' | 'partial'); if (v === 'paid') setPaidAmount(totalAmount); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Paid in Full</SelectItem>
                <SelectItem value="partial">Partial Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {paymentStatus === 'partial' && (
            <div>
              <Label className="text-sm">Amount Now Paid (₹)</Label>
              <Input
                type="number"
                min={0}
                max={balanceDue}
                value={paidAmount}
                onChange={e => setPaidAmount(Number(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Remaining balance: {formatCurrency(Math.max(0, balanceDue - paidAmount))}
              </p>
            </div>
          )}

          <div>
            <Label className="text-sm">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                onFinalize(paymentStatus, paymentMethod, paidAmount);
                setOpen(false);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Finalize & Close
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BillsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Bill['paymentStatus'] | 'all'>('all');
  const [autoBookingId, setAutoBookingId] = useState<string | undefined>();

  // Read ?bookingId=xxx set by the checkout prompt
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('bookingId');
    if (id) {
      setAutoBookingId(id);
      // Clean the URL so refreshing doesn't re-trigger
      const url = new URL(window.location.href);
      url.searchParams.delete('bookingId');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewBill, setViewBill] = useState<BillWithId | null>(null);
  const [editDraftBill, setEditDraftBill] = useState<BillWithId | null>(null);
  const [payBill, setPayBill] = useState<BillWithId | null>(null);
  const [voidBill, setVoidBill] = useState<BillWithId | null>(null);
  const [deleteBill, setDeleteBill] = useState<BillWithId | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [, setRefresh] = useState(0);

  const billsQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'bills'), orderBy('generatedAt', 'desc')) : null,
    [firestore]
  );
  const { data: bills, isLoading: billsLoading } = useCollection<Bill>(billsQuery);

  const bookingsQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'bookings'), orderBy('checkIn', 'desc')) : null,
    [firestore]
  );
  const { data: bookings } = useCollection<Booking>(bookingsQuery);

  const settingsRef = useMemoFirebase(
    () => firestore ? doc(firestore, 'settings', 'main') : null,
    [firestore]
  );
  const { data: settings } = useDoc<HotelSetting>(settingsRef);
  const taxRate = settings?.taxRate ?? 12;
  const serviceChargeRate = settings?.serviceChargeRate ?? 0;
  const hotelName = settings?.hotelName ?? 'Hotel Shanti Palace';

  const existingBillBookingIds = useMemo(
    () => new Set(bills?.map(b => b.bookingId) ?? []),
    [bills]
  );

  const filteredBills = useMemo(() => {
    let result = (bills ?? []) as BillWithId[];
    if (statusFilter !== 'all') result = result.filter(b => b.paymentStatus === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(b => b.guestName.toLowerCase().includes(q));
    }
    if (dateFrom) result = result.filter(b => b.checkIn >= dateFrom);
    if (dateTo) result = result.filter(b => b.checkIn <= dateTo);
    return result;
  }, [bills, statusFilter, search, dateFrom, dateTo]);

  const { page, setPage, pageSize, setPageSize, paginatedItems: pageBills, totalItems: billTotal, totalPages: billTotalPages, showPagination: showBillPagination } = usePagination(filteredBills);

  const unpaidCount = bills?.filter(b => b.paymentStatus === 'unpaid').length ?? 0;
  const totalRevenue = bills
    ?.filter(b => b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + b.totalAmount, 0) ?? 0;

  // ── Selection helpers ──────────────────────────────────────────────────────

  const allBillIds = useMemo(
    () => filteredBills.map(b => b.id),
    [filteredBills]
  );

  const isAllSelected = allBillIds.length > 0 && selectedIds.size === allBillIds.length;
  const isIndeterminate = selectedIds.size > 0 && !isAllSelected;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allBillIds));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkPrint = () => {
    const ids = Array.from(selectedIds).join(',');
    window.open(`/bill/print?ids=${ids}`, '_blank');
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleVoidConfirm = async () => {
    if (!firestore || !voidBill) return;
    try {
      await updateDoc(doc(firestore, 'bills', voidBill.id), { paymentStatus: 'void' });
      toast({ title: 'Bill Voided', description: `Bill for ${voidBill.guestName} has been voided.` });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to void bill.' });
    } finally {
      setVoidBill(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!firestore || !deleteBill) return;
    try {
      await deleteDoc(doc(firestore, 'bills', deleteBill.id));
      setSelectedIds(prev => { const next = new Set(prev); next.delete(deleteBill.id); return next; });
      toast({ title: 'Bill Deleted', description: `Bill for ${deleteBill.guestName} deleted.` });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete bill.' });
    } finally {
      setDeleteBill(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Bills</h1>
        <GenerateBillDialog
          bookings={(bookings as BookingWithId[]) ?? []}
          existingBillBookingIds={existingBillBookingIds}
          taxRate={taxRate}
          serviceChargeRate={serviceChargeRate}
          onCreated={() => setRefresh(n => n + 1)}
          initialBookingId={autoBookingId}
        />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary opacity-70" />
            <div>
              <p className="text-xs text-muted-foreground">Total Bills</p>
              <p className="text-2xl font-bold">{bills?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="p-4 flex items-center gap-3">
            <IndianRupee className="h-8 w-8 text-destructive opacity-70" />
            <div>
              <p className="text-xs text-muted-foreground">Pending Bills</p>
              <p className="text-2xl font-bold text-destructive">{unpaidCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 col-span-2 md:col-span-1">
          <CardContent className="p-4 flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-green-600 opacity-70" />
            <div>
              <p className="text-xs text-muted-foreground">Revenue Collected</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search guest name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-8 w-56"
        />
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v as Bill['paymentStatus'] | 'all'); setPage(1); }}>
          <SelectTrigger className="h-8 w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="void">Void</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center h-8 border border-input rounded-md bg-background px-2.5 gap-1.5 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground whitespace-nowrap">Check-in</span>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="bg-transparent text-sm outline-none w-[116px] text-foreground"
            title="From date"
          />
          <span className="text-muted-foreground text-xs">–</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="bg-transparent text-sm outline-none w-[116px] text-foreground"
            title="To date"
          />
        </div>
        {(search || statusFilter !== 'all' || dateFrom || dateTo) && (
          <Button size="sm" variant="ghost" className="h-8" onClick={() => { setSearch(''); setStatusFilter('all'); setDateFrom(''); setDateTo(''); }}>
            Clear filters
          </Button>
        )}
      </div>

      {/* Bulk action bar — appears when rows are selected */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
          <span className="text-sm font-medium text-primary">
            {selectedIds.size} bill{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2 ml-auto">
            <Button size="sm" onClick={handleBulkPrint}>
              <Printer className="h-4 w-4 mr-1.5" />
              Print Selected ({selectedIds.size})
            </Button>
            <Button size="sm" variant="ghost" onClick={clearSelection}>
              <X className="h-4 w-4 mr-1" /> Clear
            </Button>
          </div>
        </div>
      )}

      {/* Bills Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Bills</CardTitle>
          <CardDescription>Generated bills for guest stays.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={isAllSelected}
                    data-state={isIndeterminate ? 'indeterminate' : undefined}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all bills"
                  />
                </TableHead>
                <TableHead>Guest</TableHead>
                <TableHead className="hidden md:table-cell">Room</TableHead>
                <TableHead className="hidden md:table-cell">Check-in</TableHead>
                <TableHead className="hidden md:table-cell">Check-out</TableHead>
                <TableHead className="text-right">Charges</TableHead>
                <TableHead className="text-right hidden lg:table-cell">Tax</TableHead>
                <TableHead className="text-right font-bold">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {billsLoading && [...Array(4)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={10}><Skeleton className="h-8 w-full" /></TableCell>
                </TableRow>
              ))}

              {!billsLoading && filteredBills.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                    <Receipt className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    {bills?.length ? 'No bills match the current filters.' : 'No bills generated yet.'}
                  </TableCell>
                </TableRow>
              )}

              {pageBills.map(b => {
                const isSelected = selectedIds.has(b.id);

                return (
                  <TableRow
                    key={b.id}
                    className={isSelected ? 'bg-primary/5' : ''}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleOne(b.id)}
                        aria-label={`Select ${b.guestName}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{b.guestName}</div>
                      <div className="text-xs text-muted-foreground">{b.numberOfNights} nights</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {b.roomNumber ? `Room ${b.roomNumber}` : '—'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {format(parseISO(b.checkIn), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {format(parseISO(b.checkOut), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatCurrency(b.roomCharges)}
                    </TableCell>
                    <TableCell className="text-right text-sm hidden lg:table-cell">
                      {formatCurrency(b.taxAmount)}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(b.totalAmount)}
                    </TableCell>
                    <TableCell><PaymentBadge status={b.paymentStatus} isFinal={b.isFinal} /></TableCell>
                    <TableCell className="text-right">
                      <BillRowActions
                        bill={b}
                        hotelName={hotelName}
                        onView={() => setViewBill(b)}
                        onEdit={() => setEditDraftBill(b)}
                        onPay={() => setPayBill(b)}
                        onVoid={() => setVoidBill(b)}
                        onDelete={() => setDeleteBill(b)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {showBillPagination && (
            <TablePagination
              page={page}
              totalPages={billTotalPages}
              totalItems={billTotal}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </CardContent>
      </Card>

      <ViewBillDialog
        bill={viewBill}
        open={!!viewBill}
        onOpenChange={open => !open && setViewBill(null)}
        hotelName={hotelName}
      />
      <EditDraftBillDialog
        bill={editDraftBill}
        bookings={bookings ? bookings.map((b, i) => ({ ...b, id: b.id || `booking-${i}` })) : []}
        open={!!editDraftBill}
        onOpenChange={open => !open && setEditDraftBill(null)}
        onUpdated={() => setRefresh(r => r + 1)}
      />
      <MarkPaymentDialog
        bill={payBill}
        open={!!payBill}
        onOpenChange={open => !open && setPayBill(null)}
      />

      {/* Void confirmation */}
      <AlertDialog open={!!voidBill} onOpenChange={open => !open && setVoidBill(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void this bill?</AlertDialogTitle>
            <AlertDialogDescription>
              This marks the bill for <strong>{voidBill?.guestName}</strong> as void. The record is kept for audit purposes but the bill will be shown as invalid. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleVoidConfirm}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              <Ban className="h-4 w-4 mr-1.5" /> Void Bill
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteBill} onOpenChange={open => !open && setDeleteBill(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this bill?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the bill for <strong>{deleteBill?.guestName}</strong> (₹{deleteBill?.totalAmount.toLocaleString('en-IN')}). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-1.5" /> Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
