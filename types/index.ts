// ─── User & Auth ────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  createdAt: Date;
}

// ─── Settings ────────────────────────────────────────────────────────────────
export type StorageProvider = 'vercel' | 'supabase' | 's3' | 'r2';

export interface UserSettings {
  id: string;
  userId: string;
  aiApiKey: string | null;
  aiBaseUrl: string | null;
  aiModel: string;
  storageProvider: StorageProvider;
  // Supabase
  supabaseUrl: string | null;
  supabaseKey: string | null;
  supabaseBucket: string | null;
  // S3
  s3Region: string | null;
  s3Bucket: string | null;
  s3AccessKey: string | null;
  s3SecretKey: string | null;
  // R2
  r2AccountId: string | null;
  r2Bucket: string | null;
  r2AccessKey: string | null;
  r2SecretKey: string | null;
  // Features
  autoCropEnabled: boolean;
  updatedAt: Date;
}

// ─── Scans ────────────────────────────────────────────────────────────────────
export interface Scan {
  id: string;
  userId: string;
  imageUrl: string;
  thumbnailUrl: string | null;
  subject: string | null;
  uploadedAt: Date;
  processedAt: Date | null;
  status: 'pending' | 'processing' | 'done' | 'error';
  errorMessage: string | null;
  questions: Question[];
}

// ─── Questions ────────────────────────────────────────────────────────────────
export interface Question {
  id: string;
  scanId: string;
  userId: string;
  subject: string;
  topic: string | null;
  questionText: string | null;
  cropImageUrl: string | null;
  status: 'wrong' | 'correct' | 'unknown';
  // Bounding box (relative 0–1)
  bbox: BoundingBox | null;
  explanation: string | null;
  explainedAt: Date | null;
  tags: Tag[];
  createdAt: Date;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ─── Tags ─────────────────────────────────────────────────────────────────────
export interface Tag {
  id: string;
  name: string;
  color: string;
}

// ─── AI Responses ─────────────────────────────────────────────────────────────
export interface AIAnalysisResult {
  subject: string;
  questions: AIQuestion[];
}

export interface AIQuestion {
  questionNumber: number | string;
  questionText: string;
  status: 'wrong' | 'correct' | 'unknown';
  topic: string;
  bbox: BoundingBox;
  confidence: number;
}

export interface AIExplanationResult {
  steps: ExplanationStep[];
  summary: string;
  keyConceptTags: string[];
}

export interface ExplanationStep {
  step: number;
  title: string;
  content: string;
  formula?: string;
}

// ─── Filters ──────────────────────────────────────────────────────────────────
export interface QuestionFilters {
  subject?: string;
  topic?: string;
  status?: 'wrong' | 'correct' | 'unknown';
  startDate?: string;
  endDate?: string;
  search?: string;
}

// ─── API responses ────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}
