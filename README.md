# LinkedIn Posting

A lightweight local Next.js app for turning articles or raw notes into LinkedIn post angles and draft variants in Jakob Berger's voice.

## What it does

- paste notes, a URL, or both
- collect source text
- generate a concise summary
- generate 3 to 5 post angles
- draft 2 LinkedIn post variants for the selected angle
- score drafts with hard bans and advisory notes
- save history and feedback locally

## Local setup

1. Clone the repo.
2. Create `.env.local` in the project root:

```bash
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4.1-mini
```

3. Install dependencies:

```bash
npm install
```

4. Start the app:

```bash
npm run dev
```

5. Open:

```text
http://localhost:3000
```

## Data storage

This MVP stores history and feedback locally in `data/app-data.json`.
That file is created automatically the first time you generate content.

## Test input ideas

- raw notes about AI + fund ops
- a Drawdown or PEI article URL plus your own notes
- an Aztec article plus your own operating-model take

## Current scope

This is a single-user internal tool.
It does not publish to LinkedIn.
It does not do team workflows or auth.
