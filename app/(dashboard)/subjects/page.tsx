import { auth } from '@/lib/auth';
import { eq, count } from 'drizzle-orm';
import { db, questions } from '@/lib/db';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { subjectColor } from '@/utils/helpers';
import { EmptyState } from '@/app/components/ui';
import { Camera } from 'lucide-react';

export const metadata = { title: 'Subjects' };

export default async function SubjectsPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  // Aggregate questions by subject + status
  const rows = await db
    .select({
      subject: questions.subject,
      status: questions.status,
      count: count(),
    })
    .from(questions)
    .where(eq(questions.userId, userId))
    .groupBy(questions.subject, questions.status);

  type SubjectStats = {
    subject: string;
    wrong: number;
    correct: number;
    unknown: number;
    total: number;
    topics: Set<string>;
  };

  const subjectMap: Record<string, SubjectStats> = {};
  for (const row of rows) {
    if (!subjectMap[row.subject]) {
      subjectMap[row.subject] = {
        subject: row.subject,
        wrong: 0,
        correct: 0,
        unknown: 0,
        total: 0,
        topics: new Set(),
      };
    }
    subjectMap[row.subject][row.status] += row.count;
    subjectMap[row.subject].total += row.count;
  }

  // Get unique topics per subject
  const topicRows = await db
    .selectDistinct({ subject: questions.subject, topic: questions.topic })
    .from(questions)
    .where(eq(questions.userId, userId));

  for (const row of topicRows) {
    if (row.topic && subjectMap[row.subject]) {
      subjectMap[row.subject].topics.add(row.topic);
    }
  }

  const subjects = Object.values(subjectMap).sort((a, b) => b.total - a.total);

  return (
    <div className="max-w-5xl mx-auto pb-20 md:pb-0">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl md:text-4xl">Subjects</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {subjects.length} subject{subjects.length !== 1 ? 's' : ''} across all your scans
          </p>
        </div>
        <Link href="/scan" className="btn-primary hidden sm:inline-flex">
          <Camera className="w-4 h-4" />
          New scan
        </Link>
      </div>

      {subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No subjects yet"
          description="Upload a test scan and AI will automatically detect subjects and tag each question."
          action={
            <Link href="/scan" className="btn-primary">
              <Camera className="w-4 h-4" />
              Upload a scan
            </Link>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((sub) => {
            const color = subjectColor(sub.subject);
            const wrongPct = sub.total > 0 ? (sub.wrong / sub.total) * 100 : 0;

            return (
              <Link
                key={sub.subject}
                href={`/subjects/${encodeURIComponent(sub.subject)}`}
                className="card p-5 hover:shadow-md transition-all duration-200 group relative overflow-hidden"
              >
                {/* Colour accent bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
                  style={{ background: color }}
                />

                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-display"
                    style={{ backgroundColor: `${color}22`, color }}
                  >
                    {sub.subject[0]}
                  </div>
                  <ArrowRight
                    className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100
                                transition-opacity duration-150 mt-1"
                  />
                </div>

                <h2 className="font-display text-xl mb-1">{sub.subject}</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  {sub.topics.size} topic{sub.topics.size !== 1 ? 's' : ''} · {sub.total} questions
                </p>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Wrong answers</span>
                    <span className="font-medium" style={{ color }}>
                      {sub.wrong} / {sub.total}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${wrongPct}%`, background: color }}
                    />
                  </div>
                </div>

                {/* Status pills */}
                <div className="flex gap-1.5 mt-4 flex-wrap">
                  {sub.wrong > 0 && (
                    <span className="badge bg-red-500/10 text-red-500">
                      {sub.wrong} wrong
                    </span>
                  )}
                  {sub.correct > 0 && (
                    <span className="badge bg-emerald-500/10 text-emerald-500">
                      {sub.correct} correct
                    </span>
                  )}
                  {sub.unknown > 0 && (
                    <span className="badge bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                      {sub.unknown} unknown
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
