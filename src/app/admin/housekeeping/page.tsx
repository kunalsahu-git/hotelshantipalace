'use client';

import { collection, doc, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Room, Booking } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Clock, CheckCircle2, ShieldCheck, BedDouble, AlertTriangle } from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

type HKStatus = Room['housekeepingStatus'];

const statusConfig: Record<HKStatus, { label: string; icon: React.ElementType; color: string; next: HKStatus | null; nextLabel: string }> = {
  dirty: {
    label: 'Dirty',
    icon: BedDouble,
    color: 'bg-red-100 border-red-300 text-red-800',
    next: 'in_progress',
    nextLabel: 'Start Cleaning',
  },
  in_progress: {
    label: 'In Progress',
    icon: Clock,
    color: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    next: 'clean',
    nextLabel: 'Mark Clean',
  },
  clean: {
    label: 'Clean',
    icon: CheckCircle2,
    color: 'bg-green-100 border-green-300 text-green-800',
    next: 'inspected',
    nextLabel: 'Mark Inspected',
  },
  inspected: {
    label: 'Inspected',
    icon: ShieldCheck,
    color: 'bg-blue-100 border-blue-300 text-blue-800',
    next: null,
    nextLabel: '',
  },
};

const roomStatusColors: Record<Room['status'], string> = {
  available: 'bg-green-500',
  occupied: 'bg-red-500',
  reserved: 'bg-primary',
  maintenance: 'bg-orange-500',
  dirty: 'bg-yellow-500',
};

function RoomCard({ room, urgent }: { room: Room & { id: string }; urgent?: boolean }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const config = statusConfig[room.housekeepingStatus];
  const Icon = config.icon;

  const handleAdvance = async () => {
    if (!firestore || !config.next) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(firestore, 'rooms', room.id), {
        housekeepingStatus: config.next,
        // Only restore status to 'available' when finishing a clean cycle on a dirty room.
        // Don't override if room is occupied, reserved, or in maintenance.
        ...(config.next === 'clean' && room.status === 'dirty' ? { status: 'available' } : {}),
      });
      toast({ title: `Room ${room.roomNumber} → ${statusConfig[config.next].label}` });
    } catch {
      toast({ variant: 'destructive', title: 'Update failed', description: 'Try again.' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className={cn('border-2 transition-all', config.color, urgent && 'ring-2 ring-orange-400')}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-lg font-bold">Room {room.roomNumber}</p>
            <p className="text-xs opacity-70">{room.floor} · {room.categoryName}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={cn('h-2.5 w-2.5 rounded-full', roomStatusColors[room.status])} title={room.status} />
            <Icon className="h-6 w-6 opacity-60" />
          </div>
        </div>
        {urgent && (
          <div className="flex items-center gap-1 text-[11px] font-semibold text-orange-600 bg-orange-50 rounded px-2 py-0.5 mb-2">
            <AlertTriangle className="h-3 w-3" /> Guest arriving today
          </div>
        )}
        <p className="text-sm font-semibold mb-3">{config.label}</p>
        {config.next && (
          <Button
            size="sm"
            variant="secondary"
            className="w-full"
            onClick={handleAdvance}
            disabled={isUpdating}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            {isUpdating ? 'Updating...' : config.nextLabel}
          </Button>
        )}
        {!config.next && (
          <p className="text-xs text-center opacity-60 py-1">Ready for guest</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function HousekeepingPage() {
  const firestore = useFirestore();
  const [filter, setFilter] = useState<HKStatus | 'all'>('all');

  const roomsQuery = useMemoFirebase(
    () => firestore ? collection(firestore, 'rooms') : null,
    [firestore]
  );
  const { data: rooms, isLoading } = useCollection<Room>(roomsQuery);

  const bookingsQuery = useMemoFirebase(
    () => firestore ? collection(firestore, 'bookings') : null,
    [firestore]
  );
  const { data: bookings } = useCollection<Booking>(bookingsQuery);

  // Set of room IDs that have a guest arriving today and are not yet inspected
  const urgentRoomIds = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const arrivingToday = bookings?.filter(b => b.checkIn === todayStr && b.status === 'reserved') ?? [];
    const arrivingCategoryIds = new Set(arrivingToday.map(b => b.categoryId));
    return new Set(
      rooms
        ?.filter(r =>
          arrivingCategoryIds.has(r.categoryId) &&
          r.housekeepingStatus !== 'inspected' &&
          r.status === 'available'
        )
        .map(r => (r as Room & { id: string }).id) ?? []
    );
  }, [bookings, rooms]);

  const counts = {
    dirty: rooms?.filter(r => r.housekeepingStatus === 'dirty').length ?? 0,
    in_progress: rooms?.filter(r => r.housekeepingStatus === 'in_progress').length ?? 0,
    clean: rooms?.filter(r => r.housekeepingStatus === 'clean').length ?? 0,
    inspected: rooms?.filter(r => r.housekeepingStatus === 'inspected').length ?? 0,
  };

  const displayRooms = (rooms?.filter(r => filter === 'all' || r.housekeepingStatus === filter) as (Room & { id: string })[] ?? [])
    .sort((a, b) => {
      // urgent rooms first
      const aUrgent = urgentRoomIds.has(a.id) ? 0 : 1;
      const bUrgent = urgentRoomIds.has(b.id) ? 0 : 1;
      return aUrgent - bUrgent;
    });

  const filters: { value: HKStatus | 'all'; label: string }[] = [
    { value: 'all', label: `All (${rooms?.length ?? 0})` },
    { value: 'dirty', label: `Dirty (${counts.dirty})` },
    { value: 'in_progress', label: `In Progress (${counts.in_progress})` },
    { value: 'clean', label: `Clean (${counts.clean})` },
    { value: 'inspected', label: `Inspected (${counts.inspected})` },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Housekeeping</h1>
        <p className="text-muted-foreground mt-1">Track and update room cleaning status.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-red-200">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Dirty</p>
            <p className="text-2xl font-bold text-red-600">{counts.dirty}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">In Progress</p>
            <p className="text-2xl font-bold text-yellow-600">{counts.in_progress}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Clean</p>
            <p className="text-2xl font-bold text-green-600">{counts.clean}</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Inspected</p>
            <p className="text-2xl font-bold text-blue-600">{counts.inspected}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <Button
            key={f.value}
            size="sm"
            variant={filter === f.value ? 'default' : 'outline'}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Room Grid */}
      {/* Urgency banner */}
      {urgentRoomIds.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-orange-300 bg-orange-50 px-4 py-2.5 text-sm text-orange-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            <strong>{urgentRoomIds.size} room{urgentRoomIds.size > 1 ? 's' : ''}</strong> need{urgentRoomIds.size === 1 ? 's' : ''} urgent cleaning — guests are arriving today.
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-36" />)}
        </div>
      ) : displayRooms.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No rooms match this filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {displayRooms.map(room => (
            <RoomCard key={room.id} room={room} urgent={urgentRoomIds.has(room.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
