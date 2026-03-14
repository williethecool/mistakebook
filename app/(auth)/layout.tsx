import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { GraduationCap } from 'lucide-react';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user) redirect('/home');

  return (
    <div className="min-h-screen flex">
      {/* Left — branding panel (desktop) */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-ink-950 dark:bg-ink-900
                      p-12 relative overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />

        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full
                        bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full
                        bg-primary/10 blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-2xl text-white">
            Mistake<span className="text-primary">Book</span>
          </span>
        </div>

        {/* Tagline */}
        <div className="relative space-y-6">
          <h1 className="font-display text-5xl text-white leading-tight">
            Turn every<br />
            <span className="text-primary italic">mistake</span><br />
            into mastery.
          </h1>
          <p className="text-ink-300 text-lg leading-relaxed max-w-sm">
            Scan your test papers, let AI find what went wrong, and get
            step-by-step solutions to bridge every gap.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {['AI Analysis', 'Auto Cropping', 'Smart Tags', 'Step-by-Step Solutions'].map((f) => (
              <span
                key={f}
                className="text-xs font-medium px-3 py-1.5 rounded-full
                           bg-white/10 text-white border border-white/10"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Quote */}
        <p className="relative text-ink-400 text-sm italic">
          &ldquo;The only real mistake is the one from which we learn nothing.&rdquo;
          <br />
          <span className="not-italic text-ink-500">— Henry Ford</span>
        </p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-xl">
            Mistake<span className="text-primary">Book</span>
          </span>
        </div>

        <div className="w-full max-w-[400px]">
          {children}
        </div>
      </div>
    </div>
  );
}
