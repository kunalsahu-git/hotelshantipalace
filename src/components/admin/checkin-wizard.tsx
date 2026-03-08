'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import QRCode from 'react-qr-code';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard, Upload, Loader2, CheckCircle2, ArrowRight, ArrowLeft,
  Smartphone, Monitor, BedDouble, User,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import type { Booking, Room, Guest } from '@/lib/types';

async function uploadIdPhoto(file: File, guestId: string, side: 'front' | 'back'): Promise<string> {
  const signRes = await fetch('/api/cloudinary/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guestId, side }),
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
  const data = await uploadRes.json();
  return data.secure_url as string;
}

type BookingWithId = Booking & { id: string };
type RoomWithId = Room & { id: string };
type GuestWithId = Guest & { id: string };
type CheckInStep = 'details' | 'id-upload' | 'room-select' | 'payment';

interface GuestFormData {
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  numberOfGuests: number;
  specialRequests: string;
}

interface CheckInWizardProps {
  booking: BookingWithId;
  availableRooms: RoomWithId[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (booking: BookingWithId, room: RoomWithId, paymentType: 'advance' | 'paylater') => void;
  isLoading: boolean;
}

// ─── Step 1: Guest Details ──────────────────────────────────────────────────────

function GuestDetailsStep({
  booking,
  onNext,
}: {
  booking: BookingWithId;
  onNext: (data: GuestFormData) => void;
}) {
  const [name, setName] = useState(booking.guestName);
  const [phone, setPhone] = useState(booking.guestPhone);
  const [email, setEmail] = useState(booking.guestEmail);
  const [guests, setGuests] = useState(booking.numberOfGuests);
  const [specialRequests, setSpecialRequests] = useState(booking.specialRequests || '');

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Guest Name</Label>
          <Input value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <Label>Phone</Label>
          <Input value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        <div>
          <Label>Email</Label>
          <Input value={email} onChange={e => setEmail(e.target.value)} type="email" />
        </div>
        <div>
          <Label>Number of Guests</Label>
          <Input
            type="number"
            min={1}
            max={booking.numberOfGuests + 2}
            value={guests}
            onChange={e => setGuests(parseInt(e.target.value) || 1)}
          />
        </div>
      </div>

      <div>
        <Label>Special Requests</Label>
        <Textarea
          value={specialRequests}
          onChange={e => setSpecialRequests(e.target.value)}
          placeholder="Any special requests..."
          rows={2}
        />
      </div>

      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Check-in:</span>
          <span className="font-medium">{booking.checkIn}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Check-out:</span>
          <span className="font-medium">{booking.checkOut}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Category:</span>
          <span className="font-medium">{booking.categoryName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Nights:</span>
          <span className="font-medium">{booking.numberOfNights}</span>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={() => onNext({ guestName: name, guestPhone: phone, guestEmail: email, numberOfGuests: guests, specialRequests })}
          disabled={!name.trim() || !phone.trim()}
        >
          Continue to ID Upload <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 2: ID Upload ──────────────────────────────────────────────────────────

function IdUploadStep({
  bookingId,
  guestId,
  guestName,
  guestPhone,
  guestEmail,
  guest,
  onNext,
  onBack,
  onGuestCreated,
}: {
  bookingId: string;
  guestId: string | undefined;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  guest: GuestWithId | null;
  onNext: () => void;
  onBack: () => void;
  onGuestCreated: (guestId: string) => void;
}) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [uploadMode, setUploadMode] = useState<'local' | 'qr' | null>(null);
  const [idType, setIdType] = useState(guest?.idType || '');
  const [idNumber, setIdNumber] = useState(guest?.idNumber || '');
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(guest?.idFrontUrl || null);
  const [idBackPreview, setIdBackPreview] = useState<string | null>(guest?.idBackUrl || null);
  const [uploading, setUploading] = useState(false);
  // idUploaded is true only when the ID is actually saved to Firestore/Storage
  const [idUploaded, setIdUploaded] = useState(!!guest?.idFrontUrl);
  const [currentGuestId, setCurrentGuestId] = useState<string | undefined>(guestId);
  const [pollCount, setPollCount] = useState(0);

  const qrUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/checkin-upload/${bookingId}`
    : `/checkin-upload/${bookingId}`;

  // Sync when parent passes an updated guest (e.g. via onRefresh)
  useEffect(() => {
    if (guest?.idFrontUrl) {
      setIdUploaded(true);
      setIdFrontPreview(guest.idFrontUrl);
      setIdBackPreview(guest.idBackUrl || null);
    }
  }, [guest]);

  // Keep currentGuestId in sync if parent resolves it
  useEffect(() => {
    if (guestId) setCurrentGuestId(guestId);
  }, [guestId]);

  // QR mode: poll for upload with max 100 retries (~5 min)
  useEffect(() => {
    if (uploadMode !== 'qr' || idUploaded || pollCount >= 100) return;

    const interval = setInterval(async () => {
      if (!firestore) return;
      setPollCount(c => c + 1);

      // If booking has no guestId yet, re-fetch it (the QR page may have created one)
      let resolvedGuestId = currentGuestId;
      if (!resolvedGuestId) {
        try {
          const bSnap = await getDoc(doc(firestore, 'bookings', bookingId));
          const gId = bSnap.exists() ? (bSnap.data().guestId as string | undefined) : undefined;
          if (gId) {
            resolvedGuestId = gId;
            setCurrentGuestId(gId);
            onGuestCreated(gId);
          }
        } catch {}
      }

      if (!resolvedGuestId) return;

      try {
        const snap = await getDoc(doc(firestore, 'guests', resolvedGuestId));
        if (snap.exists()) {
          const data = snap.data();
          if (data.idFrontUrl) {
            setIdUploaded(true);
            setIdFrontPreview(data.idFrontUrl);
            setIdBackPreview(data.idBackUrl || null);
            toast({ title: 'ID Uploaded', description: 'Guest has submitted their ID proof.' });
          }
        }
      } catch {}
    }, 3000);

    return () => clearInterval(interval);
  }, [uploadMode, idUploaded, pollCount, firestore, bookingId, currentGuestId, onGuestCreated, toast]);

  // Create guest if booking has no guestId yet
  const ensureGuest = async (): Promise<string | null> => {
    if (currentGuestId) return currentGuestId;
    if (!firestore) return null;
    try {
      const guestRef = await addDoc(collection(firestore, 'guests'), {
        name: guestName,
        email: guestEmail,
        phone: guestPhone,
        totalStays: 0,
        source: 'walkin',
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(firestore, 'bookings', bookingId), { guestId: guestRef.id });
      setCurrentGuestId(guestRef.id);
      onGuestCreated(guestRef.id);
      return guestRef.id;
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not create guest record.' });
      return null;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select an image.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Error', description: 'Image must be less than 5MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      if (side === 'front') { setIdFrontFile(file); setIdFrontPreview(ev.target?.result as string); }
      else { setIdBackFile(file); setIdBackPreview(ev.target?.result as string); }
    };
    reader.readAsDataURL(file);
  };

  const handleLocalUpload = async () => {
    if (!firestore) return;
    if (!idType || !idNumber) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter ID type and number.' });
      return;
    }
    if (!idFrontFile) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please upload ID front photo.' });
      return;
    }

    setUploading(true);
    try {
      const resolvedGuestId = await ensureGuest();
      if (!resolvedGuestId) return;

      const updates: Record<string, any> = { idType, idNumber, idUploadedAt: serverTimestamp() };

      updates.idFrontUrl = await uploadIdPhoto(idFrontFile, resolvedGuestId, 'front');

      if (idBackFile) {
        updates.idBackUrl = await uploadIdPhoto(idBackFile, resolvedGuestId, 'back');
      }

      await updateDoc(doc(firestore, 'guests', resolvedGuestId), updates);
      setIdUploaded(true);
      toast({ title: 'ID Saved', description: 'Guest ID has been saved.' });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to upload. Try again.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!uploadMode ? (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setUploadMode('local')}
            className="flex flex-col items-center justify-center p-6 border-2 rounded-lg hover:border-primary hover:bg-muted/50 transition-colors"
          >
            <Monitor className="h-10 w-10 mb-2 text-primary" />
            <span className="font-medium">Upload from Device</span>
            <span className="text-xs text-muted-foreground">Manager scans ID</span>
          </button>
          <button
            onClick={() => setUploadMode('qr')}
            className="flex flex-col items-center justify-center p-6 border-2 rounded-lg hover:border-primary hover:bg-muted/50 transition-colors"
          >
            <Smartphone className="h-10 w-10 mb-2 text-primary" />
            <span className="font-medium">Guest Scans QR</span>
            <span className="text-xs text-muted-foreground">Guest uploads on their phone</span>
          </button>
        </div>
      ) : uploadMode === 'local' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setUploadMode(null)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            {idUploaded && <Badge className="bg-green-500">ID Saved</Badge>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>ID Type</Label>
              <select
                value={idType}
                onChange={e => setIdType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                disabled={idUploaded}
              >
                <option value="">Select</option>
                <option value="aadhar">Aadhar Card</option>
                <option value="passport">Passport</option>
                <option value="driving_license">Driving License</option>
                <option value="voter_id">Voter ID</option>
                <option value="pan">PAN Card</option>
              </select>
            </div>
            <div>
              <Label>ID Number</Label>
              <Input value={idNumber} onChange={e => setIdNumber(e.target.value)} disabled={idUploaded} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>ID Front</Label>
              {idFrontPreview ? (
                <div className="relative mt-1">
                  <img src={idFrontPreview} alt="ID Front" className="w-full h-24 object-cover rounded border" />
                  {!idUploaded && (
                    <Button
                      variant="secondary" size="sm" className="absolute bottom-1 right-1"
                      onClick={() => { setIdFrontFile(null); setIdFrontPreview(null); }}
                    >Change</Button>
                  )}
                </div>
              ) : (
                <label className="flex items-center justify-center h-24 border-2 border-dashed rounded cursor-pointer bg-muted/30">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={e => handleFileChange(e, 'front')}
                  />
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </label>
              )}
            </div>
            <div>
              <Label>ID Back (Optional)</Label>
              {idBackPreview ? (
                <div className="relative mt-1">
                  <img src={idBackPreview} alt="ID Back" className="w-full h-24 object-cover rounded border" />
                  {!idUploaded && (
                    <Button
                      variant="secondary" size="sm" className="absolute bottom-1 right-1"
                      onClick={() => { setIdBackFile(null); setIdBackPreview(null); }}
                    >Change</Button>
                  )}
                </div>
              ) : (
                <label className="flex items-center justify-center h-24 border-2 border-dashed rounded cursor-pointer bg-muted/30">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={e => handleFileChange(e, 'back')}
                  />
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </label>
              )}
            </div>
          </div>

          {!idUploaded && (
            <Button onClick={handleLocalUpload} disabled={uploading} className="w-full">
              {uploading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                : <><CheckCircle2 className="mr-2 h-4 w-4" /> Save ID Proof</>
              }
            </Button>
          )}
        </div>
      ) : (
        // QR mode
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setUploadMode(null)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            {idUploaded && <Badge className="bg-green-500">ID Verified</Badge>}
          </div>

          {!idUploaded ? (
            <>
              <div className="text-center space-y-1">
                <p className="font-medium">Guest scans QR code to upload ID</p>
                <p className="text-sm text-muted-foreground">Ask the guest to scan this with their phone camera</p>
              </div>
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <QRCode value={qrUrl} size={200} />
              </div>
              <p className="text-xs text-center text-muted-foreground font-mono break-all">{qrUrl}</p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                {pollCount < 100
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Waiting for guest to upload...</>
                  : <span className="text-destructive">Timed out — ask guest to re-scan or switch to device upload.</span>
                }
              </div>
            </>
          ) : (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
              <p className="font-medium text-green-600">ID Successfully Uploaded!</p>
              {idFrontPreview && (
                <img src={idFrontPreview} alt="ID" className="w-48 h-32 object-cover mx-auto rounded border" />
              )}
            </div>
          )}
        </div>
      )}

      {/* Outer nav — always enabled */}
      <div className="flex justify-between pt-2 border-t">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={onNext} disabled={!idUploaded}>
          Continue to Room <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 3: Room Selection ────────────────────────────────────────────────────

function RoomSelectStep({
  booking,
  availableRooms,
  onBack,
  onConfirm,
}: {
  booking: BookingWithId;
  availableRooms: RoomWithId[];
  onBack: () => void;
  onConfirm: (room: RoomWithId) => void;
}) {
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');

  const matchingRooms = availableRooms
    .filter(r => r.categoryId === booking.categoryId)
    .sort((a, b) => {
      const order: Record<string, number> = { inspected: 0, clean: 1, dirty: 2, in_progress: 3 };
      return (order[a.housekeepingStatus] ?? 4) - (order[b.housekeepingStatus] ?? 4);
    });

  const hkBadge = (status: Room['housekeepingStatus']) => {
    switch (status) {
      case 'inspected': return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">Inspected</span>;
      case 'clean': return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-green-100 text-green-700">Clean</span>;
      default: return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">Not Ready</span>;
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Select an available <strong>{booking.categoryName}</strong> room:
      </p>

      {matchingRooms.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <BedDouble className="h-12 w-12 mx-auto mb-2 opacity-30" />
          <p>No available rooms in this category</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {matchingRooms.map(room => (
            <button
              key={room.id}
              type="button"
              onClick={() => setSelectedRoomId(room.id)}
              className={`w-full text-left rounded-lg border p-3 transition-colors ${
                selectedRoomId === room.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold">Room {room.roomNumber}</p>
                {hkBadge(room.housekeepingStatus)}
              </div>
              <p className="text-xs text-muted-foreground">{room.floor} · {room.categoryName}</p>
            </button>
          ))}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button
          onClick={() => {
            const room = matchingRooms.find(r => r.id === selectedRoomId);
            if (room) onConfirm(room);
          }}
          disabled={!selectedRoomId}
        >
          Continue to Payment <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 4: Payment ───────────────────────────────────────────────────────────

function PaymentStep({
  booking,
  room,
  onBack,
  onConfirm,
}: {
  booking: BookingWithId;
  room: RoomWithId;
  onBack: () => void;
  onConfirm: (paymentType: 'advance' | 'paylater') => void;
}) {
  const totalPrice = booking.totalPrice;

  return (
    <div className="space-y-4">
      {/* Confirmation summary */}
      <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Guest:</span>
          <span className="font-medium">{booking.guestName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Room:</span>
          <span className="font-medium">Room {room.roomNumber} ({room.categoryName})</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Stay:</span>
          <span className="font-medium">{booking.checkIn} → {booking.checkOut} ({booking.numberOfNights} night{booking.numberOfNights > 1 ? 's' : ''})</span>
        </div>
        {totalPrice != null && (
          <div className="flex justify-between border-t pt-2 mt-1 font-semibold">
            <span>Total</span>
            <span>₹{totalPrice.toLocaleString('en-IN')}</span>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">How would the guest like to pay?</p>

      <div className="grid gap-3">
        <button
          onClick={() => onConfirm('advance')}
          className="flex items-center justify-between p-4 border rounded-lg hover:border-primary hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-green-600" />
            <div className="text-left">
              <p className="font-medium">Pay Now</p>
              <p className="text-xs text-muted-foreground">Collect advance payment at check-in</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </button>

        <button
          onClick={() => onConfirm('paylater')}
          className="flex items-center justify-between p-4 border rounded-lg hover:border-primary hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-orange-600" />
            <div className="text-left">
              <p className="font-medium">Pay at Checkout</p>
              <p className="text-xs text-muted-foreground">Guest pays full amount when checking out</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex justify-start">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>
    </div>
  );
}

// ─── Main Wizard ───────────────────────────────────────────────────────────────

export function CheckInWizard({
  booking,
  availableRooms,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: CheckInWizardProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [step, setStep] = useState<CheckInStep>('details');
  const [currentBooking, setCurrentBooking] = useState<BookingWithId>(booking);
  const [currentGuestId, setCurrentGuestId] = useState<string | undefined>(booking.guestId);
  const [guest, setGuest] = useState<GuestWithId | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomWithId | null>(null);
  const [savingDetails, setSavingDetails] = useState(false);

  const STEPS: CheckInStep[] = ['details', 'id-upload', 'room-select', 'payment'];

  // Load guest when dialog opens
  useEffect(() => {
    if (!open || !firestore || !booking.guestId) return;
    getDoc(doc(firestore, 'guests', booking.guestId)).then(snap => {
      if (snap.exists()) setGuest({ ...snap.data(), id: snap.id } as GuestWithId);
    });
  }, [open, firestore, booking.guestId]);

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setStep('details');
      setSelectedRoom(null);
      setCurrentBooking(booking);
      setCurrentGuestId(booking.guestId);
      setGuest(null);
    }
  }, [open, booking]);

  const goNext = () => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };

  const goBack = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  // Step 1 → save edits to Firestore before advancing
  const handleStep1Next = async (data: GuestFormData) => {
    if (firestore) {
      setSavingDetails(true);
      try {
        await updateDoc(doc(firestore, 'bookings', booking.id), {
          guestName: data.guestName,
          guestPhone: data.guestPhone,
          guestEmail: data.guestEmail,
          numberOfGuests: data.numberOfGuests,
          specialRequests: data.specialRequests,
        });
        setCurrentBooking(b => ({ ...b, ...data }));
      } catch {
        toast({ variant: 'destructive', title: 'Warning', description: 'Could not save guest details update. Continuing anyway.' });
      } finally {
        setSavingDetails(false);
      }
    }
    goNext();
  };

  const handleRoomSelect = (room: RoomWithId) => {
    setSelectedRoom(room);
    goNext();
  };

  const handlePaymentConfirm = (paymentType: 'advance' | 'paylater') => {
    if (selectedRoom) onConfirm(currentBooking, selectedRoom, paymentType);
  };

  const handleGuestCreated = (guestId: string) => {
    setCurrentGuestId(guestId);
    setCurrentBooking(b => ({ ...b, guestId }));
  };

  const handleIdRefresh = () => {
    if (!firestore || !currentGuestId) return;
    getDoc(doc(firestore, 'guests', currentGuestId)).then(snap => {
      if (snap.exists()) setGuest({ ...snap.data(), id: snap.id } as GuestWithId);
    });
  };

  const stepIndex = STEPS.indexOf(step);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Check-in: {currentBooking.guestName}</DialogTitle>
          {/* Progress bar */}
          <div className="flex gap-2 mt-2">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded transition-colors ${
                  i === stepIndex ? 'bg-primary' : i < stepIndex ? 'bg-primary/50' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </DialogHeader>

        <div className="py-2">
          {step === 'details' && (
            <GuestDetailsStep
              booking={currentBooking}
              onNext={handleStep1Next}
            />
          )}

          {step === 'id-upload' && (
            <IdUploadStep
              bookingId={booking.id}
              guestId={currentGuestId}
              guestName={currentBooking.guestName}
              guestPhone={currentBooking.guestPhone}
              guestEmail={currentBooking.guestEmail}
              guest={guest}
              onNext={goNext}
              onBack={goBack}
              onGuestCreated={handleGuestCreated}
            />
          )}

          {step === 'room-select' && (
            <RoomSelectStep
              booking={currentBooking}
              availableRooms={availableRooms}
              onBack={goBack}
              onConfirm={handleRoomSelect}
            />
          )}

          {step === 'payment' && selectedRoom && (
            <PaymentStep
              booking={currentBooking}
              room={selectedRoom}
              onBack={goBack}
              onConfirm={handlePaymentConfirm}
            />
          )}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Processing check-in...
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
