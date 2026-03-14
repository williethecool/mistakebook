import { auth } from '@/lib/auth';
import { and, eq } from 'drizzle-orm';
import { db, questions } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { subjectColor } from '@/utils/helpers';
import { QuestionGrid } from '@/app/components/questions/QuestionGrid';

interface Props {
  params: { subject: string };
  searchParams: { topic?: string; status?: string };
}

export async function generateMetadata({ params }: Props) {
  return { title: decodeURIComponent(params.subject) };
}

export default async function SubjectPage({ params, searchParams }: Props) {
  const session = await auth();
  const userId = session!.user!.id!;
  const subject = decodeURIComponent(params.subject);

  const filters = [
    eq(questions.userId, userId),
    eq(questions.subject, subject),
  ];

  if (searchParams.topic) filters.push(eq(questions.topic, searchParams.topic));
  if (searchParams.status) {
    const s = searchParams.status as 'wrong' | 'correct' | 'unknown';
    if (['wrong', 'correct', 'unknown'].includes(s)) {
      filters.push(eq(questions.status, s));
    }
  }

  const allQuestions = await db.query.questions.findMany({
    where: and(...filters),
    orderBy: (q, { desc }) => [desc(q.createdAt)],
  });

  if (allQuestions.length === 0 && !searchParams.topic && !searchParams.status) {
    notFound();
  }

  // Get unique topics for this subject
  const topicRows = await db
    .selectDistinct({ topic: questions.topic })
    .from(questions)
    .where(and(eq(questions.userId, userId), eq(questions.subject, subject)));

  const topics = topicRows.map((r) => r.topic).filter(Boolean) as string[];
  const color = subjectColor(subject);

  return (
    <div className="max-w-5xl mx-auto pb-20 md:pb-0">
      {/* Back */}
      <Link
        href="/subjects"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground
                   hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Subjects
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-display flex-shrink-0"
          style={{ backgroundColor: `${color}22`, color }}
        >
          {subject[0]}
        </div>
        <div>
          <h1 className="font-display text-3xl md:text-4xl">{subject}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {allQuestions.length} question{allQuestions.length !== 1 ? 's' : ''}
            {searchParams.topic && ` · ${searchParams.topic}`}
          </p>
        </div>
      </div>

      {/* Topic filter pills */}
      {topics.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          <Link
            href={`/subjects/${encodeURIComponent(subject)}`}
            className={`badge cursor-pointer transition-colors ${
              !searchParams.topic
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            All topics
          </Link>
          {topics.map((topic) => (
            <Link
              key={topic}
              href={`/subjects/${encodeURIComponent(subject)}?topic=${encodeURIComponent(topic)}`}
              className={`badge cursor-pointer transition-colors ${
                searchParams.topic === topic
                  ? 'text-white'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
              style={
                searchParams.topic === topic
                  ? { backgroundColor: color }
                  : undefined
              }
            >
              {topic}
            </Link>
          ))}
        </div>
      )}

      {/* Status filter */}
      <div className="flex gap-2 mb-6">
        {[
          { value: undefined, label: 'All' },
          { value: 'wrong', label: 'Wrong' },
          { value: 'correct', label: 'Correct' },
          { value: 'unknown', label: 'Unknown' },
        ].map(({ value, label }) => {
          const active = searchParams.status === value || (!searchParams.status && !value);
          const href = value
            ? `/subjects/${encodeURIComponent(subject)}${searchParams.topic ? `?topic=${searchParams.topic}&status=${value}` : `?status=${value}`}`
            : `/subjects/${encodeURIComponent(subject)}${searchParams.topic ? `?topic=${searchParams.topic}` : ''}`;
          return (
            <Link
              key={label}
              href={href}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                active
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {/* Questions grid */}
      <QuestionGrid questions={allQuestions} />
    </div>
  );
}
