import { Metadata } from 'next';
import { ScanUploader } from '@/app/components/scan/ScanUploader';

export const metadata: Metadata = { title: 'Add Scan' };

export default function ScanPage() {
  return (
    <div className="max-w-3xl mx-auto pb-24 md:pb-0">
      <div className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl">Add Scan</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload or photograph a test paper. AI will detect wrong answers automatically.
        </p>
      </div>
      <ScanUploader />
    </div>
  );
}
