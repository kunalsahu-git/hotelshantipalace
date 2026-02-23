'use client';

import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useAdmin } from '@/components/admin/admin-provider';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Enquiry } from '@/lib/types';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

export default function EnquiriesPage() {
  const firestore = useFirestore();
  const { role, isStaffLoading } = useAdmin();

  const shouldFetch = !isStaffLoading && !!role;

  const enquiriesQuery = useMemoFirebase(() => {
    if (!firestore || !shouldFetch) return null;
    return query(collection(firestore, 'enquiries'), orderBy('submittedAt', 'desc'));
  }, [firestore, shouldFetch]);

  const { data: enquiries, isLoading, error } = useCollection<Enquiry>(enquiriesQuery);

  const getStatusVariant = (status: string) => {
    switch(status) {
      case 'new': return 'default';
      case 'read': return 'secondary';
      case 'responded': return 'outline';
      default: return 'outline';
    }
  }

  const finalIsLoading = isLoading || isStaffLoading;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Enquiries</h1>
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableCaption>{finalIsLoading ? "Loading..." : (enquiries?.length === 0 ? "No enquiries found." : "A list of recent website enquiries.")}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Submitted</TableHead>
              <TableHead>Guest</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {finalIsLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-64" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-destructive">
                   Error loading enquiries. You may not have permission to view this data.
                </TableCell>
              </TableRow>
            ) : (
              enquiries?.map((enquiry) => (
                <TableRow key={enquiry.id} className={enquiry.status === 'new' ? 'font-bold' : ''}>
                  <TableCell>
                    {enquiry.submittedAt ? format(enquiry.submittedAt.toDate(), 'dd MMM yyyy, HH:mm') : 'N/A'}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>{enquiry.name}</div>
                    <div className="text-muted-foreground font-normal text-sm">{enquiry.email}</div>
                    {enquiry.phone && <div className="text-muted-foreground font-normal text-sm">{enquiry.phone}</div>}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-normal">
                    <p className="truncate max-w-xs">{enquiry.message}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(enquiry.status)} className="capitalize">{enquiry.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                      <Button variant="outline" size="sm">View</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
