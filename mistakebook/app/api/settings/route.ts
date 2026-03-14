import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db, userSettings } from '@/lib/db';

const schema = z.object({
  aiApiKey: z.string().optional().nullable(),
  aiBaseUrl: z.string().url().optional().nullable().or(z.literal('')),
  aiModel: z.string().min(1).max(100).optional(),
  storageProvider: z.enum(['vercel', 'supabase', 's3', 'r2']).optional(),
  supabaseUrl: z.string().optional().nullable(),
  supabaseKey: z.string().optional().nullable(),
  supabaseBucket: z.string().optional().nullable(),
  s3Region: z.string().optional().nullable(),
  s3Bucket: z.string().optional().nullable(),
  s3AccessKey: z.string().optional().nullable(),
  s3SecretKey: z.string().optional().nullable(),
  r2AccountId: z.string().optional().nullable(),
  r2Bucket: z.string().optional().nullable(),
  r2AccessKey: z.string().optional().nullable(),
  r2SecretKey: z.string().optional().nullable(),
  autoCropEnabled: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, session.user.id),
  });

  if (!settings) {
    return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
  }

  // Mask secrets in response
  return NextResponse.json({
    ...settings,
    aiApiKey: settings.aiApiKey ? '••••••••' : null,
    s3SecretKey: settings.s3SecretKey ? '••••••••' : null,
    r2SecretKey: settings.r2SecretKey ? '••••••••' : null,
    supabaseKey: settings.supabaseKey ? '••••••••' : null,
  });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  // If masked value sent, don't overwrite
  const data = { ...parsed.data };
  if (data.aiApiKey === '••••••••') delete data.aiApiKey;
  if (data.s3SecretKey === '••••••••') delete data.s3SecretKey;
  if (data.r2SecretKey === '••••••••') delete data.r2SecretKey;
  if (data.supabaseKey === '••••••••') delete data.supabaseKey;

  await db
    .update(userSettings)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(userSettings.userId, session.user.id));

  return NextResponse.json({ message: 'Settings updated' });
}
