'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  doc,
  updateDoc,
  runTransaction,
} from 'firebase/firestore';
import { format, parseISO, differenceInDays, isValid } from 'date-fns';
import {
  LogIn,
  LogOut,
  XCircle,
  Globe,
  Handshake,
  Calendar,
  BedDouble,
  CheckCircle2,
  Eye,
  Pencil,
  CalendarDays,
  ArrowUpDown,
  SlidersHorizontal,
  AlertTriangle,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Booking, Room } from '@/lib/types';
import { toDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { usePagination } from '@/hooks/use-pagination';
import { TablePagination } from '@/components/admin/table-pagination';
import { Textarea } from '@/components/ui/textarea';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { NewBookingDialog } from '@/components/admin/new-booking-dialog';

type BookingWithId = Booking & { id: string };
type RoomWithId = Room & { id: string };
type TabValue = 'all' | 'reserved' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';

// ─── Status & Source Badges ───────────────────────────────────────────────────

function StatusBadge({ status }: { status: Booking['status'] }) {
  switch (status) {
    case 'reserved': return <Badge variant="default">Reserved</Badge>;
    case 'checked_in': return <Badge className="bg-green-600 hover:bg-green-600 text-white">Checked In</Badge>;
    case 'checked_out': return <Badge variant="secondary">Checked Out</Badge>;
    case 'cancelled': return <Badge variant="destructive">Cancelled</Badge>;
    case 'no_show': return <Badge className="bg-orange-500 hover:bg-orange-500 text-white">No Show</Badge>;
    default: return <Badge variant="secondary">{status}</Badge>;
  }
}

function SourceBadge({ source }: { source: Booking['source'] }) {
  return (
    <Badge variant="outline" className="gap-1 font-normal">
      {source === 'website' ? <Globe className="h-3 w-3" /> : <Handshake className="h-3 w-3" />}
      {source === 'website' ? 'Website' : 'Walk-in'}
    </Badge>
  );
}

// ─── View Booking Dialog (P1.3) ───────────────────────────────────────────────

function ViewBookingDialog({
  booking,
  open,
  onOpenChange,
}: {
  booking: BookingWithId | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!booking) return null;
  const b = booking;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Booking Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {/* Status row */}
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={b.status} />
            <SourceBadge source={b.source} />
            <Badge variant="outline" className="capitalize font-normal">{b.bookingType}</Badge>
          </div>

          <Separator />

          {/* Guest info */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Guest</p>
            <div className="grid grid-cols-2 gap-y-2">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{b.guestName}</span>
              <span className="text-muted-foreground">Phone</span>
              <span>{b.guestPhone || '—'}</span>
              <span className="text-muted-foreground">Email</span>
              <span className="break-all">{b.guestEmail || '—'}</span>
              <span className="text-muted-foreground">Guests</span>
              <span>{b.numberOfGuests}</span>
            </div>
          </div>

          <Separator />

          {/* Stay info */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Stay</p>
            <div className="grid grid-cols-2 gap-y-2">
              <span className="text-muted-foreground">Category</span>
              <span>{b.categoryName}</span>
              {b.roomNumber && <>
                <span className="text-muted-foreground">Room</span>
                <span className="font-medium">Room {b.roomNumber}</span>
              </>}
              <span className="text-muted-foreground">Check-in</span>
              <span>{format(parseISO(b.checkIn), 'dd MMM yyyy')}</span>
              <span className="text-muted-foreground">Check-out</span>
              <span>{format(parseISO(b.checkOut), 'dd MMM yyyy')}</span>
              <span className="text-muted-foreground">Nights</span>
              <span>{b.numberOfNights}</span>
              {b.totalPrice && <>
                <span className="text-muted-foreground">Total Price</span>
                <span className="font-semibold">₹{b.totalPrice.toLocaleString('en-IN')}</span>
              </>}
            </div>
          </div>

          {b.specialRequests && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Special Requests</p>
                <p className="bg-muted/40 rounded-md p-3 leading-relaxed">{b.specialRequests}</p>
              </div>
            </>
          )}

          {b.createdAt && (
            <>
              <Separator />
              <p className="text-xs text-muted-foreground">
                Booked on {toDate(b.createdAt) ? format(toDate(b.createdAt)!, 'dd MMM yyyy, hh:mm a') : '—'}
                {b.createdBy ? ` · by ${b.createdBy}` : ''}
              </p>
            </>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Room Select Dialog (P1.4) ────────────────────────────────────────────────

function RoomSelectDialog({
  booking,
  availableRooms,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: {
  booking: BookingWithId | null;
  availableRooms: RoomWithId[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (booking: BookingWithId, room: RoomWithId) => void;
  isLoading: boolean;
}) {
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');

  if (!booking) return null;

  const matchingRooms = availableRooms
    .filter(r => r.categoryId === booking.categoryId)
    .sort((a, b) => {
      // inspected first, then clean, then others
      const order = { inspected: 0, clean: 1, dirty: 2, in_progress: 3 };
      return (order[a.housekeepingStatus] ?? 4) - (order[b.housekeepingStatus] ?? 4);
    });

  const handleConfirm = () => {
    const room = matchingRooms.find(r => r.id === selectedRoomId);
    if (room) onConfirm(booking, room);
  };

  const hkBadge = (status: Room['housekeepingStatus']) => {
    switch (status) {
      case 'inspected': return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Inspected ✓</span>;
      case 'clean':     return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-green-100 text-green-700">Clean</span>;
      default:          return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">Not Ready</span>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) setSelectedRoomId(''); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign Room — {booking.guestName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Select an available <strong>{booking.categoryName}</strong> room:
          </p>

          {matchingRooms.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              <BedDouble className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No available {booking.categoryName} rooms. Update room status in the Rooms page first.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {matchingRooms.map(room => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`w-full text-left rounded-lg border p-3 transition-colors ${
                    selectedRoomId === room.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40 hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">Room {room.roomNumber}</p>
                    {hkBadge(room.housekeepingStatus)}
                  </div>
                  <p className="text-xs text-muted-foreground">{room.floor} · {room.categoryName}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Cancel</Button>
          </DialogClose>
          <Button
            onClick={handleConfirm}
            disabled={!selectedRoomId || isLoading || matchingRooms.length === 0}
          >
            <LogIn className="h-4 w-4 mr-1.5" />
            {isLoading ? 'Checking In...' : 'Check In'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Booking Dialog (P2.9) ───────────────────────────────────────────────

const EditBookingSchema = z.object({
  checkIn: z.date({ required_error: 'Select a check-in date.' }),
  checkOut: z.date({ required_error: 'Select a check-out date.' }),
  numberOfGuests: z.coerce.number().min(1).max(20),
  specialRequests: z.string().optional(),
}).refine(d => d.checkOut > d.checkIn, {
  message: 'Check-out must be after check-in.',
  path: ['checkOut'],
});
type EditBookingData = z.infer<typeof EditBookingSchema>;

function EditBookingDialog({
  booking,
  open,
  onOpenChange,
}: {
  booking: BookingWithId | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<EditBookingData>({
    resolver: zodResolver(EditBookingSchema),
  });

  // Re-populate form every time the dialog opens with a booking
  useEffect(() => {
    if (!open || !booking) return;
    form.reset({
      checkIn: parseISO(booking.checkIn),
      checkOut: parseISO(booking.checkOut),
      numberOfGuests: booking.numberOfGuests,
      specialRequests: booking.specialRequests ?? '',
    });
  }, [open, booking]);

  const checkIn = form.watch('checkIn');

  if (!booking) return null;

  const onSubmit = async (data: EditBookingData) => {
    if (!firestore) return;
    const numberOfNights = differenceInDays(data.checkOut, data.checkIn);
    const perNight = booking.numberOfNights > 0 ? (booking.totalPrice ?? 0) / booking.numberOfNights : 0;
    const totalPrice = Math.round(perNight * numberOfNights);
    try {
      await updateDoc(doc(firestore, 'bookings', booking.id), {
        checkIn: format(data.checkIn, 'yyyy-MM-dd'),
        checkOut: format(data.checkOut, 'yyyy-MM-dd'),
        numberOfNights,
        totalPrice,
        numberOfGuests: data.numberOfGuests,
        specialRequests: data.specialRequests ?? '',
      });
      toast({ title: 'Booking Updated', description: `Booking for ${booking.guestName} updated.` });
      onOpenChange(false);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update booking.' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) form.reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Booking — {booking.guestName}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="checkIn" render={({ field }) => (
                <FormItem>
                  <FormLabel>Check-in Date</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        type="date"
                        className="pl-9"
                        value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                        onChange={e => {
                          const d = parseISO(e.target.value);
                          field.onChange(isValid(d) ? d : undefined);
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="checkOut" render={({ field }) => (
                <FormItem>
                  <FormLabel>Check-out Date</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        type="date"
                        className="pl-9"
                        value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                        min={checkIn ? format(checkIn, 'yyyy-MM-dd') : undefined}
                        onChange={e => {
                          const d = parseISO(e.target.value);
                          field.onChange(isValid(d) ? d : undefined);
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="numberOfGuests" render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Guests</FormLabel>
                <FormControl><Input type="number" min={1} max={20} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="specialRequests" render={({ field }) => (
              <FormItem>
                <FormLabel>Special Requests</FormLabel>
                <FormControl><Textarea placeholder="Any notes or special requests..." rows={3} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Extend Stay Dialog ────────────────────────────────────────────────────────

function ExtendStayDialog({
  booking,
  open,
  onOpenChange,
}: {
  booking: BookingWithId | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [newCheckOut, setNewCheckOut] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && booking) setNewCheckOut(booking.checkOut);
  }, [open, booking]);

  const minDate = booking ? booking.checkOut : '';
  const extraNights = booking && newCheckOut > booking.checkOut
    ? differenceInDays(parseISO(newCheckOut), parseISO(booking.checkOut))
    : 0;

  const handleSubmit = async () => {
    if (!firestore || !booking || !newCheckOut || newCheckOut <= booking.checkOut) return;
    setIsSubmitting(true);
    try {
      const totalNights = differenceInDays(parseISO(newCheckOut), parseISO(booking.checkIn));
      await updateDoc(doc(firestore, 'bookings', booking.id), {
        checkOut: newCheckOut,
        numberOfNights: totalNights,
      });
      toast({ title: 'Stay Extended', description: `Check-out updated to ${format(parseISO(newCheckOut), 'dd MMM yyyy')}.` });
      onOpenChange(false);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not extend stay.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Extend Stay
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="bg-muted/40 rounded-md p-3 space-y-1">
            <p className="font-medium">{booking.guestName}</p>
            {booking.roomNumber && <p className="text-muted-foreground">Room {booking.roomNumber}</p>}
            <p className="text-muted-foreground">Current check-out: {format(parseISO(booking.checkOut), 'dd MMM yyyy')}</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">New Check-out Date</label>
            <input
              type="date"
              value={newCheckOut}
              min={booking.checkOut}
              onChange={e => setNewCheckOut(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
            {extraNights > 0 && (
              <p className="text-xs text-muted-foreground">
                +{extraNights} night{extraNights !== 1 ? 's' : ''} added
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
          <Button onClick={handleSubmit} disabled={isSubmitting || extraNights <= 0}>
            {isSubmitting ? 'Saving...' : 'Extend Stay'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BookingsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'website' | 'admin'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'walkin' | 'advance'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'checkin_asc' | 'checkin_desc' | 'created_desc' | 'created_asc' | 'name_asc' | 'nights_desc' | 'price_desc'>('created_desc');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [viewBooking, setViewBooking] = useState<BookingWithId | null>(null);
  const [editBooking, setEditBooking] = useState<BookingWithId | null>(null);
  const [checkInBooking, setCheckInBooking] = useState<BookingWithId | null>(null);
  const [checkOutDone, setCheckOutDone] = useState<BookingWithId | null>(null);
  const [extendBooking, setExtendBooking] = useState<BookingWithId | null>(null);

  const bookingsQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'bookings'), orderBy('createdAt', 'desc')) : null,
    [firestore]
  );
  const { data: bookings, isLoading: bookingsLoading } = useCollection<Booking>(bookingsQuery);

  const roomsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'rooms') : null),
    [firestore]
  );
  const { data: rooms } = useCollection<Room>(roomsQuery);

  const availableRooms = useMemo(
    () => (rooms?.filter(r => r.status === 'available') as RoomWithId[]) ?? [],
    [rooms]
  );

  const counts = useMemo(() => ({
    all: bookings?.length ?? 0,
    reserved: bookings?.filter(b => b.status === 'reserved').length ?? 0,
    checked_in: bookings?.filter(b => b.status === 'checked_in').length ?? 0,
    checked_out: bookings?.filter(b => b.status === 'checked_out').length ?? 0,
    cancelled: bookings?.filter(b => b.status === 'cancelled').length ?? 0,
    no_show: bookings?.filter(b => b.status === 'no_show').length ?? 0,
  }), [bookings]);

  // Unique categories from bookings for the category filter dropdown
  const uniqueCategories = useMemo(() => {
    const seen = new Map<string, string>();
    (bookings ?? []).forEach(b => { if (!seen.has(b.categoryId)) seen.set(b.categoryId, b.categoryName); });
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [bookings]);

  const hasActiveFilters = search || dateFrom || dateTo || sourceFilter !== 'all' || typeFilter !== 'all' || categoryFilter !== 'all';

  const filteredBookings = useMemo(() => {
    let result = (bookings ?? []) as BookingWithId[];

    if (activeTab !== 'all') result = result.filter(b => b.status === activeTab);
    if (sourceFilter !== 'all') result = result.filter(b => b.source === sourceFilter);
    if (typeFilter !== 'all') result = result.filter(b => b.bookingType === typeFilter);
    if (categoryFilter !== 'all') result = result.filter(b => b.categoryId === categoryFilter);
    if (dateFrom) result = result.filter(b => b.checkIn >= dateFrom);
    if (dateTo) result = result.filter(b => b.checkIn <= dateTo);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(b =>
        (b.guestName ?? '').toLowerCase().includes(q) ||
        (b.guestPhone ?? '').includes(q) ||
        (b.guestEmail ?? '').toLowerCase().includes(q) ||
        (b.roomNumber ?? '').includes(q)
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'checkin_asc':  return a.checkIn.localeCompare(b.checkIn);
        case 'checkin_desc': return b.checkIn.localeCompare(a.checkIn);
        case 'created_asc':  return (a.createdAt as any)?.seconds - (b.createdAt as any)?.seconds || 0;
        case 'name_asc':     return a.guestName.localeCompare(b.guestName);
        case 'nights_desc':  return b.numberOfNights - a.numberOfNights;
        case 'price_desc':   return (b.totalPrice ?? 0) - (a.totalPrice ?? 0);
        default:             return ((b.createdAt as any)?.seconds ?? 0) - ((a.createdAt as any)?.seconds ?? 0);
      }
    });

    return result;
  }, [bookings, activeTab, search, dateFrom, dateTo, sourceFilter, typeFilter, categoryFilter, sortBy]);

  const { page, setPage, pageSize, setPageSize, paginatedItems: pageBookings, totalItems, totalPages, showPagination } = usePagination(filteredBookings);

  // P1.4 — room selection: opens dialog, actual check-in happens on confirm
  const handleCheckIn = (booking: BookingWithId) => {
    setCheckInBooking(booking);
  };

  const handleCheckInConfirm = async (booking: BookingWithId, room: RoomWithId) => {
    if (!firestore) return;
    setLoadingId(booking.id);
    try {
      await runTransaction(firestore, async tx => {
        tx.update(doc(firestore, 'bookings', booking.id), {
          status: 'checked_in',
          roomId: room.id,
          roomNumber: room.roomNumber,
        });
        tx.update(doc(firestore, 'rooms', room.id), {
          status: 'occupied',
          currentBookingId: booking.id,
        });
      });
      toast({ title: 'Checked In', description: `${booking.guestName} → Room ${room.roomNumber}.` });
      setCheckInBooking(null);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Check-in failed. Try again.' });
    } finally {
      setLoadingId(null);
    }
  };

  // P1.2 — increment guest totalStays on check-out
  const handleCheckOut = async (booking: BookingWithId) => {
    if (!firestore) return;
    setLoadingId(booking.id);
    try {
      await runTransaction(firestore, async tx => {
        // All reads MUST come before any writes in a Firestore transaction
        let currentTotalStays: number | null = null;
        const guestRef = booking.guestId ? doc(firestore, 'guests', booking.guestId) : null;
        if (guestRef) {
          const guestSnap = await tx.get(guestRef);
          if (guestSnap.exists()) {
            currentTotalStays = guestSnap.data().totalStays ?? 0;
          }
        }

        // Writes after all reads
        tx.update(doc(firestore, 'bookings', booking.id), { status: 'checked_out' });
        if (booking.roomId) {
          tx.update(doc(firestore, 'rooms', booking.roomId), {
            status: 'dirty',
            housekeepingStatus: 'dirty',
            currentBookingId: null,
          });
        }
        if (guestRef && currentTotalStays !== null) {
          tx.update(guestRef, { totalStays: currentTotalStays + 1 });
        }
      });
      setCheckOutDone(booking);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Check-out failed. Try again.' });
    } finally {
      setLoadingId(null);
    }
  };

  const handleNoShow = async (booking: BookingWithId) => {
    if (!firestore) return;
    setLoadingId(booking.id);
    try {
      await updateDoc(doc(firestore, 'bookings', booking.id), { status: 'no_show' });
      toast({ title: 'Marked No-Show', description: `${booking.guestName} did not arrive.` });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update booking.' });
    } finally {
      setLoadingId(null);
    }
  };

  const handleCancel = async (booking: BookingWithId) => {
    if (!firestore) return;
    setLoadingId(booking.id);
    try {
      await updateDoc(doc(firestore, 'bookings', booking.id), { status: 'cancelled' });
      if (booking.roomId) {
        await updateDoc(doc(firestore, 'rooms', booking.roomId), {
          status: 'available',
          currentBookingId: null,
        });
      }
      toast({ title: 'Booking Cancelled', description: `Booking for ${booking.guestName} cancelled.` });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Cancellation failed.' });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Bookings</h1>
        <NewBookingDialog />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary opacity-80" />
            <div>
              <p className="text-xs text-muted-foreground">Reserved</p>
              <p className="text-2xl font-bold">{counts.reserved}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <LogIn className="h-8 w-8 text-green-600 opacity-80" />
            <div>
              <p className="text-xs text-muted-foreground">Checked In</p>
              <p className="text-2xl font-bold text-green-600">{counts.checked_in}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-muted-foreground opacity-80" />
            <div>
              <p className="text-xs text-muted-foreground">Checked Out</p>
              <p className="text-2xl font-bold">{counts.checked_out}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="h-8 w-8 text-destructive opacity-80" />
            <div>
              <p className="text-xs text-muted-foreground">Cancelled</p>
              <p className="text-2xl font-bold text-destructive">{counts.cancelled}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
          <CardDescription>
            Manage website and walk-in reservations.
            {hasActiveFilters && ` Showing ${filteredBookings.length} of ${bookings?.length ?? 0} bookings.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={v => { setActiveTab(v as TabValue); setPage(1); }} className="mb-4">
            <TabsList>
              <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
              <TabsTrigger value="reserved">Reserved ({counts.reserved})</TabsTrigger>
              <TabsTrigger value="checked_in">Checked In ({counts.checked_in})</TabsTrigger>
              <TabsTrigger value="checked_out">Checked Out ({counts.checked_out})</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled ({counts.cancelled})</TabsTrigger>
              {counts.no_show > 0 && (
                <TabsTrigger value="no_show">No-Show ({counts.no_show})</TabsTrigger>
              )}
            </TabsList>
          </Tabs>

          {/* Filter & Sort bar */}
          <div className="space-y-2 mb-4">
            {/* Row 1: Search + Sort */}
            <div className="flex flex-wrap gap-2 items-center">
              <Input
                placeholder="Search name, phone, email, room..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="h-8 w-64"
              />
              <div className="flex items-center gap-1.5 ml-auto">
                <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                <Select value={sortBy} onValueChange={v => { setSortBy(v as typeof sortBy); setPage(1); }}>
                  <SelectTrigger className="h-8 w-48 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_desc">Newest booking first</SelectItem>
                    <SelectItem value="created_asc">Oldest booking first</SelectItem>
                    <SelectItem value="checkin_asc">Check-in: earliest first</SelectItem>
                    <SelectItem value="checkin_desc">Check-in: latest first</SelectItem>
                    <SelectItem value="name_asc">Guest name: A → Z</SelectItem>
                    <SelectItem value="nights_desc">Longest stay first</SelectItem>
                    <SelectItem value="price_desc">Highest price first</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />

              <Select value={sourceFilter} onValueChange={v => { setSourceFilter(v as typeof sourceFilter); setPage(1); }}>
                <SelectTrigger className="h-8 w-32 text-sm">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="admin">Walk-in / Admin</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={v => { setTypeFilter(v as typeof typeFilter); setPage(1); }}>
                <SelectTrigger className="h-8 w-36 text-sm">
                  <SelectValue placeholder="Booking type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="walkin">Walk-in</SelectItem>
                  <SelectItem value="advance">Advance</SelectItem>
                </SelectContent>
              </Select>

              {uniqueCategories.length > 0 && (
                <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v); setPage(1); }}>
                  <SelectTrigger className="h-8 w-40 text-sm">
                    <SelectValue placeholder="Room category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {uniqueCategories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Separator orientation="vertical" className="h-6" />

              <div className="flex items-center h-8 border border-input rounded-md bg-background px-2.5 gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">Check-in</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                  className="bg-transparent text-sm outline-none w-[116px] text-foreground"
                />
                <span className="text-muted-foreground text-xs">–</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => { setDateTo(e.target.value); setPage(1); }}
                  className="bg-transparent text-sm outline-none w-[116px] text-foreground"
                />
              </div>

              {hasActiveFilters && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-muted-foreground"
                  onClick={() => {
                    setSearch(''); setDateFrom(''); setDateTo('');
                    setSourceFilter('all'); setTypeFilter('all'); setCategoryFilter('all');
                    setPage(1);
                  }}
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Clear filters
                </Button>
              )}

              <span className="ml-auto text-xs text-muted-foreground">
                {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead>Room / Category</TableHead>
                <TableHead>Check-In</TableHead>
                <TableHead>Check-Out</TableHead>
                <TableHead className="text-center">Nights</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Amount</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookingsLoading && [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={9}><Skeleton className="h-8 w-full" /></TableCell>
                </TableRow>
              ))}

              {!bookingsLoading && filteredBookings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                    <BedDouble className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    No bookings found.
                  </TableCell>
                </TableRow>
              )}

              {pageBookings.map(booking => {
                const isRowLoading = loadingId === booking.id;
                return (
                  <TableRow key={booking.id} className={isRowLoading ? 'opacity-50' : ''}>
                    <TableCell>
                      <div className="font-medium">{booking.guestName}</div>
                      <div className="text-xs text-muted-foreground">{booking.guestPhone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{booking.categoryName}</div>
                      {booking.roomNumber && (
                        <div className="text-xs text-muted-foreground">Room {booking.roomNumber}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(parseISO(booking.checkIn), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(parseISO(booking.checkOut), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell className="text-center text-sm">{booking.numberOfNights}</TableCell>
                    <TableCell className="text-right text-sm hidden sm:table-cell">
                      {booking.totalPrice ? `₹${booking.totalPrice.toLocaleString('en-IN')}` : '—'}
                    </TableCell>
                    <TableCell><SourceBadge source={booking.source} /></TableCell>
                    <TableCell><StatusBadge status={booking.status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        {/* View details — always visible */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setViewBooking(booking)}
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {booking.status === 'reserved' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditBooking(booking)}
                              title="Edit booking"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleCheckIn(booking)}
                              disabled={isRowLoading}
                            >
                              <LogIn className="h-3.5 w-3.5 mr-1" /> Check In
                            </Button>
                            {booking.checkIn < format(new Date(), 'yyyy-MM-dd') && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleNoShow(booking)}
                                disabled={isRowLoading}
                                title="Mark as No-Show"
                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              >
                                <AlertTriangle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCancel(booking)}
                              disabled={isRowLoading}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {booking.status === 'checked_in' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setExtendBooking(booking)}
                              disabled={isRowLoading}
                              title="Extend Stay"
                            >
                              <Calendar className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCheckOut(booking)}
                              disabled={isRowLoading}
                            >
                              <LogOut className="h-3.5 w-3.5 mr-1" /> Check Out
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {showPagination && (
            <TablePagination
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </CardContent>
      </Card>

      {/* View Booking Dialog */}
      <ViewBookingDialog
        booking={viewBooking}
        open={!!viewBooking}
        onOpenChange={open => !open && setViewBooking(null)}
      />

      {/* Edit Booking Dialog */}
      <EditBookingDialog
        booking={editBooking}
        open={!!editBooking}
        onOpenChange={open => !open && setEditBooking(null)}
      />

      {/* Room Select Dialog for Check-In */}
      <RoomSelectDialog
        booking={checkInBooking}
        availableRooms={availableRooms}
        open={!!checkInBooking}
        onOpenChange={open => !open && setCheckInBooking(null)}
        onConfirm={handleCheckInConfirm}
        isLoading={!!loadingId}
      />

      {/* Extend Stay Dialog */}
      <ExtendStayDialog
        booking={extendBooking}
        open={!!extendBooking}
        onOpenChange={open => !open && setExtendBooking(null)}
      />

      {/* Post-Checkout Bill Prompt */}
      <Dialog open={!!checkOutDone} onOpenChange={open => !open && setCheckOutDone(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Checked Out
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">{checkOutDone?.guestName}</strong> has been checked out
              {checkOutDone?.roomNumber ? ` from Room ${checkOutDone.roomNumber}` : ''}.
            </p>
            <p>Would you like to generate a bill for this stay?</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="secondary" onClick={() => setCheckOutDone(null)}>
              Later
            </Button>
            <Button asChild onClick={() => setCheckOutDone(null)}>
              <Link href={`/admin/bills?bookingId=${checkOutDone?.id}`}>Generate Bill</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
