const API_BASE = "https://chatcore-production-1b02.up.railway.app/api";

function getToken() {
  return localStorage.getItem("chatcore_token");
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Something went wrong.");
  }

  return data;
}

export const api = {
  signup: (name, email, password) =>
    request("/auth/signup", {
      method: "POST",
      body: { name, email, password },
    }),

  login: (email, password) =>
    request("/auth/login", { method: "POST", body: { email, password } }),

  getMe: () => request("/business/me", { auth: true }),

  updateBusinessInfo: (business_info) =>
    request("/business/me", {
      method: "PUT",
      body: { business_info },
      auth: true,
    }),
  getLeads: () => request("/business/leads", { auth: true }),
  getConversations: () => request("/business/conversations", { auth: true }),

  getConversationMessages: (id) =>
    request(`/business/conversations/${id}/messages`, { auth: true }),

  replyToConversation: (id, message) =>
    request(`/business/conversations/${id}/reply`, {
      method: "POST",
      body: { message },
      auth: true,
    }),
  getAnalytics: () => request("/business/analytics", { auth: true }),
  updateBranding: (widget_color, welcome_message) =>
    request("/business/branding", {
      method: "PUT",
      body: { widget_color, welcome_message },
      auth: true,
    }),

  uploadDocument: (file) => {
    const formData = new FormData();
    formData.append("document", file);
    const token = getToken();
    return fetch(`${API_BASE}/business/upload-document`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      return data;
    });
  },
  importWebsite: (url) =>
    request("/business/import-website", {
      method: "POST",
      body: { url },
      auth: true,
    }),
};
