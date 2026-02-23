'use client';
import Link from 'next/link';
import {
  collection,
  query,
  where,
  Timestamp,
  orderBy,
} from 'firebase/firestore';
import {
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
import { useAdmin } from '@/components/admin/admin-provider';
import type { Booking, Enquiry, Room } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Bed,
  Building,
  Percent,
  Globe,
  PlusCircle,
  LogIn,
  LogOut,
  Wrench,
  MessageSquareWarning,
  BedDouble,
  CalendarCheck,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, addDays, startOfDay } from 'date-fns';

export default function DashboardPage() {
  const firestore = useFirestore();
  const { role, isStaffLoading } = useAdmin();

  // --- Data Fetching ---

  const shouldFetch = !isStaffLoading && !!role;
  
  const startOfToday = startOfDay(new Date());
  const sevenDaysFromNow = addDays(startOfToday, 7);

  // Enquiries for alert banner
  const enquiriesQuery = useMemoFirebase(() => {
    if (!firestore || !shouldFetch) return null;
    return query(collection(firestore, 'enquiries'), where('status', '==', 'new'));
  }, [firestore, shouldFetch]);
  const { data: newEnquiries, isLoading: isLoadingEnquiries } = useCollection<Enquiry>(enquiriesQuery);

  // Total, Occupied, and Available rooms
  const roomsQuery = useMemoFirebase(() => {
    if (!firestore || !shouldFetch) return null;
    return query(collection(firestore, 'rooms'));
  }, [firestore, shouldFetch]);
  const { data: rooms, isLoading: isLoadingRooms } = useCollection<Room>(roomsQuery);

  const occupiedRoomsQuery = useMemoFirebase(() => {
    if (!firestore || !shouldFetch) return null;
    return query(collection(firestore, 'rooms'), where('status', '==', 'occupied'));
  }, [firestore, shouldFetch]);
  const { data: occupiedRooms, isLoading: isLoadingOccupied } = useCollection<Room>(occupiedRoomsQuery);
  
  const availableRoomsQuery = useMemoFirebase(() => {
    if (!firestore || !shouldFetch) return null;
    return query(collection(firestore, 'rooms'), where('status', '==', 'available'));
  }, [firestore, shouldFetch]);
  const { data: availableRooms, isLoading: isLoadingAvailable } = useCollection<Room>(availableRoomsQuery);


  // Website bookings today
  const todaysBookingsQuery = useMemoFirebase(() => {
    if (!firestore || !shouldFetch) return null;
    return query(
      collection(firestore, 'bookings'),
      where('source', '==', 'website'),
      where('createdAt', '>=', Timestamp.fromDate(startOfToday))
    );
  }, [firestore, shouldFetch]);

  const { data: todaysWebsiteBookings, isLoading: isLoadingBookings } = useCollection<Booking>(todaysBookingsQuery);

  // Upcoming bookings
  const upcomingBookingsQuery = useMemoFirebase(() => {
    if (!firestore || !shouldFetch) return null;
    return query(
      collection(firestore, 'bookings'),
      where('checkIn', '>=', format(startOfToday, 'yyyy-MM-dd')),
      where('checkIn', '<=', format(sevenDaysFromNow, 'yyyy-MM-dd')),
      orderBy('checkIn')
    );
  }, [firestore, shouldFetch]);
  const { data: upcomingBookings, isLoading: isLoadingUpcoming } = useCollection<Booking>(upcomingBookingsQuery);


  const isLoading = isLoadingEnquiries || isLoadingRooms || isLoadingBookings || isStaffLoading || isLoadingOccupied || isLoadingAvailable || isLoadingUpcoming;

  const totalRoomsCount = rooms?.length ?? 0;
  const occupiedRoomsCount = occupiedRooms?.length ?? 0;
  const availableRoomsCount = availableRooms?.length ?? 0;
  const occupancyPercentage = totalRoomsCount > 0 ? Math.round((occupiedRoomsCount / totalRoomsCount) * 100) : 0;

  if (isStaffLoading) {
    return (
       <div className="p-6">
        <Skeleton className="h-9 w-64 mb-6" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }
  
  if (!role) {
    // This can happen briefly during redirect or if the user has no role.
    return null; 
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      {/* Enquiries Alert */}
      {!isLoadingEnquiries && newEnquiries && newEnquiries.length > 0 && (
         <Alert className="mb-6 border-primary text-primary-foreground">
           <MessageSquareWarning className="h-4 w-4" />
           <AlertTitle className="font-bold">New Enquiries Received</AlertTitle>
           <AlertDescription className="flex justify-between items-center">
             You have {newEnquiries.length} unread {newEnquiries.length === 1 ? 'enquiry' : 'enquiries'}.
             <Button asChild variant="outline" size="sm" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
               <Link href="/admin/enquiries">View Enquiries</Link>
             </Button>
           </AlertDescription>
         </Alert>
       )}

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy %</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{occupancyPercentage}%</div>}
            <p className="text-xs text-muted-foreground">{occupiedRoomsCount} of {totalRoomsCount} rooms</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupied Today</CardTitle>
            <BedDouble className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{occupiedRoomsCount}</div>}
            <p className="text-xs text-muted-foreground">Rooms with guests currently checked in</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Now</CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
           <CardContent>
            {isLoading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{availableRoomsCount}</div>}
            <p className="text-xs text-muted-foreground">Clean, vacant rooms ready for check-in</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Website Bookings Today</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingBookings ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold flex items-center gap-2">
                {todaysWebsiteBookings?.length || 0}
                {todaysWebsiteBookings && todaysWebsiteBookings.length > 0 && <Badge>New</Badge>}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Since midnight</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button asChild size="lg" variant="outline"><Link href="/admin/bookings"><PlusCircle className="mr-2"/> New Booking</Link></Button>
          <Button asChild size="lg" variant="outline"><Link href="/admin/checkin"><LogIn className="mr-2"/> Check-In Guest</Link></Button>
          <Button asChild size="lg" variant="outline"><Link href="/admin/checkin"><LogOut className="mr-2"/> Check-Out Guest</Link></Button>
          <Button asChild size="lg" variant="outline"><Link href="/admin/maintenance"><Wrench className="mr-2"/> New Maintenance Request</Link></Button>
        </div>
      </div>
      
      {/* Activity Feed */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Today's Activity</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Activity feed coming soon.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Upcoming Bookings (7 days)</CardTitle>
            <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/bookings">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
             {isLoadingUpcoming ? (
              <div className="space-y-4">
                {[...Array(3)].map((_,i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : upcomingBookings && upcomingBookings.length > 0 ? (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                    <div>
                      <p className="font-semibold">{booking.guestName}</p>
                      <p className="text-sm text-muted-foreground">{booking.categoryName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{format(new Date(booking.checkIn), 'EEE, dd MMM')}</p>
                      <Badge variant={booking.source === 'website' ? 'default' : 'secondary'} className="capitalize mt-1">{booking.source}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <CalendarCheck className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4">No upcoming bookings in the next 7 days.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
