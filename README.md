# Kylian AI Web Builder — an AI website builder you host yourself

A two-pane tool: describe a site in the chat on the left, watch it appear live in the
preview on the right, keep refining it with follow-up prompts, and download the
finished HTML whenever you want.

This only works once it's deployed with your own Anthropic API key — see below.

## What's in this folder

- `index.html` — the whole frontend (chat UI + live preview). No build step needed.
- `api/generate.js` — a serverless function that calls Claude on the site's behalf.
  This is what keeps your API key private.
- `package.json` — minimal project config so Vercel recognizes this as a Node project.

## 1. Get an Anthropic API key

1. Go to **console.anthropic.com** and sign up or log in. (This is separate from any
   claude.ai subscription — it's a pay-as-you-go developer account.)
2. Add billing details under **Settings → Billing** — the API doesn't have a free tier,
   but usage is cheap; a typical generated page costs a few cents.
3. Go to **Settings → API Keys** → **Create Key**. Copy it somewhere safe — you won't
   be able to see it again after you navigate away.

## 2. Deploy to Vercel (free hosting)

1. Go to **vercel.com** and sign up (you can use GitHub, GitLab, or email).
2. Easiest path — no GitHub required:
   - Install the Vercel CLI: open a terminal and run `npm install -g vercel`
   - `cd` into this folder
   - Run `vercel` and follow the prompts (accept the defaults)
3. Alternative — via GitHub:
   - Create a new GitHub repo and push this folder to it
   - In Vercel, click **Add New → Project**, import that repo, and deploy

Either way, Vercel will detect `api/generate.js` automatically and turn it into a
serverless endpoint at `/api/generate` — no extra configuration needed.

## 3. Add your API key to Vercel

1. In your Vercel project dashboard, go to **Settings → Environment Variables**.
2. Add a new variable:
   - Name: `ANTHROPIC_API_KEY`
   - Value: the key you copied in step 1
3. Redeploy the project (Vercel → Deployments → ⋯ → Redeploy) so the function picks
   up the new variable.

## 4. Use it

Visit the URL Vercel gives you (something like `your-project.vercel.app`). Type a
prompt like:

> A one-page portfolio for a wedding photographer, warm and minimal

The generated site loads directly in the preview pane. Send follow-up prompts to
refine it — "make the header sticky," "add a contact form," etc. — and each one edits
the current page rather than starting over.

- **Download HTML** saves the current site as a standalone `.html` file you can host
  anywhere else.
- **New / Delete** at the top manage multiple separate site projects. These are saved
  in your browser's local storage, so they'll persist between visits on the same
  device and browser, but won't follow you to a different device.

## Notes and limits

- Every generation calls the Anthropic API and costs a small amount — there's no way
  around this for an "AI generates a page" feature; that generation is Claude doing
  real work.
- Local storage is per-browser. If you want projects saved centrally (so they show up
  on any device), that needs a real database added to the backend — let me know if
  you want that built out.
- Anyone with your site's URL who uses the builder will trigger API calls billed to
  your account. If you're sharing this publicly, consider adding a simple password
  gate or rate limiting.
