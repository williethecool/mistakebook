/**
 * POST /api/scan
 * 1. Receive uploaded image
 * 2. Upload to user's configured storage provider
 * 3. Run AI analysis (detect questions, bounding boxes, subjects)
 * 4. Save scan + questions to database
 */
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db, scans, questions, userSettings } from '@/lib/db';
import { uploadToStorage } from '@/lib/storage';
import { analyseTestImage } from '@/lib/ai';
import { nanoid } from 'crypto';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  // ── Parse multipart form ──────────────────────────────────────────────────
  const formData = await req.formData();
  const file = formData.get('image') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No image provided' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString('base64');
  const mimeType = file.type || 'image/jpeg';

  // ── Load user settings ────────────────────────────────────────────────────
  const settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  });

  if (!settings?.aiApiKey) {
    return NextResponse.json(
      { error: 'AI API key not configured. Please go to Settings.' },
      { status: 422 }
    );
  }

  // ── Upload image to storage ───────────────────────────────────────────────
  const ext = file.name.split('.').pop() ?? 'jpg';
  const key = `users/${userId}/scans/${uid()}.${ext}`;

  let imageUrl: string;
  try {
    imageUrl = await uploadToStorage(buffer, {
      provider: settings.storageProvider,
      key,
      contentType: mimeType,
      supabaseUrl: settings.supabaseUrl ?? undefined,
      supabaseKey: settings.supabaseKey ?? undefined,
      supabaseBucket: settings.supabaseBucket ?? undefined,
      s3Region: settings.s3Region ?? undefined,
      s3Bucket: settings.s3Bucket ?? undefined,
      s3AccessKey: settings.s3AccessKey ?? undefined,
      s3SecretKey: settings.s3SecretKey ?? undefined,
      r2AccountId: settings.r2AccountId ?? undefined,
      r2Bucket: settings.r2Bucket ?? undefined,
      r2AccessKey: settings.r2AccessKey ?? undefined,
      r2SecretKey: settings.r2SecretKey ?? undefined,
    });
  } catch (err: unknown) {
    console.error('[scan:upload]', err);
    return NextResponse.json(
      { error: `Storage upload failed: ${(err as Error).message}` },
      { status: 500 }
    );
  }

  // ── Create scan row (pending) ─────────────────────────────────────────────
  const [scan] = await db
    .insert(scans)
    .values({ userId, imageUrl, status: 'processing' })
    .returning();

  // ── AI Analysis ───────────────────────────────────────────────────────────
  let analysis;
  try {
    analysis = await analyseTestImage(base64, mimeType, {
      apiKey: settings.aiApiKey,
      baseUrl: settings.aiBaseUrl ?? undefined,
      model: settings.aiModel,
    });
  } catch (err: unknown) {
    await db
      .update(scans)
      .set({ status: 'error', errorMessage: (err as Error).message })
      .where(eq(scans.id, scan.id));

    return NextResponse.json(
      { error: `AI analysis failed: ${(err as Error).message}`, scanId: scan.id },
      { status: 500 }
    );
  }

  // ── Save scan subject & mark done ─────────────────────────────────────────
  await db
    .update(scans)
    .set({
      subject: analysis.subject,
      status: 'done',
      processedAt: new Date(),
    })
    .where(eq(scans.id, scan.id));

  // ── Save questions ────────────────────────────────────────────────────────
  if (analysis.questions.length > 0) {
    await db.insert(questions).values(
      analysis.questions.map((q) => ({
        scanId: scan.id,
        userId,
        subject: analysis.subject,
        topic: q.topic,
        questionText: q.questionText,
        status: q.status,
        bbox: q.bbox,
      }))
    );
  }

  // ── Return result ─────────────────────────────────────────────────────────
  const savedQuestions = await db.query.questions.findMany({
    where: eq(questions.scanId, scan.id),
  });

  return NextResponse.json({
    scan: { ...scan, subject: analysis.subject, status: 'done' },
    questions: savedQuestions,
    analysis,
  });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const allScans = await db.query.scans.findMany({
    where: eq(scans.userId, session.user.id),
    with: { questions: true },
    orderBy: (s, { desc }) => [desc(s.uploadedAt)],
  });

  return NextResponse.json({ scans: allScans });
}
