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
import { collection, query, orderBy, where } from 'firebase/firestore';
import { isToday, format, addDays, parseISO, differenceInDays } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
  const occupiedRooms = roomsData?.filter((r: any) => r.status === 'occupied').length ?? 0;
  const availableRooms = roomsData?.filter((r: any) => r.status === 'available').length ?? 0;
  const occupancyPct = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  const newEnquiriesQuery = useMemoFirebase(
    () =>
      firestore && canFetch
        ? query(collection(firestore, 'enquiries'), where('status', '==', 'new'))
        : null,
    [firestore, canFetch]
  );
  const { data: newEnquiries, isLoading: enquiriesLoading } = useCollection(newEnquiriesQuery);

  const allBookingsQuery = useMemoFirebase(
    () =>
      firestore && canFetch
        ? query(collection(firestore, 'bookings'), orderBy('createdAt', 'desc'))
        : null,
    [firestore, canFetch]
  );
  const { data: allBookings, isLoading: bookingsLoading } = useCollection(allBookingsQuery);

  const websiteBookings = allBookings?.filter((b: any) => {
    if (b.source !== 'website') return false;
    const ts = b.createdAt;
    if (!ts) return false;
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return isToday(date);
  });

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const in7DaysStr = format(addDays(new Date(), 7), 'yyyy-MM-dd');

  // Pending arrivals: check-in is today and still reserved (not yet checked in)
  const todayArrivals = (allBookings?.filter((b: any) =>
    b.checkIn === todayStr && b.status === 'reserved'
  ) ?? []) as any[];

  // Pending departures: check-out is today and currently checked in
  const todayDepartures = (allBookings?.filter((b: any) =>
    b.checkOut === todayStr && b.status === 'checked_in'
  ) ?? []) as any[];

  // Already checked in today
  const checkedInToday = (allBookings?.filter((b: any) =>
    b.checkIn === todayStr && b.status === 'checked_in'
  ) ?? []) as any[];

  // Already checked out today
  const checkedOutToday = (allBookings?.filter((b: any) =>
    b.checkOut === todayStr && b.status === 'checked_out'
  ) ?? []) as any[];

  // Upcoming reservations: check-in is within the next 7 days (not today), status = reserved
  const upcomingBookings = ((allBookings?.filter((b: any) =>
    b.checkIn > todayStr && b.checkIn <= in7DaysStr && b.status === 'reserved'
  ) ?? []) as any[]).sort((a: any, b: any) => a.checkIn.localeCompare(b.checkIn));

  const isLoading = roomsLoading || enquiriesLoading || bookingsLoading || isStaffLoading;

  const StatCard = ({ title, value, icon: Icon, description, loading, delay = 0 }: any) => (
    <Card
      className="transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
      style={{ animationDelay: `${delay}ms` }}
    >
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
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <Button variant="outline" size="sm" asChild>
          <Link href="/" target="_blank" rel="noopener noreferrer">
            <Globe className="mr-2 h-4 w-4" />
            View Main Site
          </Link>
        </Button>
      </div>
      
      {/* New Enquiries Alert */}
      {!enquiriesLoading && newEnquiries && newEnquiries.length > 0 && (
         <Alert className="bg-primary/5 border-primary/20 animate-scale-in">
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 animate-fade-in">
        <StatCard
          title="Total Rooms"
          value={totalRooms}
          icon={Building}
          loading={isLoading}
          delay={0}
        />
        <StatCard
          title="Website Bookings Today"
          value={websiteBookings?.length ?? 0}
          icon={Globe}
          loading={isLoading}
          description={(websiteBookings?.length ?? 0) > 0 ? "New bookings received" : "From shantipalace.com"}
          delay={75}
        />
        <StatCard
          title="Occupied Today"
          value={occupiedRooms}
          icon={Bed}
          loading={isLoading}
          delay={150}
        />
        <StatCard
          title="Available Now"
          value={availableRooms}
          icon={Users}
          loading={isLoading}
          delay={225}
        />
        <StatCard
          title="Occupancy %"
          value={`${occupancyPct}%`}
          icon={Percent}
          loading={isLoading}
          delay={300}
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
                <Link href="/admin/bookings">
                  <LogIn className="h-6 w-6" />
                  Check-In Guest
                </Link>
              </Button>
               <Button asChild variant="outline" size="lg" className="h-20 flex-col gap-2">
                <Link href="/admin/bookings">
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
        {/* Today's Activity */}
        <Card className="col-span-full lg:col-span-4">
          <CardHeader>
            <CardTitle>Today&apos;s Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {bookingsLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <>
                {/* Pending Arrivals */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <LogIn className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">Pending Arrivals</span>
                    <Badge variant="secondary">{todayArrivals.length}</Badge>
                  </div>
                  {todayArrivals.length === 0 ? (
                    <p className="text-xs text-muted-foreground pl-6">No pending arrivals today.</p>
                  ) : (
                    <div className="space-y-1 pl-6">
                      {todayArrivals.map((b: any) => (
                        <div key={b.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                          <div>
                            <p className="text-sm font-medium">{b.guestName}</p>
                            <p className="text-xs text-muted-foreground">
                              {b.categoryName}{b.numberOfGuests ? ` · ${b.numberOfGuests} guest${b.numberOfGuests > 1 ? 's' : ''}` : ''}
                              {' · '}{b.numberOfNights} night{b.numberOfNights > 1 ? 's' : ''}
                            </p>
                          </div>
                          <Button asChild size="sm" variant="outline">
                            <Link href="/admin/checkin">Check In</Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pending Departures */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <LogOut className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-semibold">Pending Departures</span>
                    <Badge variant="secondary">{todayDepartures.length}</Badge>
                  </div>
                  {todayDepartures.length === 0 ? (
                    <p className="text-xs text-muted-foreground pl-6">No pending departures today.</p>
                  ) : (
                    <div className="space-y-1 pl-6">
                      {todayDepartures.map((b: any) => (
                        <div key={b.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                          <div>
                            <p className="text-sm font-medium">{b.guestName}</p>
                            <p className="text-xs text-muted-foreground">
                              {b.roomNumber ? `Room ${b.roomNumber}` : b.categoryName}
                              {' · '}{b.numberOfNights} night{b.numberOfNights > 1 ? 's' : ''}
                            </p>
                          </div>
                          <Button asChild size="sm" variant="outline">
                            <Link href="/admin/checkin">Check Out</Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Completed Today */}
                {(checkedInToday.length > 0 || checkedOutToday.length > 0) && (
                  <div className="pt-1 border-t">
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Completed today</p>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      {checkedInToday.length > 0 && (
                        <span className="flex items-center gap-1">
                          <LogIn className="h-3 w-3 text-green-600" />
                          {checkedInToday.length} checked in
                        </span>
                      )}
                      {checkedOutToday.length > 0 && (
                        <span className="flex items-center gap-1">
                          <LogOut className="h-3 w-3 text-gray-500" />
                          {checkedOutToday.length} checked out
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {todayArrivals.length === 0 && todayDepartures.length === 0 &&
                  checkedInToday.length === 0 && checkedOutToday.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No activity scheduled for today.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Bookings */}
        <Card className="col-span-full lg:col-span-3">
          <CardHeader>
            <CardTitle>Upcoming Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : upcomingBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No upcoming reservations in the next 7 days.
              </p>
            ) : (
              <div className="space-y-1">
                {upcomingBookings.map((b: any) => {
                  const daysUntil = differenceInDays(parseISO(b.checkIn), new Date());
                  return (
                    <div key={b.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{b.guestName}</p>
                        <p className="text-xs text-muted-foreground">
                          {b.categoryName} · {b.numberOfNights}N
                        </p>
                      </div>
                      <div className="text-right ml-3 shrink-0">
                        <p className="text-xs font-medium text-primary">
                          {daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(b.checkIn), 'dd MMM')}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {upcomingBookings.length > 0 && (
                  <div className="pt-2">
                    <Button asChild variant="link" size="sm" className="p-0 h-auto text-xs">
                      <Link href="/admin/bookings">View all bookings →</Link>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
