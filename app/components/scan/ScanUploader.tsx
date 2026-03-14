'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Upload, Camera, X, RotateCcw, ZoomIn,
  Loader2, CheckCircle2, AlertCircle,
  Scissors, Eye,
} from 'lucide-react';
import { cn, fileToDataUrl, cropImageFromBbox } from '@/utils/helpers';
import { Button } from '@/app/components/ui';
import { ScanResults } from './ScanResults';
import type { Scan, Question } from '@/types';

type UploadState = 'idle' | 'preview' | 'uploading' | 'analysing' | 'done' | 'error';

interface ProcessResult {
  scan: Scan;
  questions: Question[];
}

export function ScanUploader() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [state, setState] = useState<UploadState>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [autoCrop, setAutoCrop] = useState(true);

  // Load autoCrop setting from server on mount
  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        if (typeof d?.autoCropEnabled === 'boolean') {
          setAutoCrop(d.autoCropEnabled);
        }
      })
      .catch(() => {});
  }, []);

  const onDrop = useCallback(async (accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    const url = await fileToDataUrl(f);
    setPreview(url);
    setState('preview');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic'] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024, // 20 MB
    onDropRejected: (r) => {
      const msg = r[0]?.errors[0]?.message ?? 'File rejected';
      toast.error(msg);
    },
  });

  function handleCameraCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    onDrop([f]);
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setState('idle');
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  }

  async function handleAnalyse() {
    if (!file || !preview) return;

    setState('uploading');
    setProgress(10);

    try {
      // ── Optional: auto-crop bboxes locally before upload ──────────────
      // We skip client-side cropping here; the server returns bboxes
      // and we crop for display after analysis. The full image is always
      // sent to AI for best accuracy.

      const formData = new FormData();
      formData.append('image', file);

      setProgress(30);
      setState('analysing');

      const res = await fetch('/api/scan', {
        method: 'POST',
        body: formData,
      });

      setProgress(80);

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? 'Upload failed');
      }

      // ── Client-side crop generation ────────────────────────────────────
      if (autoCrop && data.questions?.length > 0 && preview) {
        const cropPromises = data.questions.map(async (q: Question) => {
          if (!q.bbox) return q;
          try {
            const blob = await cropImageFromBbox(preview, q.bbox);
            // We'll use object URLs for display only — server has the canonical URL
            const objectUrl = URL.createObjectURL(blob);
            return { ...q, cropImageUrl: q.cropImageUrl ?? objectUrl };
          } catch {
            return q;
          }
        });
        data.questions = await Promise.all(cropPromises);
      }

      setProgress(100);
      setResult({ scan: data.scan, questions: data.questions ?? [] });
      setState('done');

      const wrongCount = (data.questions ?? []).filter(
        (q: Question) => q.status === 'wrong'
      ).length;
      toast.success(
        `Analysis complete — ${wrongCount} wrong answer${wrongCount !== 1 ? 's' : ''} found`
      );
    } catch (err: unknown) {
      const msg = (err as Error).message ?? 'Something went wrong';
      setError(msg);
      setState('error');
      toast.error(msg);
    }
  }

  // ── Render: idle drop zone ─────────────────────────────────────────────────
  if (state === 'idle') {
    return (
      <div className="space-y-4">
        {/* Drop zone */}
        <div
          {...getRootProps()}
          className={cn(
            'upload-zone min-h-[320px] p-8 transition-all duration-200',
            isDragActive && 'active'
          )}
        >
          <input {...getInputProps()} ref={fileInputRef} />
          <div className="flex flex-col items-center text-center gap-4 pointer-events-none">
            <div className={cn(
              'w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-200',
              isDragActive ? 'bg-primary/15 scale-110' : 'bg-muted'
            )}>
              <Upload className={cn(
                'w-9 h-9 transition-colors duration-200',
                isDragActive ? 'text-primary' : 'text-muted-foreground'
              )} />
            </div>
            <div>
              <p className="text-lg font-medium text-foreground mb-1">
                {isDragActive ? 'Drop your test here' : 'Upload test paper'}
              </p>
              <p className="text-sm text-muted-foreground">
                Drag & drop or click to browse · JPG, PNG, WEBP up to 20 MB
              </p>
            </div>
            <div className="flex gap-2">
              <span className="badge bg-muted text-muted-foreground">AI Analysis</span>
              <span className="badge bg-muted text-muted-foreground">Auto Tagging</span>
              {autoCrop && (
                <span className="badge bg-muted text-muted-foreground">
                  <Scissors className="w-2.5 h-2.5" />
                  Auto Crop
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Camera button */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => cameraInputRef.current?.click()}
        >
          <Camera className="w-4 h-4" />
          Take a photo
        </Button>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={handleCameraCapture}
        />

        {/* Tips */}
        <div className="card p-4 bg-muted/40 border-dashed">
          <p className="text-xs font-medium text-foreground mb-2">📸 Tips for best results</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Lay the paper flat on a well-lit surface</li>
            <li>• Capture the whole page including margins</li>
            <li>• Ensure teacher&apos;s marks are clearly visible</li>
            <li>• Avoid shadows across question text</li>
          </ul>
        </div>
      </div>
    );
  }

  // ── Render: preview ────────────────────────────────────────────────────────
  if (state === 'preview' && preview) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-foreground">Review your scan</h2>
          <button
            onClick={reset}
            className="btn-ghost text-muted-foreground hover:text-foreground text-xs gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            Remove
          </button>
        </div>

        {/* Image preview */}
        <div className="relative rounded-2xl overflow-hidden border border-border bg-muted/30 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Scan preview"
            className="w-full object-contain max-h-[500px]"
          />
          <div className="absolute inset-0 flex items-center justify-center
                          bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* File info */}
        <div className="card p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
            <Eye className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file?.name}</p>
            <p className="text-xs text-muted-foreground">
              {file ? (file.size / 1024 / 1024).toFixed(2) : 0} MB
            </p>
          </div>
          <button onClick={reset} className="text-muted-foreground hover:text-foreground p-1">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <Button onClick={handleAnalyse} className="w-full gap-2" size="lg">
          <Scissors className="w-4 h-4" />
          Analyse with AI
        </Button>
      </div>
    );
  }

  // ── Render: uploading / analysing ──────────────────────────────────────────
  if (state === 'uploading' || state === 'analysing') {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6 animate-fade-in">
        <div className="relative w-20 h-20">
          {/* Spinner ring */}
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40" cy="40" r="34"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="6"
            />
            <circle
              cx="40" cy="40" r="34"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-7 h-7 text-primary animate-spin" />
          </div>
        </div>

        <div className="text-center">
          <p className="font-medium text-foreground mb-1">
            {state === 'uploading' ? 'Uploading image…' : 'AI is analysing your test…'}
          </p>
          <p className="text-sm text-muted-foreground">
            {state === 'analysing'
              ? 'Detecting questions, marking wrong answers, tagging topics…'
              : 'Sending to storage…'}
          </p>
        </div>

        {/* Preview thumbnail */}
        {preview && (
          <div className="w-32 h-32 rounded-2xl overflow-hidden border border-border opacity-60">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    );
  }

  // ── Render: error ──────────────────────────────────────────────────────────
  if (state === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 animate-fade-in text-center">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <div>
          <p className="font-medium text-foreground mb-1">Analysis failed</p>
          <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={reset} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Try again
          </Button>
          <Button variant="ghost" onClick={() => router.push('/settings')}>
            Check settings
          </Button>
        </div>
      </div>
    );
  }

  // ── Render: done ───────────────────────────────────────────────────────────
  if (state === 'done' && result) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Success banner */}
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Scan analysed successfully
            </p>
            <p className="text-xs text-muted-foreground">
              {result.questions.length} question{result.questions.length !== 1 ? 's' : ''} detected
              {' · '}
              {result.questions.filter((q) => q.status === 'wrong').length} wrong
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5">
            <Camera className="w-3.5 h-3.5" />
            New scan
          </Button>
        </div>

        <ScanResults scan={result.scan} questions={result.questions} scanImageUrl={preview!} />
      </div>
    );
  }

  return null;
}
