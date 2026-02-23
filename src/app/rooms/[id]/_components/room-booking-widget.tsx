'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, differenceInDays, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, Users, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import type { RoomCategory } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

// Dummy availability check for demonstration
function checkAvailability(roomId: string, checkIn?: Date, checkOut?: Date): boolean {
    if (!checkIn || !checkOut) return true;
    // In a real app, this would check a database.
    // For now, let's make some rooms unavailable for certain dates.
    if (roomId === 'suite' && checkIn.getDate() === 15) {
        return false;
    }
    return true;
}

export function RoomBookingWidget({ room }: { room: RoomCategory }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [checkInDate, setCheckInDate] = useState<Date | undefined>(
    searchParams.get('checkin') ? parseISO(searchParams.get('checkin')!) : undefined
  );
  const [checkOutDate, setCheckOutDate] = useState<Date | undefined>(
    searchParams.get('checkout') ? parseISO(searchParams.get('checkout')!) : undefined
  );
  const [guests, setGuests] = useState<string>(searchParams.get('guests') || '2');

  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [numberOfNights, setNumberOfNights] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);

  useEffect(() => {
    if(checkInDate && checkOutDate && differenceInDays(checkOutDate, checkInDate) < 1) {
        setCheckOutDate(undefined);
        return;
    }

    const available = checkAvailability(room.id, checkInDate, checkOutDate);
    setIsAvailable(available);

    if (checkInDate && checkOutDate && differenceInDays(checkOutDate, checkInDate) > 0) {
      const nights = differenceInDays(checkOutDate, checkInDate);
      setNumberOfNights(nights);
      setTotalPrice(nights * room.basePrice);
    } else {
      setNumberOfNights(0);
      setTotalPrice(0);
    }
  }, [checkInDate, checkOutDate, room.id, room.basePrice]);
  
  const handleBookNow = () => {
    if (!checkInDate || !checkOutDate) {
        toast({
            variant: "destructive",
            title: "Missing Information",
            description: "Please select check-in and check-out dates.",
        })
      return;
    }
    if (!isAvailable) {
        toast({
            variant: "destructive",
            title: "Room Not Available",
            description: "This room is not available for the selected dates.",
        })
      return;
    }
    
    const params = new URLSearchParams();
    params.append("checkin", format(checkInDate, "yyyy-MM-dd"));
    params.append("checkout", format(checkOutDate, "yyyy-MM-dd"));
    params.append("guests", guests);
    params.append("roomType", room.id);

    router.push(`/book?${params.toString()}`);
  };
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-baseline">
            <p className="text-3xl font-bold text-primary">₹{room.basePrice.toLocaleString()}</p>
            <p className="text-muted-foreground">/night</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="check-in" className="text-sm font-medium text-muted-foreground">Check-in</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="check-in"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !checkInDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {checkInDate ? format(checkInDate, "dd MMM") : <span>Pick date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={checkInDate}
                  onSelect={setCheckInDate}
                  initialFocus
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <label htmlFor="check-out" className="text-sm font-medium text-muted-foreground">Check-out</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="check-out"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !checkOutDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {checkOutDate ? format(checkOutDate, "dd MMM") : <span>Pick date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={checkOutDate}
                  onSelect={setCheckOutDate}
                  disabled={(date) =>
                    date <= (checkInDate || new Date(new Date().setHours(0, 0, 0, 0)))
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="space-y-2">
          <label htmlFor="guests" className="text-sm font-medium text-muted-foreground">Guests</label>
          <Select value={guests} onValueChange={setGuests}>
            <SelectTrigger id="guests">
              <Users className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select guests" />
            </SelectTrigger>
            <SelectContent>
                {[...Array(room.maxOccupancy)].map((_, i) => (
                    <SelectItem key={i+1} value={`${i+1}`}>{i+1} Guest{i > 0 ? 's' : ''}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {checkInDate && checkOutDate && (
            isAvailable ? (
                <div className="flex items-center gap-2 text-green-600 font-semibold pt-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>Available for selected dates</span>
                </div>
            ) : (
                <div className="flex items-center gap-2 text-destructive font-semibold pt-2">
                    <XCircle className="w-5 h-5" />
                    <span>Not available for these dates</span>
                </div>
            )
        )}
        
        <Button onClick={handleBookNow} size="lg" className="w-full h-12 text-base font-bold" disabled={!isAvailable && !!checkInDate && !!checkOutDate}>
          Reserve
        </Button>
      </CardContent>
      {totalPrice > 0 && isAvailable && checkInDate && checkOutDate && (
        <CardFooter className="flex flex-col items-start space-y-2 border-t pt-4">
            <div className="flex justify-between w-full text-muted-foreground">
                <span>₹{room.basePrice.toLocaleString()} x {numberOfNights} night{numberOfNights > 1 ? 's': ''}</span>
                <span>₹{totalPrice.toLocaleString()}</span>
            </div>
             {/* Could add taxes and fees here in a real app */}
            <div className="flex justify-between w-full font-bold text-lg pt-2 border-t w-full mt-2">
                <span>Total</span>
                <span>₹{totalPrice.toLocaleString()}</span>
            </div>
        </CardFooter>
      )}
    </Card>
  );
}
