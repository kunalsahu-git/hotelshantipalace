import * as z from 'zod';

export const BookingFormSchema = z.object({
  guestName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  guestPhone: z.string().min(10, { message: "Please enter a valid phone number." }),
  guestEmail: z.string().email({ message: "Please enter a valid email address." }),
  numberOfGuests: z.coerce.number().min(1, { message: "At least one guest is required." }),
  specialRequests: z.string().optional(),
  
  checkIn: z.date({ required_error: "Check-in date is required." }),
  checkOut: z.date({ required_error: "Check-out date is required." }),

  categoryId: z.string({ required_error: "Please select a room category." }).min(1, { message: "Please select a room category." }),
}).refine(data => data.checkIn < data.checkOut, {
    message: "Check-out date must be after check-in date.",
    path: ["checkOut"],
});

export type BookingFormData = z.infer<typeof BookingFormSchema>;

export const EnquiryFormSchema = z.object({
  name: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  phone: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email address." }),
  message: z.string().min(10, { message: "Message must be at least 10 characters." }),
});

export type EnquiryFormData = z.infer<typeof EnquiryFormSchema>;


export const LoginFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof LoginFormSchema>;

export const RoomFormSchema = z.object({
  roomNumber: z.string().min(1, { message: "Room number is required." }),
  floor: z.string().min(1, { message: "Floor is required." }),
  categoryId: z.string({ required_error: "Please select a room category." }),
  status: z.enum(['available', 'occupied', 'reserved', 'maintenance', 'dirty']),
  housekeepingStatus: z.enum(['clean', 'dirty', 'in_progress', 'inspected']),
  notes: z.string().optional(),
});

export type RoomFormData = z.infer<typeof RoomFormSchema>;
