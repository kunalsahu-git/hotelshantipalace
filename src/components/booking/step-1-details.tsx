'use client';

import { useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { BookingFormData } from '@/lib/schemas';
import { ArrowRight, BedDouble } from 'lucide-react';

export function Step1Details({ nextStep }: { nextStep: () => void }) {
  const form = useFormContext<BookingFormData>();

  return (
    <form onSubmit={(e) => { e.preventDefault(); nextStep(); }} className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Your Details</h2>
        <p className="text-muted-foreground">Please provide your contact information.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="guestName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Anjali Sharma" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="guestPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="e.g. +91 98765 43210" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="guestEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="e.g. anjali.sharma@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="numberOfGuests"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Guests</FormLabel>
              <Select onValueChange={(value) => field.onChange(parseInt(value, 10))} defaultValue={String(field.value)}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select number of guests" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {[1,2,3,4,5,6,7,8].map(g => (
                    <SelectItem key={g} value={String(g)}>{g} Guest{g > 1 ? 's' : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="numberOfRooms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Rooms</FormLabel>
              <Select onValueChange={(value) => field.onChange(parseInt(value, 10))} defaultValue={String(field.value ?? 1)}>
                <FormControl>
                  <SelectTrigger>
                    <BedDouble className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select rooms" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {[1,2,3,4,5].map(r => (
                    <SelectItem key={r} value={String(r)}>{r} Room{r > 1 ? 's' : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
         <div className="md:col-span-2">
            <FormField
            control={form.control}
            name="specialRequests"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Special Requests (Optional)</FormLabel>
                <FormControl>
                    <Textarea
                    placeholder="e.g., Ground floor preferred, anniversary celebration"
                    className="resize-none"
                    {...field}
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button type="submit" size="lg">
          Next Step <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </form>
  );
}
