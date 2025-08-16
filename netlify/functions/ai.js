// netlify/functions/ai.js
export default async (req, context) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'POST only' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const { prompt, messages } = await req.json().catch(() => ({}));
  if (!prompt && !messages) {
    return new Response(JSON.stringify({ ok: false, error: 'Provide prompt or messages[]' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing OPENAI_API_KEY' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  // Build Chat payload. Accept either simple prompt or Chat messages.
  const chatMessages = messages ?? [
    { role: 'system', content: 'You are a concise corporate website helper.' },
    { role: 'user', content: String(prompt) },
  ];

  // OpenAI Chat Completions (Responses API) - standard JSON (no streaming)
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages: chatMessages,
    }),
  });

  if (!r.ok) {
    const errTxt = await r.text();
    return new Response(JSON.stringify({ ok: false, error: errTxt }), {
      status: r.status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const data = await r.json();
  const text = data?.choices?.[0]?.message?.content ?? '';

  return new Response(JSON.stringify({ ok: true, text }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  });
}