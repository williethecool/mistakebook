import { auth } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { db, userSettings } from '@/lib/db';
import { SettingsForm } from '@/app/components/settings/SettingsForm';

export const metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  });

  // Mask secrets before sending to client
  const safeSettings = settings
    ? {
        ...settings,
        aiApiKey: settings.aiApiKey ? '••••••••' : '',
        s3SecretKey: settings.s3SecretKey ? '••••••••' : '',
        r2SecretKey: settings.r2SecretKey ? '••••••••' : '',
        supabaseKey: settings.supabaseKey ? '••••••••' : '',
      }
    : null;

  return (
    <div className="max-w-2xl mx-auto pb-20 md:pb-0">
      <div className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure your AI provider, storage, and features.
        </p>
      </div>
      <SettingsForm initialSettings={safeSettings} />
    </div>
  );
}
