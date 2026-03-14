'use client';

import { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp, Loader2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate, subjectColor } from '@/utils/helpers';
import { Button } from '@/app/components/ui';
import type { Question } from '@/types';
import type { AIExplanationResult } from '@/types';

interface QuestionGridProps {
  questions: Question[];
}

export function QuestionGrid({ questions }: QuestionGridProps) {
  if (questions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No questions match the current filters.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {questions.map((q) => (
        <QuestionCard key={q.id} question={q} />
      ))}
    </div>
  );
}

function QuestionCard({ question }: { question: Question }) {
  const [expanded, setExpanded] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState<AIExplanationResult | null>(
    question.explanation
      ? (() => {
          try { return JSON.parse(question.explanation!); }
          catch { return null; }
        })()
      : null
  );

  const color = subjectColor(question.subject);

  async function handleExplain() {
    if (explanation) {
      setExpanded((e) => !e);
      return;
    }

    setExplaining(true);
    setExpanded(true);

    try {
      // If we have a crop image, send it as base64
      let imageBase64: string | null = null;
      let mimeType = 'image/jpeg';

      if (question.cropImageUrl) {
        const res = await fetch('/api/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId: question.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setExplanation(data.parsed ?? JSON.parse(data.explanation));
      } else {
        const res = await fetch('/api/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId: question.id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        const parsed = data.parsed ?? (data.explanation ? JSON.parse(data.explanation) : null);
        setExplanation(parsed);
      }
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to get explanation');
      setExpanded(false);
    } finally {
      setExplaining(false);
    }
  }

  return (
    <div className="card overflow-hidden">
      {/* Main row */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Status dot */}
          <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 status-${question.status}`} />

          <div className="flex-1 min-w-0">
            {/* Tags row */}
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${color}22`, color }}
              >
                {question.subject}
              </span>
              {question.topic && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Tag className="w-2.5 h-2.5" />
                  {question.topic}
                </span>
              )}
              <span className="text-xs text-muted-foreground ml-auto">
                {formatDate(question.createdAt)}
              </span>
            </div>

            {/* Question text */}
            <p className="text-sm text-foreground leading-relaxed">
              {question.questionText ?? 'Question detected from scan'}
            </p>

            {/* Crop image */}
            {question.cropImageUrl && (
              <div className="mt-3 rounded-xl overflow-hidden border border-border max-w-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={question.cropImageUrl}
                  alt="Question crop"
                  className="w-full object-contain"
                />
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 pl-5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExplain}
            loading={explaining}
            className="gap-1.5"
          >
            <Lightbulb className="w-3.5 h-3.5 text-primary" />
            {explanation ? 'View solution' : 'Explain how to solve'}
            {explanation && (
              expanded
                ? <ChevronUp className="w-3 h-3" />
                : <ChevronDown className="w-3 h-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Explanation panel */}
      {expanded && (
        <div className="border-t border-border bg-muted/30 px-5 py-4">
          {explaining ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating step-by-step solution…
            </div>
          ) : explanation ? (
            <ExplanationView explanation={explanation} />
          ) : null}
        </div>
      )}
    </div>
  );
}

function ExplanationView({ explanation }: { explanation: AIExplanationResult }) {
  return (
    <div className="space-y-4">
      {/* Summary */}
      {explanation.summary && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/8 border border-primary/20">
          <Lightbulb className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-foreground">{explanation.summary}</p>
        </div>
      )}

      {/* Steps */}
      <div className="space-y-3">
        {explanation.steps.map((step, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-primary text-white text-xs
                            flex items-center justify-center flex-shrink-0 font-medium mt-0.5">
              {step.step}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground mb-0.5">{step.title}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.content}</p>
              {step.formula && (
                <div className="mt-2 px-3 py-2 rounded-lg bg-card border border-border">
                  <code className="font-mono text-xs text-foreground">{step.formula}</code>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Key concept tags */}
      {explanation.keyConceptTags?.length > 0 && (
        <div className="flex gap-1.5 flex-wrap pt-1">
          {explanation.keyConceptTags.map((tag) => (
            <span key={tag} className="badge bg-muted text-muted-foreground text-xs">
              # {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
