/**
 * POST /api/explain
 * Fetches a crop of the question image (or uses provided base64),
 * calls AI to get step-by-step explanation, saves to DB.
 */
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db, questions, userSettings } from '@/lib/db';
import { explainQuestion } from '@/lib/ai';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { questionId, imageBase64, mimeType } = await req.json();

  if (!questionId) {
    return NextResponse.json({ error: 'questionId required' }, { status: 400 });
  }

  // Load question
  const question = await db.query.questions.findFirst({
    where: eq(questions.id, questionId),
  });

  if (!question || question.userId !== session.user.id) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 });
  }

  // Already explained — return cached
  if (question.explanation) {
    return NextResponse.json({ explanation: question.explanation });
  }

  // Load settings
  const settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, session.user.id),
  });

  if (!settings?.aiApiKey) {
    return NextResponse.json(
      { error: 'AI API key not configured.' },
      { status: 422 }
    );
  }

  // If no image was sent, fetch from imageUrl and convert
  let base64 = imageBase64;
  let mime = mimeType ?? 'image/jpeg';

  if (!base64 && question.cropImageUrl) {
    const res = await fetch(question.cropImageUrl);
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch question image' },
        { status: 500 }
      );
    }
    const buf = await res.arrayBuffer();
    base64 = Buffer.from(buf).toString('base64');
    mime = res.headers.get('content-type') ?? 'image/jpeg';
  }

  if (!base64) {
    return NextResponse.json(
      { error: 'No image available for this question' },
      { status: 400 }
    );
  }

  // Call AI
  let result;
  try {
    result = await explainQuestion(
      base64,
      mime,
      question.questionText,
      question.subject,
      {
        apiKey: settings.aiApiKey,
        baseUrl: settings.aiBaseUrl ?? undefined,
        model: settings.aiModel,
      }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: `AI failed: ${(err as Error).message}` },
      { status: 500 }
    );
  }

  // Persist explanation as JSON string
  const explanationJson = JSON.stringify(result);
  await db
    .update(questions)
    .set({ explanation: explanationJson, explainedAt: new Date() })
    .where(eq(questions.id, questionId));

  return NextResponse.json({ explanation: explanationJson, parsed: result });
}
