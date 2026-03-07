'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { collection, query, orderBy, runTransaction, doc, getDoc } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import { LogIn, LogOut, UserCheck, UserX, BedDouble, CheckCircle2, AlertTriangle } from 'lucide-react';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Booking, Room } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

type BookingWithId = Booking & { id: string };
type RoomWithId = Room & { id: string };

// ─── Room Select Dialog (P1.4) ────────────────────────────────────────────────

function RoomSelectDialog({
  booking,
  availableRooms,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  guestIdMissing,
}: {
  booking: BookingWithId | null;
  availableRooms: RoomWithId[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (booking: BookingWithId, room: RoomWithId) => void;
  isLoading: boolean;
  guestIdMissing: boolean;
}) {
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');

  if (!booking) return null;

  const matchingRooms = availableRooms
    .filter(r => r.categoryId === booking.categoryId)
    .sort((a, b) => {
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
          {guestIdMissing && (
            <div className="flex items-start gap-2 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2.5 text-sm text-yellow-800">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-yellow-600" />
              <span>Guest ID not on file. Please collect ID proof before check-in.</span>
            </div>
          )}
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CheckinPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [checkInBooking, setCheckInBooking] = useState<BookingWithId | null>(null);
  const [guestIdMissing, setGuestIdMissing] = useState(false);
  const [checkOutDone, setCheckOutDone] = useState<BookingWithId | null>(null);

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

  // P1.4 — opens room selection dialog; P2.3 — check guest ID
  const handleCheckInClick = async (booking: BookingWithId) => {
    setCheckInBooking(booking);
    setGuestIdMissing(false);
    if (booking.guestId && firestore) {
      try {
        const snap = await getDoc(doc(firestore, 'guests', booking.guestId));
        if (snap.exists()) {
          const data = snap.data();
          setGuestIdMissing(!data.idType && !data.idNumber);
        } else {
          setGuestIdMissing(true);
        }
      } catch {
        // If fetch fails, don't block check-in
      }
    } else {
      setGuestIdMissing(true); // No guest record at all
    }
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
        // All reads before any writes
        let currentTotalStays: number | null = null;
        const guestRef = booking.guestId ? doc(firestore, 'guests', booking.guestId) : null;
        if (guestRef) {
          const guestSnap = await tx.get(guestRef);
          if (guestSnap.exists()) currentTotalStays = guestSnap.data().totalStays ?? 0;
        }

        // Writes
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
      <div>
        <h1 className="text-3xl font-bold">Check-in / Check-out</h1>
        <p className="text-muted-foreground mt-1">Today — {format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
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

      {/* Room Select Dialog */}
      <RoomSelectDialog
        booking={checkInBooking}
        availableRooms={availableRooms}
        open={!!checkInBooking}
        onOpenChange={open => !open && setCheckInBooking(null)}
        onConfirm={handleCheckInConfirm}
        isLoading={!!loadingId}
        guestIdMissing={guestIdMissing}
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
