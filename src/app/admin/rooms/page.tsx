'use client';

import { useState } from 'react';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { type Room } from '@/lib/types';
import { roomCategories } from '@/lib/mock-data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Building, Sparkles } from 'lucide-react';
import { AddRoomForm } from '@/components/admin/add-room-form';

// Define initial rooms to seed
const getInitialRooms = () => {
  const rooms: Omit<Room, 'id'>[] = [];
  const floors = ['1st Floor', '2nd Floor', '3rd Floor', '4th Floor', '5th Floor'];
  
  // Add some standard rooms
  const standardCategory = roomCategories.find(c => c.id === 'standard');
  if (standardCategory) {
    for (let i = 1; i <= 5; i++) {
      rooms.push({
        roomNumber: `10${i}`,
        floor: floors[0],
        categoryId: standardCategory.id,
        categoryName: standardCategory.name,
        status: 'available',
        housekeepingStatus: 'clean',
        isActive: true,
      });
    }
  }

  // Add some deluxe rooms
  const deluxeCategory = roomCategories.find(c => c.id === 'deluxe');
  if (deluxeCategory) {
    for (let i = 1; i <= 5; i++) {
      rooms.push({
        roomNumber: `20${i}`,
        floor: floors[1],
        categoryId: deluxeCategory.id,
        categoryName: deluxeCategory.name,
        status: 'available',
        housekeepingStatus: 'clean',
        isActive: true,
      });
    }
  }

  // Add some suites
  const suiteCategory = roomCategories.find(c => c.id === 'suite');
  if (suiteCategory) {
    for (let i = 1; i <= 3; i++) {
      rooms.push({
        roomNumber: `30${i}`,
        floor: floors[2],
        categoryId: suiteCategory.id,
        categoryName: suiteCategory.name,
        status: i === 1 ? 'reserved' : 'available',
        housekeepingStatus: i === 2 ? 'dirty' : 'clean',
        isActive: true,
      });
    }
  }

   // Add some executive rooms
  const executiveCategory = roomCategories.find(c => c.id === 'executive');
  if (executiveCategory) {
    for (let i = 1; i <= 2; i++) {
      rooms.push({
        roomNumber: `40${i}`,
        floor: floors[3],
        categoryId: executiveCategory.id,
        categoryName: executiveCategory.name,
        status: 'available',
        housekeepingStatus: 'clean',
        isActive: true,
      });
    }
  }

  return rooms;
};

function RoomRow({ room }: { room: Room }) {
    const getStatusBadgeVariant = (status: Room['status']) => {
        switch(status) {
            case 'available': return 'secondary';
            case 'occupied': return 'destructive';
            case 'reserved': return 'default';
            case 'maintenance': return 'outline';
            case 'dirty': return 'outline';
            default: return 'secondary';
        }
    }
    const getHousekeepingBadgeVariant = (status: Room['housekeepingStatus']) => {
        switch(status) {
            case 'clean': return 'secondary';
            case 'dirty': return 'destructive';
            case 'in_progress': return 'default';
            case 'inspected': return 'default';
            default: return 'secondary';
        }
    }
  return (
    <TableRow>
      <TableCell className="font-bold">{room.roomNumber}</TableCell>
      <TableCell>{room.categoryName}</TableCell>
      <TableCell>{room.floor}</TableCell>
      <TableCell>
        <Badge variant={getStatusBadgeVariant(room.status)} className="capitalize">{room.status.replace('_', ' ')}</Badge>
      </TableCell>
      <TableCell>
        <Badge variant={getHousekeepingBadgeVariant(room.housekeepingStatus)} className="capitalize">{room.housekeepingStatus.replace('_', ' ')}</Badge>
      </TableCell>
    </TableRow>
  );
}

export default function AdminRoomsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);

  const roomsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'rooms') : null),
    [firestore]
  );
  const { data: rooms, isLoading } = useCollection<Room>(roomsQuery);

  const handleSeedData = async () => {
    if (!firestore) return;
    setIsSeeding(true);
    
    try {
      const batch = writeBatch(firestore);
      const initialRooms = getInitialRooms();
      const roomsCollection = collection(firestore, 'rooms');

      initialRooms.forEach(roomData => {
        const newRoomRef = doc(roomsCollection);
        batch.set(newRoomRef, roomData);
      });

      await batch.commit();

      toast({
        title: 'Success!',
        description: `${initialRooms.length} rooms have been created.`,
      });
    } catch (error) {
      console.error("Error seeding rooms:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not seed rooms. Check console for details.',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const hasRooms = rooms && rooms.length > 0;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Rooms</h1>
        <AddRoomForm />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Room Inventory</CardTitle>
          <CardDescription>
            Manage all the rooms in Hotel Shanti Palace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room No.</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Housekeeping</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && !hasRooms && (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <Building className="w-16 h-16 text-muted-foreground" />
                        <h3 className="text-xl font-bold">No Rooms Found</h3>
                        <p className="text-muted-foreground">Get started by seeding the initial room data.</p>
                         <Button onClick={handleSeedData} disabled={isSeeding}>
                            <Sparkles className="mr-2 h-4 w-4" />
                            {isSeeding ? 'Creating Rooms...' : 'Seed Initial Rooms'}
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {rooms?.map((room) => (
                <RoomRow key={room.id} room={room} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
