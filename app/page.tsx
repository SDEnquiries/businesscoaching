import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <Image
          src="/logo.png"
          alt="Switch Direction"
          width={220}
          height={150}
          className="mx-auto mb-6"
          priority
        />
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
