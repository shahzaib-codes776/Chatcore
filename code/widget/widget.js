(function () {
  const script = document.currentScript;
  const businessId = script.getAttribute("data-business");
  const API_BASE = "http://localhost:5000/api";

  if (!businessId) {
    console.error(
      "ChatCore widget: missing data-business attribute on script tag.",
    );
    return;
  }

  let visitorName = "";
  let visitorEmail = "";
  let leadCaptured = false;

  const style = document.createElement("style");
  style.textContent = `
    #chatcore-bubble {
      position: fixed; bottom: 20px; right: 20px;
      width: 56px; height: 56px; border-radius: 50%;
      background: #14E8B4; border: none; cursor: pointer;
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
      background: #14E8B4; color: #0B0E14; padding: 12px 14px;
      font-weight: 600; font-size: 14px;
    }
    #chatcore-messages {
      flex: 1; padding: 12px; overflow-y: auto;
      display: flex; flex-direction: column; gap: 8px;
    }
    .chatcore-msg { max-width: 85%; padding: 8px 12px; border-radius: 10px; font-size: 13px; line-height: 1.4; }
    .chatcore-msg.bot { background: #191D27; color: #F7F9FA; border-bottom-left-radius: 2px; align-self: flex-start; }
    .chatcore-msg.user { background: #0FA383; color: #fff; border-bottom-right-radius: 2px; align-self: flex-end; }
    #chatcore-input-row { display: flex; border-top: 1px solid #232733; padding: 8px; gap: 6px; }
    #chatcore-input {
      flex: 1; background: #0B0E14; border: 1px solid #232733; border-radius: 8px;
      padding: 8px 10px; color: #F7F9FA; font-size: 13px; outline: none;
    }
    #chatcore-send {
      background: #14E8B4; border: none; border-radius: 8px; padding: 8px 12px;
      font-weight: 600; font-size: 13px; cursor: pointer; color: #0B0E14;
    }
    #chatcore-lead-form { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
    #chatcore-lead-form p { color: #F7F9FA; font-size: 13px; margin-bottom: 4px; }
    #chatcore-lead-form input {
      background: #0B0E14; border: 1px solid #232733; border-radius: 8px;
      padding: 8px 10px; color: #F7F9FA; font-size: 13px; outline: none;
    }
    #chatcore-lead-form button {
      background: #14E8B4; border: none; border-radius: 8px; padding: 9px;
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

  function addMessage(text, sender) {
    const div = document.createElement("div");
    div.className = `chatcore-msg ${sender}`;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  bubble.addEventListener("click", () => {
    win.classList.toggle("open");
  });

  startBtn.addEventListener("click", () => {
    visitorName = nameInput.value.trim();
    visitorEmail = emailInput.value.trim();
    leadCaptured = true;

    leadForm.style.display = "none";
    messagesEl.style.display = "flex";
    inputRow.style.display = "flex";

    addMessage("Hi! Ask me anything about this business.", "bot");
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
        }),
      });
      const data = await res.json();
      addMessage(data.reply || "Sorry, something went wrong.", "bot");
    } catch (err) {
      addMessage("Sorry, I couldn't connect right now.", "bot");
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });
})();
