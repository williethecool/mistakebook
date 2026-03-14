import { NextResponse } from 'next/server';
import { eq, count, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db, questions } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Group questions by subject with counts per status
  const rows = await db
    .select({
      subject: questions.subject,
      status: questions.status,
      count: count(),
    })
    .from(questions)
    .where(eq(questions.userId, session.user.id))
    .groupBy(questions.subject, questions.status);

  // Transform into subject map
  const subjectMap: Record<
    string,
    { subject: string; wrong: number; correct: number; unknown: number; total: number }
  > = {};

  for (const row of rows) {
    if (!subjectMap[row.subject]) {
      subjectMap[row.subject] = {
        subject: row.subject,
        wrong: 0,
        correct: 0,
        unknown: 0,
        total: 0,
      };
    }
    subjectMap[row.subject][row.status] += row.count;
    subjectMap[row.subject].total += row.count;
  }

  const subjects = Object.values(subjectMap).sort((a, b) => b.total - a.total);

  return NextResponse.json({ subjects });
}
