'use client';
import Link from 'next/link';
import {
  collection,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import {
  useFirestore,
  useCollection,
  useMemoFirebase,
} from '@/firebase';
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
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  const firestore = useFirestore();

  // --- Data Fetching ---

  // Enquiries for alert banner
  const enquiriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'enquiries'), where('status', '==', 'new'));
  }, [firestore]);
  const { data: newEnquiries, isLoading: isLoadingEnquiries } = useCollection<Enquiry>(enquiriesQuery);

  // Total rooms
  const roomsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'rooms'));
  }, [firestore]);
  const { data: rooms, isLoading: isLoadingRooms } = useCollection<Room>(roomsQuery);

  // Website bookings today
  const getStartOfToday = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };

  const todaysBookingsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'bookings'),
      where('source', '==', 'website'),
      where('createdAt', '>=', Timestamp.fromDate(getStartOfToday()))
    );
  }, [firestore]);

  const { data: todaysWebsiteBookings, isLoading: isLoadingBookings } = useCollection<Booking>(todaysBookingsQuery);

  const isLoading = isLoadingEnquiries || isLoadingRooms || isLoadingBookings;

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
            <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingRooms ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{rooms?.length || 0}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy %</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Coming Soon</div>
            <p className="text-xs text-muted-foreground">based on today's occupancy</p>
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Now</CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Coming Soon</div>
            <p className="text-xs text-muted-foreground">Current room availability</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button size="lg" variant="outline"><PlusCircle className="mr-2"/> New Booking</Button>
          <Button size="lg" variant="outline"><LogIn className="mr-2"/> Check-In Guest</Button>
          <Button size="lg" variant="outline"><LogOut className="mr-2"/> Check-Out Guest</Button>
          <Button size="lg" variant="outline"><Wrench className="mr-2"/> New Maintenance Request</Button>
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
          <CardHeader><CardTitle>Upcoming Bookings (7 days)</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Upcoming bookings coming soon.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
