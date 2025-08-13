// /netlify/functions/ai.js
export default async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  // Only POST
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }

  // Parse body
  let bodyIn = {};
  try { bodyIn = await req.json(); } catch (_) {}
  const { messages } = bodyIn;
  if (!Array.isArray(messages)) {
    return sse({ output_text: 'Bad request: messages must be an array.' }, 400);
  }

  // Instant FAQ replies
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
      out: "Highlights include Agip–Setraco mediation, Eterna alliances, and OML40 support via Origin Global Nig Ltd; should we send a one‑pager or schedule a briefing?" },
    { re: /(visa|skilled worker|compliance|legal)/i,
      out: "UK roles subject to Skilled Worker Visa are voluntary per our MoU until status permits directorship; do you need a compliance note for your legal team?" },
    { re: /(sectors|industr(y|ies)|what fields)/i,
      out: "Energy, agriculture, mining, and security infrastructure with import/export, wholesale, retail, and e‑commerce enablement; which sector fits your brief?" },
    { re: /(security|esg|ncdmb|early warning|risk)/i,
      out: "We integrate host‑community risk intelligence, early warning, and NCDMB‑aligned ESG delivery; what asset or project are you securing?" },
    { re: /(contact|email|book (a )?call|speak|meeting)/i,
      out: "Email info@laconetti.com or share your name, organisation, email, phone, and preferred time to book a slot." }
  ];
  const hit = faqs.find(f => f.re.test(last));
  if (hit) return sse({ output_text: hit.out });

  // System brief (grounded)
  const system = {
    role: 'system',
    content: `
You are Laconetti’s website assistant. Answer in short, factual sentences. If a request is off‑scope, collect contact details and offer an intro call.

Identity
• Company: Laconetti Strategic Solutions Ltd
• Tagline: “Sustainable Strategy. Global Impact.”
• Positioning: Dual‑jurisdiction consultancy headquartered in Nigeria with a strong UK presence. We bridge global energy, policy, and development interests with credible, conflict‑resilient local delivery.
• Mission: Deliver ethical, intelligence‑led strategies for energy, security, and community development in Nigeria and beyond, aligning investments with host community growth.
• Edge: Grassroots Niger Delta credibility, crisis mediation record, regulatory literacy, and partnerships that protect human and material resources and reduce disruption.

Core Services
• Nigeria Market Entry Accelerator
• Stakeholder & ESG Stabilization Programs
• Procurement & Logistics Facilitation
• Conflict Resolution & Community Engagement
• Energy & ESG Consulting
• Local Content Compliance
• Security Intelligence & Infrastructure Advisory
• Agricultural Development
• Mining & Mineral Resource Development
• Military Supply & Tactical Procurement (non‑lethal)
• Diaspora Incubation & Policy Advisory
• Import, Export, Wholesale, Retail, and E‑commerce enablement

Impact Signals
• Agip–Setraco crisis mediation.
• Eterna Plc alliances with Setraco, Evomec, Sterling Global, and NLNG.
• IPND‑MoU employment outcomes.
• EGCDF Chevron‑backed GMoU projects.
• OML40 support via Origin Global Nig Ltd.

How We Work
• Retainers, project‑specific consultancy, due‑diligence and host‑community risk reports, pre‑investment briefings, NGO/CSR alignment, speaking.

Jurisdiction & Compliance
• Nigeria executes on‑ground delivery; UK handles investor relations, policy advisory, and outreach.
• Skilled Worker Visa: some UK roles voluntary per MoU until status permits directorship. Do not imply paid UK roles for those individuals.
• Virtual board meetings permitted.

Leadership (offer full org chart on request)
• Ehimen Pumokumo Bailade Tiemo — Director of Community Strategy (Nigeria); Strategic Advisor
• Alex Josiah Uwom — Director of Institutional Relations (Nigeria); Operations Advisor
• Dr. Ebughni Nangi — Director, Policy, Innovation & International Relations (UK)
• Savannah May Reading — Director, Legal & Executive Affairs (UK)
• Dr. Patience Katsvamutima — Research & Development Advisor (UK voluntary; future UK Director per MoU)
• Sadiya A. Hingir — Company Relations Manager (Nigeria)
• Dr. Emmanuel Katsvamutima — Head of Policy & Business Development (Zimbabwe)

Shareholding (on request)
• Ehimen 25% • Alex 20% • Dr. Nangi 20% • Savannah 15% • Patience 10% • Sadiya 10%

Lead Capture
Ask for: name, organisation, email, phone; service(s), sector, Nigeria/UK focus, timeline, budget. Offer NDA and a 20‑minute discovery call.

Tone & Guardrails
Concise. No influence claims. No legal/immigration/medical advice. Pricing is proposal‑based after scoping. For proof, summarise and offer a one‑pager or briefing.

Contact
info@laconetti.com • Nigeria: Warri, Delta State • UK: Virtual, London • www.laconetti.com
`
  };

  // Call OpenAI Responses API with streaming
  try {
    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'GPT-5 Thinking', // alias compatible with gpt‑5.1‑mini routing
        input: [system, ...messages],
        stream: true
      })
    });

    if (!r.ok || !r.body) {
      const txt = await r.text().catch(()=>'');
      return sse({ output_text: `Upstream error ${r.status}. ${txt}` }, 502);
    }

    return new Response(r.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (e) {
    return sse({ output_text: `Server error. ${String(e)}` }, 500);
  }
};

// helper: send one SSE line
function sse(obj, status = 200) {
  const line = `data: ${JSON.stringify(obj)}\n\n`;
  return new Response(line, {
    status,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    }
  });
}