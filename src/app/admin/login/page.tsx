'use client';
import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { LoginFormSchema, type LoginFormData } from '@/lib/schemas';
import { Logo } from '@/components/logo';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, Mail } from 'lucide-react';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const STORAGE_KEY = 'admin_login_attempts';

function getAttemptData(): { count: number; lockUntil: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { count: 0, lockUntil: 0 };
    return JSON.parse(raw);
  } catch {
    return { count: 0, lockUntil: 0 };
  }
}

function recordFailedAttempt() {
  const data = getAttemptData();
  const count = data.count + 1;
  const lockUntil = count >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MINUTES * 60 * 1000 : data.lockUntil;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ count, lockUntil }));
}

function clearAttempts() {
  localStorage.removeItem(STORAGE_KEY);
}

const ResetSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});
type ResetFormData = z.infer<typeof ResetSchema>;

function ForgotPasswordDialog({
  open,
  onOpenChange,
  prefillEmail,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  prefillEmail: string;
}) {
  const auth = useAuth();
  const { toast } = useToast();
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ResetFormData>({
    resolver: zodResolver(ResetSchema),
    defaultValues: { email: prefillEmail },
    values: { email: prefillEmail },
  });

  const handleClose = (v: boolean) => {
    if (!v) {
      setSent(false);
      form.reset({ email: '' });
    }
    onOpenChange(v);
  };

  const onSubmit = async (data: ResetFormData) => {
    if (!auth) return;
    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, data.email);
      setSent(true);
    } catch (err: any) {
      // Deliberately show the same success UI even for unknown emails
      // to avoid revealing which emails are registered.
      if (err.code === 'auth/too-many-requests') {
        toast({
          variant: 'destructive',
          title: 'Too many requests',
          description: 'Please wait a moment before trying again.',
        });
      } else {
        setSent(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Enter your email address and we&apos;ll send you a link to reset your password.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="font-semibold text-gray-800">Check your inbox</p>
            <p className="text-sm text-muted-foreground">
              If an account exists for <span className="font-medium">{form.getValues('email')}</span>,
              a password reset link has been sent.
            </p>
            <Button className="mt-2 w-full" onClick={() => handleClose(false)}>
              Back to Login
            </Button>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormProvider {...form}>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="admin@shantipalace.com"
                          className="pl-9"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </FormProvider>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const onSubmit = (data: LoginFormData) => {
    setError(null);

    const attempts = getAttemptData();
    if (attempts.lockUntil > Date.now()) {
      const remaining = Math.ceil((attempts.lockUntil - Date.now()) / 60000);
      setError(`Too many failed attempts. Please try again in ${remaining} minute${remaining > 1 ? 's' : ''}.`);
      return;
    }

    setIsSubmitting(true);
    if (!auth) {
      setError("Firebase is not initialized correctly.");
      setIsSubmitting(false);
      return;
    }

    signInWithEmailAndPassword(auth, data.email, data.password)
      .then(() => {
        clearAttempts();
        toast({ title: 'Login Successful', description: 'Welcome back!' });
        router.push('/admin/dashboard');
      })
      .catch((signInError) => {
        recordFailedAttempt();
        const updated = getAttemptData();
        const remaining = MAX_ATTEMPTS - updated.count;

        if (updated.lockUntil > Date.now()) {
          setError(`Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.`);
        } else if (
          signInError.code === 'auth/invalid-credential' ||
          signInError.code === 'auth/user-not-found' ||
          signInError.code === 'auth/wrong-password'
        ) {
          setError(`Invalid email or password. ${remaining > 0 ? `${remaining} attempt${remaining > 1 ? 's' : ''} remaining.` : ''}`);
        } else {
          setError('An unexpected error occurred. Please try again later.');
        }
        setIsSubmitting(false);
      });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <Logo />
          <h2 className="mt-6 text-3xl font-bold tracking-tight">
            Staff Panel Login
          </h2>
        </div>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Login Failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="admin@shantipalace.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center justify-between">
                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="font-normal">Remember me</FormLabel>
                    </FormItem>
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowReset(true)}
                  className="text-sm font-medium text-primary hover:text-primary/90"
                >
                  Forgot your password?
                </button>
              </div>
            </div>
            <div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>

      <ForgotPasswordDialog
        open={showReset}
        onOpenChange={setShowReset}
        prefillEmail={form.watch('email')}
      />
    </div>
  );
}
