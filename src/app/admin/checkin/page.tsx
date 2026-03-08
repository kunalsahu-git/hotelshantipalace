'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { collection, query, orderBy, runTransaction, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { format, addDays, differenceInCalendarDays, parseISO } from 'date-fns';
import { LogIn, LogOut, UserCheck, UserX, CheckCircle2, Plus } from 'lucide-react';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Booking, Room } from '@/lib/types';
import { roomCategories } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { CheckInWizard } from '@/components/admin/checkin-wizard';

type BookingWithId = Booking & { id: string };
type RoomWithId = Room & { id: string };

// ─── Booking Row ──────────────────────────────────────────────────────────────

function BookingRow({
  booking,
  action,
  onAction,
  isLoading,
}: {
  booking: BookingWithId;
  action: 'checkin' | 'checkout';
  onAction: (b: BookingWithId) => void;
  isLoading: boolean;
}) {
  return (
    <TableRow className={isLoading ? 'opacity-50' : ''}>
      <TableCell>
        <div className="font-medium">{booking.guestName}</div>
        <div className="text-xs text-muted-foreground">{booking.guestPhone}</div>
      </TableCell>
      <TableCell className="text-sm">{booking.categoryName}</TableCell>
      <TableCell className="text-sm">
        {booking.roomNumber ? (
          <span className="font-semibold">Room {booking.roomNumber}</span>
        ) : (
          <span className="text-muted-foreground italic">Not assigned</span>
        )}
      </TableCell>
      <TableCell className="text-sm">{booking.numberOfNights} night{booking.numberOfNights > 1 ? 's' : ''}</TableCell>
      <TableCell className="text-sm">{booking.numberOfGuests} guest{booking.numberOfGuests > 1 ? 's' : ''}</TableCell>
      <TableCell className="text-right">
        <Button
          size="sm"
          variant={action === 'checkin' ? 'default' : 'outline'}
          onClick={() => onAction(booking)}
          disabled={isLoading}
        >
          {action === 'checkin' ? (
            <><LogIn className="h-3.5 w-3.5 mr-1" /> Check In</>
          ) : (
            <><LogOut className="h-3.5 w-3.5 mr-1" /> Check Out</>
          )}
        </Button>
      </TableCell>
    </TableRow>
  );
}

// ─── Walk-in Dialog ───────────────────────────────────────────────────────────

function WalkInDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const today = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [categoryId, setCategoryId] = useState(roomCategories[0]?.id ?? '');
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedCategory = roomCategories.find(c => c.id === categoryId);
  const numberOfNights = Math.max(1, differenceInCalendarDays(parseISO(checkOut), parseISO(today)));
  const totalPrice = (selectedCategory?.basePrice ?? 0) * numberOfNights;

  const handleCreate = async () => {
    if (!firestore) return;
    if (!guestName.trim() || !guestPhone.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Guest name and phone are required.' });
      return;
    }
    if (!checkOut || checkOut <= today) {
      toast({ variant: 'destructive', title: 'Error', description: 'Check-out must be after today.' });
      return;
    }

    setSaving(true);
    try {
      // Create guest record
      const guestRef = await addDoc(collection(firestore, 'guests'), {
        name: guestName.trim(),
        phone: guestPhone.trim(),
        email: guestEmail.trim(),
        totalStays: 0,
        source: 'walkin',
        createdAt: serverTimestamp(),
      });

      // Create booking
      await addDoc(collection(firestore, 'bookings'), {
        guestId: guestRef.id,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        guestEmail: guestEmail.trim(),
        categoryId,
        categoryName: selectedCategory?.name ?? '',
        checkIn: today,
        checkOut,
        numberOfNights,
        numberOfGuests,
        status: 'reserved',
        bookingType: 'walkin',
        source: 'admin',
        totalPrice,
        specialRequests: specialRequests.trim(),
        createdAt: serverTimestamp(),
      });

      toast({ title: 'Walk-in Created', description: `${guestName} added to today's arrivals.` });
      onCreated();
      onOpenChange(false);

      // Reset
      setGuestName(''); setGuestPhone(''); setGuestEmail('');
      setCategoryId(roomCategories[0]?.id ?? '');
      setCheckOut(tomorrow); setNumberOfGuests(1); setSpecialRequests('');
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create walk-in booking.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Walk-in Booking</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Guest Name *</Label>
              <Input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Full name" />
            </div>
            <div>
              <Label>Phone *</Label>
              <Input value={guestPhone} onChange={e => setGuestPhone(e.target.value)} placeholder="+91..." />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={guestEmail} onChange={e => setGuestEmail(e.target.value)} type="email" placeholder="Optional" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Room Category</Label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {roomCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Number of Guests</Label>
              <Input
                type="number"
                min={1}
                max={selectedCategory?.maxOccupancy ?? 4}
                value={numberOfGuests}
                onChange={e => setNumberOfGuests(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Check-in</Label>
              <Input value={today} disabled className="bg-muted" />
            </div>
            <div>
              <Label>Check-out</Label>
              <Input
                type="date"
                value={checkOut}
                min={tomorrow}
                onChange={e => setCheckOut(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Special Requests</Label>
            <Input value={specialRequests} onChange={e => setSpecialRequests(e.target.value)} placeholder="Optional" />
          </div>

          {/* Summary */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <span>{numberOfNights} night{numberOfNights > 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total:</span>
              <span>₹{totalPrice.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={saving}>
            {saving ? 'Creating...' : 'Create & Check In'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CheckinPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [checkInBooking, setCheckInBooking] = useState<BookingWithId | null>(null);
  const [checkOutDone, setCheckOutDone] = useState<BookingWithId | null>(null);
  const [walkInOpen, setWalkInOpen] = useState(false);

  const bookingsQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'bookings'), orderBy('checkIn', 'asc')) : null,
    [firestore]
  );
  const { data: bookings, isLoading: bookingsLoading } = useCollection<Booking>(bookingsQuery);

  const roomsQuery = useMemoFirebase(
    () => firestore ? collection(firestore, 'rooms') : null,
    [firestore]
  );
  const { data: rooms } = useCollection<Room>(roomsQuery);

  const today = format(new Date(), 'yyyy-MM-dd');

  const todayArrivals = useMemo(
    () => (bookings?.filter(b => b.checkIn === today && b.status === 'reserved') as BookingWithId[]) ?? [],
    [bookings, today]
  );

  const todayDepartures = useMemo(
    () => (bookings?.filter(b => b.checkOut === today && b.status === 'checked_in') as BookingWithId[]) ?? [],
    [bookings, today]
  );

  const availableRooms = useMemo(
    () => (rooms?.filter(r => r.status === 'available') as RoomWithId[]) ?? [],
    [rooms]
  );

  const handleCheckInClick = (booking: BookingWithId) => {
    setCheckInBooking(booking);
  };

  const handleCheckInConfirm = async (booking: BookingWithId, room: RoomWithId, paymentType: 'advance' | 'paylater') => {
    if (!firestore) return;
    setLoadingId(booking.id);
    try {
      await runTransaction(firestore, async tx => {
        tx.update(doc(firestore, 'bookings', booking.id), {
          status: 'checked_in',
          roomId: room.id,
          roomNumber: room.roomNumber,
          paymentType,
        });
        tx.update(doc(firestore, 'rooms', room.id), {
          status: 'occupied',
          currentBookingId: booking.id,
        });
      });
      toast({
        title: 'Checked In',
        description: `${booking.guestName} → Room ${room.roomNumber}. Payment: ${paymentType === 'advance' ? 'Advance Paid' : 'Pay at Checkout'}.`
      });
      setCheckInBooking(null);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Check-in failed. Try again.' });
    } finally {
      setLoadingId(null);
    }
  };

  const handleCheckOut = async (booking: BookingWithId) => {
    if (!firestore) return;
    setLoadingId(booking.id);
    try {
      await runTransaction(firestore, async tx => {
        let currentTotalStays: number | null = null;
        const guestRef = booking.guestId ? doc(firestore, 'guests', booking.guestId) : null;
        if (guestRef) {
          const guestSnap = await tx.get(guestRef);
          if (guestSnap.exists()) currentTotalStays = guestSnap.data().totalStays ?? 0;
        }

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

  const skeletonRows = [...Array(3)].map((_, i) => (
    <TableRow key={i}>
      <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
    </TableRow>
  ));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Check-in / Check-out</h1>
          <p className="text-muted-foreground mt-1">Today — {format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
        </div>
        <Button onClick={() => setWalkInOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Walk-in
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <UserCheck className="h-9 w-9 text-primary opacity-80" />
            <div>
              <p className="text-xs text-muted-foreground">Arrivals Today</p>
              <p className="text-3xl font-bold">{todayArrivals.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <UserX className="h-9 w-9 text-orange-500 opacity-80" />
            <div>
              <p className="text-xs text-muted-foreground">Departures Today</p>
              <p className="text-3xl font-bold">{todayDepartures.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Arrivals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5 text-primary" /> Today&apos;s Arrivals
          </CardTitle>
          <CardDescription>Reserved bookings with check-in date today.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Nights</TableHead>
                <TableHead>Guests</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookingsLoading && skeletonRows}
              {!bookingsLoading && todayArrivals.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    No arrivals scheduled for today.
                  </TableCell>
                </TableRow>
              )}
              {todayArrivals.map(b => (
                <BookingRow
                  key={b.id}
                  booking={b}
                  action="checkin"
                  onAction={handleCheckInClick}
                  isLoading={loadingId === b.id}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Departures */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-orange-500" /> Today&apos;s Departures
          </CardTitle>
          <CardDescription>Checked-in guests with check-out date today.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Nights</TableHead>
                <TableHead>Guests</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookingsLoading && skeletonRows}
              {!bookingsLoading && todayDepartures.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    No departures scheduled for today.
                  </TableCell>
                </TableRow>
              )}
              {todayDepartures.map(b => (
                <BookingRow
                  key={b.id}
                  booking={b}
                  action="checkout"
                  onAction={handleCheckOut}
                  isLoading={loadingId === b.id}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Walk-in Dialog */}
      <WalkInDialog
        open={walkInOpen}
        onOpenChange={setWalkInOpen}
        onCreated={() => {}}
      />

      {/* Check-in Wizard */}
      {checkInBooking && (
        <CheckInWizard
          booking={checkInBooking}
          availableRooms={availableRooms}
          open={!!checkInBooking}
          onOpenChange={open => !open && setCheckInBooking(null)}
          onConfirm={handleCheckInConfirm}
          isLoading={!!loadingId}
        />
      )}

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
            <Button variant="secondary" onClick={() => setCheckOutDone(null)}>Later</Button>
            <Button asChild onClick={() => setCheckOutDone(null)}>
              <Link href={`/admin/bills?bookingId=${checkOutDone?.id}`}>Generate Bill</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
