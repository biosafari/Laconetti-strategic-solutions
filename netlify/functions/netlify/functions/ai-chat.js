export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Missing OPENAI_API_KEY' })
      };
    }

    const body = JSON.parse(event.body || '{}');

    // Accept flexible inputs: { messages }, { message }, or { prompt }
    let messages = body.messages;
    if (!Array.isArray(messages)) {
      const single = body.message || body.prompt;
      if (!single) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing message(s)' })
        };
      }
      messages = [{ role: 'user', content: String(single) }];
    }

    // Call OpenAI
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        messages
      })
    });

    const data = await r.json();

    if (!r.ok) {
      return {
        statusCode: r.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: data.error?.message || 'Upstream API error'
        })
      };
    }

    // Normalize the response shape
    const reply =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.delta?.content ||
      'No output';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply })
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: String(e) })
    };
  }
}