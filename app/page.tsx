import Link from 'next/link';
import Logo from '@/components/Logo';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16 bg-brand-500">
      <div className="max-w-md w-full text-center">
        <div className="mb-8 flex justify-center">
          <Logo size={96} textSize="xl" align="center" light />
        </div>
        <p className="text-gold-light text-xs font-semibold tracking-wider uppercase mb-3">
          Business coaching for founders who mean business
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-4">
          Take control. Build momentum. Get results.
        </h1>
        <p className="text-white/80 mb-8">
          Your coaching hub for staying on track between sessions — build your business plan,
          hit your monthly targets, and watch the progress add up.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/login" className="btn-primary">
            Log in
          </Link>
          <Link
            href="/signup"
            className="border border-white/40 text-white rounded-lg px-5 py-2.5 font-semibold hover:bg-white/10 transition"
          >
            Create an account
          </Link>
        </div>
      </div>
    </main>
  );
}
