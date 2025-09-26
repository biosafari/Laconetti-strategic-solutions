/* Laconetti core UI: theme + chart (Chart.js v4) */
(() => {
  const THEME_KEY = "laconetti:theme";

  // ---- Theme ---------------------------------------------------------------
  const getSystemTheme = () =>
    window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark" : "light";

  const readTheme = () => {
    try { return localStorage.getItem(THEME_KEY) || ""; } catch { return ""; }
  };

  const writeTheme = (v) => {
    try { localStorage.setItem(THEME_KEY, v); } catch {}
  };

  const applyTheme = (t) => {
    const theme = t || readTheme() || getSystemTheme();
    document.documentElement.setAttribute("data-theme", theme);
    const btn = document.getElementById("themeToggle");
    if (btn) {
      btn.setAttribute("aria-pressed", String(theme === "dark"));
      btn.title = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
      btn.textContent = theme === "dark" ? "☀️" : "🌙";
    }
    return theme;
  };

  // Apply ASAP to avoid flash
  applyTheme();

  const onToggleTheme = () => {
    const next = (document.documentElement.getAttribute("data-theme") === "dark") ? "light" : "dark";
    applyTheme(next);
    writeTheme(next);
  };

  // ---- Chart ---------------------------------------------------------------
  const initMarketChart = () => {
    const el = document.getElementById("marketChart");
    if (!el || typeof Chart === "undefined") return;

    const css = getComputedStyle(document.documentElement);
    const cText   = css.getPropertyValue("--text-primary").trim()   || "#eaeaea";
    const cAxis   = css.getPropertyValue("--muted").trim()          || "#8aa0b4";
    const cBar    = css.getPropertyValue("--accent").trim()         || "#DAA520";
    const cBarAlt = css.getPropertyValue("--accent-secondary").trim() || "#003366";
    const ctx = el.getContext("2d");

    // gradient aligned with brand
    const grad = ctx.createLinearGradient(0, 0, 0, el.height);
    grad.addColorStop(0, cBar);
    grad.addColorStop(1, cBarAlt);

    new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Energy", "Agriculture", "Mining", "Procurement"],
        datasets: [{
          label: "Market Share (%)",
          data: [35, 25, 20, 20],
          backgroundColor: grad,
          borderWidth: 0,
          borderRadius: 8,
          maxBarThickness: 48
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600, easing: "easeOutQuart" },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: cBarAlt,
            titleColor: cText,
            bodyColor: cText,
            padding: 12,
            displayColors: false
          },
          title: {
            display: true,
            text: "Market Share by Segment",
            color: cText,
            font: { weight: "600", size: 16 }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: cText, font: { weight: "600" } }
          },
          y: {
            beginAtZero: true,
            grid: { color: cAxis },
            ticks: { color: cText, stepSize: 10 },
            title: { display: true, text: "Percentage", color: cText }
          }
        }
      }
    });
  };

  // ---- Boot ---------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("themeToggle");
    if (btn) btn.addEventListener("click", onToggleTheme);
    initMarketChart();
  });
})();
<script>
async function askLaconetti(message) {
  const r = await fetch('/.netlify/functions/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  const body = JSON.parse(event.body || '{}');

// Accept { messages }, or { message }, or { prompt }
let messages = body.messages;
if (!Array.isArray(messages)) {
  const single = body.message || body.prompt;
  if (!single) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing message(s)' })
    };
  }
  messages = [{ role: 'user', content: String(single) }];
}

// Node 18 on Netlify has global fetch
const resp = await fetch('https://api.openai.com/v1/chat/completions', {
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

const data = await resp.json();

if (!resp.ok) {
  return {
    statusCode: resp.status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: data.error?.message || 'Upstream API error' })
  };
}

const reply =
  data?.choices?.[0]?.message?.content ||
  data?.choices?.[0]?.delta?.content ||
  'No output';

return {
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ reply })
};