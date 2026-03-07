'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Pencil, Trash2, LayoutGrid } from 'lucide-react';

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { RoomCategory } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
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
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

type CategoryWithId = RoomCategory & { id: string };

// ─── Schema ───────────────────────────────────────────────────────────────────

const CategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  basePrice: z.coerce.number().min(1, 'Price must be at least ₹1.'),
  maxOccupancy: z.coerce.number().min(1, 'Occupancy must be at least 1.'),
  amenities: z.string(), // comma-separated, split on save
  photoUrl: z.string().url('Enter a valid image URL.').or(z.literal('')),
  isActive: z.boolean(),
});
type CategoryFormData = z.infer<typeof CategorySchema>;

// ─── Form Dialog ──────────────────────────────────────────────────────────────

function CategoryFormDialog({
  open,
  onOpenChange,
  existing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  existing?: CategoryWithId | null;
}) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(CategorySchema),
  });

  // Re-populate every time the dialog opens (add or edit)
  useEffect(() => {
    if (!open) return;
    form.reset({
      name: existing?.name ?? '',
      description: existing?.description ?? '',
      basePrice: existing?.basePrice ?? 1500,
      maxOccupancy: existing?.maxOccupancy ?? 2,
      amenities: existing?.amenities?.join(', ') ?? '',
      photoUrl: existing?.photoUrl ?? '',
      isActive: existing?.isActive ?? true,
    });
  }, [open, existing]);

  const onSubmit = async (data: CategoryFormData) => {
    if (!firestore) return;
    const amenities = data.amenities
      .split(',')
      .map(a => a.trim())
      .filter(Boolean);

    const payload = {
      name: data.name,
      description: data.description,
      basePrice: data.basePrice,
      maxOccupancy: data.maxOccupancy,
      amenities,
      photoUrl: data.photoUrl || '',
      imageHint: 'hotel room',
      gallery: [],
      isActive: data.isActive,
    };

    try {
      if (existing) {
        await updateDoc(doc(firestore, 'roomCategories', existing.id), payload);
        toast({ title: 'Category Updated', description: `${data.name} updated successfully.` });
      } else {
        await addDoc(collection(firestore, 'roomCategories'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        toast({ title: 'Category Created', description: `${data.name} added to room categories.` });
      }
      form.reset();
      onOpenChange(false);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save category.' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) form.reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? 'Edit Category' : 'New Room Category'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Category Name</FormLabel>
                  <FormControl><Input placeholder="e.g. Deluxe Room" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="basePrice" render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Price (₹ / night)</FormLabel>
                  <FormControl><Input type="number" min={1} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="maxOccupancy" render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Occupancy</FormLabel>
                  <FormControl><Input type="number" min={1} max={10} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea placeholder="Describe this room category..." rows={3} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="amenities" render={({ field }) => (
              <FormItem>
                <FormLabel>Amenities</FormLabel>
                <FormControl><Input placeholder="Free WiFi, AC, TV, Hot Water" {...field} /></FormControl>
                <FormDescription>Comma-separated list of amenities.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="photoUrl" render={({ field }) => (
              <FormItem>
                <FormLabel>Photo URL</FormLabel>
                <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                <FormDescription>Direct image URL for the category thumbnail.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="isActive" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <FormLabel>Active</FormLabel>
                  <FormDescription className="text-xs">Inactive categories are hidden from the public booking page.</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )} />

            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : existing ? 'Save Changes' : 'Create Category'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<CategoryWithId | null>(null);

  const categoriesQuery = useMemoFirebase(
    () => firestore ? collection(firestore, 'roomCategories') : null,
    [firestore]
  );
  const { data: categories, isLoading } = useCollection<RoomCategory>(categoriesQuery);

  const handleDelete = async (cat: CategoryWithId) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'roomCategories', cat.id));
      toast({ title: 'Category Deleted', description: `${cat.name} removed.` });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not delete category.' });
    }
  };

  const handleToggleActive = async (cat: CategoryWithId) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'roomCategories', cat.id), { isActive: !cat.isActive });
      toast({ title: cat.isActive ? 'Deactivated' : 'Activated', description: `${cat.name} is now ${cat.isActive ? 'inactive' : 'active'}.` });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update category.' });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Room Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Define room types, pricing, and amenities shown on the booking page.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Category
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            {(categories?.length ?? 0)} categories configured.
            Changes here reflect immediately on the public booking page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Price / Night</TableHead>
                <TableHead className="text-center">Max Guests</TableHead>
                <TableHead className="hidden md:table-cell">Amenities</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && [...Array(4)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                </TableRow>
              ))}

              {!isLoading && (!categories || categories.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                    <LayoutGrid className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    No room categories yet. Create one to get started.
                  </TableCell>
                </TableRow>
              )}

              {categories?.map(cat => {
                const c = cat as CategoryWithId;
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground max-w-xs truncate">{c.description}</div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ₹{c.basePrice.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="text-center">{c.maxOccupancy}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {c.amenities?.slice(0, 3).map((a, i) => (
                          <Badge key={i} variant="secondary" className="text-xs font-normal">{a}</Badge>
                        ))}
                        {(c.amenities?.length ?? 0) > 3 && (
                          <Badge variant="outline" className="text-xs font-normal">
                            +{c.amenities.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() => handleToggleActive(c)}
                        className="cursor-pointer"
                        title={c.isActive ? 'Click to deactivate' : 'Click to activate'}
                      >
                        {c.isActive
                          ? <Badge className="bg-green-600 hover:bg-green-600 text-white">Active</Badge>
                          : <Badge variant="secondary">Inactive</Badge>
                        }
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => setEditCategory(c)}>
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
                              <AlertDialogTitle>Delete &quot;{c.name}&quot;?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This removes the category from Firestore. Existing bookings and rooms referencing this category will not be affected, but new bookings won&apos;t be able to select it.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(c)}
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
        </CardContent>
      </Card>

      <CategoryFormDialog open={addOpen} onOpenChange={setAddOpen} />
      <CategoryFormDialog
        open={!!editCategory}
        onOpenChange={open => !open && setEditCategory(null)}
        existing={editCategory}
      />
    </div>
  );
}
