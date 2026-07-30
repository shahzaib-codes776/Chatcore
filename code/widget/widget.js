(function () {
  const script = document.currentScript;
  const businessId = script.getAttribute("data-business");
  const API_BASE = "https://chatcore-production-1b02.up.railway.app/api";

  if (!businessId) {
    console.error(
      "ChatCore widget: missing data-business attribute on script tag.",
    );
    return;
  }

  let visitorName = "";
  let visitorEmail = "";
  let widgetColor = "#14E8B4";
  let welcomeMessage = "Hi! Ask me anything about this business.";
  let conversationId = null;
  let knownMessageCount = 0;
  let pollTimer = null;

  const style = document.createElement("style");
  style.textContent = `
    #chatcore-bubble {
      position: fixed; bottom: 20px; right: 20px;
      width: 56px; height: 56px; border-radius: 50%;
      border: none; cursor: pointer;
      box-shadow: 0 4px 16px rgba(0,0,0,0.25);
      display: flex; align-items: center; justify-content: center;
      z-index: 999999; font-size: 24px;
    }
    #chatcore-window {
      position: fixed; bottom: 88px; right: 20px;
      width: 320px; height: 440px;
      background: #12151D; border: 1px solid #232733; border-radius: 14px;
      display: none; flex-direction: column; overflow: hidden;
      font-family: Inter, sans-serif;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      z-index: 999999;
    }
    #chatcore-window.open { display: flex; }
    #chatcore-header {
      color: #0B0E14; padding: 12px 14px;
      font-weight: 600; font-size: 14px;
    }
    #chatcore-messages {
      flex: 1; padding: 12px; overflow-y: auto;
      display: flex; flex-direction: column; gap: 8px;
    }
    .chatcore-msg { max-width: 85%; padding: 8px 12px; border-radius: 10px; font-size: 13px; line-height: 1.4; }
    .chatcore-msg.bot { background: #191D27; color: #F7F9FA; border-bottom-left-radius: 2px; align-self: flex-start; }
    .chatcore-msg.business { background: #2A2140; color: #F7F9FA; border-bottom-left-radius: 2px; align-self: flex-start; border: 1px solid #7C5CFA; }
    .chatcore-msg.business .chatcore-label { color: #B79CFF; }
    .chatcore-msg.user { color: #fff; border-bottom-right-radius: 2px; align-self: flex-end; }
    .chatcore-label { font-size: 9px; text-transform: uppercase; opacity: 0.7; margin-bottom: 3px; display: block; }
    #chatcore-input-row { display: flex; border-top: 1px solid #232733; padding: 8px; gap: 6px; }
    #chatcore-input {
      flex: 1; background: #0B0E14; border: 1px solid #232733; border-radius: 8px;
      padding: 8px 10px; color: #F7F9FA; font-size: 13px; outline: none;
    }
    #chatcore-send {
      border: none; border-radius: 8px; padding: 8px 12px;
      font-weight: 600; font-size: 13px; cursor: pointer; color: #0B0E14;
    }
    #chatcore-lead-form { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
    #chatcore-lead-form p { color: #F7F9FA; font-size: 13px; margin-bottom: 4px; }
    #chatcore-lead-form input {
      background: #0B0E14; border: 1px solid #232733; border-radius: 8px;
      padding: 8px 10px; color: #F7F9FA; font-size: 13px; outline: none;
    }
    #chatcore-lead-form button {
      border: none; border-radius: 8px; padding: 9px;
      font-weight: 600; font-size: 13px; cursor: pointer; color: #0B0E14;
    }
  `;
  document.head.appendChild(style);

  const bubble = document.createElement("button");
  bubble.id = "chatcore-bubble";
  bubble.innerHTML = "&#128172;";

  const win = document.createElement("div");
  win.id = "chatcore-window";
  win.innerHTML = `
    <div id="chatcore-header">Chat with us</div>
    <div id="chatcore-lead-form">
      <p>Before we start, who are we chatting with?</p>
      <input id="chatcore-name" placeholder="Your name" />
      <input id="chatcore-email" placeholder="Your email" />
      <button id="chatcore-start">Start chat</button>
    </div>
    <div id="chatcore-messages" style="display:none;"></div>
    <div id="chatcore-input-row" style="display:none;">
      <input id="chatcore-input" placeholder="Type a message..." />
      <button id="chatcore-send">Send</button>
    </div>
  `;

  document.body.appendChild(bubble);
  document.body.appendChild(win);

  const leadForm = win.querySelector("#chatcore-lead-form");
  const messagesEl = win.querySelector("#chatcore-messages");
  const inputRow = win.querySelector("#chatcore-input-row");
  const inputEl = win.querySelector("#chatcore-input");
  const sendBtn = win.querySelector("#chatcore-send");
  const nameInput = win.querySelector("#chatcore-name");
  const emailInput = win.querySelector("#chatcore-email");
  const startBtn = win.querySelector("#chatcore-start");
  const headerEl = win.querySelector("#chatcore-header");

  function applyColor(color) {
    bubble.style.background = color;
    headerEl.style.background = color;
    sendBtn.style.background = color;
    startBtn.style.background = color;
    document
      .querySelectorAll(".chatcore-msg.user")
      .forEach((el) => (el.style.background = color));
  }

  fetch(`${API_BASE}/chat/${businessId}/config`)
    .then((res) => res.json())
    .then((data) => {
      if (data.widget_color) {
        widgetColor = data.widget_color;
        applyColor(widgetColor);
      }
      if (data.welcome_message) {
        welcomeMessage = data.welcome_message;
      }
    })
    .catch(() => applyColor(widgetColor));

  applyColor(widgetColor);

  function addMessage(text, sender) {
    const div = document.createElement("div");
    div.className = `chatcore-msg ${sender}`;
    if (sender === "business") {
      const label = document.createElement("span");
      label.className = "chatcore-label";
      label.textContent = "Business owner";
      div.appendChild(label);
      div.appendChild(document.createTextNode(text));
    } else {
      div.textContent = text;
    }
    if (sender === "user") div.style.background = widgetColor;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  bubble.addEventListener("click", () => {
    win.classList.toggle("open");
  });

  startBtn.addEventListener("click", () => {
    visitorName = nameInput.value.trim();
    visitorEmail = emailInput.value.trim();

    leadForm.style.display = "none";
    messagesEl.style.display = "flex";
    inputRow.style.display = "flex";

    addMessage(welcomeMessage, "bot");
    knownMessageCount = 1; // welcome message counts locally, not from server yet
  });

  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;
    addMessage(text, "user");
    inputEl.value = "";

    try {
      const res = await fetch(`${API_BASE}/chat/${businessId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          name: visitorName,
          email: visitorEmail,
          conversationId,
        }),
      });
      const data = await res.json();
      addMessage(
        data.reply || data.error || "Sorry, something went wrong.",
        "bot",
      );

      if (data.conversationId) {
        conversationId = data.conversationId;
        startPolling();
      }
    } catch (err) {
      addMessage("Sorry, I couldn't connect right now.", "bot");
    }
  }

  function startPolling() {
    if (pollTimer) return; // already polling
    pollTimer = setInterval(async () => {
      if (!conversationId) return;
      try {
        const res = await fetch(
          `${API_BASE}/chat/${businessId}/conversation/${conversationId}/messages`,
        );
        const data = await res.json();
        if (data.messages && data.messages.length > knownMessageCount) {
          const newOnes = data.messages.slice(knownMessageCount);
          newOnes.forEach((m) => {
            if (m.sender === "business") {
              addMessage(m.content, "business");
            }
          });
          knownMessageCount = data.messages.length;
        }
      } catch (err) {
        // silently ignore poll errors
      }
    }, 5000); // check every 5 seconds
  }

  sendBtn.addEventListener("click", sendMessage);
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });
})();
