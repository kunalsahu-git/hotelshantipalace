'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EnquiryFormSchema, type EnquiryFormData } from '@/lib/schemas';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Send } from 'lucide-react';

export function EnquiryForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<EnquiryFormData>({
    resolver: zodResolver(EnquiryFormSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      message: '',
    },
  });

  const onSubmit = async (data: EnquiryFormData) => {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Database Error',
        description: 'Could not connect to the database. Please try again later.',
      });
      return;
    }
    setIsSubmitting(true);

    const enquiriesCollection = collection(firestore, 'enquiries');

    const payload = {
      ...data,
      status: 'new',
      submittedAt: serverTimestamp(),
    }

    addDoc(enquiriesCollection, payload)
      .then(() => {
        toast({
          title: 'Enquiry Sent!',
          description: "Thank you for your message. We'll get back to you shortly.",
        });
        form.reset();
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
            path: 'enquiries',
            operation: 'create',
            requestResourceData: payload,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 h-full flex flex-col">
        <div>
          <h2 className="text-2xl font-bold">Send us a Message</h2>
          <p className="text-muted-foreground">Fill out the form and we'll be in touch.</p>
        </div>
        
        <div className="space-y-6 flex-grow">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your Name" {...field} />
                </FormControl>
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
                <FormControl>
                  <Input type="email" placeholder="your.email@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Your Phone Number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us what you'd like to know..."
                    className="resize-none"
                    rows={5}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end mt-auto">
          <Button type="submit" size="lg" disabled={isSubmitting}>
             {isSubmitting ? 'Sending...' : 'Send Enquiry'}
            <Send className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
