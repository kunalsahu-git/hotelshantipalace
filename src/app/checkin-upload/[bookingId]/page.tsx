'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Upload, Loader2, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BookingData {
  id: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  guestId?: string;
  checkIn: string;
  checkOut: string;
  status: string;
  source?: 'website' | 'admin';
}

export default function CheckinUploadPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;
  const { toast } = useToast();

  const [initialized, setInitialized] = useState(false);
  const [firestore, setFirestore] = useState<any>(null);
  const [storage, setStorage] = useState<any>(null);

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [idType, setIdType] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null);
  const [idBackPreview, setIdBackPreview] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { firestore: fs, storage: st } = initializeFirebase();
      setFirestore(fs);
      setStorage(st);
      setInitialized(true);
    };
    init();
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

        const data = snap.data() as BookingData;
        data.id = snap.id;

        let currentGuestId = data.guestId;

        // If booking doesn't have a guestId, create one
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
          
          // Atomically update the booking with the new guestId
          await updateDoc(bookingRef, { guestId: currentGuestId });
          
          data.guestId = currentGuestId; // Update the local booking data as well
        }

        setBooking(data);

        // Check if already submitted using the now-guaranteed guestId
        if (currentGuestId) {
            const guestSnap = await getDoc(doc(firestore, 'guests', currentGuestId));
            if (guestSnap.exists()) {
              const guestData = guestSnap.data();
              if (guestData.idFrontUrl && guestData.idUploadedAt) {
                setAlreadySubmitted(true);
              }
            }
        }
      } catch (err) {
        console.error('Error fetching or processing booking:', err);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not prepare check-in. Please try again.' });
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [initialized, firestore, bookingId, router, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select an image file.' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Error', description: 'Image must be less than 5MB.' });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (side === 'front') {
        setIdFrontFile(file);
        setIdFrontPreview(e.target?.result as string);
      } else {
        setIdBackFile(file);
        setIdBackPreview(e.target?.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!firestore || !storage || !booking?.guestId) {
      toast({ variant: 'destructive', title: 'Error', description: 'System not ready. Please try again.' });
      return;
    }

    if (!idFrontFile) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please upload ID front photo.' });
      return;
    }

    if (!idType || !idNumber) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter ID type and number.' });
      return;
    }

    setSubmitting(true);

    try {
      // Upload images
      const uploadPromises: Promise<{ side: string; url: string }>[] = [];

      if (idFrontFile) {
        const frontRef = ref(storage, `guests/${booking.guestId}/id-front.jpg`);
        uploadPromises.push(
          uploadBytes(frontRef, idFrontFile).then(async () => {
            const url = await getDownloadURL(frontRef);
            return { side: 'front', url };
          })
        );
      }

      if (idBackFile) {
        const backRef = ref(storage, `guests/${booking.guestId}/id-back.jpg`);
        uploadPromises.push(
          uploadBytes(backRef, idBackFile).then(async () => {
            const url = await getDownloadURL(backRef);
            return { side: 'back', url };
          })
        );
      }

      const uploaded = await Promise.all(uploadPromises);

      const updates: any = {
        idType,
        idNumber,
        idUploadedAt: serverTimestamp(),
      };

      uploaded.forEach(({ side, url }) => {
        if (side === 'front') updates.idFrontUrl = url;
        if (side === 'back') updates.idBackUrl = url;
      });

      // Update guest record
      await updateDoc(doc(firestore, 'guests', booking.guestId), updates);

      toast({ title: 'Success', description: 'ID proof submitted successfully!' });
      setAlreadySubmitted(true);
    } catch (err) {
      console.error('Error uploading:', err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to upload. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

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

  if (alreadySubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-green-700">ID Submitted</h2>
            <p className="text-muted-foreground mt-2">
              Your ID proof has already been submitted. Thank you!
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              You can now proceed to your room at the front desk.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Complete Check-in</CardTitle>
            <CardDescription>
              Upload your ID proof to complete the check-in process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Guest Info */}
            {booking && (
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                <p className="font-semibold">{booking.guestName}</p>
                <p className="text-sm text-muted-foreground">{booking.guestPhone}</p>
                <p className="text-sm text-muted-foreground">
                  Check-in: {booking.checkIn} → Check-out: {booking.checkOut}
                </p>
              </div>
            )}

            {/* ID Details */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="idType">ID Type</Label>
                <select
                  id="idType"
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select ID type</option>
                  <option value="aadhar">Aadhar Card</option>
                  <option value="passport">Passport</option>
                  <option value="driving_license">Driving License</option>
                  <option value="voter_id">Voter ID</option>
                  <option value="pan">PAN Card</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <Label htmlFor="idNumber">ID Number</Label>
                <Input
                  id="idNumber"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="Enter ID number"
                />
              </div>
            </div>

            {/* ID Front Upload */}
            <div>
              <Label>ID Photo - Front</Label>
              <div className="mt-1">
                {idFrontPreview ? (
                  <div className="relative">
                    <img
                      src={idFrontPreview}
                      alt="ID Front"
                      className="w-full h-40 object-cover rounded-lg border"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute bottom-2 right-2"
                      onClick={() => {
                        setIdFrontFile(null);
                        setIdFrontPreview(null);
                      }}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Tap to upload front of ID</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'front')}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* ID Back Upload */}
            <div>
              <Label>ID Photo - Back (Optional)</Label>
              <div className="mt-1">
                {idBackPreview ? (
                  <div className="relative">
                    <img
                      src={idBackPreview}
                      alt="ID Back"
                      className="w-full h-40 object-cover rounded-lg border"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute bottom-2 right-2"
                      onClick={() => {
                        setIdBackFile(null);
                        setIdBackPreview(null);
                      }}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Tap to upload back of ID</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, 'back')}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Consent */}
            <p className="text-xs text-muted-foreground">
              By submitting, you consent to Hotel Shanti Palace storing a copy of your ID for check-in verification.
            </p>

            {/* Submit */}
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={submitting || !idFrontFile || !idType || !idNumber}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Submit ID Proof
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
