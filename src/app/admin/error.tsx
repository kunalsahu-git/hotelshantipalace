'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="max-w-md w-full border-destructive/30">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Page Error</h2>
          <p className="text-muted-foreground text-sm mb-2">
            This page encountered an unexpected error.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <p className="text-xs text-muted-foreground font-mono bg-muted rounded p-2 mb-4 text-left break-all">
              {error.message}
            </p>
          )}
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Reload Page
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
