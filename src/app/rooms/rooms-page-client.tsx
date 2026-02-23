'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { RoomResultCard } from '@/components/room-result-card';
import { RoomsFilterBar } from '@/components/rooms-filter-bar';
import type { RoomCategory } from '@/lib/types';
import { parseISO } from 'date-fns';

export function RoomsPageClient({ allRooms }: { allRooms: RoomCategory[] }) {
  const searchParams = useSearchParams();

  const [checkInDate, setCheckInDate] = useState<Date | undefined>(
    searchParams.get('checkin') ? parseISO(searchParams.get('checkin')!) : undefined
  );
  const [checkOutDate, setCheckOutDate] = useState<Date | undefined>(
    searchParams.get('checkout') ? parseISO(searchParams.get('checkout')!) : undefined
  );
  const [guests, setGuests] = useState<string>(searchParams.get('guests') || '2');
  const [roomType, setRoomType] = useState<string>(searchParams.get('roomType') || 'all');
  
  const [filteredRooms, setFilteredRooms] = useState<RoomCategory[]>(allRooms);

  const handleSearch = (filters: {
    checkIn?: Date;
    checkOut?: Date;
    guests: string;
    roomType: string;
  }) => {
    setCheckInDate(filters.checkIn);
    setCheckOutDate(filters.checkOut);
    setGuests(filters.guests);
    setRoomType(filters.roomType);
  };
  
  useEffect(() => {
    let rooms = allRooms;
    if (roomType !== 'all') {
      rooms = rooms.filter(room => room.id === roomType);
    }
    
    // In a real app, occupancy would be checked against guest count.
    // For this prototype, we'll just filter by room type.
    
    setFilteredRooms(rooms);

  }, [roomType, allRooms]);

  return (
    <div className="space-y-12">
      <RoomsFilterBar 
        onSearch={handleSearch}
        initialValues={{ checkInDate, checkOutDate, guests, roomType }}
      />
      <div className="grid grid-cols-1 gap-8">
        {filteredRooms.length > 0 ? (
          filteredRooms.map(room => (
            <RoomResultCard 
              key={room.id} 
              category={room} 
              checkInDate={checkInDate}
              checkOutDate={checkOutDate}
            />
          ))
        ) : (
          <p className="text-center text-muted-foreground col-span-full">No rooms match your criteria.</p>
        )}
      </div>
    </div>
  );
}
