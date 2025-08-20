// netlify/functions/ai.js
export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { messages } = JSON.parse(event.body || '{}');
    if (!messages) return { statusCode: 400, body: 'Missing messages' };

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        messages
      })
    });

    const data = await r.json();

    return {
      statusCode: r.ok ? 200 : r.status,
      headers: {
        'Access-Control-Allow-Origin': 'https://www.laconetti.com',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        output_text: data?.choices?.[0]?.message?.content || 'No output'
      })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: String(e) }) };
  }
}
