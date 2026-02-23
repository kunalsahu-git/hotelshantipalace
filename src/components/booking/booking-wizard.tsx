'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { parseISO, isValid, addDays } from 'date-fns';

import { BookingProgress } from './booking-progress';
import { Step1Details } from './step-1-details';
import { Step2RoomSelection } from './step-2-room-selection';
import { Step3Review } from './step-3-review';
import type { RoomCategory } from '@/lib/types';
import { BookingFormSchema, type BookingFormData } from '@/lib/schemas';
import { Button } from '../ui/button';

export function BookingWizard({ allRooms }: { allRooms: RoomCategory[] }) {
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);

  const getInitialDate = (param: string | null): Date | undefined => {
    if (!param) return undefined;
    const date = parseISO(param);
    return isValid(date) ? date : undefined;
  };

  const methods = useForm<BookingFormData>({
    resolver: zodResolver(BookingFormSchema),
    defaultValues: {
      checkIn: getInitialDate(searchParams.get('checkin')),
      checkOut: getInitialDate(searchParams.get('checkout')),
      guests: parseInt(searchParams.get('guests') || '2', 10),
      roomTypeId: searchParams.get('roomType') || undefined,
      fullName: '',
      email: '',
      phone: '',
      specialRequests: '',
    },
  });

  const handleFillTestData = () => {
    const today = new Date();
    methods.reset({
      fullName: 'Rohan Sharma',
      email: 'rohan.sharma@example.com',
      phone: '9876543210',
      guests: 2,
      specialRequests: 'Testing the booking system with autofilled data.',
      checkIn: addDays(today, 2),
      checkOut: addDays(today, 5),
      roomTypeId: 'deluxe',
    });
  };

  const nextStep = async () => {
    const fieldsToValidate: (keyof BookingFormData)[] = 
      currentStep === 1 ? ["fullName", "email", "phone", "guests"] : 
      currentStep === 2 ? ["checkIn", "checkOut", "roomTypeId"] : [];
      
    const isStepValid = await methods.trigger(fieldsToValidate);
    
    if (isStepValid) {
        setCurrentStep((prev) => prev + 1);
        window.scrollTo(0, 0);
    }
  };
  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
    window.scrollTo(0, 0);
  };

  return (
    <FormProvider {...methods}>
      <div className="space-y-8">
        <div className="flex justify-between items-start">
            <div className="flex-grow">
                <BookingProgress currentStep={currentStep} />
            </div>
            <Button variant="outline" onClick={handleFillTestData}>Fill with Test Data</Button>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 md:p-8">
            {currentStep === 1 && <Step1Details nextStep={nextStep} />}
            {currentStep === 2 && <Step2RoomSelection prevStep={prevStep} nextStep={nextStep} allRooms={allRooms} />}
            {currentStep === 3 && <Step3Review prevStep={prevStep} />}
        </div>
      </div>
    </FormProvider>
  );
}
