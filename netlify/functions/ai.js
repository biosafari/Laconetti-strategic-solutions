// CommonJS Netlify Function (no streaming)
exports.handler = async (event) => {
  // CORS + methods
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors() };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors(), body: 'Method Not Allowed' };
  }

  // Parse body
  let messages = [];
  try { ({ messages } = JSON.parse(event.body || '{}')); } catch {}
  if (!Array.isArray(messages)) {
    return json(400, { error: 'messages must be an array' });
  }

  // Instant FAQ
  const last = (messages[messages.length - 1]?.content || '').toLowerCase();
  const faqs = [
    { re: /(what do (you|we) do|\byour services\b|services do you offer)/i,
      out: "We deliver market entry, ESG and stakeholder stabilization, procurement and logistics, and conflict‑resilient execution in Nigeria with a UK investor interface; which service do you need and what’s your timeline?" },
    { re: /(how (do )?we start|getting started|engage|onboard)/i,
      out: "We begin with a 20‑minute discovery call and an NDA if required; share your name, organisation, email, target sector, and desired start date." },
    { re: /(where do you operate|which countries|locations?)/i,
      out: "We execute on‑ground in Nigeria and handle investor relations and policy advisory from the UK; is your focus Nigeria, UK interface, or both?" },
    { re: /(price|pricing|cost|rates|fees)/i,
      out: "Pricing is proposal‑based after scoping; what service, scope, and budget range should we align to?" },
    { re: /(proof|case studies?|track record|references?)/i,
      out: "Highlights include Agip–Setraco mediation, Eterna alliances, and OML40 support via Origin Global Nig Ltd; should we send a one‑pager or schedule a briefing?" }
  ];
  const hit = faqs.find(f => f.re.test(last));
  if (hit) return json(200, { output_text: hit.out });

  // System brief
  const system = {
    role: 'system',
    content: `
You are Laconetti’s website assistant. Answer in short, factual sentences. If off‑scope, collect contact details and offer an intro call.
Identity: Laconetti Strategic Solutions Ltd. Tagline: “Sustainable Strategy. Global Impact.”
Positioning: Dual‑jurisdiction consultancy. Nigeria delivery, UK investor interface.
Core services: Nigeria Market Entry; Stakeholder & ESG Stabilization; Procurement & Logistics; Conflict Resolution & Community Engagement; Energy & ESG Consulting; Local Content Compliance; Security Intelligence; Agricultural Development; Mining; Military Supply (non‑lethal); Diaspora Incubation & Policy Advisory; Import/Export, Wholesale, Retail, E‑commerce.
Impact: Agip–Setraco mediation; Eterna alliances; IPND‑MoU outcomes; Chevron‑backed GMoU projects; OML40 via Origin Global Nig Ltd.
Jurisdiction & compliance: UK voluntary roles per MoU until visa status permits directorship. No influence claims. Pricing after scoping.
Contacts: info@laconetti.com • Nigeria: Warri • UK: Virtual, London • www.laconetti.com
`
  };

  // Call OpenAI (Responses API, no stream)
  try {
    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-5.1-mini',
        input: [system, ...messages],
        stream: false
      })
    });

    const j = await r.json().catch(() => ({}));
    if (!r.ok) return json(502, { error: `OpenAI ${r.status}`, details: j });

    const text =
      j.output_text ||
      (Array.isArray(j.output) && j.output.map(o => o.content?.map(c => c.text).join(' ')).join(' ')) ||
      'No output.';

    return json(200, { output_text: text });
  } catch (e) {
    return json(500, { error: String(e) });
  }
};

// helpers
function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
function json(statusCode, obj) {
  return { statusCode, headers: { ...cors(), 'Content-Type': 'application/json' }, body: JSON.stringify(obj) };
}