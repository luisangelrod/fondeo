import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-muted-foreground mb-4">404</h1>
        <h2 className="text-2xl font-bold mb-4">
          Página no encontrada / Page not found
        </h2>
        <p className="text-muted-foreground mb-6">
          Esta página no existe o fue eliminada.
          <br />
          This page does not exist or was removed.
        </p>
        <Button asChild>
          <Link href="/">
            Volver al inicio / Go home
          </Link>
        </Button>
      </div>
    </div>
  );
}
