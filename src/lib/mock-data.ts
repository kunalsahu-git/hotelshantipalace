import type { RoomCategory } from './types';
import { PlaceHolderImages } from './placeholder-images';

const getImage = (id: string) => {
  const img = PlaceHolderImages.find((p) => p.id === id);
  return {
    url: img?.imageUrl || `https://picsum.photos/seed/${id}/600/400`,
    hint: img?.imageHint || 'hotel room',
  };
};

export const roomCategories: RoomCategory[] = [
  {
    id: 'standard',
    name: 'Standard Room',
    description: 'Cozy and comfortable, perfect for solo travelers or couples seeking a peaceful retreat.',
    basePrice: 1800,
    maxOccupancy: 2,
    amenities: ['Free WiFi', 'Flat-screen TV'],
    photoUrl: getImage('standard-room').url,
    imageHint: getImage('standard-room').hint,
  },
  {
    id: 'deluxe',
    name: 'Deluxe Room',
    description: 'Spacious with premium amenities, ideal for a relaxing and rejuvenating stay.',
    basePrice: 2800,
    maxOccupancy: 3,
    amenities: ['Free WiFi', 'Flat-screen TV', 'Air Conditioning'],
    photoUrl: getImage('deluxe-room').url,
    imageHint: getImage('deluxe-room').hint,
  },
  {
    id: 'suite',
    name: 'Suite',
    description: 'Luxurious and expansive, offering a separate living area and enhanced comfort.',
    basePrice: 4500,
    maxOccupancy: 4,
    amenities: ['Free WiFi', 'Flat-screen TV', 'Air Conditioning'],
    photoUrl: getImage('suite-room').url,
    imageHint: getImage('suite-room').hint,
  },
  {
    id: 'executive',
    name: 'Executive Room',
    description: 'Designed for business travelers with a dedicated workspace and exclusive access.',
    basePrice: 6500,
    maxOccupancy: 2,
    amenities: ['Free WiFi', 'Flat-screen TV', 'Air Conditioning'],
    photoUrl: getImage('executive-room').url,
    imageHint: getImage('executive-room').hint,
  },
];
