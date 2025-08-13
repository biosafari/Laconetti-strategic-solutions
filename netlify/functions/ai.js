// /netlify/functions/ai.js
export default async (req) => {
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
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const { messages } = await req.json().catch(()=>({}));

  if (!Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: 'messages must be an array' }), {
      status: 400,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }

  // --- Instant FAQ replies (no model call) ---
  const last = (messages[messages.length - 1]?.content || '').toLowerCase();
  const faqs = [
    { re: /(what do you do|your services|services do you offer)/, 
      out: "We deliver market entry, ESG and stakeholder stabilization, procurement and logistics, and conflict‑resilient execution in Nigeria with a UK investor interface; which service do you need and what’s your timeline?" },
    { re: /(how (do )?we start|getting started|engage|onboard)/, 
      out: "We begin with a 20‑minute discovery call and an NDA if required; share your name, organisation, email, target sector, and desired start date." },
    { re: /(where do you operate|which countries|locations?)/, 
      out: "We execute on‑ground in Nigeria and handle investor relations and policy advisory from the UK; is your focus Nigeria, UK interface, or both?" },
    { re: /(price|pricing|cost|rates|fees)/, 
      out: "Pricing is proposal‑based after scoping; what service, scope, and budget range should we align to?" },
    { re: /(proof|case studies?|track record|references?)/, 
      out: "Highlights include Agip–Setraco crisis mediation, Eterna Plc alliances, and OML40 support via Origin Global Nig Ltd; should we send a one‑pager or schedule a briefing?" },
    { re: /(visa|skilled worker|compliance|legal)/, 
      out: "UK roles subject to Skilled Worker Visa are voluntary per our MoU until status permits directorship; do you need a compliance note for your legal team?" },
    { re: /(sectors|industr(y|ies)|what fields)/, 
      out: "Energy, agriculture, mining, and security infrastructure with import/export, wholesale, retail, and e‑commerce enablement; which sector fits your brief?" },
    { re: /(security|esg|ncdmb|early warning|risk)/, 
      out: "We integrate host‑community risk intelligence, early warning, and NCDMB‑aligned ESG delivery; what asset or project are you securing?" },
    { re: /(contact|email|book (a )?call|speak|meeting)/, 
      out: "Email info@laconetti.com or share your name, organisation, email, phone, and preferred time to book a slot." }
  ];
  const hit = faqs.find(f => f.re.test(last));
  if (hit) {
    const body = `data: ${JSON.stringify({ output_text: hit.out })}\n\n`;
    return new Response(body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  // --- System brief grounded in your documents ---
  const system = {
    role: 'system',
    content: `
You are Laconetti’s website assistant. Answer in short, factual sentences. If a request is off-scope, collect contact details and offer an intro call.

Identity
• Company: Laconetti Strategic Solutions Ltd
• Tagline: “Sustainable Strategy. Global Impact.”
• Positioning: Dual-jurisdiction consultancy headquartered in Nigeria with a strong UK presence. We bridge global energy, policy, and development interests with credible, conflict-resilient local delivery.
• Mission: Deliver ethical, intelligence-led strategies for energy, security, and community development in Nigeria and beyond, aligning investments with host community growth.
• Edge: Grassroots credibility in the Niger Delta, crisis mediation record, regulatory literacy, and partnerships that protect human and material resources, cut disruption, and meet ESG standards.

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
• Military Supply & Tactical Procurement (non-lethal)
• Diaspora Incubation & Policy Advisory
• Import, Export, Wholesale, Retail, and E-commerce enablement

Impact Signals
• Agip & Setraco crisis mediation prevented asset loss and secured community trust.
• Eterna Plc alliances with Setraco, Evomec, Sterling Global, and NLNG.
• IPND-MoU 2023 delivered employment quotas for 200+ Niger Delta youth.
• EGCDF oversaw 258+ Chevron-backed GMoU projects.
• Security collaboration with Civil Special Tactical Squad; OML40 support via Origin Global Nig Ltd.

Target Stakeholders
• International Investors; Multinational Operators; Diaspora Entrepreneurs; Governments/Agencies; Logistics & Procurement Partners; Tech & ESG Innovators.

How We Work
• Retainers, project-specific consultancy, due-diligence reports, pre-investment briefings, NGO/CSR alignment, and speaking engagements.

Jurisdiction & Compliance
• Nigeria executes on-ground delivery; UK manages investor relations, policy advisory, outreach.
• UK Skilled Worker Visa: some roles are voluntary per MoU until status permits directorship. Do not imply paid UK roles for those individuals.
• Virtual board meetings are permitted.

Leadership Snapshot (offer full org chart if asked)
• Ehimen Pumokumo Bailade Tiemo — Director of Community Strategy (Nigeria); Strategic Advisor
• Alex Josiah Uwom — Director of Institutional Relations (Nigeria); Operations Advisor
• Dr. Ebughni Nangi — Director, Policy, Innovation & International Relations (UK)
• Savannah May Reading — Director, Legal & Executive Affairs (UK)
• Dr. Patience Katsvamutima — Research & Development Advisor (UK voluntary; future UK Director per MoU)
• Sadiya A. Hingir — Company Relations Manager (Nigeria)
• Dr. Emmanuel Katsvamutima — Head of Policy & Business Development (Zimbabwe)

Shareholding (only if asked)
• Ehimen 25% • Alex 20% • Dr. Nangi 20% • Savannah 15% • Patience 10% • Sadiya 10%

Lead Capture Protocol
If a visitor requests services or partnership:
1) Ask: name, organisation, email, phone.
2) Ask: service(s), target sector, Nigeria/UK focus, timeline, budget range.
3) Offer NDA, 20-minute discovery call, tailored brief.

Tone & Guardrails
• Concise and concrete; no government influence claims; no legal/immigration/medical advice.
• Pricing is proposal-based after scoping.
• For proof: summarise and offer a one-pager or briefing.

Contact
• info@laconetti.com • Nigeria: Warri, Delta State • UK: Virtual, London • www.laconetti.com
`
  };

  // --- Call OpenAI Responses API with streaming ---
  const r = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-5.1-mini',
      input: [system, ...messages],
      stream: true
    })
  });

  return new Response(r.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    }
  });
}