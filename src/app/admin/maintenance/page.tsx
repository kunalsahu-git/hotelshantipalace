'use client';

import { useState, useMemo } from 'react';
import {
  collection,
  query,
  orderBy,
  doc,
  updateDoc,
  addDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { format } from 'date-fns';
import { Plus, Wrench, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { toDate } from '@/lib/utils';
import type { MaintenanceTicket, Room } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/components/admin/admin-provider';
import { usePagination } from '@/hooks/use-pagination';
import { TablePagination } from '@/components/admin/table-pagination';

const TicketSchema = z.object({
  roomId: z.string().min(1, 'Please select a room.'),
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  priority: z.enum(['low', 'medium', 'high']),
});
type TicketFormData = z.infer<typeof TicketSchema>;

function StatusBadge({ status }: { status: MaintenanceTicket['status'] }) {
  if (status === 'open') return <Badge variant="destructive">Open</Badge>;
  if (status === 'in_progress') return <Badge className="bg-yellow-500 text-white hover:bg-yellow-500">In Progress</Badge>;
  return <Badge className="bg-green-600 text-white hover:bg-green-600">Resolved</Badge>;
}

function PriorityBadge({ priority }: { priority: MaintenanceTicket['priority'] }) {
  if (priority === 'high') return <Badge variant="destructive" className="font-normal">High</Badge>;
  if (priority === 'medium') return <Badge variant="outline" className="font-normal border-yellow-400 text-yellow-700">Medium</Badge>;
  return <Badge variant="secondary" className="font-normal">Low</Badge>;
}

function NewTicketDialog({ rooms }: { rooms: (Room & { id: string })[] }) {
  const [open, setOpen] = useState(false);
  const firestore = useFirestore();
  const { user } = useAdmin();
  const { toast } = useToast();

  const form = useForm<TicketFormData>({
    resolver: zodResolver(TicketSchema),
    defaultValues: { roomId: '', title: '', description: '', priority: 'medium' },
  });

  const onSubmit = async (data: TicketFormData) => {
    if (!firestore) return;
    const room = rooms.find(r => r.id === data.roomId);
    if (!room) return;

    try {
      await addDoc(collection(firestore, 'maintenanceTickets'), {
        roomId: room.id,
        roomNumber: room.roomNumber,
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: 'open',
        raisedBy: user?.name ?? 'Admin',
        raisedAt: serverTimestamp(),
      });
      toast({ title: 'Ticket Raised', description: `Maintenance ticket for Room ${room.roomNumber} created.` });
      form.reset();
      setOpen(false);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create ticket.' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-2 h-4 w-4" /> Raise Ticket</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Raise Maintenance Ticket</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="roomId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select a room" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {rooms.map(r => (
                        <SelectItem key={r.id} value={r.id}>
                          Room {r.roomNumber} — {r.categoryName} ({r.floor})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Title</FormLabel>
                  <FormControl><Input placeholder="e.g., AC not cooling" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea placeholder="Describe the issue in detail..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Submitting...' : 'Raise Ticket'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function MaintenancePage() {
  const firestore = useFirestore();
  const { user } = useAdmin();
  const { toast } = useToast();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<MaintenanceTicket['status'] | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<MaintenanceTicket['priority'] | 'all'>('all');

  const ticketsQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'maintenanceTickets'), orderBy('raisedAt', 'desc')) : null,
    [firestore]
  );
  const { data: tickets, isLoading } = useCollection<MaintenanceTicket>(ticketsQuery);

  const roomsQuery = useMemoFirebase(
    () => firestore ? collection(firestore, 'rooms') : null,
    [firestore]
  );
  const { data: rooms } = useCollection<Room>(roomsQuery);

  const handleStatusChange = async (ticket: MaintenanceTicket & { id: string }, newStatus: MaintenanceTicket['status']) => {
    if (!firestore) return;
    setLoadingId(ticket.id);
    try {
      const batch = writeBatch(firestore);

      batch.update(doc(firestore, 'maintenanceTickets', ticket.id), {
        status: newStatus,
        ...(newStatus === 'resolved' ? { resolvedAt: serverTimestamp(), resolvedBy: user?.name ?? 'Admin' } : {}),
      });

      // When resolved, set the room back to available (only if it's still in maintenance)
      if (newStatus === 'resolved' && ticket.roomId) {
        const room = (rooms as (Room & { id: string })[] | undefined)?.find(r => r.id === ticket.roomId);
        if (room?.status === 'maintenance') {
          batch.update(doc(firestore, 'rooms', ticket.roomId), {
            status: 'available',
            housekeepingStatus: 'dirty',
          });
        }
      }

      await batch.commit();
      toast({ title: newStatus === 'in_progress' ? 'Ticket started.' : 'Ticket resolved — room set to available.' });
    } catch {
      toast({ variant: 'destructive', title: 'Update failed.' });
    } finally {
      setLoadingId(null);
    }
  };

  const filteredTickets = useMemo(() => {
    let result = (tickets ?? []) as (MaintenanceTicket & { id: string })[];
    if (statusFilter !== 'all') result = result.filter(t => t.status === statusFilter);
    if (priorityFilter !== 'all') result = result.filter(t => t.priority === priorityFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        String(t.roomNumber).includes(q)
      );
    }
    return result;
  }, [tickets, statusFilter, priorityFilter, search]);

  const { page, setPage, pageSize, setPageSize, paginatedItems: pageTickets, totalItems, totalPages, showPagination } = usePagination(filteredTickets);

  const open = tickets?.filter(t => t.status === 'open').length ?? 0;
  const inProgress = tickets?.filter(t => t.status === 'in_progress').length ?? 0;
  const resolved = tickets?.filter(t => t.status === 'resolved').length ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Maintenance</h1>
        <NewTicketDialog rooms={(rooms as (Room & { id: string })[]) ?? []} />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-red-200">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-7 w-7 text-destructive opacity-70" />
            <div>
              <p className="text-xs text-muted-foreground">Open</p>
              <p className="text-2xl font-bold text-destructive">{open}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-7 w-7 text-yellow-600 opacity-70" />
            <div>
              <p className="text-xs text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600">{inProgress}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="h-7 w-7 text-green-600 opacity-70" />
            <div>
              <p className="text-xs text-muted-foreground">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{resolved}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Tickets</CardTitle>
          <CardDescription>All reported maintenance issues.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filter bar */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Input
              placeholder="Search issue title or room..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 w-56"
            />
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v as MaintenanceTicket['status'] | 'all'); setPage(1); }}>
              <SelectTrigger className="h-8 w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={v => { setPriorityFilter(v as MaintenanceTicket['priority'] | 'all'); setPage(1); }}>
              <SelectTrigger className="h-8 w-32"><SelectValue placeholder="Priority" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            {(search || statusFilter !== 'all' || priorityFilter !== 'all') && (
              <Button size="sm" variant="ghost" className="h-8" onClick={() => { setSearch(''); setStatusFilter('all'); setPriorityFilter('all'); }}>
                Clear filters
              </Button>
            )}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Raised By</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && [...Array(4)].map((_, i) => (
                <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
              ))}
              {!isLoading && filteredTickets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    <Wrench className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    {tickets?.length ? 'No tickets match the current filters.' : 'No maintenance tickets.'}
                  </TableCell>
                </TableRow>
              )}
              {pageTickets.map(t => {
                const isRowLoading = loadingId === t.id;
                return (
                  <TableRow key={t.id} className={isRowLoading ? 'opacity-50' : ''}>
                    <TableCell className="font-medium">Room {t.roomNumber}</TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{t.title}</div>
                      <div className="text-xs text-muted-foreground max-w-xs truncate">{t.description}</div>
                    </TableCell>
                    <TableCell><PriorityBadge priority={t.priority} /></TableCell>
                    <TableCell><StatusBadge status={t.status} /></TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{t.raisedBy}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {toDate(t.raisedAt) ? format(toDate(t.raisedAt)!, 'dd MMM yyyy') : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        {t.status === 'open' && (
                          <Button size="sm" variant="outline" onClick={() => handleStatusChange(t, 'in_progress')} disabled={isRowLoading}>
                            <Clock className="h-3.5 w-3.5 mr-1" /> Start
                          </Button>
                        )}
                        {t.status === 'in_progress' && (
                          <Button size="sm" onClick={() => handleStatusChange(t, 'resolved')} disabled={isRowLoading}>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Resolve
                          </Button>
                        )}
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
    </div>
  );
}
