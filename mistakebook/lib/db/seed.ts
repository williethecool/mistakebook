/**
 * Seed script — run with: npx tsx lib/db/seed.ts
 * Creates a demo user for local development testing.
 */
import { db } from './index';
import { users, userSettings, scans, questions } from './schema';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Seeding database…');

  // Demo user
  const hash = await bcrypt.hash('Password123', 12);
  const [user] = await db
    .insert(users)
    .values({
      name: 'Demo Student',
      email: 'demo@mistakebook.dev',
      passwordHash: hash,
    })
    .onConflictDoNothing()
    .returning();

  if (!user) {
    console.log('ℹ️  Demo user already exists, skipping.');
    return;
  }

  console.log(`✅ Created user: ${user.email}`);

  // Default settings
  await db.insert(userSettings).values({
    userId: user.id,
    aiModel: 'gpt-4o',
    storageProvider: 'vercel',
    autoCropEnabled: true,
  });

  // Demo scan
  const [scan] = await db
    .insert(scans)
    .values({
      userId: user.id,
      imageUrl: 'https://placehold.co/800x1100/f5f5f0/3c3b34?text=Test+Paper',
      subject: 'Math',
      status: 'done',
      processedAt: new Date(),
    })
    .returning();

  // Demo questions
  await db.insert(questions).values([
    {
      scanId: scan.id,
      userId: user.id,
      subject: 'Math',
      topic: 'Quadratic Equations',
      questionText: 'Solve: x² - 5x + 6 = 0',
      status: 'wrong',
      bbox: { x: 0.05, y: 0.1, width: 0.9, height: 0.12 },
    },
    {
      scanId: scan.id,
      userId: user.id,
      subject: 'Math',
      topic: 'Algebra',
      questionText: 'Simplify: (3x² + 2x - 1) ÷ (x + 1)',
      status: 'correct',
      bbox: { x: 0.05, y: 0.25, width: 0.9, height: 0.12 },
    },
    {
      scanId: scan.id,
      userId: user.id,
      subject: 'Math',
      topic: 'Trigonometry',
      questionText: 'Find the value of sin(30°) + cos(60°)',
      status: 'wrong',
      bbox: { x: 0.05, y: 0.4, width: 0.9, height: 0.12 },
    },
    {
      scanId: scan.id,
      userId: user.id,
      subject: 'Math',
      topic: 'Calculus',
      questionText: 'Differentiate: f(x) = 3x³ - 2x² + x - 5',
      status: 'correct',
      bbox: { x: 0.05, y: 0.55, width: 0.9, height: 0.12 },
    },
  ]);

  console.log('✅ Seeded demo scan with 4 questions');
  console.log('');
  console.log('Demo credentials:');
  console.log('  Email:    demo@mistakebook.dev');
  console.log('  Password: Password123');
  console.log('');
  console.log('🎉 Seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
