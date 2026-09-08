import Link from 'next/link';
import Logo from '@/components/Logo';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <Logo size={96} textSize="xl" align="center" />
        </div>
        <p className="text-gray-600 mb-8">
          A secure space for coaches and coachees to share homework, track progress,
          and stay connected between sessions.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/login" className="btn-primary">
            Log in
          </Link>
          <Link href="/signup" className="btn-secondary">
            Sign up
          </Link>
        </div>
      </div>
    </main>
  );
}
