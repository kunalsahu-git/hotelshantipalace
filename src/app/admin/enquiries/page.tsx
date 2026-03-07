'use client';

import { useState, useMemo } from 'react';
import { collection, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { MessageSquare, Trash2, Eye, CheckCheck, MailOpen, CalendarDays, CalendarPlus } from 'lucide-react';
import { NewBookingDialog } from '@/components/admin/new-booking-dialog';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { usePagination } from '@/hooks/use-pagination';
import { TablePagination } from '@/components/admin/table-pagination';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { toDate } from '@/lib/utils';
import type { Enquiry } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

type EnquiryWithId = Enquiry & { id: string };

function StatusBadge({ status }: { status: Enquiry['status'] }) {
  if (status === 'new') return <Badge>New</Badge>;
  if (status === 'read') return <Badge variant="secondary">Read</Badge>;
  return <Badge variant="outline">Responded</Badge>;
}

export default function EnquiriesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selected, setSelected] = useState<EnquiryWithId | null>(null);
  const [convertEnquiry, setConvertEnquiry] = useState<EnquiryWithId | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Enquiry['status'] | 'all'>('all');
  const [dateFrom, setDateFrom] = useState('');

  const enquiriesQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'enquiries'), orderBy('submittedAt', 'desc'))
        : null,
    [firestore]
  );
  const { data: enquiries, isLoading } = useCollection<Enquiry>(enquiriesQuery);

  const handleOpen = async (enquiry: EnquiryWithId) => {
    setSelected(enquiry);
    if (enquiry.status === 'new' && firestore) {
      await updateDoc(doc(firestore, 'enquiries', enquiry.id), { status: 'read' });
    }
  };

  const handleMarkResponded = async (id: string) => {
    if (!firestore) return;
    await updateDoc(doc(firestore, 'enquiries', id), { status: 'responded' });
    toast({ title: 'Marked as Responded' });
    setSelected(null);
  };

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    await deleteDoc(doc(firestore, 'enquiries', id));
    toast({ title: 'Enquiry Deleted' });
    setSelected(null);
  };

  const filteredEnquiries = useMemo(() => {
    let result = (enquiries ?? []) as EnquiryWithId[];
    if (statusFilter !== 'all') result = result.filter(e => e.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        (e.phone ?? '').includes(q)
      );
    }
    if (dateFrom) {
      result = result.filter(e => {
        const d = toDate(e.submittedAt);
        return d ? format(d, 'yyyy-MM-dd') >= dateFrom : true;
      });
    }
    return result;
  }, [enquiries, statusFilter, search, dateFrom]);

  const { page, setPage, pageSize, setPageSize, paginatedItems: pageEnquiries, totalItems, totalPages, showPagination } = usePagination(filteredEnquiries);

  const newCount = enquiries?.filter(e => e.status === 'new').length ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enquiries</h1>
          {newCount > 0 && (
            <p className="text-sm text-primary font-medium mt-1">
              {newCount} unread {newCount === 1 ? 'enquiry' : 'enquiries'}
            </p>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Guest Messages</CardTitle>
          <CardDescription>Submissions from the website contact form.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filter bar */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Input
              placeholder="Search name, email, phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 w-56"
            />
            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v as Enquiry['status'] | 'all'); setPage(1); }}>
              <SelectTrigger className="h-8 w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="responded">Responded</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center h-8 border border-input rounded-md bg-background px-2.5 gap-1.5 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">Received from</span>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="bg-transparent text-sm outline-none w-[116px] text-foreground"
              />
            </div>
            {(search || statusFilter !== 'all' || dateFrom) && (
              <Button size="sm" variant="ghost" className="h-8" onClick={() => { setSearch(''); setStatusFilter('all'); setDateFrom(''); }}>
                Clear filters
              </Button>
            )}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="hidden md:table-cell">Received</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                  </TableRow>
                ))}

              {!isLoading && filteredEnquiries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    {enquiries?.length ? 'No enquiries match the current filters.' : 'No enquiries yet.'}
                  </TableCell>
                </TableRow>
              )}

              {pageEnquiries.map(e => {
                return (
                  <TableRow key={e.id} className={e.status === 'new' ? 'font-medium bg-primary/5' : ''}>
                    <TableCell>
                      <div>{e.name}</div>
                      <div className="text-xs text-muted-foreground">{e.email}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{e.phone || '—'}</TableCell>
                    <TableCell>
                      <p className="max-w-xs truncate text-sm">{e.message}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {toDate(e.submittedAt) ? format(toDate(e.submittedAt)!, 'dd MMM yyyy') : '—'}
                    </TableCell>
                    <TableCell><StatusBadge status={e.status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => handleOpen(e)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Enquiry?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the enquiry from {e.name}. This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(e.id)}
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

      {/* Convert Enquiry to Booking */}
      <NewBookingDialog
        open={!!convertEnquiry}
        onOpenChange={open => !open && setConvertEnquiry(null)}
        prefill={{
          name: convertEnquiry?.name,
          email: convertEnquiry?.email,
          phone: convertEnquiry?.phone,
        }}
      />

      {/* View Enquiry Dialog */}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Enquiry from {selected?.name}</DialogTitle>
            <DialogDescription>
              {selected?.email}
              {selected?.phone ? ` · ${selected.phone}` : ''}
              {selected && toDate(selected.submittedAt)
                ? ` · ${format(toDate(selected.submittedAt)!, 'dd MMM yyyy, hh:mm a')}`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/50 rounded-md p-4 text-sm leading-relaxed whitespace-pre-wrap">
            {selected?.message}
          </div>
          <div className="flex gap-2 justify-between pt-2 flex-wrap">
            <Button
              variant="default"
              onClick={() => {
                if (selected) {
                  setConvertEnquiry(selected);
                  setSelected(null);
                }
              }}
            >
              <CalendarPlus className="mr-2 h-4 w-4" /> Create Booking
            </Button>
            <div className="flex gap-2">
              {selected?.status !== 'responded' && (
                <Button
                  variant="outline"
                  onClick={() => selected && handleMarkResponded(selected.id)}
                >
                  <CheckCheck className="mr-2 h-4 w-4" /> Mark as Responded
                </Button>
              )}
              {selected?.status === 'responded' && (
                <Badge variant="outline" className="gap-1 self-center">
                  <MailOpen className="h-3 w-3" /> Responded
                </Badge>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
