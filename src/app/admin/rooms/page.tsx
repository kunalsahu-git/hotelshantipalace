'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  collection,
  writeBatch,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { type Room, type Booking } from '@/lib/types';
import { useRoomCategories } from '@/hooks/use-room-categories';
import { RoomFormSchema, type RoomFormData } from '@/lib/schemas';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { usePagination } from '@/hooks/use-pagination';
import { TablePagination } from '@/components/admin/table-pagination';
import { Building, Sparkles, Plus, Pencil, Trash2, User } from 'lucide-react';

// ─── Seed data ────────────────────────────────────────────────────────────────

const getInitialRooms = (categories: { id: string; name: string }[]) => {
  const rooms: Omit<Room, 'id'>[] = [];
  const floors = ['1st Floor', '2nd Floor', '3rd Floor', '4th Floor'];

  const add = (catId: string, prefix: string, floor: string, count: number) => {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;
    for (let i = 1; i <= count; i++) {
      rooms.push({
        roomNumber: `${prefix}0${i}`,
        floor,
        categoryId: cat.id,
        categoryName: cat.name,
        status: 'available',
        housekeepingStatus: 'clean',
        isActive: true,
      });
    }
  };

  add('standard', '1', floors[0], 5);
  add('deluxe', '2', floors[1], 5);
  add('suite', '3', floors[2], 3);
  add('executive', '4', floors[3], 2);
  return rooms;
};

// ─── Status helpers ───────────────────────────────────────────────────────────

const roomStatusVariant: Record<Room['status'], 'secondary' | 'destructive' | 'default' | 'outline'> = {
  available: 'secondary',
  occupied: 'destructive',
  reserved: 'default',
  maintenance: 'outline',
  dirty: 'outline',
};

const hkStatusVariant: Record<Room['housekeepingStatus'], 'secondary' | 'destructive' | 'default'> = {
  clean: 'secondary',
  dirty: 'destructive',
  in_progress: 'default',
  inspected: 'default',
};

// ─── Room Form (shared by Add & Edit) ────────────────────────────────────────

function RoomFormDialog({
  open,
  onOpenChange,
  existing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  existing?: (Room & { id: string }) | null;
}) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { categories } = useRoomCategories();

  const form = useForm<RoomFormData>({
    resolver: zodResolver(RoomFormSchema),
  });

  // Re-populate every time the dialog opens (add or edit)
  useEffect(() => {
    if (!open) return;
    form.reset({
      roomNumber: existing?.roomNumber ?? '',
      floor: existing?.floor ?? '',
      categoryId: existing?.categoryId ?? '',
      status: existing?.status ?? 'available',
      housekeepingStatus: existing?.housekeepingStatus ?? 'clean',
      notes: existing?.notes ?? '',
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, existing]);

  const onSubmit = async (data: RoomFormData) => {
    if (!firestore) return;
    const cat = categories.find(c => c.id === data.categoryId);
    if (!cat) { toast({ variant: 'destructive', title: 'Invalid category.' }); return; }

    try {
      if (existing) {
        await updateDoc(doc(firestore, 'rooms', existing.id), {
          ...data,
          categoryName: cat.name,
        });
        toast({ title: 'Room Updated', description: `Room ${data.roomNumber} updated.` });
      } else {
        const { addDoc } = await import('firebase/firestore');
        await addDoc(collection(firestore, 'rooms'), {
          ...data,
          categoryName: cat.name,
          isActive: true,
        });
        toast({ title: 'Room Added', description: `Room ${data.roomNumber} created.` });
      }
      form.reset();
      onOpenChange(false);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save room.' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) form.reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{existing ? 'Edit Room' : 'Add New Room'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="roomNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Number</FormLabel>
                  <FormControl><Input placeholder="e.g., 101" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="floor" render={({ field }) => (
                <FormItem>
                  <FormLabel>Floor</FormLabel>
                  <FormControl><Input placeholder="e.g., 1st Floor" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="categoryId" render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {(['available', 'occupied', 'reserved', 'maintenance', 'dirty'] as const).map(s => (
                        <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="housekeepingStatus" render={({ field }) => (
                <FormItem>
                  <FormLabel>Housekeeping</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {(['clean', 'dirty', 'in_progress', 'inspected'] as const).map(s => (
                        <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (optional)</FormLabel>
                <FormControl><Textarea placeholder="Internal notes about this room..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : existing ? 'Save Changes' : 'Add Room'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminRoomsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { categories } = useRoomCategories();
  const [isSeeding, setIsSeeding] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editRoom, setEditRoom] = useState<(Room & { id: string }) | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Room['status'] | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [floorFilter, setFloorFilter] = useState('all');

  const roomsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'rooms') : null),
    [firestore]
  );
  const { data: rooms, isLoading } = useCollection<Room>(roomsQuery);

  const checkedInQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'bookings'), where('status', '==', 'checked_in')) : null),
    [firestore]
  );
  const { data: checkedInBookings } = useCollection<Booking>(checkedInQuery);

  // Map roomId → booking for quick lookup
  const occupiedMap = useMemo(() => {
    const map = new Map<string, Booking & { id: string }>();
    (checkedInBookings ?? []).forEach(b => {
      if (b.roomId) map.set(b.roomId, b as Booking & { id: string });
    });
    return map;
  }, [checkedInBookings]);

  const uniqueFloors = useMemo(() => [...new Set((rooms ?? []).map(r => r.floor))].sort(), [rooms]);
  const uniqueCategories = useMemo(() => [...new Set((rooms ?? []).map(r => r.categoryName))].sort(), [rooms]);

  const filteredRooms = useMemo(() => {
    let result = (rooms ?? []) as (Room & { id: string })[];
    if (statusFilter !== 'all') result = result.filter(r => r.status === statusFilter);
    if (categoryFilter !== 'all') result = result.filter(r => r.categoryName === categoryFilter);
    if (floorFilter !== 'all') result = result.filter(r => r.floor === floorFilter);
    if (search) result = result.filter(r => r.roomNumber.toLowerCase().includes(search.toLowerCase()));
    return result;
  }, [rooms, statusFilter, categoryFilter, floorFilter, search]);

  const { page, setPage, pageSize, setPageSize, paginatedItems: pageRooms, totalItems, totalPages, showPagination } = usePagination(filteredRooms);

  const handleSeedData = async () => {
    if (!firestore || categories.length === 0) return;
    setIsSeeding(true);
    try {
      const { addDoc: add } = await import('firebase/firestore');
      const batch = writeBatch(firestore);
      const initialRooms = getInitialRooms(categories);
      const roomsCol = collection(firestore, 'rooms');
      initialRooms.forEach(r => {
        batch.set(doc(roomsCol), r);
      });
      await batch.commit();
      toast({ title: 'Rooms Seeded', description: `${initialRooms.length} rooms created.` });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not seed rooms.' });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleDelete = async (room: Room & { id: string }) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'rooms', room.id));
      toast({ title: 'Room Deleted', description: `Room ${room.roomNumber} removed.` });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not delete room.' });
    }
  };

  const handleQuickStatus = async (room: Room & { id: string }, status: Room['status']) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'rooms', room.id), { status });
      toast({ title: 'Status Updated', description: `Room ${room.roomNumber} → ${status}.` });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update status.' });
    }
  };

  const hasRooms = rooms && rooms.length > 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Rooms</h1>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Room
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Room Inventory</CardTitle>
          <CardDescription>
            {hasRooms
              ? `${rooms.length} rooms · ${rooms.filter(r => r.status === 'available').length} available`
              : 'Manage all rooms in the hotel.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filter bar */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Input
              placeholder="Search room number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 w-48"
            />
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v as Room['status'] | 'all'); setPage(1); }}>
              <SelectTrigger className="h-8 w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {(['available', 'occupied', 'reserved', 'maintenance', 'dirty'] as const).map(s => (
                  <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {uniqueCategories.length > 1 && (
              <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v); setPage(1); }}>
                <SelectTrigger className="h-8 w-40"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {uniqueFloors.length > 1 && (
              <Select value={floorFilter} onValueChange={v => { setFloorFilter(v); setPage(1); }}>
                <SelectTrigger className="h-8 w-36"><SelectValue placeholder="Floor" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Floors</SelectItem>
                  {uniqueFloors.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {(search || statusFilter !== 'all' || categoryFilter !== 'all' || floorFilter !== 'all') && (
              <Button size="sm" variant="ghost" className="h-8" onClick={() => { setSearch(''); setStatusFilter('all'); setCategoryFilter('all'); setFloorFilter('all'); }}>
                Clear filters
              </Button>
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room No.</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Housekeeping</TableHead>
                <TableHead className="hidden md:table-cell">Current Guest</TableHead>
                <TableHead className="hidden md:table-cell">Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={8}><Skeleton className="h-8 w-full" /></TableCell>
                </TableRow>
              ))}

              {!isLoading && !hasRooms && (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Building className="w-14 h-14 text-muted-foreground opacity-40" />
                      <h3 className="text-lg font-semibold">No Rooms Yet</h3>
                      <p className="text-sm text-muted-foreground">Seed initial rooms or add them manually.</p>
                      <Button onClick={handleSeedData} disabled={isSeeding}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        {isSeeding ? 'Creating...' : 'Seed Initial Rooms'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && filteredRooms.length === 0 && hasRooms && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No rooms match the current filters.
                  </TableCell>
                </TableRow>
              )}

              {pageRooms.map(r => {
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-bold">{r.roomNumber}</TableCell>
                    <TableCell className="text-sm">{r.categoryName}</TableCell>
                    <TableCell className="text-sm">{r.floor}</TableCell>
                    <TableCell>
                      {/* Inline quick-status dropdown */}
                      <Select
                        value={r.status}
                        onValueChange={v => handleQuickStatus(r, v as Room['status'])}
                      >
                        <SelectTrigger className="w-32 h-7 text-xs border-0 p-0 shadow-none focus:ring-0">
                          <Badge variant={roomStatusVariant[r.status]} className="capitalize cursor-pointer">
                            {r.status.replace('_', ' ')}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {(['available', 'occupied', 'reserved', 'maintenance', 'dirty'] as const).map(s => (
                            <SelectItem key={s} value={s} className="capitalize text-sm">{s.replace('_', ' ')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={hkStatusVariant[r.housekeepingStatus]} className="capitalize">
                        {r.housekeepingStatus.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {(() => {
                        const booking = occupiedMap.get(r.id);
                        if (!booking) return <span className="text-xs text-muted-foreground">—</span>;
                        return (
                          <div className="flex items-start gap-1.5">
                            <User className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sm font-medium leading-tight">{booking.guestName}</p>
                              <p className="text-xs text-muted-foreground">
                                Out: {format(parseISO(booking.checkOut), 'dd MMM')}
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-xs truncate">
                      {r.notes || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => setEditRoom(r)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Room {r.roomNumber}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This permanently removes the room from inventory. Active bookings for this room will not be automatically cancelled.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(r)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {showPagination && (
            <TablePagination
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <RoomFormDialog open={addOpen} onOpenChange={setAddOpen} />

      {/* Edit Dialog */}
      <RoomFormDialog
        open={!!editRoom}
        onOpenChange={open => !open && setEditRoom(null)}
        existing={editRoom}
      />
    </div>
  );
}
