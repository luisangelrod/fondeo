'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[Fondeo Error Boundary]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold mb-4">
          Algo salió mal / Something went wrong
        </h2>
        <p className="text-muted-foreground mb-6">
          Ocurrió un error inesperado. Por favor intenta de nuevo.
          <br />
          An unexpected error occurred. Please try again.
        </p>
        <Button onClick={reset}>
          Intentar de nuevo / Try again
        </Button>
      </div>
    </div>
  );
}
