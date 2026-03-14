# MistakeBook 📚

> Capture, organise, and learn from your test mistakes with AI-powered analysis.

MistakeBook lets students upload photos of test papers, automatically detect wrong answers using AI vision, tag and organise questions by subject and topic, and generate step-by-step explanations — all in a clean, responsive web app hosted on Vercel.

---

## Features

- **📷 Photo upload** — drag-and-drop or camera capture from any device
- **🤖 AI Analysis** — detects subjects, wrong questions, bounding boxes, and topics via OpenAI-compatible vision APIs
- **✂️ Auto-cropping** — crops individual questions from the full scan image for display
- **💡 Step-by-step solutions** — "Explain how to solve" generates detailed AI solutions inline
- **📚 Subject organisation** — questions auto-grouped by subject and topic with progress tracking
- **🔐 Authentication** — email/password + Google OAuth via NextAuth v5
- **☁️ Flexible storage** — Vercel Blob, Supabase Storage, AWS S3, or Cloudflare R2
- **🌙 Light/dark mode** — system-aware with manual override
- **📱 Mobile-first** — responsive with bottom tab navigation on mobile

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Auth | NextAuth v5 (Credentials + Google) |
| Database | Vercel Postgres (Neon) + Drizzle ORM |
| Storage | Vercel Blob / Supabase / S3 / R2 |
| AI | OpenAI-compatible vision API |
| Styling | Tailwind CSS + CSS variables |
| UI | Custom components + Framer Motion |
| Forms | React Hook Form + Zod |
| Hosting | Vercel |

---

## Project Structure

```
mistakebook/
├── app/
│   ├── (auth)/              # Login, register pages
│   │   ├── layout.tsx       # Auth layout with branding panel
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/         # Protected app pages
│   │   ├── layout.tsx       # Sidebar + mobile nav
│   │   ├── home/page.tsx    # Stats dashboard
│   │   ├── subjects/        # Subject list + detail
│   │   ├── scan/page.tsx    # Upload + AI analysis
│   │   ├── settings/page.tsx
│   │   └── profile/page.tsx
│   ├── api/
│   │   ├── auth/            # NextAuth handler + register
│   │   ├── scan/            # Upload + AI analysis
│   │   ├── questions/       # List, filter, subjects
│   │   ├── explain/         # Step-by-step solution
│   │   └── settings/        # User settings CRUD
│   ├── components/
│   │   ├── auth/            # LogoutButton
│   │   ├── layout/          # Sidebar, MobileNav
│   │   ├── questions/       # QuestionGrid
│   │   ├── scan/            # ScanUploader, ScanResults
│   │   ├── settings/        # SettingsForm
│   │   └── ui/              # Button, Input, Badge, etc.
│   ├── globals.css          # Design tokens, base styles
│   └── layout.tsx           # Root layout
├── lib/
│   ├── ai.ts                # OpenAI-compatible AI calls
│   ├── auth.ts              # NextAuth config
│   ├── storage.ts           # Multi-provider storage abstraction
│   └── db/
│       ├── schema.ts        # Drizzle schema
│       ├── index.ts         # DB connection
│       ├── seed.ts          # Dev seed script
│       └── migrations/      # SQL migrations
├── hooks/                   # useQuestions, useSettings
├── types/                   # TypeScript interfaces
├── utils/helpers.ts         # Utilities
├── middleware.ts            # Auth route protection
├── .env.example             # Environment variable template
├── vercel.json              # Vercel deployment config
└── drizzle.config.ts        # Drizzle ORM config
```

---

## Quick Start (Local Development)

### 1. Clone and install

```bash
git clone https://github.com/yourname/mistakebook.git
cd mistakebook
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:
- `AUTH_SECRET` — generate with `openssl rand -base64 32`
- `POSTGRES_URL` — a Neon, Supabase, or local Postgres URL
- `BLOB_READ_WRITE_TOKEN` — from Vercel (or leave blank and use another storage provider)

### 3. Set up the database

```bash
# Push schema to your database
npm run db:push

# (Optional) Seed with demo data
npx tsx lib/db/seed.ts
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploying to Vercel (Website — No CLI Required)

Follow these steps entirely through the Vercel and GitHub websites.

---

### Step 1 — Push your code to GitHub

1. Go to [github.com/new](https://github.com/new) and create a new **private** repository called `mistakebook`.
2. In your terminal, inside the project folder, run:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/mistakebook.git
git branch -M main
git push -u origin main
```

---

### Step 2 — Import the project on Vercel

1. Go to [vercel.com](https://vercel.com) and sign up or log in (using GitHub is easiest).
2. From your dashboard, click **Add New… → Project**.
3. Find `mistakebook` in your repository list and click **Import**.
4. Vercel will detect Next.js automatically — leave all build settings as-is.
5. **Do not click Deploy yet.** Continue to the steps below first.

---

### Step 3 — Add a Postgres database

1. In your Vercel project, click the **Storage** tab.
2. Click **Create Database** → select **Neon Serverless Postgres** → click **Continue**.
3. Name it `mistakebook-db`, choose a region near you, click **Create**.
4. Click **Connect to Project** and select `mistakebook`.

This automatically injects `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING`, and related variables — you do not need to add them manually.

---

### Step 4 — Add Blob storage for images

1. Still on the **Storage** tab, click **Create Database** again.
2. Select **Vercel Blob** → click **Continue**.
3. Name it `mistakebook-images` and click **Create**.
4. Click **Connect to Project**.

This automatically injects `BLOB_READ_WRITE_TOKEN`.

---

### Step 5 — Add environment variables

1. Go to **Settings → Environment Variables** in your project.
2. Add the following variables one at a time (type the name, paste the value, click **Add**):

| Variable | Value | Notes |
|----------|-------|-------|
| `AUTH_SECRET` | Random 32-char string | Generate at [generate-secret.vercel.app](https://generate-secret.vercel.app) |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Update after first deploy with your real URL |
| `GOOGLE_CLIENT_ID` | From Google Console | Optional — for Google sign-in |
| `GOOGLE_CLIENT_SECRET` | From Google Console | Optional — for Google sign-in |

> Do **not** manually add `POSTGRES_URL` or `BLOB_READ_WRITE_TOKEN` — these were injected automatically in Steps 3 and 4.

---

### Step 6 — Set up Google OAuth (optional)

If you want users to sign in with Google:

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create or select a project.
2. Navigate to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**.
3. Set the application type to **Web application**.
4. Under **Authorized redirect URIs**, add:
   ```
   https://YOUR-APP.vercel.app/api/auth/callback/google
   ```
5. Copy the **Client ID** and **Client Secret** into Vercel's environment variables as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

---

### Step 7 — Deploy

1. Go to the **Deployments** tab in your Vercel project.
2. Click **Redeploy** on the latest deployment (or return to the overview and click **Deploy**).
3. Wait ~60–90 seconds for the build to complete.
4. Click **Visit** to open your live app.

---

### Step 8 — Create the database tables

After deploying, you need to create the tables. The easiest way is:

1. In the Vercel dashboard, go to **Storage → your Postgres database → Query**.
2. Open the file `lib/db/migrations/0001_initial.sql` from this project.
3. Copy the entire file contents and paste into the query editor.
4. Click **Run Query**.

Alternatively, if you have Node.js installed locally:
```bash
# Copy POSTGRES_URL from Vercel → Storage → your DB → .env.local tab
echo "POSTGRES_URL=your-url-here" >> .env.local
npm run db:push
```

---

### Step 9 — Configure AI and storage in the app

Once your app is live and you've registered an account:

1. Go to **Settings** inside the app.
2. Under **AI Configuration**, paste your OpenAI API key (get one at [platform.openai.com](https://platform.openai.com)).
3. Leave **Base URL** blank for OpenAI, or enter a custom URL for other providers (see table below).
4. The default model is `gpt-4o` — recommended for reading printed/handwritten test papers.
5. Under **Image Storage**, `Vercel Blob` is selected by default and works immediately.
6. Click **Save settings**, then upload your first test scan.

---

### Supported AI Providers

| Provider | Base URL to enter | Recommended Model |
|----------|-------------------|-------------------|
| OpenAI (default) | *(leave blank)* | `gpt-4o` |
| Groq | `https://api.groq.com/openai/v1` | `llama-3.2-11b-vision-preview` |
| Azure OpenAI | `https://{resource}.openai.azure.com/openai/deployments/{deployment}` | `gpt-4o` |
| Ollama (local) | `http://localhost:11434/v1` | `llava` |

---

### Custom Domain (optional)

To use your own domain (e.g. `mistakebook.yourdomain.com`):

1. Go to **Settings → Domains** in your Vercel project.
2. Enter your domain and follow the DNS instructions.
3. Update `NEXT_PUBLIC_APP_URL` in your environment variables to match.
4. If using Google OAuth, add the new domain to your authorized redirect URIs in Google Console.

---

## Configuring Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new **OAuth 2.0 Client ID** (Web application)
3. Add Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://your-app.vercel.app/api/auth/callback/google` (prod)
4. Copy **Client ID** and **Client Secret** to your environment variables

---

## Configuring Storage Providers

Users configure their storage in **Settings** within the app. Here's a summary:

### Vercel Blob (default)
- Add the Vercel Blob integration in your Vercel project
- No per-user configuration needed — `BLOB_READ_WRITE_TOKEN` handles it

### Supabase Storage
- Create a Supabase project at [supabase.com](https://supabase.com)
- Create a storage bucket (e.g. `mistakebook-images`) with public access
- In MistakeBook Settings: paste the project URL, service role key, and bucket name

### AWS S3
- Create an S3 bucket with public read access (or CloudFront CDN)
- Create an IAM user with `s3:PutObject` permission
- In Settings: enter region, bucket name, access key ID, secret key

### Cloudflare R2
- Create an R2 bucket in your Cloudflare dashboard
- Enable public access (or use a custom domain)
- Create R2 API tokens in the Cloudflare dashboard
- In Settings: enter account ID, bucket name, access key, secret key

---

## Configuring the AI Provider

Users set their own AI key in **Settings → AI Configuration**. This supports any OpenAI-compatible API:

| Provider | Base URL | Recommended Model |
|----------|---------|-------------------|
| OpenAI | `https://api.openai.com/v1` | `gpt-4o` |
| Anthropic (via proxy) | Custom | `claude-3-5-sonnet` |
| Groq | `https://api.groq.com/openai/v1` | `llama-3.2-vision` |
| Ollama (local) | `http://localhost:11434/v1` | `llava` |
| Azure OpenAI | `https://{resource}.openai.azure.com/openai/deployments/{deployment}` | `gpt-4o` |

The AI is used for:
1. **Scan analysis** — detects questions, marks wrong/correct, returns bounding boxes and topic tags
2. **Question explanation** — generates step-by-step solutions for wrong questions

---

## Database Schema Overview

```
users           → accounts, sessions (NextAuth)
users           → user_settings (1:1)
users           → scans (1:many)
scans           → questions (1:many)
users           → tags (1:many)
questions       ↔ tags (many:many via question_tags)
```

---

## Adding New Features

The codebase is designed to be extended:

- **New storage provider** → add a case to `lib/storage.ts` and update the settings form
- **New AI provider** → the AI module uses a generic fetch; just change the base URL in settings
- **New question metadata** → add columns to `questions` in `schema.ts`, run `db:push`
- **New page** → create `app/(dashboard)/yourpage/page.tsx`, add nav item to `Sidebar.tsx` and `MobileNav.tsx`

---

## Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Lint
npm run db:push      # Push schema to DB (no migrations)
npm run db:generate  # Generate migration files
npm run db:studio    # Open Drizzle Studio (DB GUI)
npx tsx lib/db/seed.ts  # Seed demo data
```

---

## License

MIT — free to use, modify, and deploy.
