import * as z from 'zod';

export const BookingFormSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  phone: z.string().min(10, { message: "Please enter a valid phone number." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  guests: z.coerce.number().min(1, { message: "At least one guest is required." }),
  specialRequests: z.string().optional(),
  
  checkIn: z.date({ required_error: "Check-in date is required." }),
  checkOut: z.date({ required_error: "Check-out date is required." }),

  roomTypeId: z.string({ required_error: "Please select a room category." }).min(1, { message: "Please select a room category." }),
}).refine(data => data.checkIn < data.checkOut, {
    message: "Check-out date must be after check-in date.",
    path: ["checkOut"],
});

export type BookingFormData = z.infer<typeof BookingFormSchema>;
