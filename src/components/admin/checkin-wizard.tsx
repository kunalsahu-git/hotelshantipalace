'use client';

import { useState, useEffect, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import QRCode from 'react-qr-code';
import { format } from 'date-fns';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  User, CreditCard, QrCode, Upload, Loader2, CheckCircle2, ArrowRight, ArrowLeft,
  Smartphone, Monitor, BedDouble, AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useStorage } from '@/firebase';
import type { Booking, Room, Guest } from '@/lib/types';

type BookingWithId = Booking & { id: string };
type RoomWithId = Room & { id: string };
type GuestWithId = Guest & { id: string };

type CheckInStep = 'details' | 'id-upload' | 'room-select' | 'payment' | 'confirm';

interface CheckInWizardProps {
  booking: BookingWithId;
  availableRooms: RoomWithId[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (booking: BookingWithId, room: RoomWithId, paymentType: 'advance' | 'paylater') => void;
  isLoading: boolean;
}

// ─── Step 1: Guest Details ─────────────────────────────────────────────────────

function GuestDetailsStep({
  booking,
  guest,
  onNext,
}: {
  booking: BookingWithId;
  guest: GuestWithId | null;
  onNext: () => void;
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

      {/* Booking Summary */}
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
        <Button onClick={onNext}>
          Continue to ID Upload <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 2: ID Upload ─────────────────────────────────────────────────────────

function IdUploadStep({
  booking,
  guest,
  onNext,
  onBack,
  onRefresh,
}: {
  booking: BookingWithId;
  guest: GuestWithId | null;
  onNext: () => void;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const [uploadMode, setUploadMode] = useState<'local' | 'qr' | null>(null);
  const [idType, setIdType] = useState(guest?.idType || '');
  const [idNumber, setIdNumber] = useState(guest?.idNumber || '');
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(guest?.idFrontUrl || null);
  const [idBackPreview, setIdBackPreview] = useState<string | null>(guest?.idBackUrl || null);
  const [uploading, setUploading] = useState(false);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [idUploaded, setIdUploaded] = useState(!!guest?.idFrontUrl);

  const qrUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/checkin-upload/${booking.id}`
    : `/checkin-upload/${booking.id}`;

  useEffect(() => {
    if (uploadMode === 'qr' && !idUploaded) {
      // Poll for upload status
      const interval = setInterval(async () => {
        if (!firestore || !booking.guestId) return;
        try {
          const snap = await getDoc(doc(firestore, 'guests', booking.guestId));
          if (snap.exists()) {
            const data = snap.data();
            if (data.idFrontUrl) {
              setIdUploaded(true);
              setIdFrontPreview(data.idFrontUrl);
              setIdBackPreview(data.idBackUrl || null);
              clearInterval(interval);
              toast({ title: 'ID Uploaded', description: 'Guest has submitted their ID proof.' });
            }
          }
        } catch {}
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [uploadMode, idUploaded, firestore, booking.guestId, toast]);

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
    reader.onload = (ev) => {
      if (side === 'front') {
        setIdFrontFile(file);
        setIdFrontPreview(ev.target?.result as string);
      } else {
        setIdBackFile(file);
        setIdBackPreview(ev.target?.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLocalUpload = async () => {
    if (!firestore || !storage || !booking.guestId) return;
    if (!idType || !idNumber) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter ID type and number.' });
      return;
    }
    if (!idFrontFile && !idFrontPreview) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please upload ID front photo.' });
      return;
    }

    setUploading(true);
    try {
      const updates: any = { idType, idNumber, idUploadedAt: serverTimestamp() };

      if (idFrontFile) {
        const frontRef = ref(storage, `guests/${booking.guestId}/id-front.jpg`);
        await uploadBytes(frontRef, idFrontFile);
        updates.idFrontUrl = await getDownloadURL(frontRef);
      }

      if (idBackFile) {
        const backRef = ref(storage, `guests/${booking.guestId}/id-back.jpg`);
        await uploadBytes(backRef, idBackFile);
        updates.idBackUrl = await getDownloadURL(backRef);
      }

      await updateDoc(doc(firestore, 'guests', booking.guestId), updates);
      setIdUploaded(true);
      toast({ title: 'ID Uploaded', description: 'Guest ID has been saved.' });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to upload.' });
    } finally {
      setUploading(false);
    }
  };

  const idVerified = idUploaded || (idFrontPreview && idType && idNumber);

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
            onClick={() => { setUploadMode('qr'); setQrGenerated(true); }}
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
            {idUploaded && <Badge className="bg-green-500">ID Verified</Badge>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>ID Type</Label>
              <select
                value={idType}
                onChange={e => setIdType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
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
              <Input value={idNumber} onChange={e => setIdNumber(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>ID Front</Label>
              {idFrontPreview ? (
                <div className="relative mt-1">
                  <img src={idFrontPreview} alt="ID Front" className="w-full h-24 object-cover rounded border" />
                  <Button
                    variant="secondary" size="sm" className="absolute bottom-1 right-1"
                    onClick={() => { setIdFrontFile(null); setIdFrontPreview(null); }}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <label className="flex items-center justify-center h-24 border-2 border-dashed rounded cursor-pointer bg-muted/30">
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, 'front')} />
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </label>
              )}
            </div>
            <div>
              <Label>ID Back (Optional)</Label>
              {idBackPreview ? (
                <div className="relative mt-1">
                  <img src={idBackPreview} alt="ID Back" className="w-full h-24 object-cover rounded border" />
                  <Button
                    variant="secondary" size="sm" className="absolute bottom-1 right-1"
                    onClick={() => { setIdBackFile(null); setIdBackPreview(null); }}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <label className="flex items-center justify-center h-24 border-2 border-dashed rounded cursor-pointer bg-muted/30">
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, 'back')} />
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </label>
              )}
            </div>
          </div>

          <Button onClick={handleLocalUpload} disabled={uploading} className="w-full">
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Save ID Proof
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setUploadMode(null)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            {idUploaded && <Badge className="bg-green-500">ID Verified</Badge>}
          </div>

          {!idUploaded ? (
            <>
              <div className="text-center space-y-2">
                <p className="font-medium">Guest scans QR code to upload ID</p>
                <p className="text-sm text-muted-foreground">Ask the guest to scan this QR with their phone camera</p>
              </div>

              {qrGenerated && (
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <QRCode value={qrUrl} size={200} />
                </div>
              )}

              <p className="text-xs text-center text-muted-foreground">
                Or share link: <span className="font-mono text-xs">{qrUrl}</span>
              </p>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4" />
                Waiting for guest to upload... (one-time submission)
              </div>

              <Button variant="outline" onClick={onRefresh} className="w-full">
                <Loader2 className="mr-2 h-4 w-4" /> Refresh Status
              </Button>
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

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack} disabled={!uploadMode}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={onNext} disabled={!idVerified}>
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
      const order = { inspected: 0, clean: 1, dirty: 2, in_progress: 3 };
      return (order[a.housekeepingStatus] ?? 4) - (order[b.housekeepingStatus] ?? 4);
    });

  const handleConfirm = () => {
    const room = matchingRooms.find(r => r.id === selectedRoomId);
    if (room) {
      onConfirm(room);
    }
  };

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
        <Button onClick={handleConfirm} disabled={!selectedRoomId}>
          Continue to Payment <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 4: Payment ───────────────────────────────────────────────────────────

function PaymentStep({
  booking,
  onBack,
  onConfirm,
}: {
  booking: BookingWithId;
  onBack: () => void;
  onConfirm: (paymentType: 'advance' | 'paylater') => void;
}) {
  return (
    <div className="space-y-4">
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
              <p className="text-xs text-muted-foreground">Pay advance to confirm booking</p>
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
              <p className="text-xs text-muted-foreground">Pay full amount when checking out</p>
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

// ─── Main Wizard Component ─────────────────────────────────────────────────────

export function CheckInWizard({
  booking,
  availableRooms,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: CheckInWizardProps) {
  const firestore = useFirestore();
  const [step, setStep] = useState<CheckInStep>('details');
  const [guest, setGuest] = useState<GuestWithId | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomWithId | null>(null);

  // Load guest data when dialog opens
  useEffect(() => {
    if (!open || !firestore || !booking) return;
    if (booking.guestId) {
      getDoc(doc(firestore, 'guests', booking.guestId)).then(snap => {
        if (snap.exists()) {
          setGuest({ ...snap.data(), id: snap.id } as GuestWithId);
        }
      });
    }
  }, [open, firestore, booking]);

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setStep('details');
      setSelectedRoom(null);
    }
  }, [open]);

  const handleNext = () => {
    const order: CheckInStep[] = ['details', 'id-upload', 'room-select', 'payment'];
    const idx = order.indexOf(step);
    if (idx < order.length - 1) setStep(order[idx + 1]);
  };

  const handleBack = () => {
    const order: CheckInStep[] = ['details', 'id-upload', 'room-select', 'payment'];
    const idx = order.indexOf(step);
    if (idx > 0) setStep(order[idx - 1]);
  };

  const handleRoomSelect = (room: RoomWithId) => {
    setSelectedRoom(room);
    handleNext();
  };

  const handlePaymentConfirm = (paymentType: 'advance' | 'paylater') => {
    if (selectedRoom) {
      onConfirm(booking, selectedRoom, paymentType);
    }
  };

  const stepTitles: Record<CheckInStep, string> = {
    'details': 'Guest Details',
    'id-upload': 'ID Verification',
    'room-select': 'Select Room',
    'payment': 'Payment',
    'confirm': 'Confirm',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Check-in: {booking.guestName}</DialogTitle>
          <div className="flex gap-2 mt-2">
            {(['details', 'id-upload', 'room-select', 'payment'] as CheckInStep[]).map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded ${
                  s === step ? 'bg-primary' :
                  ['details', 'id-upload', 'room-select', 'payment'].indexOf(step) > i ? 'bg-primary/50' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </DialogHeader>

        <div className="py-2">
          {step === 'details' && (
            <GuestDetailsStep
              booking={booking}
              guest={guest}
              onNext={handleNext}
            />
          )}

          {step === 'id-upload' && (
            <IdUploadStep
              booking={booking}
              guest={guest}
              onNext={handleNext}
              onBack={handleBack}
              onRefresh={() => {
                if (firestore && booking.guestId) {
                  getDoc(doc(firestore, 'guests', booking.guestId)).then(snap => {
                    if (snap.exists()) {
                      const data = snap.data();
                      if (data.idFrontUrl) {
                        setGuest({ ...data, id: snap.id } as GuestWithId);
                      }
                    }
                  });
                }
              }}
            />
          )}

          {step === 'room-select' && (
            <RoomSelectStep
              booking={booking}
              availableRooms={availableRooms}
              onBack={handleBack}
              onConfirm={handleRoomSelect}
            />
          )}

          {step === 'payment' && (
            <PaymentStep
              booking={booking}
              onBack={handleBack}
              onConfirm={handlePaymentConfirm}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
