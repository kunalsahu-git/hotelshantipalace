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
  fullName: string;
  phone: string;
  email: string;
  guests: number;
  specialRequests: string;
  roomTypeId: string;
  roomTypeName: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  numberOfNights: number;
  totalPrice: number;
  status: 'reserved' | 'confirmed' | 'cancelled' | 'completed';
  bookingType: 'advance' | 'walk-in';
  source: 'website';
  createdAt?: any;
};

export type Enquiry = {
    id?: string;
    name: string;
    phone?: string;
    email: string;
    message: string;
    submittedAt?: any;
}
