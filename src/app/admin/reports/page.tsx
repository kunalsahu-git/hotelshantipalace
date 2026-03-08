'use client';

import { useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { format, parseISO, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { BarChart3, TrendingUp, IndianRupee, BedDouble, Users, Calendar, Star, LucideIcon } from 'lucide-react';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Bill, Booking, Room } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  loading,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-24 mt-1" />
            ) : (
              <p className="text-2xl font-bold mt-1">{value}</p>
            )}
            {sub && !loading && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <Icon className="h-5 w-5 text-muted-foreground opacity-60 mt-1" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReportsPage() {
  const firestore = useFirestore();

  const billsQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'bills'), orderBy('generatedAt', 'desc')) : null,
    [firestore]
  );
  const { data: bills, isLoading: billsLoading } = useCollection<Bill>(billsQuery);

  const bookingsQuery = useMemoFirebase(
    () => firestore ? collection(firestore, 'bookings') : null,
    [firestore]
  );
  const { data: bookings, isLoading: bookingsLoading } = useCollection<Booking>(bookingsQuery);

  const roomsQuery = useMemoFirebase(
    () => firestore ? collection(firestore, 'rooms') : null,
    [firestore]
  );
  const { data: rooms } = useCollection<Room>(roomsQuery);

  const isLoading = billsLoading || bookingsLoading;

  const today = new Date();
  const thisMonthStr = format(today, 'yyyy-MM');
  const lastMonthStr = format(subMonths(today, 1), 'yyyy-MM');

  // ── Revenue metrics ──────────────────────────────────────────────────────────
  const paidBills = useMemo(
    () => (bills ?? []).filter(b => b.paymentStatus === 'paid' || b.paymentStatus === 'partial'),
    [bills]
  );

  const totalRevenue = useMemo(
    () => paidBills.reduce((sum, b) => sum + (b.paymentStatus === 'partial' && b.paidAmount != null ? b.paidAmount : b.totalAmount), 0),
    [paidBills]
  );

  const thisMonthRevenue = useMemo(
    () => paidBills
      .filter(b => {
        const d = b.generatedAt;
        if (!d) return false;
        const str = typeof d === 'string' ? d : (d as any)?.toDate?.()?.toISOString?.() ?? '';
        return str.startsWith(thisMonthStr);
      })
      .reduce((sum, b) => sum + (b.paymentStatus === 'partial' && b.paidAmount != null ? b.paidAmount : b.totalAmount), 0),
    [paidBills, thisMonthStr]
  );

  const lastMonthRevenue = useMemo(
    () => paidBills
      .filter(b => {
        const d = b.generatedAt;
        if (!d) return false;
        const str = typeof d === 'string' ? d : (d as any)?.toDate?.()?.toISOString?.() ?? '';
        return str.startsWith(lastMonthStr);
      })
      .reduce((sum, b) => sum + (b.paymentStatus === 'partial' && b.paidAmount != null ? b.paidAmount : b.totalAmount), 0),
    [paidBills, lastMonthStr]
  );

  // ── Booking metrics ──────────────────────────────────────────────────────────
  const totalBookings = bookings?.length ?? 0;
  const checkedIn = bookings?.filter(b => b.status === 'checked_in').length ?? 0;
  const totalRooms = rooms?.filter(r => r.isActive).length ?? 0;
  const occupancyRate = totalRooms > 0 ? Math.round((checkedIn / totalRooms) * 100) : 0;

  const cancelledCount = bookings?.filter(b => b.status === 'cancelled' || b.status === 'no_show').length ?? 0;
  const cancellationRate = totalBookings > 0 ? Math.round((cancelledCount / totalBookings) * 100) : 0;

  const avgNights = useMemo(() => {
    const checked = (bookings ?? []).filter(b => b.status === 'checked_out' || b.status === 'checked_in');
    if (checked.length === 0) return 0;
    return (checked.reduce((s, b) => s + (b.numberOfNights ?? 0), 0) / checked.length).toFixed(1);
  }, [bookings]);

  // ── Monthly revenue (last 6 months) ─────────────────────────────────────────
  const monthlyRevenue = useMemo(() => {
    const now = new Date();
    const months: { label: string; key: string; amount: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      const key = format(d, 'yyyy-MM');
      const label = format(d, 'MMM yy');
      const amount = paidBills
        .filter(b => {
          if (!b.generatedAt) return false;
          const str = typeof b.generatedAt === 'string'
            ? b.generatedAt
            : (b.generatedAt as any)?.toDate?.()?.toISOString?.() ?? '';
          return str.startsWith(key);
        })
        .reduce((s, b) => s + (b.paymentStatus === 'partial' && b.paidAmount != null ? b.paidAmount : b.totalAmount), 0);
      months.push({ label, key, amount });
    }
    return months;
  }, [paidBills]);

  const maxMonthlyAmount = Math.max(...monthlyRevenue.map(m => m.amount), 1);

  // ── Revenue by category ─────────────────────────────────────────────────────
  const revenueByCategory = useMemo(() => {
    const map = new Map<string, { name: string; revenue: number; bookings: number; nights: number }>();
    (bills ?? []).forEach(b => {
      if (b.paymentStatus === 'unpaid' || b.paymentStatus === 'void') return;
      const name = (bookings ?? []).find(bk => bk.id === b.bookingId)?.categoryName
        ?? (bills as any)?.categoryName
        ?? 'Unknown';
      const existing = map.get(name) ?? { name, revenue: 0, bookings: 0, nights: 0 };
      existing.revenue += b.paymentStatus === 'partial' && b.paidAmount != null ? b.paidAmount : b.totalAmount;
      existing.bookings += 1;
      existing.nights += b.numberOfNights ?? 0;
      map.set(name, existing);
    });
    return [...map.values()].sort((a, b) => b.revenue - a.revenue);
  }, [bills, bookings]);

  // ── Booking source breakdown ─────────────────────────────────────────────────
  const sourceBreakdown = useMemo(() => {
    const website = (bookings ?? []).filter(b => b.source === 'website').length;
    const admin = (bookings ?? []).filter(b => b.source === 'admin').length;
    return { website, admin };
  }, [bookings]);

  // ── Status breakdown ─────────────────────────────────────────────────────────
  const statusBreakdown = useMemo(() => {
    const statuses: Record<string, number> = {};
    (bookings ?? []).forEach(b => {
      statuses[b.status] = (statuses[b.status] ?? 0) + 1;
    });
    return statuses;
  }, [bookings]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(totalRevenue)}
          sub="All paid bills"
          icon={IndianRupee}
          loading={isLoading}
        />
        <StatCard
          title="This Month"
          value={formatCurrency(thisMonthRevenue)}
          sub={`vs ${formatCurrency(lastMonthRevenue)} last month`}
          icon={TrendingUp}
          loading={isLoading}
        />
        <StatCard
          title="Occupancy Rate"
          value={`${occupancyRate}%`}
          sub={`${checkedIn} of ${totalRooms} rooms occupied`}
          icon={BedDouble}
          loading={isLoading}
        />
        <StatCard
          title="Total Bookings"
          value={String(totalBookings)}
          sub={`${cancellationRate}% cancellation rate`}
          icon={Calendar}
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Avg. Stay Duration"
          value={`${avgNights} nights`}
          sub="Checked-in & checked-out"
          icon={Star}
          loading={isLoading}
        />
        <StatCard
          title="Total Guests"
          value={String((bookings ?? []).filter(b => b.status !== 'cancelled').reduce((s, b) => s + (b.numberOfGuests ?? 1), 0))}
          sub="Across all bookings"
          icon={Users}
          loading={isLoading}
        />
        <StatCard
          title="Unpaid Bills"
          value={String((bills ?? []).filter(b => b.paymentStatus === 'unpaid').length)}
          sub={`${(bills ?? []).filter(b => b.paymentStatus === 'partial').length} partial`}
          icon={IndianRupee}
          loading={isLoading}
        />
      </div>

      {/* Monthly Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue</CardTitle>
          <CardDescription>Last 6 months — paid bills only</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="flex items-end gap-3 h-40">
              {monthlyRevenue.map(m => {
                const pct = maxMonthlyAmount > 0 ? (m.amount / maxMonthlyAmount) * 100 : 0;
                const isCurrentMonth = m.key === thisMonthStr;
                return (
                  <div key={m.key} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground leading-none">
                      {m.amount > 0 ? formatCurrency(m.amount) : '—'}
                    </span>
                    <div className="w-full flex items-end" style={{ height: '100px' }}>
                      <div
                        className={`w-full rounded-t-sm transition-all ${isCurrentMonth ? 'bg-primary' : 'bg-primary/30'}`}
                        style={{ height: `${Math.max(pct, m.amount > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${isCurrentMonth ? 'text-primary' : 'text-muted-foreground'}`}>
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Booking Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Bookings by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? <Skeleton className="h-32 w-full" /> : (
              <div className="space-y-2">
                {Object.entries(statusBreakdown).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        status === 'checked_in' ? 'bg-green-500' :
                        status === 'reserved' ? 'bg-blue-500' :
                        status === 'checked_out' ? 'bg-gray-400' :
                        status === 'cancelled' ? 'bg-red-500' :
                        'bg-orange-500'
                      }`} />
                      <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/60 rounded-full"
                          style={{ width: `${totalBookings > 0 ? (count / totalBookings) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booking Source */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Source</CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? <Skeleton className="h-32 w-full" /> : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-sm">Website / Online</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${totalBookings > 0 ? (sourceBreakdown.website / totalBookings) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{sourceBreakdown.website}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-sm">Admin / Walk-in</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${totalBookings > 0 ? (sourceBreakdown.admin / totalBookings) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{sourceBreakdown.admin}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Category */}
      {revenueByCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Room Category</CardTitle>
            <CardDescription>From paid & partial bills</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Bills</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Nights</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenueByCategory.map(cat => (
                  <TableRow key={cat.name}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell className="text-right">{cat.bookings}</TableCell>
                    <TableCell className="text-right hidden md:table-cell">{cat.nights}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(cat.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
