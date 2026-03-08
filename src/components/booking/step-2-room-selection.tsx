'use client';

import { useFormContext } from 'react-hook-form';
import { format, differenceInDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import type { BookingFormData } from '@/lib/schemas';
import type { RoomCategory } from '@/lib/types';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon, ArrowLeft, ArrowRight, Users, Wifi, Tv, Wind } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

const amenityIcons: { [key: string]: React.ElementType } = {
    'Free WiFi': Wifi,
    'Flat-screen TV': Tv,
    'Air Conditioning': Wind,
};

export function Step2RoomSelection({ prevStep, nextStep, allRooms }: { prevStep: () => void; nextStep: () => void; allRooms: RoomCategory[] }) {
  const { control, watch, formState: { errors } } = useFormContext<BookingFormData>();

  const checkIn = watch('checkIn');
  const checkOut = watch('checkOut');
  const selectedRoomId = watch('categoryId');
  const numberOfRooms = watch('numberOfRooms') || 1;

  const selectedRoom = allRooms.find(r => r.id === selectedRoomId);
  const numberOfNights = checkIn && checkOut && checkOut > checkIn ? differenceInDays(checkOut, checkIn) : 0;
  const totalPrice = selectedRoom && numberOfNights > 0 ? selectedRoom.basePrice * numberOfNights * numberOfRooms : 0;

  return (
    <form onSubmit={(e) => { e.preventDefault(); nextStep(); }} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Choose Your Room</h2>
        <p className="text-muted-foreground">Select your dates and preferred room category.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="checkIn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Check-in Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} initialFocus />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="checkOut"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Check-out Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date <= (checkIn || new Date())} initialFocus />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="categoryId"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel className={cn(errors.categoryId && 'text-destructive')}>Available Room Categories</FormLabel>
            <FormControl>
              <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 gap-4">
                {allRooms.map((room) => (
                  <FormItem key={room.id}>
                    <FormControl>
                        <RadioGroupItem value={room.id} className="sr-only" />
                    </FormControl>
                    <FormLabel className="font-normal">
                        <Card className={cn("cursor-pointer hover:border-primary", field.value === room.id && "border-2 border-primary ring-2 ring-primary ring-offset-2")}>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                                <div className="relative md:col-span-1 min-h-[180px] md:min-h-full">
                                    <Image src={room.photoUrl} alt={room.name} fill className="object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none" data-ai-hint={room.imageHint} sizes="(max-width: 768px) 100vw, 33vw" />
                                </div>
                                <div className="md:col-span-2 p-4 flex flex-col">
                                    <h3 className="text-xl font-bold">{room.name}</h3>
                                     <div className="flex items-center gap-2 my-2">
                                        <Users className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">Up to {room.maxOccupancy} guests</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {room.amenities.map((amenity) => {
                                            const Icon = amenityIcons[amenity];
                                            return Icon ? <Badge key={amenity} variant="secondary" className="gap-1.5"><Icon className="w-3.5 h-3.5" /> {amenity}</Badge> : null;
                                        })}
                                    </div>
                                     <p className="text-lg font-bold text-primary mt-auto pt-2">₹{room.basePrice.toLocaleString()}/night</p>
                                </div>
                             </div>
                        </Card>
                    </FormLabel>
                  </FormItem>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {totalPrice > 0 && (
        <Card className="bg-primary/5">
          <CardContent className="p-4 flex justify-between items-center">
            <p className="font-semibold text-lg">Price Breakdown</p>
            <p className="text-right">
              <span className="font-bold text-xl">₹{totalPrice.toLocaleString()}</span><br/>
              <span className="text-muted-foreground text-sm">
                {numberOfRooms} room{numberOfRooms > 1 ? 's' : ''} × {numberOfNights} night{numberOfNights > 1 ? 's' : ''} × ₹{selectedRoom?.basePrice.toLocaleString()}
              </span>
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button type="button" variant="outline" size="lg" onClick={prevStep}>
          <ArrowLeft className="mr-2 h-5 w-5" /> Back
        </Button>
        <Button type="submit" size="lg">
          Next Step <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </form>
  );
}
