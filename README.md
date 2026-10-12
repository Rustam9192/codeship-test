# NimbusStack product knowledge

Internal chat for NimbusStack employees. Answers come only from the markdown files in `nimbusstack-knowledge-base`. Do not edit those files.

## Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and set at least one key. Create each key in that provider's console:
   - `ANTHROPIC_API_KEY` — [Anthropic console](https://console.anthropic.com/settings/keys)
   - `OPENAI_API_KEY` — [OpenAI platform](https://platform.openai.com/api-keys)
   - `GOOGLE_GENERATIVE_AI_API_KEY` — [Google AI Studio](https://aistudio.google.com/apikey)
3. Start the app: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000)

Keys stay on the server. A provider without a key is shown as unavailable. If the selected provider fails, the server retries the next configured provider and shows which one actually answered.

## Checks

- `npm run typecheck`
- `npm run lint`
- `npm test`

## Deploy

The app is a Next.js App Router project. On Vercel, set the same environment variables in the project settings and include the `nimbusstack-knowledge-base` folder in the deployment.
