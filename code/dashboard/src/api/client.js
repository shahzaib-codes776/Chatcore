const API_BASE = "http://localhost:5000/api";

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
};
