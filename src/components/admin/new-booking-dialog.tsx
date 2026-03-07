'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  addDoc, collection, serverTimestamp,
  getDocs, query, where, updateDoc, doc, writeBatch,
} from 'firebase/firestore';
import { format, differenceInDays, parseISO, isValid } from 'date-fns';
import { Plus, AlertTriangle, CheckCircle2, CalendarDays, BedDouble, LogIn } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogTrigger, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRoomCategories } from '@/hooks/use-room-categories';
import { AdminBookingFormSchema, type AdminBookingFormData } from '@/lib/schemas';
import type { Booking, Room } from '@/lib/types';

export function NewBookingDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  prefill,
}: {
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  prefill?: { name?: string; email?: string; phone?: string };
} = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (v: boolean) => {
    if (controlledOnOpenChange) controlledOnOpenChange(v);
    else setInternalOpen(v);
  };
  const firestore = useFirestore();
  const { toast } = useToast();
  const { categories } = useRoomCategories();

  // Fetch rooms & bookings for availability check
  const roomsQuery = useMemoFirebase(
    () => (firestore && open ? collection(firestore, 'rooms') : null),
    [firestore, open]
  );
  const { data: rooms } = useCollection<Room>(roomsQuery);

  const bookingsQuery = useMemoFirebase(
    () => (firestore && open ? collection(firestore, 'bookings') : null),
    [firestore, open]
  );
  const { data: bookings } = useCollection<Booking>(bookingsQuery);

  const form = useForm<AdminBookingFormData>({
    resolver: zodResolver(AdminBookingFormSchema),
    defaultValues: {
      guestName: '',
      guestPhone: '',
      guestEmail: '',
      numberOfGuests: 1,
      categoryId: '',
      specialRequests: '',
      bookingType: 'walkin',
    },
  });

  const [instantCheckIn, setInstantCheckIn] = useState(false);
  const [instantRoomId, setInstantRoomId] = useState('');

  // When opened via enquiry prefill, populate guest fields
  useEffect(() => {
    if (open && prefill) {
      if (prefill.name) form.setValue('guestName', prefill.name);
      if (prefill.email) form.setValue('guestEmail', prefill.email);
      if (prefill.phone) form.setValue('guestPhone', prefill.phone);
    }
    if (!open) {
      setInstantCheckIn(false);
      setInstantRoomId('');
    }
  }, [open, prefill]);

  const checkIn = form.watch('checkIn');
  const checkOut = form.watch('checkOut');
  const categoryId = form.watch('categoryId');
  const bookingTypeWatched = form.watch('bookingType');

  const today = format(new Date(), 'yyyy-MM-dd');
  const checkInStr = checkIn ? format(checkIn, 'yyyy-MM-dd') : '';
  const showInstantOption = bookingTypeWatched === 'walkin' && checkInStr === today;

  // Available rooms for instant check-in (matching category, available status)
  const availableRoomsForInstant = useMemo(
    () => ((rooms ?? []) as (Room & { id: string })[]).filter(r => r.categoryId === categoryId && r.status === 'available' && r.isActive),
    [rooms, categoryId]
  );

  const selectedCategory = useMemo(
    () => categories.find(c => c.id === categoryId),
    [categories, categoryId]
  );

  const nights = checkIn && checkOut && checkOut > checkIn
    ? differenceInDays(checkOut, checkIn)
    : 0;
  const totalPrice = selectedCategory && nights > 0
    ? nights * selectedCategory.basePrice
    : 0;

  // Availability: count rooms of category vs overlapping active bookings
  const availability = useMemo(() => {
    if (!categoryId || !checkIn || !checkOut || checkOut <= checkIn) return null;

    const totalRooms = rooms?.filter(r => r.categoryId === categoryId && r.isActive).length ?? 0;
    if (totalRooms === 0) return { available: false, totalRooms: 0, conflicting: 0 };

    const newCheckIn = format(checkIn, 'yyyy-MM-dd');
    const newCheckOut = format(checkOut, 'yyyy-MM-dd');

    const conflicting = bookings?.filter(b =>
      b.categoryId === categoryId &&
      (b.status === 'reserved' || b.status === 'checked_in') &&
      b.checkIn < newCheckOut &&
      b.checkOut > newCheckIn
    ).length ?? 0;

    return {
      available: conflicting < totalRooms,
      totalRooms,
      conflicting,
      remaining: totalRooms - conflicting,
    };
  }, [categoryId, checkIn, checkOut, rooms, bookings]);

  const onSubmit = async (data: AdminBookingFormData) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Database not connected.' });
      return;
    }
    const category = categories.find(c => c.id === data.categoryId);
    if (!category) return;

    // Block submission if no availability
    if (availability && !availability.available) {
      toast({
        variant: 'destructive',
        title: 'No Availability',
        description: `All ${category.name} rooms are booked for these dates.`,
      });
      return;
    }

    const numberOfNights = differenceInDays(data.checkOut, data.checkIn);

    // Upsert guest: find by phone or create new
    let guestId: string | undefined;
    try {
      const guestsRef = collection(firestore, 'guests');
      const q = query(guestsRef, where('phone', '==', data.guestPhone));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const existing = snapshot.docs[0];
        guestId = existing.id;
        await updateDoc(doc(firestore, 'guests', guestId), {
          name: data.guestName,
          email: data.guestEmail,
        });
      } else {
        const newGuest = await addDoc(guestsRef, {
          name: data.guestName,
          phone: data.guestPhone,
          email: data.guestEmail,
          totalStays: 0,
          source: 'walkin',
          createdAt: serverTimestamp(),
        });
        guestId = newGuest.id;
      }
    } catch {
      // non-fatal — booking proceeds without guestId
    }

    const doInstantCheckIn = instantCheckIn && showInstantOption && !!instantRoomId;
    const selectedRoom = doInstantCheckIn
      ? availableRoomsForInstant.find(r => r.id === instantRoomId)
      : null;

    const payload: Omit<Booking, 'id'> = {
      guestName: data.guestName,
      guestPhone: data.guestPhone,
      guestEmail: data.guestEmail,
      numberOfGuests: data.numberOfGuests,
      categoryId: category.id,
      categoryName: category.name,
      checkIn: format(data.checkIn, 'yyyy-MM-dd'),
      checkOut: format(data.checkOut, 'yyyy-MM-dd'),
      numberOfNights,
      totalPrice: numberOfNights * category.basePrice,
      status: doInstantCheckIn ? 'checked_in' : 'reserved',
      bookingType: data.bookingType,
      source: 'admin',
      specialRequests: data.specialRequests || '',
      createdAt: serverTimestamp() as any,
      ...(guestId ? { guestId } : {}),
      ...(doInstantCheckIn && selectedRoom ? { roomId: selectedRoom.id, roomNumber: selectedRoom.roomNumber } : {}),
    };

    try {
      const bookingRef = await addDoc(collection(firestore, 'bookings'), payload);

      if (doInstantCheckIn && selectedRoom) {
        const batch = writeBatch(firestore);
        batch.update(doc(firestore, 'rooms', selectedRoom.id), {
          status: 'occupied',
          housekeepingStatus: 'dirty',
          currentBookingId: bookingRef.id,
        });
        await batch.commit();
        toast({ title: 'Checked In', description: `${data.guestName} checked in to Room ${selectedRoom.roomNumber}.` });
      } else {
        toast({ title: 'Booking Created', description: `Reservation for ${data.guestName} added.` });
      }

      form.reset();
      setOpen(false);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create booking.' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Booking
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Booking</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            {/* Booking Type */}
            <FormField control={form.control} name="bookingType" render={({ field }) => (
              <FormItem>
                <FormLabel>Booking Type</FormLabel>
                <FormControl>
                  <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-6">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="walkin" id="walkin" />
                      <label htmlFor="walkin" className="text-sm font-medium cursor-pointer">Walk-in</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="advance" id="advance" />
                      <label htmlFor="advance" className="text-sm font-medium cursor-pointer">Advance</label>
                    </div>
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )} />

            {/* Guest Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="guestName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input placeholder="Guest's full name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="guestPhone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl><Input placeholder="10-digit phone number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="guestEmail" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" placeholder="guest@example.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="numberOfGuests" render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Guests</FormLabel>
                  <FormControl><Input type="number" min={1} max={10} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Category */}
            <FormField control={form.control} name="categoryId" render={({ field }) => (
              <FormItem>
                <FormLabel>Room Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a room type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.filter(c => c.isActive).map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name} — ₹{cat.basePrice.toLocaleString()}/night
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            {/* Availability indicator */}
            {availability !== null && (
              <div className={cn(
                'rounded-md border p-3 flex items-center gap-2 text-sm',
                availability.available
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              )}>
                {availability.available ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                )}
                {availability.available
                  ? `${availability.remaining} of ${availability.totalRooms} ${selectedCategory?.name} room${availability.remaining !== 1 ? 's' : ''} available for these dates.`
                  : `No ${selectedCategory?.name} rooms available — all ${availability.totalRooms} room${availability.totalRooms !== 1 ? 's' : ''} booked for these dates.`
                }
              </div>
            )}

            {/* Price Preview */}
            {nights > 0 && selectedCategory && (
              <div className="rounded-md bg-primary/5 border border-primary/20 p-3 flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {nights} night{nights > 1 ? 's' : ''} × ₹{selectedCategory.basePrice.toLocaleString()}
                </span>
                <span className="font-bold text-primary">₹{totalPrice.toLocaleString()}</span>
              </div>
            )}

            <FormField control={form.control} name="specialRequests" render={({ field }) => (
              <FormItem>
                <FormLabel>Special Requests (optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Any notes or special requests..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            {/* Instant Check-In Option (walk-in, today only) */}
            {showInstantOption && categoryId && (
              <div className="rounded-md border border-primary/30 bg-primary/5 p-3 space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={instantCheckIn}
                    onChange={e => {
                      setInstantCheckIn(e.target.checked);
                      setInstantRoomId('');
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <LogIn className="h-4 w-4 text-primary" />
                    Instant Check-in — assign room now
                  </span>
                </label>
                {instantCheckIn && (
                  availableRoomsForInstant.length === 0 ? (
                    <p className="text-xs text-destructive pl-6">No available {selectedCategory?.name} rooms right now.</p>
                  ) : (
                    <div className="pl-6 space-y-1.5 max-h-40 overflow-y-auto">
                      {availableRoomsForInstant.map(room => (
                        <button
                          key={room.id}
                          type="button"
                          onClick={() => setInstantRoomId(room.id)}
                          className={`w-full text-left rounded border px-3 py-2 text-sm transition-colors ${
                            instantRoomId === room.id
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/40'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <BedDouble className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-medium">Room {room.roomNumber}</span>
                            <span className="text-xs text-muted-foreground">{room.floor}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Cancel</Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={
                  form.formState.isSubmitting ||
                  (availability !== null && !availability.available) ||
                  (instantCheckIn && showInstantOption && !instantRoomId)
                }
              >
                {form.formState.isSubmitting
                  ? (instantCheckIn && showInstantOption ? 'Checking In...' : 'Creating...')
                  : (instantCheckIn && showInstantOption ? 'Check In Now' : 'Create Booking')
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
