import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'MistakeBook', template: '%s · MistakeBook' },
  description:
    'Capture, organise, and learn from your test mistakes with AI-powered analysis.',
  keywords: ['study', 'test', 'mistakes', 'AI', 'education'],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://mistakebook.vercel.app'
  ),
  openGraph: {
    type: 'website',
    siteName: 'MistakeBook',
    title: 'MistakeBook — Learn from every mistake',
    description: 'AI-powered test analysis and study companion.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                fontFamily: 'var(--font-body)',
                borderRadius: '12px',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
