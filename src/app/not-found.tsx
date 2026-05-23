import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-4xl font-bold tracking-tight mb-2">404</h1>
      <p className="text-muted-foreground mb-6">We couldn&apos;t find the page you were looking for.</p>
      <Link 
        href="/" 
        className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
