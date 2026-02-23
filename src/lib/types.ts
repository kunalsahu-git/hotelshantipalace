export type StaffRole = 'admin' | 'frontdesk' | 'housekeeping';

export type User = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  isActive: boolean;
  createdAt: any;
}

export type RoomCategory = {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  maxOccupancy: number;
  amenities: string[];
  photoUrl: string;
  imageHint: string;
  gallery: {
    url: string;
    hint: string;
  }[];
};

export type Booking = {
  id?: string;
  guestId?: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  roomId?: string;
  roomNumber?: string;
  categoryId: string;
  categoryName: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  numberOfNights: number;
  numberOfGuests: number;
  status: 'reserved' | 'checked_in' | 'checked_out' | 'cancelled';
  bookingType: 'advance' | 'walk-in';
  source: 'website' | 'admin';
  specialRequests?: string;
  createdAt?: any;
  createdBy?: string;
  earlyCheckIn?: boolean;
  lateCheckOut?: boolean;
  totalPrice?: number; // Kept for wizard flow, not in DB model as per spec
};

export type Enquiry = {
    id?: string;
    name: string;
    phone?: string;
    email: string;
    message: string;
    submittedAt?: any;
    status: 'new' | 'read' | 'responded';
}
