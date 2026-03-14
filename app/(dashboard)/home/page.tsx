import { auth } from '@/lib/auth';
import { eq, count } from 'drizzle-orm';
import { db, questions, scans } from '@/lib/db';
import Link from 'next/link';
import {
  Camera, TrendingUp, BookOpen, AlertCircle,
  CheckCircle2, Clock, ArrowRight, Zap,
} from 'lucide-react';
import { formatDate, subjectColor } from '@/utils/helpers';
import { Badge } from '@/app/components/ui';

export const metadata = { title: 'Home' };

export default async function HomePage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const firstName = session?.user?.name?.split(' ')[0] ?? 'there';

  // ── Stats ─────────────────────────────────────────────────────────────────
  const [totalWrong] = await db
    .select({ count: count() })
    .from(questions)
    .where(eq(questions.userId, userId));

  const [wrongCount] = await db
    .select({ count: count() })
    .from(questions)
    .where(eq(questions.userId, userId));

  const [scanCount] = await db
    .select({ count: count() })
    .from(scans)
    .where(eq(scans.userId, userId));

  const [explainedCount] = await db
    .select({ count: count() })
    .from(questions)
    .where(eq(questions.userId, userId));

  // ── Recent wrong questions ────────────────────────────────────────────────
  const recentQuestions = await db.query.questions.findMany({
    where: eq(questions.userId, userId),
    orderBy: (q, { desc }) => [desc(q.createdAt)],
    limit: 6,
  });

  // ── Recent scans ──────────────────────────────────────────────────────────
  const recentScans = await db.query.scans.findMany({
    where: eq(scans.userId, userId),
    orderBy: (s, { desc }) => [desc(s.uploadedAt)],
    limit: 4,
  });

  const stats = [
    {
      label: 'Total Questions',
      value: totalWrong.count,
      icon: BookOpen,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Wrong Answers',
      value: wrongCount.count,
      icon: AlertCircle,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Scans Uploaded',
      value: scanCount.count,
      icon: Camera,
      color: 'text-violet-500',
      bg: 'bg-violet-500/10',
    },
    {
      label: 'Explained',
      value: explainedCount.count,
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm mb-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="font-display text-3xl md:text-4xl">
            Hey, {firstName} 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {totalWrong.count === 0
              ? 'Upload your first test scan to get started.'
              : `You have ${wrongCount.count} questions to review.`}
          </p>
        </div>
        <Link
          href="/scan"
          className="btn-primary hidden sm:inline-flex flex-shrink-0"
        >
          <Camera className="w-4 h-4" />
          New scan
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card p-4">
              <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4.5 h-4.5 ${stat.color}`} />
              </div>
              <div className="text-2xl font-display text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* CTA if no scans */}
      {scanCount.count === 0 && (
        <div className="card p-8 flex flex-col items-center text-center border-dashed">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <h2 className="font-display text-2xl mb-2">Start learning smarter</h2>
          <p className="text-muted-foreground text-sm max-w-sm mb-6">
            Upload a photo of any test paper. MistakeBook will automatically find
            wrong answers and generate step-by-step solutions.
          </p>
          <Link href="/scan" className="btn-primary">
            <Camera className="w-4 h-4" />
            Upload your first test
          </Link>
        </div>
      )}

      {/* Two-column layout */}
      {(recentQuestions.length > 0 || recentScans.length > 0) && (
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Recent wrong questions */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl">Recent Questions</h2>
              <Link href="/subjects" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-2.5">
              {recentQuestions.map((q) => (
                <div key={q.id} className="card p-4 flex items-start gap-3">
                  {/* Status indicator */}
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 status-${q.status}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${subjectColor(q.subject)}22`,
                          color: subjectColor(q.subject),
                        }}
                      >
                        {q.subject}
                      </span>
                      {q.topic && (
                        <span className="text-xs text-muted-foreground truncate">{q.topic}</span>
                      )}
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">
                      {q.questionText ?? 'Question from scan'}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatDate(q.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Recent scans */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl">Recent Scans</h2>
            </div>
            <div className="space-y-2.5">
              {recentScans.map((scan) => (
                <div key={scan.id} className="card p-3 flex items-center gap-3">
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={scan.thumbnailUrl ?? scan.imageUrl}
                      alt="Scan"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-sm font-medium truncate">
                        {scan.subject ?? 'Analysing…'}
                      </span>
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          scan.status === 'done'
                            ? 'bg-emerald-500'
                            : scan.status === 'error'
                            ? 'bg-red-500'
                            : 'bg-yellow-500 animate-pulse'
                        }`}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(scan.uploadedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
