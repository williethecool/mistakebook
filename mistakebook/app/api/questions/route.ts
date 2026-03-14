import { NextRequest, NextResponse } from 'next/server';
import { and, eq, like, gte, lte, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db, questions } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const subject = searchParams.get('subject');
  const topic = searchParams.get('topic');
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const limit = parseInt(searchParams.get('limit') ?? '50');
  const offset = parseInt(searchParams.get('offset') ?? '0');

  const filters = [eq(questions.userId, session.user.id)];

  if (subject) filters.push(eq(questions.subject, subject));
  if (topic) filters.push(eq(questions.topic, topic));
  if (status && ['wrong', 'correct', 'unknown'].includes(status)) {
    filters.push(eq(questions.status, status as 'wrong' | 'correct' | 'unknown'));
  }
  if (search) filters.push(like(questions.questionText, `%${search}%`));
  if (startDate) filters.push(gte(questions.createdAt, new Date(startDate)));
  if (endDate) filters.push(lte(questions.createdAt, new Date(endDate)));

  const results = await db.query.questions.findMany({
    where: and(...filters),
    orderBy: [desc(questions.createdAt)],
    limit,
    offset,
  });

  return NextResponse.json({ questions: results });
}
