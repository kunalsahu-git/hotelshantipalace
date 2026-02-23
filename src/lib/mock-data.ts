import type { RoomCategory } from './types';
import { PlaceHolderImages } from './placeholder-images';

const getImage = (id: string) => {
  const img = PlaceHolderImages.find((p) => p.id === id);
  return {
    url: img?.imageUrl || `https://picsum.photos/seed/${id}/800/600`,
    hint: img?.imageHint || 'hotel room',
  };
};

const standardRoomPhoto = getImage('standard-room');
const deluxeRoomPhoto = getImage('deluxe-room');
const suiteRoomPhoto = getImage('suite-room');
const executiveRoomPhoto = getImage('executive-room');

export const roomCategories: RoomCategory[] = [
  {
    id: 'standard',
    name: 'Standard Room',
    description: 'Cozy and comfortable, perfect for solo travelers or couples seeking a peaceful retreat.',
    basePrice: 1800,
    maxOccupancy: 2,
    amenities: ['Free WiFi', 'Flat-screen TV'],
    photoUrl: standardRoomPhoto.url,
    imageHint: standardRoomPhoto.hint,
    gallery: [
        standardRoomPhoto,
        getImage('standard-room-2'),
        getImage('gallery-1')
    ]
  },
  {
    id: 'deluxe',
    name: 'Deluxe Room',
    description: 'Spacious with premium amenities, ideal for a relaxing and rejuvenating stay.',
    basePrice: 2800,
    maxOccupancy: 3,
    amenities: ['Free WiFi', 'Flat-screen TV', 'Air Conditioning'],
    photoUrl: deluxeRoomPhoto.url,
    imageHint: deluxeRoomPhoto.hint,
    gallery: [
        deluxeRoomPhoto,
        getImage('deluxe-room-2'),
        getImage('gallery-2')
    ]
  },
  {
    id: 'suite',
    name: 'Suite',
    description: 'Luxurious and expansive, offering a separate living area and enhanced comfort.',
    basePrice: 4500,
    maxOccupancy: 4,
    amenities: ['Free WiFi', 'Flat-screen TV', 'Air Conditioning'],
    photoUrl: suiteRoomPhoto.url,
    imageHint: suiteRoomPhoto.hint,
    gallery: [
        suiteRoomPhoto,
        getImage('suite-room-2'),
        getImage('gallery-3')
    ]
  },
  {
    id: 'executive',
    name: 'Executive Room',
    description: 'Designed for business travelers with a dedicated workspace and exclusive access.',
    basePrice: 6500,
    maxOccupancy: 2,
    amenities: ['Free WiFi', 'Flat-screen TV', 'Air Conditioning'],
    photoUrl: executiveRoomPhoto.url,
    imageHint: executiveRoomPhoto.hint,
    gallery: [
        executiveRoomPhoto,
        getImage('executive-room-2'),
        getImage('gallery-1')
    ]
  },
];
