'use client';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Bed,
  Users,
  Percent,
  Globe,
  CalendarPlus,
  LogIn,
  LogOut,
  Wrench,
  AlertCircle,
  Building,
  BedDouble,
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdmin } from '@/components/admin/admin-provider';

export default function DashboardPage() {
  const { isStaffLoading } = useAdmin();
  const firestore = useFirestore();

  const canFetch = !isStaffLoading;

  const roomsQuery = useMemoFirebase(
    () => (firestore && canFetch ? collection(firestore, 'rooms') : null),
    [firestore, canFetch]
  );
  const { data: roomsData, isLoading: roomsLoading } = useCollection(roomsQuery);
  const totalRooms = roomsData?.length ?? 0;

  const newEnquiriesQuery = useMemoFirebase(
    () =>
      firestore && canFetch
        ? query(collection(firestore, 'enquiries'), where('status', '==', 'new'))
        : null,
    [firestore, canFetch]
  );
  const { data: newEnquiries, isLoading: enquiriesLoading } = useCollection(newEnquiriesQuery);

  const websiteBookingsQuery = useMemoFirebase(() => {
    if (!firestore || !canFetch) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return query(
      collection(firestore, 'bookings'),
      where('source', '==', 'website'),
      where('createdAt', '>=', Timestamp.fromDate(today)),
      where('createdAt', '<', Timestamp.fromDate(tomorrow))
    );
  }, [firestore, canFetch]);
  const { data: websiteBookings, isLoading: bookingsLoading } = useCollection(websiteBookingsQuery);

  const isLoading = roomsLoading || enquiriesLoading || bookingsLoading || isStaffLoading;

  const StatCard = ({ title, value, icon: Icon, description, loading }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-2/3" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {description && !loading && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      
      {/* New Enquiries Alert */}
      {!enquiriesLoading && newEnquiries && newEnquiries.length > 0 && (
         <Alert className="bg-primary/5 border-primary/20">
           <AlertCircle className="h-4 w-4 text-primary" />
           <AlertTitle className="text-primary font-bold">New Enquiries</AlertTitle>
           <AlertDescription className="text-primary/90 flex justify-between items-center">
             You have {newEnquiries.length} new {newEnquiries.length === 1 ? 'enquiry' : 'enquiries'} from the website.
             <Button variant="link" asChild className="p-0 h-auto text-primary/90">
                <Link href="/admin/enquiries">View them &rarr;</Link>
             </Button>
           </AlertDescription>
         </Alert>
      )}

      {/* Top Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Total Rooms"
          value={totalRooms}
          icon={Building}
          loading={isLoading}
        />
        <StatCard
          title="Website Bookings Today"
          value={websiteBookings?.length ?? 0}
          icon={Globe}
          loading={isLoading}
          description={websiteBookings?.length > 0 ? "New bookings received" : "From shantipalace.com"}
        />
        <StatCard
          title="Occupied Today"
          value="Coming Soon"
          icon={Bed}
          loading={false}
        />
        <StatCard
          title="Available Now"
          value="Coming Soon"
          icon={Users}
          loading={false}
        />
        <StatCard
          title="Occupancy %"
          value="Coming Soon"
          icon={Percent}
          loading={false}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Quick Actions */}
         <Card className="col-span-full">
           <CardHeader>
             <CardTitle>Quick Actions</CardTitle>
           </CardHeader>
           <CardContent className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <Button asChild variant="outline" size="lg" className="h-20 flex-col gap-2">
                <Link href="/admin/bookings">
                  <CalendarPlus className="h-6 w-6" />
                  New Booking
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-20 flex-col gap-2">
                <Link href="/admin/rooms">
                  <BedDouble className="h-6 w-6" />
                  Add New Room
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-20 flex-col gap-2">
                <Link href="/admin/checkin">
                  <LogIn className="h-6 w-6" />
                  Check-In Guest
                </Link>
              </Button>
               <Button asChild variant="outline" size="lg" className="h-20 flex-col gap-2">
                <Link href="/admin/checkin">
                  <LogOut className="h-6 w-6" />
                  Check-Out Guest
                </Link>
              </Button>
               <Button asChild variant="outline" size="lg" className="h-20 flex-col gap-2">
                <Link href="/admin/maintenance">
                  <Wrench className="h-6 w-6" />
                  New Maintenance Request
                </Link>
              </Button>
           </CardContent>
         </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-full lg:col-span-4">
          <CardHeader>
            <CardTitle>Today's Activity</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <p className="p-4 text-sm text-muted-foreground">Coming Soon</p>
          </CardContent>
        </Card>
        <Card className="col-span-full lg:col-span-3">
          <CardHeader>
            <CardTitle>Upcoming Bookings (Next 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming Soon</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
