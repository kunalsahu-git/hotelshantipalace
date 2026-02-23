export type StaffRole = 'admin';

export type User = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  isActive: boolean;
  createdAt: any;
};

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
  isActive: boolean;
};

export type Room = {
  id: string;
  roomNumber: string;
  floor: string;
  categoryId: string;
  categoryName: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance' | 'dirty';
  housekeepingStatus: 'clean' | 'dirty' | 'in_progress' | 'inspected';
  isActive: boolean;
  notes?: string;
  currentBookingId?: string;
};

export type Guest = {
  id: string;
  name: string;
  phone: string;
  email: string;
  idType?: string;
  idNumber?: string;
  address?: string;
  nationality?: string;
  notes?: string;
  tags?: string[];
  createdAt: any;
  totalStays: number;
  source: 'walkin' | 'website';
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
  bookingType: 'advance' | 'walkin';
  source: 'website' | 'admin';
  specialRequests?: string;
  createdAt?: any;
  createdBy?: string;
  earlyCheckIn?: boolean;
  lateCheckOut?: boolean;
  totalPrice?: number;
};

export type Bill = {
  id: string;
  bookingId: string;
  guestId: string;
  guestName: string;
  roomNumber?: string;
  checkIn: string;
  checkOut: string;
  numberOfNights: number;
  roomCharges: number;
  extraCharges?: { name: string; amount: number }[];
  taxRate: number;
  taxAmount: number;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  discountAmount?: number;
  subtotal: number;
  totalAmount: number;
  paymentStatus: 'unpaid' | 'paid' | 'partial';
  paymentMethod?: 'cash' | 'card' | 'upi' | 'other';
  generatedAt: any;
  generatedBy?: string;
};

export type MaintenanceTicket = {
  id: string;
  roomId: string;
  roomNumber: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  raisedBy: string;
  raisedAt: any;
  resolvedAt?: any;
  resolvedBy?: string;
  notes?: string;
};

export type Enquiry = {
  id?: string;
  name: string;
  phone?: string;
  email: string;
  message: string;
  submittedAt?: any;
  status: 'new' | 'read' | 'responded';
};

export type HotelSetting = {
  id: string;
  hotelName: string;
  address: string;
  phone: string;
  email: string;
  logoURL?: string;
  taxRate: number;
  serviceChargeRate: number;
  checkInTime: string;
  checkOutTime: string;
  seasonalPricing?: { name: string; startDate: string; endDate: string; multiplier: number }[];
};
