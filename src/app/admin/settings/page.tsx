'use client';

import { useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save } from 'lucide-react';

import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import type { HotelSetting } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

const SettingsSchema = z.object({
  hotelName: z.string().min(2, 'Hotel name is required.'),
  address: z.string().min(5, 'Address is required.'),
  phone: z.string().min(10, 'Phone is required.'),
  email: z.string().email('Enter a valid email.'),
  taxRate: z.coerce.number().min(0).max(100),
  serviceChargeRate: z.coerce.number().min(0).max(100),
  checkInTime: z.string().min(1, 'Check-in time is required.'),
  checkOutTime: z.string().min(1, 'Check-out time is required.'),
});
type SettingsFormData = z.infer<typeof SettingsSchema>;

const SETTINGS_DOC_ID = 'main';

export default function SettingsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const settingsRef = useMemoFirebase(
    () => firestore ? doc(firestore, 'settings', SETTINGS_DOC_ID) : null,
    [firestore]
  );
  const { data: settings, isLoading } = useDoc<HotelSetting>(settingsRef);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      hotelName: 'Hotel Shanti Palace',
      address: '',
      phone: '',
      email: '',
      taxRate: 12,
      serviceChargeRate: 0,
      checkInTime: '12:00',
      checkOutTime: '11:00',
    },
  });

  // Populate form when data loads
  useEffect(() => {
    if (settings) {
      form.reset({
        hotelName: settings.hotelName ?? 'Hotel Shanti Palace',
        address: settings.address ?? '',
        phone: settings.phone ?? '',
        email: settings.email ?? '',
        taxRate: settings.taxRate ?? 12,
        serviceChargeRate: settings.serviceChargeRate ?? 0,
        checkInTime: settings.checkInTime ?? '12:00',
        checkOutTime: settings.checkOutTime ?? '11:00',
      });
    }
  }, [settings, form]);

  const onSubmit = async (data: SettingsFormData) => {
    if (!firestore) return;
    try {
      await setDoc(doc(firestore, 'settings', SETTINGS_DOC_ID), data, { merge: true });
      toast({ title: 'Settings Saved', description: 'Hotel configuration has been updated.' });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save settings.' });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage hotel configuration and defaults.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Hotel Info */}
          <Card>
            <CardHeader>
              <CardTitle>Hotel Information</CardTitle>
              <CardDescription>Basic details shown on bills and communications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="hotelName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hotel Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl><Input placeholder="Full hotel address" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl><Input placeholder="Contact number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input type="email" placeholder="hotel@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Billing */}
          <Card>
            <CardHeader>
              <CardTitle>Billing & Charges</CardTitle>
              <CardDescription>Default tax and service charges applied to bills.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="taxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GST / Tax Rate (%)</FormLabel>
                      <FormControl><Input type="number" min={0} max={100} step={0.5} {...field} /></FormControl>
                      <FormDescription>e.g., 12 for 12%</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="serviceChargeRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service Charge (%)</FormLabel>
                      <FormControl><Input type="number" min={0} max={100} step={0.5} {...field} /></FormControl>
                      <FormDescription>Set to 0 to disable</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Check-in/out Times */}
          <Card>
            <CardHeader>
              <CardTitle>Check-in / Check-out</CardTitle>
              <CardDescription>Standard times displayed to guests.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="checkInTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Check-in Time</FormLabel>
                      <FormControl><Input type="time" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="checkOutTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Check-out Time</FormLabel>
                      <FormControl><Input type="time" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={form.formState.isSubmitting} size="lg">
            <Save className="mr-2 h-4 w-4" />
            {form.formState.isSubmitting ? 'Saving...' : 'Save Settings'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
