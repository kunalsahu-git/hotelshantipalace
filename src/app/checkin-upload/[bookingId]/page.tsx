'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Upload, Loader2, Shield, Users, Hotel } from 'lucide-react';
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

// ─── Cloudinary upload ─────────────────────────────────────────────────────────

async function uploadIdPhoto(file: File, guestId: string, side: 'front' | 'back', guestIndex: number): Promise<string> {
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

  const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData });
  if (!uploadRes.ok) {
    const err = await uploadRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Upload failed');
  }
  return (await uploadRes.json()).secure_url as string;
}

// ─── Photo picker ──────────────────────────────────────────────────────────────

function PhotoPicker({ label, sublabel, preview, onChange, onClear, required }: {
  label: string;
  sublabel?: string;
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
      toast({ variant: 'destructive', title: 'Invalid file', description: 'Please select an image file.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'File too large', description: 'Image must be under 5 MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => onChange(file, ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-1.5">
      <div>
        <p className="text-sm font-medium text-gray-700">
          {label}
          {required ? <span className="text-red-500 ml-1">*</span> : <span className="text-gray-400 text-xs ml-1">(optional)</span>}
        </p>
        {sublabel && <p className="text-xs text-gray-400">{sublabel}</p>}
      </div>
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          <img src={preview} alt={label} className="w-full h-32 object-cover" />
          <button
            onClick={onClear}
            className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-xs font-medium px-2.5 py-1 rounded-full shadow border border-gray-200 hover:bg-white transition-colors"
          >
            Change
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 hover:border-gray-300 transition-all group">
          <div className="h-9 w-9 rounded-full bg-white border border-gray-200 flex items-center justify-center mb-1.5 shadow-sm group-hover:shadow transition-shadow">
            <Upload className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-xs font-medium text-gray-500">Tap to take photo or upload</p>
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleChange} />
        </label>
      )}
    </div>
  );
}

// ─── Guest section ─────────────────────────────────────────────────────────────

function GuestSection({ index, total, form, isPrimary, onChange }: {
  index: number;
  total: number;
  form: GuestForm;
  isPrimary: boolean;
  onChange: (patch: Partial<GuestForm>) => void;
}) {
  const isOptional = !isPrimary;

  return (
    <div className={`rounded-2xl border bg-white shadow-sm overflow-hidden ${isPrimary ? 'ring-2 ring-amber-400/60' : ''}`}>
      {/* Section header */}
      <div className={`px-4 py-3 flex items-center gap-3 border-b ${isPrimary ? 'bg-amber-50' : 'bg-gray-50'}`}>
        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
          isPrimary ? 'bg-amber-400 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${isPrimary ? 'text-amber-900' : 'text-gray-800'}`}>
            {isPrimary ? 'Primary Guest' : `Guest ${index + 1}`}
          </p>
          <p className="text-xs text-gray-500">
            {isPrimary ? 'ID verification required' : 'ID details optional'}
          </p>
        </div>
        {isPrimary && (
          <div className="flex items-center gap-1 bg-amber-100 text-amber-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
            <Shield className="w-3 h-3" /> Required
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Name + Age */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Label className="text-xs text-gray-600 font-medium mb-1 block">
              Full Name {isPrimary && <span className="text-red-500">*</span>}
            </Label>
            <Input
              value={form.name}
              onChange={e => onChange({ name: e.target.value })}
              placeholder="Full name"
              readOnly={isPrimary}
              className={`text-sm ${isPrimary ? 'bg-gray-50 cursor-default text-gray-500' : ''}`}
            />
          </div>
          <div>
            <Label className="text-xs text-gray-600 font-medium mb-1 block">
              Age {isPrimary && <span className="text-red-500">*</span>}
            </Label>
            <Input
              type="number"
              min={1}
              max={120}
              value={form.age}
              onChange={e => onChange({ age: e.target.value })}
              placeholder="Age"
              className="text-sm"
            />
          </div>
        </div>

        {/* ID Type + Number */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-gray-600 font-medium mb-1 block">
              ID Type {isPrimary && <span className="text-red-500">*</span>}
            </Label>
            <select
              value={form.idType}
              onChange={e => onChange({ idType: e.target.value })}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select type</option>
              <option value="aadhar">Aadhar Card</option>
              <option value="passport">Passport</option>
              <option value="driving_license">Driving License</option>
              <option value="voter_id">Voter ID</option>
              <option value="pan">PAN Card</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <Label className="text-xs text-gray-600 font-medium mb-1 block">
              ID Number {isPrimary && <span className="text-red-500">*</span>}
            </Label>
            <Input
              value={form.idNumber}
              onChange={e => onChange({ idNumber: e.target.value })}
              placeholder="ID number"
              className="text-sm"
            />
          </div>
        </div>

        {/* Photos */}
        <div className="grid grid-cols-2 gap-3">
          <PhotoPicker
            label="Front of ID"
            sublabel="Clear photo required"
            required={isPrimary}
            preview={form.frontPreview}
            onChange={(file, preview) => onChange({ frontFile: file, frontPreview: preview })}
            onClear={() => onChange({ frontFile: null, frontPreview: null })}
          />
          <PhotoPicker
            label="Back of ID"
            preview={form.backPreview}
            onChange={(file, preview) => onChange({ backFile: file, backPreview: preview })}
            onClear={() => onChange({ backFile: null, backPreview: null })}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

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
            name: data.guestName, email: data.guestEmail, phone: data.guestPhone,
            totalStays: 0, source: data.source || 'website', createdAt: serverTimestamp(),
          });
          currentGuestId = guestRef.id;
          await updateDoc(bookingRef, { guestId: currentGuestId });
          data.guestId = currentGuestId;
        }

        setBooking(data);
        setGuests([
          { ...EMPTY_GUEST(), name: data.guestName },
          ...Array.from({ length: numGuests - 1 }, EMPTY_GUEST),
        ]);

        const guestSnap = await getDoc(doc(firestore, 'guests', currentGuestId));
        if (guestSnap.exists()) {
          const gd = guestSnap.data();
          if (gd.idFrontUrl && gd.idUploadedAt) setAlreadySubmitted(true);
        }
      } catch (err) {
        console.error('Error fetching booking:', err);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load check-in. Please try again.' });
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [initialized, firestore, bookingId, router, toast]);

  const updateGuest = useCallback((index: number, patch: Partial<GuestForm>) => {
    setGuests(prev => prev.map((g, i) => i === index ? { ...g, ...patch } : g));
  }, []);

  // Only validate primary guest — additional guests are optional
  const validate = (): string | null => {
    const p = guests[0];
    if (!p.age || parseInt(p.age) < 1) return 'Please enter the primary guest\'s age.';
    if (!p.idType) return 'Please select an ID type for the primary guest.';
    if (!p.idNumber.trim()) return 'Please enter the ID number for the primary guest.';
    if (!p.frontFile) return 'Please upload a front photo of the primary guest\'s ID.';
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
      const total = guests.filter((g, i) => i === 0 || g.frontFile || g.name.trim()).length;
      let uploaded = 0;

      // Primary guest — always saved
      setUploadProgress('Uploading primary guest ID...');
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
      uploaded++;

      // Additional guests — only save if they filled anything in
      const additionalGuests = [];
      for (let i = 1; i < guests.length; i++) {
        const g = guests[i];
        const hasAnyData = g.name.trim() || g.idNumber.trim() || g.frontFile;
        if (!hasAnyData) continue; // skip completely empty additional guest rows

        setUploadProgress(`Uploading guest ${i + 1} ID...`);
        const entry: Record<string, any> = {
          name: g.name.trim() || `Guest ${i + 1}`,
          age: g.age ? parseInt(g.age) : null,
          idType: g.idType || null,
          idNumber: g.idNumber.trim() || null,
        };
        if (g.frontFile) {
          entry.idFrontUrl = await uploadIdPhoto(g.frontFile, booking.guestId, 'front', i);
        }
        if (g.backFile) {
          entry.idBackUrl = await uploadIdPhoto(g.backFile, booking.guestId, 'back', i);
        }
        additionalGuests.push(entry);
        uploaded++;
      }

      if (additionalGuests.length > 0) {
        await updateDoc(doc(firestore, 'bookings', booking.id), { additionalGuests });
      }

      toast({ title: 'Submitted!', description: 'Check-in documents received. See you at the front desk!' });
      setAlreadySubmitted(true);
    } catch (err) {
      console.error('Error uploading:', err);
      toast({ variant: 'destructive', title: 'Upload failed', description: 'Please try again.' });
    } finally {
      setSubmitting(false);
      setUploadProgress('');
    }
  };

  // ── States ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
        <div className="text-center space-y-3">
          <div className="h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
            <Loader2 className="h-7 w-7 animate-spin text-amber-600" />
          </div>
          <p className="text-sm text-gray-500 font-medium">Preparing your check-in...</p>
        </div>
      </div>
    );
  }

  if (alreadySubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 p-4">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-gray-900">You&apos;re all set!</h2>
            <p className="text-gray-500 text-sm">Your ID documents have been submitted.</p>
            <p className="text-gray-500 text-sm">Please head to the front desk to collect your key.</p>
          </div>
          <Button asChild className="w-full bg-amber-500 hover:bg-amber-600 text-white">
            <Link href="/">Visit Hotel Website</Link>
          </Button>
        </div>
      </div>
    );
  }

  const numGuests = guests.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      {/* Top bar */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-amber-100 px-4 py-3 flex items-center gap-2.5 sticky top-0 z-10">
        <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center">
          <Hotel className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">Hotel Shanti Palace</p>
          <p className="text-xs text-gray-500">Guest Check-in</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-5 pb-12 space-y-4">

        {/* Booking summary */}
        {booking && (
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-500" />
              <p className="font-semibold text-sm text-gray-800">Booking Summary</p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Guest</p>
                <p className="font-medium text-gray-800 truncate">{booking.guestName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Guests</p>
                <p className="font-medium text-gray-800">{numGuests} {numGuests === 1 ? 'person' : 'people'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Check-in</p>
                <p className="font-medium text-gray-800">{booking.checkIn}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Check-out</p>
                <p className="font-medium text-gray-800">{booking.checkOut}</p>
              </div>
            </div>
          </div>
        )}

        {/* Instruction banner */}
        <div className="bg-amber-500/10 border border-amber-200 rounded-xl px-4 py-3 flex gap-3 items-start">
          <Shield className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold">Primary guest ID is required.</span>{' '}
            {numGuests > 1 && 'Additional guest details are optional but help speed up check-in.'}
          </div>
        </div>

        {/* Guest sections */}
        {guests.map((g, i) => (
          <GuestSection
            key={i}
            index={i}
            total={numGuests}
            form={g}
            isPrimary={i === 0}
            onChange={patch => updateGuest(i, patch)}
          />
        ))}

        {/* Consent + Submit */}
        <div className="space-y-3">
          <p className="text-xs text-center text-gray-400 px-2">
            By submitting you consent to Hotel Shanti Palace collecting and storing ID proof as required for check-in under applicable regulations.
          </p>
          <Button
            className="w-full h-12 text-base font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-md shadow-amber-200"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{uploadProgress || 'Uploading...'}</>
            ) : (
              <><CheckCircle2 className="w-4 h-4 mr-2" />Submit & Complete Check-in</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
