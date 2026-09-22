// This runs on the server (Vercel), never in the visitor's browser.
// It reads your Groq API key from an environment variable, so the
// key is never exposed to anyone using your site.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'Server is missing GROQ_API_KEY. Add it in your hosting provider\'s environment variables.',
    });
  }

  const { prompt, history, currentHtml } = req.body || {};

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing "prompt" in request body.' });
  }

  const systemPrompt = `You are a website generator. You produce a single, complete, self-contained HTML file for whatever site the user describes.

Rules:
- Respond with ONLY raw HTML. No markdown code fences, no explanation, no preamble, no text before or after the HTML.
- The response must start with <!DOCTYPE html> and be a complete, valid HTML document.
- Put all CSS in a <style> tag in the <head>. Put all JavaScript in a <script> tag before </body>. Do not reference any external files.
- You may load fonts from https://fonts.googleapis.com and scripts from https://cdnjs.cloudflare.com if genuinely useful, but the page must work without any other external dependency.
- Make it genuinely well designed: thoughtful typography, a real color palette suited to the subject, sensible spacing, and a responsive layout. Avoid generic templated looks.
- If the user is asking to modify an existing page (one will be provided below as CURRENT_HTML), edit that HTML to make the requested change, preserving everything else. Return the FULL updated HTML document, not a diff or snippet.
- Never include placeholder lorem ipsum if real, sensible sample content is easy to write instead.`;

  // Build the conversation the model sees. We keep it simple: prior turns as
  // plain text context, plus the current HTML (if any) and the new request.
  const messages = [{ role: 'system', content: systemPrompt }];

  if (Array.isArray(history)) {
    for (const turn of history) {
      if (turn && (turn.role === 'user' || turn.role === 'assistant') && typeof turn.content === 'string') {
        messages.push({ role: turn.role, content: turn.content });
      }
    }
  }

  let userContent = prompt;
  if (currentHtml && typeof currentHtml === 'string') {
    userContent = `CURRENT_HTML:\n${currentHtml}\n\nREQUEST: ${prompt}`;
  }
  messages.push({ role: 'user', content: userContent });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: `Anthropic API error: ${errText}` });
    }

    const data = await response.json();
    const textBlock = (data.content || []).find((b) => b.type === 'text');
    let html = textBlock ? textBlock.text : '';

    // Safety net: strip markdown fences if the model added them anyway.
    html = html.trim();
    if (html.startsWith('```')) {
      html = html.replace(/^```(?:html)?\n?/, '').replace(/```$/, '').trim();
    }

    if (!html.toLowerCase().includes('<!doctype') && !html.toLowerCase().includes('<html')) {
      return res.status(502).json({ error: 'Model did not return a full HTML document. Try rephrasing your prompt.' });
    }

    return res.status(200).json({ html });
  } catch (err) {
    return res.status(500).json({ error: `Request failed: ${err.message}` });
  }
}
