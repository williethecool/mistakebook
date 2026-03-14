'use client';

import { useState, useRef, useEffect } from 'react';
import { Layers, List, Tag, Lightbulb, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn, subjectColor, formatDate } from '@/utils/helpers';
import { Button, Badge } from '@/app/components/ui';
import type { Scan, Question, AIExplanationResult } from '@/types';

interface ScanResultsProps {
  scan: Scan;
  questions: Question[];
  scanImageUrl: string;
}

export function ScanResults({ scan, questions, scanImageUrl }: ScanResultsProps) {
  const [view, setView] = useState<'annotated' | 'list'>('annotated');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const wrongQuestions = questions.filter((q) => q.status === 'wrong');
  const color = subjectColor(scan.subject ?? 'Other');

  // ── Draw bounding boxes on canvas ────────────────────────────────────────
  useEffect(() => {
    if (view !== 'annotated') return;
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !img.complete) return;

    drawAnnotations(canvas, img, questions, selectedId);
  }, [view, questions, selectedId]);

  function handleImageLoad() {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    drawAnnotations(canvas, img, questions, selectedId);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-sm font-medium px-2.5 py-0.5 rounded-full"
              style={{ backgroundColor: `${color}22`, color }}
            >
              {scan.subject ?? 'Unknown subject'}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDate(scan.uploadedAt ?? new Date())}
            </span>
          </div>
          <div className="flex gap-3 text-sm">
            <span className="text-foreground font-medium">{questions.length} total</span>
            <span className="text-red-500">{wrongQuestions.length} wrong</span>
            <span className="text-emerald-500">
              {questions.filter((q) => q.status === 'correct').length} correct
            </span>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted">
          <button
            onClick={() => setView('annotated')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              view === 'annotated'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            Annotated
          </button>
          <button
            onClick={() => setView('list')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              view === 'list'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <List className="w-3.5 h-3.5" />
            List
          </button>
        </div>
      </div>

      {/* Annotated view */}
      {view === 'annotated' && (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-border bg-muted/20">
            {/* Hidden img to get natural dimensions */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={scanImageUrl}
              alt="Scan"
              className="w-full opacity-0 absolute pointer-events-none"
              onLoad={handleImageLoad}
            />
            <canvas
              ref={canvasRef}
              className="w-full cursor-pointer"
              onClick={(e) => {
                const canvas = canvasRef.current;
                const img = imgRef.current;
                if (!canvas || !img) return;
                const rect = canvas.getBoundingClientRect();
                const scaleX = img.naturalWidth / rect.width;
                const scaleY = img.naturalHeight / rect.height;
                const x = (e.clientX - rect.left) * scaleX;
                const y = (e.clientY - rect.top) * scaleY;

                // Find clicked question
                const clicked = questions.find((q) => {
                  if (!q.bbox) return false;
                  const bx = q.bbox.x * img.naturalWidth;
                  const by = q.bbox.y * img.naturalHeight;
                  const bw = q.bbox.width * img.naturalWidth;
                  const bh = q.bbox.height * img.naturalHeight;
                  return x >= bx && x <= bx + bw && y >= by && y <= by + bh;
                });
                setSelectedId(clicked?.id ?? null);
              }}
            />
          </div>

          {/* Legend */}
          <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-red-500/80" />
              Wrong
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500/80" />
              Correct
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-yellow-500/80" />
              Unknown
            </span>
            <span className="ml-auto">Click a box to select</span>
          </div>

          {/* Selected question detail */}
          {selectedId && (
            <SelectedQuestionPanel
              question={questions.find((q) => q.id === selectedId)!}
              onClose={() => setSelectedId(null)}
            />
          )}
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div className="space-y-3">
          {questions.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">
              No questions were detected in this scan.
            </p>
          ) : (
            questions.map((q) => (
              <QuestionListItem key={q.id} question={q} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Canvas drawing helper ────────────────────────────────────────────────────
function drawAnnotations(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  questions: Question[],
  selectedId: string | null
) {
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);

  for (const q of questions) {
    if (!q.bbox) continue;

    const x = q.bbox.x * w;
    const y = q.bbox.y * h;
    const bw = q.bbox.width * w;
    const bh = q.bbox.height * h;

    const isSelected = q.id === selectedId;
    const strokeColor =
      q.status === 'wrong'
        ? '#ef4444'
        : q.status === 'correct'
        ? '#10b981'
        : '#f59e0b';

    // Fill overlay
    ctx.fillStyle = `${strokeColor}${isSelected ? '33' : '18'}`;
    ctx.fillRect(x, y, bw, bh);

    // Border
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.strokeRect(x, y, bw, bh);

    // Label bubble
    const label = q.status === 'wrong' ? '✗' : q.status === 'correct' ? '✓' : '?';
    const fontSize = Math.max(14, Math.min(24, bh * 0.15));
    ctx.font = `bold ${fontSize}px sans-serif`;
    const labelW = ctx.measureText(label).width + 12;
    const labelH = fontSize + 8;

    ctx.fillStyle = strokeColor;
    ctx.beginPath();
    ctx.roundRect(x - 1, y - labelH - 2, labelW, labelH, 4);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.fillText(label, x + 5, y - 6);
  }
}

// ─── Selected question panel ──────────────────────────────────────────────────
function SelectedQuestionPanel({
  question,
  onClose,
}: {
  question: Question;
  onClose: () => void;
}) {
  return (
    <div className="card p-4 border-l-4 animate-scale-in"
      style={{ borderLeftColor: question.status === 'wrong' ? '#ef4444' : question.status === 'correct' ? '#10b981' : '#f59e0b' }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className={cn(
            'badge',
            question.status === 'wrong' && 'bg-red-500/10 text-red-500',
            question.status === 'correct' && 'bg-emerald-500/10 text-emerald-500',
            question.status === 'unknown' && 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
          )}>
            {question.status}
          </span>
          {question.topic && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {question.topic}
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">
          ✕
        </button>
      </div>
      {question.questionText && (
        <p className="text-sm text-foreground mb-3">{question.questionText}</p>
      )}
      {question.cropImageUrl && (
        <div className="rounded-xl overflow-hidden border border-border mb-3 max-w-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={question.cropImageUrl} alt="Question" className="w-full object-contain" />
        </div>
      )}
    </div>
  );
}

// ─── Question list item ───────────────────────────────────────────────────────
function QuestionListItem({ question }: { question: Question }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<AIExplanationResult | null>(() => {
    if (!question.explanation) return null;
    try { return JSON.parse(question.explanation); } catch { return null; }
  });

  const color = subjectColor(question.subject);

  async function explain() {
    if (explanation) { setExpanded((e) => !e); return; }
    setLoading(true);
    setExpanded(true);
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setExplanation(data.parsed ?? JSON.parse(data.explanation));
    } catch (err: unknown) {
      toast.error((err as Error).message);
      setExpanded(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            'w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0',
            question.status === 'wrong' && 'bg-red-500',
            question.status === 'correct' && 'bg-emerald-500',
            question.status === 'unknown' && 'bg-yellow-500',
          )} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${color}22`, color }}
              >
                {question.subject}
              </span>
              {question.topic && (
                <span className="text-xs text-muted-foreground">{question.topic}</span>
              )}
            </div>
            <p className="text-sm text-foreground">
              {question.questionText ?? 'Question from scan'}
            </p>
            {question.cropImageUrl && (
              <div className="mt-2 max-w-xs rounded-xl overflow-hidden border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={question.cropImageUrl} alt="" className="w-full object-contain" />
              </div>
            )}
          </div>
        </div>

        {question.status === 'wrong' && (
          <div className="mt-3 pl-5">
            <Button variant="outline" size="sm" onClick={explain} loading={loading} className="gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-primary" />
              {explanation ? 'Hide solution' : 'Explain how to solve'}
              {explanation && (expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
            </Button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="border-t border-border bg-muted/30 px-5 py-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating solution…
            </div>
          ) : explanation ? (
            <ExplanationView explanation={explanation} />
          ) : null}
        </div>
      )}
    </div>
  );
}

// ─── Explanation view (same as QuestionGrid) ──────────────────────────────────
function ExplanationView({ explanation }: { explanation: AIExplanationResult }) {
  return (
    <div className="space-y-4">
      {explanation.summary && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/8 border border-primary/20">
          <Lightbulb className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-foreground">{explanation.summary}</p>
        </div>
      )}
      <div className="space-y-3">
        {explanation.steps?.map((step, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary text-white text-xs
                            flex items-center justify-center flex-shrink-0 font-medium mt-0.5">
              {step.step}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground mb-0.5">{step.title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.content}</p>
              {step.formula && (
                <div className="mt-2 px-3 py-2 rounded-lg bg-card border border-border">
                  <code className="font-mono text-xs">{step.formula}</code>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {explanation.keyConceptTags?.length > 0 && (
        <div className="flex gap-1.5 flex-wrap pt-1">
          {explanation.keyConceptTags.map((tag) => (
            <span key={tag} className="badge bg-muted text-muted-foreground text-xs"># {tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}
