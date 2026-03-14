/**
 * AI service using OpenAI-compatible APIs
 * Handles: image analysis, question detection, step-by-step explanations
 */
import type { AIAnalysisResult, AIExplanationResult } from '@/types';

interface AIClientOpts {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

function buildClient(opts: AIClientOpts) {
  const baseUrl = opts.baseUrl?.replace(/\/$/, '') ?? 'https://api.openai.com/v1';
  const model = opts.model ?? 'gpt-4o';
  return { baseUrl, model, apiKey: opts.apiKey };
}

async function chatCompletion(
  client: ReturnType<typeof buildClient>,
  messages: object[],
  jsonMode = false
) {
  const res = await fetch(`${client.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${client.apiKey}`,
    },
    body: JSON.stringify({
      model: client.model,
      messages,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      max_tokens: 4096,
      temperature: 0.1,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices[0].message.content as string;
}

// ─── Analyse a test image ─────────────────────────────────────────────────────
const ANALYSIS_SYSTEM_PROMPT = `You are an expert educational assistant specialised in analysing test papers.
Given an image of a test paper, you must:
1. Identify the subject (e.g. Math, Physics, Chemistry, Biology, English, History).
2. Detect ALL questions and determine which are WRONG (marked with ✗, red marks, crossed out answers, low marks, teacher corrections).
3. For each question, estimate a normalised bounding box (values 0.0–1.0, relative to image dimensions): {x, y, width, height} where (x,y) is the top-left corner.
4. Identify the topic of each question (e.g. "Quadratic Equations", "Newton's Laws").

Respond ONLY with a valid JSON object matching this schema exactly:
{
  "subject": "string",
  "questions": [
    {
      "questionNumber": "string or number",
      "questionText": "brief description of question",
      "status": "wrong" | "correct" | "unknown",
      "topic": "string",
      "bbox": { "x": number, "y": number, "width": number, "height": number },
      "confidence": number
    }
  ]
}`;

export async function analyseTestImage(
  imageBase64: string,
  mimeType: string,
  opts: AIClientOpts
): Promise<AIAnalysisResult> {
  const client = buildClient(opts);

  const messages = [
    { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
    {
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: {
            url: `data:${mimeType};base64,${imageBase64}`,
            detail: 'high',
          },
        },
        {
          type: 'text',
          text: 'Analyse this test paper and return the structured JSON.',
        },
      ],
    },
  ];

  const raw = await chatCompletion(client, messages, true);

  try {
    return JSON.parse(raw) as AIAnalysisResult;
  } catch {
    throw new Error('AI returned invalid JSON for analysis');
  }
}

// ─── Explain a wrong question ─────────────────────────────────────────────────
const EXPLAIN_SYSTEM_PROMPT = `You are an expert teacher who provides clear, step-by-step solutions to exam questions.
Given an image of a specific exam question (possibly with the student's wrong answer visible), provide a detailed solution.

Respond ONLY with a valid JSON object:
{
  "steps": [
    {
      "step": 1,
      "title": "Step title",
      "content": "Explanation",
      "formula": "optional LaTeX or plain formula"
    }
  ],
  "summary": "One-sentence summary of the key concept",
  "keyConceptTags": ["tag1", "tag2"]
}`;

export async function explainQuestion(
  imageBase64: string,
  mimeType: string,
  questionText: string | null,
  subject: string,
  opts: AIClientOpts
): Promise<AIExplanationResult> {
  const client = buildClient(opts);

  const messages = [
    { role: 'system', content: EXPLAIN_SYSTEM_PROMPT },
    {
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: {
            url: `data:${mimeType};base64,${imageBase64}`,
            detail: 'high',
          },
        },
        {
          type: 'text',
          text: `Subject: ${subject}. ${questionText ? `Question: ${questionText}` : ''}
Please provide a step-by-step solution.`,
        },
      ],
    },
  ];

  const raw = await chatCompletion(client, messages, true);

  try {
    return JSON.parse(raw) as AIExplanationResult;
  } catch {
    throw new Error('AI returned invalid JSON for explanation');
  }
}
