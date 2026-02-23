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
