'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Save, Eye, EyeOff, Key, Database, Cpu, Zap } from 'lucide-react';
import { Button, Input, Select, Toggle, Divider } from '@/app/components/ui';

const schema = z.object({
  aiApiKey: z.string().optional(),
  aiBaseUrl: z.string().optional(),
  aiModel: z.string().min(1),
  storageProvider: z.enum(['vercel', 'supabase', 's3', 'r2']),
  supabaseUrl: z.string().optional(),
  supabaseKey: z.string().optional(),
  supabaseBucket: z.string().optional(),
  s3Region: z.string().optional(),
  s3Bucket: z.string().optional(),
  s3AccessKey: z.string().optional(),
  s3SecretKey: z.string().optional(),
  r2AccountId: z.string().optional(),
  r2Bucket: z.string().optional(),
  r2AccessKey: z.string().optional(),
  r2SecretKey: z.string().optional(),
  autoCropEnabled: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface SettingsFormProps {
  initialSettings: Partial<FormData & { id: string; userId: string }> | null;
}

const STORAGE_OPTIONS = [
  { value: 'vercel', label: 'Vercel Blob Storage' },
  { value: 'supabase', label: 'Supabase Storage' },
  { value: 's3', label: 'AWS S3' },
  { value: 'r2', label: 'Cloudflare R2' },
];

const MODEL_OPTIONS = [
  { value: 'gpt-4o', label: 'GPT-4o (Recommended)' },
  { value: 'gpt-4o-mini', label: 'GPT-4o mini (Faster)' },
  { value: 'gpt-4-vision-preview', label: 'GPT-4 Vision' },
  { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
  { value: 'custom', label: 'Custom model…' },
];

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [customModel, setCustomModel] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      aiApiKey: initialSettings?.aiApiKey ?? '',
      aiBaseUrl: initialSettings?.aiBaseUrl ?? '',
      aiModel: initialSettings?.aiModel ?? 'gpt-4o',
      storageProvider: (initialSettings?.storageProvider as FormData['storageProvider']) ?? 'vercel',
      supabaseUrl: initialSettings?.supabaseUrl ?? '',
      supabaseKey: initialSettings?.supabaseKey ?? '',
      supabaseBucket: initialSettings?.supabaseBucket ?? '',
      s3Region: initialSettings?.s3Region ?? '',
      s3Bucket: initialSettings?.s3Bucket ?? '',
      s3AccessKey: initialSettings?.s3AccessKey ?? '',
      s3SecretKey: initialSettings?.s3SecretKey ?? '',
      r2AccountId: initialSettings?.r2AccountId ?? '',
      r2Bucket: initialSettings?.r2Bucket ?? '',
      r2AccessKey: initialSettings?.r2AccessKey ?? '',
      r2SecretKey: initialSettings?.r2SecretKey ?? '',
      autoCropEnabled: initialSettings?.autoCropEnabled ?? true,
    },
  });

  const storageProvider = watch('storageProvider');
  const autoCrop = watch('autoCropEnabled');

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success('Settings saved');
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

      {/* ── AI Configuration ────────────────────────────────────────── */}
      <section className="card p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-medium text-foreground">AI Configuration</h2>
            <p className="text-xs text-muted-foreground">OpenAI-compatible API settings</p>
          </div>
        </div>

        <Divider />

        {/* API Key */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5" />
            API Key
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              placeholder="sk-…"
              className="input-base pr-10"
              {...register('aiApiKey')}
            />
            <button
              type="button"
              onClick={() => setShowApiKey((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Stored encrypted. Works with OpenAI, Anthropic, or any compatible API.
          </p>
        </div>

        {/* Base URL */}
        <Input
          label="API Base URL"
          placeholder="https://api.openai.com/v1 (leave blank for default)"
          hint="Use a custom endpoint for self-hosted or proxy setups"
          {...register('aiBaseUrl')}
        />

        {/* Model */}
        <div className="space-y-2">
          <Select
            label="Model"
            options={MODEL_OPTIONS}
            {...register('aiModel')}
            onChange={(e) => {
              if (e.target.value === 'custom') {
                setCustomModel(true);
                setValue('aiModel', '');
              } else {
                setCustomModel(false);
                setValue('aiModel', e.target.value);
              }
            }}
          />
          {customModel && (
            <Input
              placeholder="e.g. llama-3.2-vision"
              {...register('aiModel')}
            />
          )}
        </div>
      </section>

      {/* ── Storage Configuration ───────────────────────────────────── */}
      <section className="card p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Database className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h2 className="font-medium text-foreground">Image Storage</h2>
            <p className="text-xs text-muted-foreground">Where your scan images are stored</p>
          </div>
        </div>

        <Divider />

        <Select
          label="Storage Provider"
          options={STORAGE_OPTIONS}
          {...register('storageProvider')}
        />

        {/* Vercel */}
        {storageProvider === 'vercel' && (
          <div className="p-3 rounded-xl bg-muted/50 text-sm text-muted-foreground">
            Vercel Blob Storage is configured via the{' '}
            <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">BLOB_READ_WRITE_TOKEN</code>{' '}
            environment variable. No additional configuration needed here.
          </div>
        )}

        {/* Supabase */}
        {storageProvider === 'supabase' && (
          <div className="space-y-4">
            <Input label="Supabase Project URL" placeholder="https://xxx.supabase.co" {...register('supabaseUrl')} />
            <div className="relative">
              <Input label="Service Role Key" type="password" placeholder="eyJ…" {...register('supabaseKey')} />
            </div>
            <Input label="Storage Bucket" placeholder="mistakebook-images" {...register('supabaseBucket')} />
          </div>
        )}

        {/* S3 */}
        {storageProvider === 's3' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Region" placeholder="us-east-1" {...register('s3Region')} />
              <Input label="Bucket Name" placeholder="my-bucket" {...register('s3Bucket')} />
            </div>
            <Input label="Access Key ID" placeholder="AKIA…" {...register('s3AccessKey')} />
            <Input label="Secret Access Key" type="password" placeholder="••••••••" {...register('s3SecretKey')} />
            <p className="text-xs text-muted-foreground">
              Ensure your bucket has public read access or configure a CDN.
            </p>
          </div>
        )}

        {/* R2 */}
        {storageProvider === 'r2' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Account ID" placeholder="abc123…" {...register('r2AccountId')} />
              <Input label="Bucket Name" placeholder="mistakebook" {...register('r2Bucket')} />
            </div>
            <Input label="Access Key ID" placeholder="…" {...register('r2AccessKey')} />
            <Input label="Secret Access Key" type="password" placeholder="••••••••" {...register('r2SecretKey')} />
            <p className="text-xs text-muted-foreground">
              Enable public access on the R2 bucket. The public URL will be{' '}
              <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                pub-[account-id].r2.dev/[key]
              </code>
            </p>
          </div>
        )}
      </section>

      {/* ── Features ────────────────────────────────────────────────── */}
      <section className="card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <h2 className="font-medium text-foreground">Features</h2>
            <p className="text-xs text-muted-foreground">Toggle optional capabilities</p>
          </div>
        </div>

        <Divider />

        <Toggle
          checked={autoCrop}
          onChange={(v) => setValue('autoCropEnabled', v)}
          label="Auto-crop questions"
          description="Automatically crop individual questions from scan images using bounding boxes"
        />
      </section>

      {/* Save */}
      <div className="flex justify-end">
        <Button type="submit" loading={loading} className="gap-2">
          <Save className="w-4 h-4" />
          Save settings
        </Button>
      </div>
    </form>
  );
}
