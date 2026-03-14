import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a date to "Mar 14, 2026" */
export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Truncate text */
export function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}

/** Sleep helper */
export const sleep = (ms: number) =>
  new Promise((r) => setTimeout(r, ms));

/** Generate a random hex color */
export function randomColor() {
  const colors = [
    '#ff3d1f', '#ff6b52', '#3b82f6', '#8b5cf6',
    '#10b981', '#f59e0b', '#ec4899', '#06b6d4',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/** Convert a File to base64 string */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // strip data URL prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Convert a File to data URL (with prefix) */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Crop an image using a bounding box (0–1 normalised) */
export async function cropImageFromBbox(
  imageUrl: string,
  bbox: { x: number; y: number; width: number; height: number },
  padding = 0.01
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const px = Math.max(0, bbox.x - padding);
      const py = Math.max(0, bbox.y - padding);
      const pw = Math.min(1, bbox.width + padding * 2);
      const ph = Math.min(1, bbox.height + padding * 2);

      canvas.width = img.width * pw;
      canvas.height = img.height * ph;

      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(
        img,
        img.width * px,
        img.height * py,
        img.width * pw,
        img.height * ph,
        0, 0,
        canvas.width,
        canvas.height
      );
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob'));
      }, 'image/jpeg', 0.92);
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
}

/** Subject colour map */
export const SUBJECT_COLORS: Record<string, string> = {
  Math: '#3b82f6',
  Physics: '#8b5cf6',
  Chemistry: '#10b981',
  Biology: '#22c55e',
  English: '#f59e0b',
  History: '#ec4899',
  Geography: '#06b6d4',
  Other: '#6b7280',
};

export function subjectColor(subject: string) {
  return SUBJECT_COLORS[subject] ?? '#ff3d1f';
}
