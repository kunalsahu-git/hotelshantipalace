'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Upload, Loader2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface BookingData {
  id: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  guestId?: string;
  checkIn: string;
  checkOut: string;
  numberOfGuests: number;
  status: string;
  source?: 'website' | 'admin';
}

interface GuestForm {
  name: string;
  age: string;
  idType: string;
  idNumber: string;
  frontFile: File | null;
  frontPreview: string | null;
  backFile: File | null;
  backPreview: string | null;
}

// ─── Cloudinary upload helper ──────────────────────────────────────────────────

async function uploadIdPhoto(
  file: File,
  guestId: string,
  side: 'front' | 'back',
  guestIndex: number
): Promise<string> {
  const signRes = await fetch('/api/cloudinary/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guestId, side, guestIndex }),
  });
  if (!signRes.ok) throw new Error('Failed to get upload signature');
  const { signature, timestamp, apiKey, cloudName, folder, publicId } = await signRes.json();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', String(timestamp));
  formData.append('signature', signature);
  formData.append('folder', folder);
  formData.append('public_id', publicId);

  const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!uploadRes.ok) {
    const err = await uploadRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Upload failed');
  }
  return (await uploadRes.json()).secure_url as string;
}

// ─── File picker ────────────────────────────────────────────────────────────────

function PhotoPicker({
  label,
  preview,
  onChange,
  onClear,
  required,
}: {
  label: string;
  preview: string | null;
  onChange: (file: File, preview: string) => void;
  onClear: () => void;
  required?: boolean;
}) {
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select an image file.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Error', description: 'Image must be less than 5MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => onChange(file, ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <Label>{label}{required && <span className="text-destructive ml-1">*</span>}</Label>
      <div className="mt-1">
        {preview ? (
          <div className="relative">
            <img src={preview} alt={label} className="w-full h-36 object-cover rounded-lg border" />
            <Button variant="secondary" size="sm" className="absolute bottom-2 right-2" onClick={onClear}>
              Change
            </Button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
            <Upload className="w-7 h-7 mb-1 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Tap to upload</p>
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleChange} />
          </label>
        )}
      </div>
    </div>
  );
}

// ─── Guest section ──────────────────────────────────────────────────────────────

function GuestSection({
  index,
  total,
  form,
  isPrimary,
  onChange,
}: {
  index: number;
  total: number;
  form: GuestForm;
  isPrimary: boolean;
  onChange: (updated: Partial<GuestForm>) => void;
}) {
  return (
    <div className="border rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
          {index + 1}
        </div>
        <div>
          <p className="font-semibold text-sm">
            {isPrimary ? 'Primary Guest' : `Guest ${index + 1}`}
            {total > 1 && <span className="text-xs text-muted-foreground font-normal ml-1">({index + 1} of {total})</span>}
          </p>
        </div>
      </div>

      {/* Name + Age */}
      <div className="grid grid-cols-2 gap-3">
        <div className={isPrimary ? 'col-span-2 sm:col-span-1' : ''}>
          <Label>Full Name <span className="text-destructive">*</span></Label>
          <Input
            value={form.name}
            onChange={e => onChange({ name: e.target.value })}
            placeholder="Full name"
            readOnly={isPrimary}
            className={isPrimary ? 'bg-muted cursor-default' : ''}
          />
        </div>
        <div>
          <Label>Age <span className="text-destructive">*</span></Label>
          <Input
            type="number"
            min={1}
            max={120}
            value={form.age}
            onChange={e => onChange({ age: e.target.value })}
            placeholder="Age"
          />
        </div>
      </div>

      {/* ID Type + Number */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>ID Type <span className="text-destructive">*</span></Label>
          <select
            value={form.idType}
            onChange={e => onChange({ idType: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Select</option>
            <option value="aadhar">Aadhar Card</option>
            <option value="passport">Passport</option>
            <option value="driving_license">Driving License</option>
            <option value="voter_id">Voter ID</option>
            <option value="pan">PAN Card</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <Label>ID Number <span className="text-destructive">*</span></Label>
          <Input
            value={form.idNumber}
            onChange={e => onChange({ idNumber: e.target.value })}
            placeholder="ID number"
          />
        </div>
      </div>

      {/* Photos */}
      <div className="grid grid-cols-2 gap-3">
        <PhotoPicker
          label="ID Front"
          required
          preview={form.frontPreview}
          onChange={(file, preview) => onChange({ frontFile: file, frontPreview: preview })}
          onClear={() => onChange({ frontFile: null, frontPreview: null })}
        />
        <PhotoPicker
          label="ID Back (Optional)"
          preview={form.backPreview}
          onChange={(file, preview) => onChange({ backFile: file, backPreview: preview })}
          onClear={() => onChange({ backFile: null, backPreview: null })}
        />
      </div>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────────

const EMPTY_GUEST = (): GuestForm => ({
  name: '', age: '', idType: '', idNumber: '',
  frontFile: null, frontPreview: null, backFile: null, backPreview: null,
});

export default function CheckinUploadPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;
  const { toast } = useToast();

  const [firestore, setFirestore] = useState<any>(null);
  const [initialized, setInitialized] = useState(false);
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const [guests, setGuests] = useState<GuestForm[]>([EMPTY_GUEST()]);

  useEffect(() => {
    const { firestore: fs } = initializeFirebase();
    setFirestore(fs);
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized || !firestore) return;

    const fetchBooking = async () => {
      try {
        const bookingRef = doc(firestore, 'bookings', bookingId);
        const snap = await getDoc(bookingRef);
        if (!snap.exists()) {
          toast({ variant: 'destructive', title: 'Error', description: 'Booking not found.' });
          router.push('/');
          return;
        }

        const data = { ...snap.data(), id: snap.id } as BookingData;
        const numGuests = Math.max(1, data.numberOfGuests || 1);

        let currentGuestId = data.guestId;
        if (!currentGuestId) {
          const guestRef = await addDoc(collection(firestore, 'guests'), {
            name: data.guestName,
            email: data.guestEmail,
            phone: data.guestPhone,
            totalStays: 0,
            source: data.source || 'website',
            createdAt: serverTimestamp(),
          });
          currentGuestId = guestRef.id;
          await updateDoc(bookingRef, { guestId: currentGuestId });
          data.guestId = currentGuestId;
        }

        setBooking(data);

        // Initialise guest forms — primary guest has name pre-filled
        setGuests([
          { ...EMPTY_GUEST(), name: data.guestName },
          ...Array.from({ length: numGuests - 1 }, EMPTY_GUEST),
        ]);

        // Check if already fully submitted
        const guestSnap = await getDoc(doc(firestore, 'guests', currentGuestId));
        if (guestSnap.exists()) {
          const gd = guestSnap.data();
          if (gd.idFrontUrl && gd.idUploadedAt) setAlreadySubmitted(true);
        }
      } catch (err) {
        console.error('Error fetching booking:', err);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not prepare check-in. Please try again.' });
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [initialized, firestore, bookingId, router, toast]);

  const updateGuest = useCallback((index: number, patch: Partial<GuestForm>) => {
    setGuests(prev => prev.map((g, i) => i === index ? { ...g, ...patch } : g));
  }, []);

  const validate = (): string | null => {
    for (let i = 0; i < guests.length; i++) {
      const g = guests[i];
      const label = i === 0 ? 'Primary guest' : `Guest ${i + 1}`;
      if (!g.name.trim()) return `${label}: name is required.`;
      if (!g.age || parseInt(g.age) < 1) return `${label}: valid age is required.`;
      if (!g.idType) return `${label}: ID type is required.`;
      if (!g.idNumber.trim()) return `${label}: ID number is required.`;
      if (!g.frontFile) return `${label}: ID front photo is required.`;
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!firestore || !booking?.guestId) {
      toast({ variant: 'destructive', title: 'Error', description: 'System not ready. Please try again.' });
      return;
    }

    const err = validate();
    if (err) {
      toast({ variant: 'destructive', title: 'Missing information', description: err });
      return;
    }

    setSubmitting(true);
    try {
      const total = guests.length;

      // ── Primary guest ──────────────────────────────────────────────────────
      setUploadProgress(`Uploading Guest 1 of ${total}...`);
      const primaryUpdates: Record<string, any> = {
        age: parseInt(guests[0].age),
        idType: guests[0].idType,
        idNumber: guests[0].idNumber,
        idUploadedAt: serverTimestamp(),
      };
      primaryUpdates.idFrontUrl = await uploadIdPhoto(guests[0].frontFile!, booking.guestId, 'front', 0);
      if (guests[0].backFile) {
        primaryUpdates.idBackUrl = await uploadIdPhoto(guests[0].backFile, booking.guestId, 'back', 0);
      }
      await updateDoc(doc(firestore, 'guests', booking.guestId), primaryUpdates);

      // ── Additional guests ──────────────────────────────────────────────────
      const additionalGuests = [];
      for (let i = 1; i < guests.length; i++) {
        setUploadProgress(`Uploading Guest ${i + 1} of ${total}...`);
        const g = guests[i];
        const entry: Record<string, any> = {
          name: g.name.trim(),
          age: parseInt(g.age),
          idType: g.idType,
          idNumber: g.idNumber.trim(),
        };
        entry.idFrontUrl = await uploadIdPhoto(g.frontFile!, booking.guestId, 'front', i);
        if (g.backFile) {
          entry.idBackUrl = await uploadIdPhoto(g.backFile, booking.guestId, 'back', i);
        }
        additionalGuests.push(entry);
      }

      // Save additional guests to booking doc
      if (additionalGuests.length > 0) {
        await updateDoc(doc(firestore, 'bookings', booking.id), { additionalGuests });
      }

      toast({ title: 'Submitted!', description: 'All guest IDs have been submitted successfully.' });
      setAlreadySubmitted(true);
    } catch (err) {
      console.error('Error uploading:', err);
      toast({ variant: 'destructive', title: 'Error', description: 'Upload failed. Please try again.' });
    } finally {
      setSubmitting(false);
      setUploadProgress('');
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-600" />
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // ── Already submitted ──────────────────────────────────────────────────────

  if (alreadySubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-green-700">All Done!</h2>
            <p className="text-muted-foreground mt-2">All guest IDs have been submitted. Thank you!</p>
            <p className="text-sm text-muted-foreground mt-1">You can now proceed to your room at the front desk.</p>
            <Button asChild className="mt-6 w-full">
              <Link href="/">Go to Hotel Website</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────

  const numGuests = guests.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4 pb-10">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Complete Check-in</CardTitle>
            <CardDescription>
              Please provide ID details for all {numGuests} guest{numGuests > 1 ? 's' : ''} in your booking.
            </CardDescription>
          </CardHeader>
          {booking && (
            <CardContent className="pt-0">
              <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{booking.guestName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-in</span>
                  <span className="font-medium">{booking.checkIn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-out</span>
                  <span className="font-medium">{booking.checkOut}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Guests</span>
                  <span className="font-medium">{numGuests}</span>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* One section per guest */}
        {guests.map((g, i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <GuestSection
                index={i}
                total={numGuests}
                form={g}
                isPrimary={i === 0}
                onChange={patch => updateGuest(i, patch)}
              />
            </CardContent>
          </Card>
        ))}

        {/* Submit */}
        <Card>
          <CardContent className="pt-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              By submitting, all guests consent to Hotel Shanti Palace storing copies of their ID for check-in verification as required by law.
            </p>
            <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {uploadProgress || 'Uploading...'}</>
              ) : (
                <><CheckCircle2 className="w-4 h-4 mr-2" /> Submit All Guest IDs</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
