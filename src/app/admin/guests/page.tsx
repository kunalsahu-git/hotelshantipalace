'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, Users, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { toDate } from '@/lib/utils';
import type { Guest } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { usePagination } from '@/hooks/use-pagination';
import { TablePagination } from '@/components/admin/table-pagination';

const GuestSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  phone: z.string().min(10, 'Enter a valid phone number.'),
  email: z.string().email('Enter a valid email.'),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  address: z.string().optional(),
  nationality: z.string().optional(),
  notes: z.string().optional(),
});
type GuestFormData = z.infer<typeof GuestSchema>;

type GuestWithId = Guest & { id: string };

function GuestFormDialog({
  open,
  onOpenChange,
  existing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  existing?: GuestWithId | null;
}) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<GuestFormData>({
    resolver: zodResolver(GuestSchema),
  });

  // Re-populate every time the dialog opens (add or edit)
  useEffect(() => {
    if (!open) return;
    form.reset({
      name: existing?.name ?? '',
      phone: existing?.phone ?? '',
      email: existing?.email ?? '',
      idType: existing?.idType ?? '',
      idNumber: existing?.idNumber ?? '',
      address: existing?.address ?? '',
      nationality: existing?.nationality ?? '',
      notes: existing?.notes ?? '',
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, existing]);

  const handleOpenChange = (v: boolean) => {
    if (!v) form.reset();
    onOpenChange(v);
  };

  const onSubmit = async (data: GuestFormData) => {
    if (!firestore) return;
    try {
      if (existing) {
        await updateDoc(doc(firestore, 'guests', existing.id), { ...data });
        toast({ title: 'Guest Updated', description: `${data.name}'s profile has been updated.` });
      } else {
        await addDoc(collection(firestore, 'guests'), {
          ...data,
          totalStays: 0,
          source: 'walkin',
          createdAt: serverTimestamp(),
        });
        toast({ title: 'Guest Added', description: `${data.name} has been added to the directory.` });
      }
      form.reset();
      onOpenChange(false);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save guest.' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? 'Edit Guest' : 'Add New Guest'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input placeholder="Guest's full name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl><Input placeholder="Phone number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="Email address" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="idType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Type</FormLabel>
                    <FormControl><Input placeholder="e.g., Aadhaar, Passport" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="idNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Number</FormLabel>
                    <FormControl><Input placeholder="ID number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nationality</FormLabel>
                    <FormControl><Input placeholder="e.g., Indian" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Address</FormLabel>
                    <FormControl><Input placeholder="Home address" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Internal Notes</FormLabel>
                    <FormControl><Textarea placeholder="Any notes about this guest..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : existing ? 'Save Changes' : 'Add Guest'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function GuestsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<GuestWithId | null>(null);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'website' | 'walkin'>('all');

  const guestsQuery = useMemoFirebase(
    () => firestore ? query(collection(firestore, 'guests'), orderBy('createdAt', 'desc')) : null,
    [firestore]
  );
  const { data: guests, isLoading } = useCollection<Guest>(guestsQuery);

  const filteredGuests = useMemo(() => {
    let result = (guests ?? []) as GuestWithId[];
    if (sourceFilter !== 'all') result = result.filter(g => g.source === sourceFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(g =>
        g.name.toLowerCase().includes(q) ||
        g.email.toLowerCase().includes(q) ||
        g.phone.includes(q)
      );
    }
    return result;
  }, [guests, sourceFilter, search]);

  const { page, setPage, pageSize, setPageSize, paginatedItems: pageGuests, totalItems, totalPages, showPagination } = usePagination(filteredGuests);

  const handleEdit = (guest: GuestWithId) => {
    setEditingGuest(guest);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingGuest(null);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!firestore) return;
    await deleteDoc(doc(firestore, 'guests', id));
    toast({ title: 'Guest Removed', description: `${name} has been removed from the directory.` });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Guests</h1>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add Guest
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Guest Directory</CardTitle>
          <CardDescription>All registered guests — walk-in and website bookings.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filter bar */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Input
              placeholder="Search name, email, phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 w-64"
            />
            <Select value={sourceFilter} onValueChange={v => { setSourceFilter(v as 'all' | 'website' | 'walkin'); setPage(1); }}>
              <SelectTrigger className="h-8 w-36">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="walkin">Walk-in</SelectItem>
              </SelectContent>
            </Select>
            {(search || sourceFilter !== 'all') && (
              <Button size="sm" variant="ghost" className="h-8" onClick={() => { setSearch(''); setSourceFilter('all'); }}>
                Clear filters
              </Button>
            )}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="hidden lg:table-cell">Nationality</TableHead>
                <TableHead className="text-center">Stays</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="hidden md:table-cell">Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && [...Array(5)].map((_, i) => (
                <TableRow key={i}><TableCell colSpan={7}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
              ))}

              {!isLoading && filteredGuests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    {guests?.length ? 'No guests match the current filters.' : 'No guests yet. Add your first guest.'}
                  </TableCell>
                </TableRow>
              )}

              {pageGuests.map(g => {
                return (
                  <TableRow key={g.id}>
                    <TableCell>
                      <div className="font-medium">{g.name}</div>
                      <div className="text-xs text-muted-foreground">{g.email}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{g.phone}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{g.nationality || '—'}</TableCell>
                    <TableCell className="text-center text-sm font-semibold">{g.totalStays}</TableCell>
                    <TableCell>
                      <Badge variant={g.source === 'website' ? 'default' : 'secondary'} className="capitalize">
                        {g.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {toDate(g.createdAt) ? format(toDate(g.createdAt)!, 'dd MMM yyyy') : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(g)}>
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
                              <AlertDialogTitle>Remove Guest?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove {g.name} from the guest directory.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(g.id, g.name)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove
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

      <GuestFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        existing={editingGuest}
      />
    </div>
  );
}
