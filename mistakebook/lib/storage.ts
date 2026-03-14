/**
 * Storage abstraction — supports Vercel Blob, Supabase, AWS S3, Cloudflare R2
 * All methods return a public URL to the uploaded file.
 */
import type { StorageProvider } from '@/types';

export interface UploadOptions {
  provider: StorageProvider;
  bucket?: string;
  key: string;        // destination path/filename
  contentType: string;
  // provider credentials (from user settings)
  supabaseUrl?: string;
  supabaseKey?: string;
  supabaseBucket?: string;
  s3Region?: string;
  s3Bucket?: string;
  s3AccessKey?: string;
  s3SecretKey?: string;
  r2AccountId?: string;
  r2Bucket?: string;
  r2AccessKey?: string;
  r2SecretKey?: string;
}

/** Upload a buffer to the configured storage provider */
export async function uploadToStorage(
  buffer: Buffer,
  opts: UploadOptions
): Promise<string> {
  switch (opts.provider) {
    case 'vercel':
      return uploadToVercelBlob(buffer, opts);
    case 'supabase':
      return uploadToSupabase(buffer, opts);
    case 's3':
      return uploadToS3(buffer, opts);
    case 'r2':
      return uploadToR2(buffer, opts);
    default:
      throw new Error(`Unknown storage provider: ${opts.provider}`);
  }
}

// ─── Vercel Blob ──────────────────────────────────────────────────────────────
async function uploadToVercelBlob(
  buffer: Buffer,
  opts: UploadOptions
): Promise<string> {
  // Dynamic import so the package is optional
  const { put } = await import('@vercel/blob');
  const blob = await put(opts.key, buffer, {
    access: 'public',
    contentType: opts.contentType,
  });
  return blob.url;
}

// ─── Supabase Storage ─────────────────────────────────────────────────────────
async function uploadToSupabase(
  buffer: Buffer,
  opts: UploadOptions
): Promise<string> {
  if (!opts.supabaseUrl || !opts.supabaseKey || !opts.supabaseBucket) {
    throw new Error('Supabase credentials are required');
  }
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(opts.supabaseUrl, opts.supabaseKey);

  const { error } = await supabase.storage
    .from(opts.supabaseBucket)
    .upload(opts.key, buffer, {
      contentType: opts.contentType,
      upsert: true,
    });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  const { data } = supabase.storage
    .from(opts.supabaseBucket)
    .getPublicUrl(opts.key);

  return data.publicUrl;
}

// ─── AWS S3 ───────────────────────────────────────────────────────────────────
async function uploadToS3(
  buffer: Buffer,
  opts: UploadOptions
): Promise<string> {
  if (!opts.s3Region || !opts.s3Bucket || !opts.s3AccessKey || !opts.s3SecretKey) {
    throw new Error('S3 credentials are required');
  }
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

  const client = new S3Client({
    region: opts.s3Region,
    credentials: {
      accessKeyId: opts.s3AccessKey,
      secretAccessKey: opts.s3SecretKey,
    },
  });

  await client.send(
    new PutObjectCommand({
      Bucket: opts.s3Bucket,
      Key: opts.key,
      Body: buffer,
      ContentType: opts.contentType,
      ACL: 'public-read',
    })
  );

  return `https://${opts.s3Bucket}.s3.${opts.s3Region}.amazonaws.com/${opts.key}`;
}

// ─── Cloudflare R2 ────────────────────────────────────────────────────────────
async function uploadToR2(
  buffer: Buffer,
  opts: UploadOptions
): Promise<string> {
  if (
    !opts.r2AccountId ||
    !opts.r2Bucket ||
    !opts.r2AccessKey ||
    !opts.r2SecretKey
  ) {
    throw new Error('R2 credentials are required');
  }
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${opts.r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: opts.r2AccessKey,
      secretAccessKey: opts.r2SecretKey,
    },
  });

  await client.send(
    new PutObjectCommand({
      Bucket: opts.r2Bucket,
      Key: opts.key,
      Body: buffer,
      ContentType: opts.contentType,
    })
  );

  // R2 public URL pattern (assuming custom domain or public bucket URL)
  return `https://pub-${opts.r2AccountId}.r2.dev/${opts.key}`;
}
