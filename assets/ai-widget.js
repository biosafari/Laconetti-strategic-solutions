(function () {
  const styleLink = document.createElement("link");
  styleLink.rel = "stylesheet";
  styleLink.href = "/assets/ai-widget.css";
  document.head.appendChild(styleLink);

  const bubble = document.createElement("button");
  bubble.id = "laco-ai-bubble";
  bubble.textContent = "Chat";
  document.body.appendChild(bubble);

  const panel = document.createElement("div");
  panel.id = "laco-ai-panel";
  panel.innerHTML = `
    <div class="laco-ai-header">Laconetti Assistant</div>
    <div id="laco-ai-log"></div>
    <form id="laco-ai-form">
      <input id="laco-ai-input" placeholder="Type your question…" autocomplete="off"/>
      <button type="submit">Send</button>
    </form>`;
  document.body.appendChild(panel);

  let open = false;
  bubble.addEventListener("click", () => {
    open = !open;
    panel.style.display = open ? "flex" : "none";
  });

  const log = panel.querySelector("#laco-ai-log");
  const form = panel.querySelector("#laco-ai-form");
  const input = panel.querySelector("#laco-ai-input");

  function add(role, text) {
    const div = document.createElement("div");
    div.className = `msg ${role}`;
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  const history = [
    { role: "system", content: "You are Laconetti’s website assistant. Answer concisely." }
  ];

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    add("user", text);
    history.push({ role: "user", content: text });
    add("assistant", "…");

    try {
      const r = await fetch("/.netlify/functions/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history })
      });
      const j = await r.json();
      const last = log.querySelector(".msg.assistant:last-child");
      last.textContent = j.reply || "No response.";
      history.push({ role: "assistant", content: j.reply || "" });
    } catch (err) {
      const last = log.querySelector(".msg.assistant:last-child");
      last.textContent = "Error. Try again.";
    }
  });
})();