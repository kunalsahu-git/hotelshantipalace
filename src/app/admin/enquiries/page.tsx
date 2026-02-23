'use client';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { type Enquiry } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

function EnquiryRow({ enquiry }: { enquiry: Enquiry }) {
  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{enquiry.name}</div>
        <div className="text-sm text-muted-foreground">{enquiry.email}</div>
      </TableCell>
      <TableCell className="hidden md:table-cell">{enquiry.phone}</TableCell>
      <TableCell>
        <p className="max-w-xs truncate">{enquiry.message}</p>
      </TableCell>
      <TableCell className="text-right">
        {enquiry.submittedAt ? (
          <div className="text-sm">
            {format(enquiry.submittedAt.toDate(), 'dd MMM yyyy')}
          </div>
        ) : null}
      </TableCell>
      <TableCell className="text-right">
        <Badge
          variant={enquiry.status === 'new' ? 'default' : 'secondary'}
          className="capitalize"
        >
          {enquiry.status}
        </Badge>
      </TableCell>
    </TableRow>
  );
}

export default function EnquiriesPage() {
  const firestore = useFirestore();
  const enquiriesQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'enquiries'), orderBy('submittedAt', 'desc'))
        : null,
    [firestore]
  );
  const { data: enquiries, isLoading } = useCollection<Enquiry>(enquiriesQuery);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Enquiries</h1>
      <Card>
        <CardHeader>
          <CardTitle>Guest Messages</CardTitle>
          <CardDescription>
            Submissions from the website contact form.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && enquiries?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No enquiries yet.
                  </TableCell>
                </TableRow>
              )}
              {enquiries?.map((enquiry) => (
                <EnquiryRow key={enquiry.id} enquiry={enquiry} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
