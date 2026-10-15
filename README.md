# ClassRoom Sim v7 — OpenRouter chat integration

A mobile-first classroom interface with bundled prerecorded lecture playback and an AI-generated simulated class discussion. This is an independent simulation, not a real school portal or live meeting.

## Configure lecture recordings

Put recordings you have permission to use in `public/lectures/`, then edit `public/lectures/playlist.json` with their filenames and titles. Playback starts after **Join class**, initially muted for Android autoplay compatibility, and advances through the playlist.

## OpenRouter setup

AI messages are generated through the serverless endpoint `api/chat.ts`. The OpenRouter key must remain server-side.

1. Create or open your project on Vercel.
2. Import this project and deploy it using Vercel's standard Vite support.
3. In **Project Settings → Environment Variables**, add:
   - `OPENROUTER_API_KEY` — your OpenRouter API key
   - `OPENROUTER_MODEL` — a model available to your OpenRouter account, e.g. `openai/gpt-4o-mini`
   - `APP_URL` — your deployed app URL (optional, used as OpenRouter attribution)
4. Redeploy after setting the variables.

Do **not** put your key in `src/`, `localStorage`, a `VITE_*` variable, or a public `.env` file. `.env.example` contains placeholders only.

The frontend calls `/api/chat` while the classroom is active. If the API is unavailable or not configured, it falls back to local scripted messages so the UI still works. Live AI messages depend on internet access and OpenRouter model availability/costs.

## Run locally

```bash
npm install
npm run dev
```

The Vite dev server does not automatically run Vercel serverless functions. For local end-to-end API testing, use Vercel CLI (`vercel dev`) after configuring local server-side environment variables, or deploy a preview to Vercel.

## Build and deploy

```bash
npm run build
npm run preview
```

Add `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, and optionally `APP_URL` to the hosting environment before expecting live AI responses. Keep the app's independent/simulated status clear; participant profiles and messages are AI-generated.

## Interactive AI class chat (v8)

The chat composer now accepts student messages. Submitting a message sends it to `/api/chat` with `mode: "reply"`; the server-side OpenRouter endpoint asks one fictional classmate to answer the message in the context of the current lecture and recent chat. The API key remains server-side in `OPENROUTER_API_KEY`.

Deploy to Vercel (or another compatible serverless host), set `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, and optionally `APP_URL`, then redeploy. The Vite development server alone does not run the `api/chat.ts` serverless function, so test AI replies on the deployed environment or run with a compatible Vercel dev setup. Automated messages remain separate from direct replies.


## v11 course and chat updates

- Default class title is **Computer Science** for new browser profiles.
- Student dashboard now lists five subjects: Computer Science, Data Structures and Algorithms, Operating Systems, Computer Networks, and Software Engineering. Only the Computer Science course is wired to the bundled lecture playlist in this build.
- Changed the chat subtitle from “AI-generated sample discussion” to “Course discussion”.
- Expanded varied discussion lines and added recent-message duplicate checks; repeated AI output falls back to a different local message when possible.


### v17 layout correction
The lecture stage is constrained to a true 16:9 ratio. On shorter screens, its width scales down based on available viewport height rather than allowing flexbox to squash the stage. The video remains contained without cropping.
