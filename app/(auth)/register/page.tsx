'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Input } from '@/app/components/ui';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

const PERKS = [
  'Unlimited test scans',
  'AI-powered question analysis',
  'Step-by-step explanations',
  'Smart subject tagging',
];

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? 'Registration failed');
        return;
      }

      // Auto sign-in after register
      const signInRes = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInRes?.error) {
        toast.success('Account created! Please sign in.');
        router.push('/login');
      } else {
        toast.success('Welcome to MistakeBook!');
        router.push('/home');
        router.refresh();
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    await signIn('google', { callbackUrl: '/home' });
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h2 className="font-display text-3xl text-foreground mb-1">Create your account</h2>
        <p className="text-muted-foreground text-sm">
          Free forever. No credit card required.
        </p>
      </div>

      {/* Perks */}
      <div className="grid grid-cols-2 gap-1.5 mb-6">
        {PERKS.map((perk) => (
          <div key={perk} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            {perk}
          </div>
        ))}
      </div>

      {/* Google */}
      <Button
        variant="outline"
        className="w-full mb-4 gap-3"
        loading={googleLoading}
        onClick={handleGoogle}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </Button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">or use email</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <Input
          label="Full name"
          placeholder="Alex Chen"
          leftIcon={<User className="w-4 h-4" />}
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          leftIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Password"
          type="password"
          placeholder="Min. 8 characters"
          leftIcon={<Lock className="w-4 h-4" />}
          error={errors.password?.message}
          hint="At least 8 characters, one uppercase, one number"
          {...register('password')}
        />
        <Input
          label="Confirm password"
          type="password"
          placeholder="••••••••"
          leftIcon={<Lock className="w-4 h-4" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" className="w-full mt-1" loading={loading}>
          Create account
          <ArrowRight className="w-4 h-4" />
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground mt-5">
        By creating an account you agree to our{' '}
        <Link href="/terms" className="text-primary hover:underline">Terms</Link>
        {' '}and{' '}
        <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
      </p>

      <p className="text-center text-sm text-muted-foreground mt-3">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
