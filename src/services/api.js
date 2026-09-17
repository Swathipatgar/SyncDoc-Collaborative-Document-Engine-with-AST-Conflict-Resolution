const API_BASE = "/api";

const getHeaders = (token) => {
  const authToken = token || localStorage.getItem("syncdoc_token");
  const headers = {
    "Content-Type": "application/json",
  };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  return headers;
};

const handleResponse = async (res) => {
  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const clone = res.clone();
      try {
        const data = await res.json();
        errorMsg = data.message || errorMsg;
      } catch {
        const text = await clone.text();
        if (text && (text.includes("ECONNREFUSED") || text.includes("proxy error") || text.includes("Bad Gateway"))) {
          errorMsg = "Backend server is offline. Please ensure the backend is running on port 5000.";
        }
      }
    } catch {
      // fallback
    }
    if (res.status === 500 && errorMsg === "HTTP Error 500") {
      errorMsg = "Backend connection failed. Please ensure the backend server is running on port 5000.";
    }
    throw new Error(errorMsg);
  }
  return res.json();
};

export const api = {
  auth: {
    login: async (email, password) => {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      return handleResponse(res);
    },

    register: async (name, email, password) => {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      return handleResponse(res);
    },

    getMe: async () => {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },

    getUsers: async () => {
      const res = await fetch(`${API_BASE}/auth/users`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },
  },

  documents: {
    getAll: async () => {
      const res = await fetch(`${API_BASE}/documents`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },

    getById: async (id) => {
      const res = await fetch(`${API_BASE}/documents/${id}`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },

    create: async ({ title, content }) => {
      const res = await fetch(`${API_BASE}/documents`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ title, content }),
      });
      return handleResponse(res);
    },

    update: async (id, { content }) => {
      const res = await fetch(`${API_BASE}/documents/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ content }),
      });
      return handleResponse(res);
    },

    delete: async (id) => {
      const res = await fetch(`${API_BASE}/documents/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      return handleResponse(res);
    },

    share: async (id, { collaboratorId, permission = "write" }) => {
      const res = await fetch(`${API_BASE}/documents/${id}/share`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ collaboratorId, permission }),
      });
      return handleResponse(res);
    },

    removeCollaborator: async (id, collaboratorId) => {
      const res = await fetch(`${API_BASE}/documents/${id}/collaborators/${collaboratorId}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      return handleResponse(res);
    },

    getVersions: async (id) => {
      const res = await fetch(`${API_BASE}/documents/${id}/versions`, {
        headers: getHeaders(),
      });
      return handleResponse(res);
    },

    exportHtml: async (id, filename = "document.html") => {
      const res = await fetch(`${API_BASE}/documents/${id}/export/html`, {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("Failed to export HTML");
      const htmlText = await res.text();
      const blob = new Blob([htmlText], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },

    exportPdf: async (id, filename = "document.pdf") => {
      const res = await fetch(`${API_BASE}/documents/${id}/export/pdf`, {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("Failed to export PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
  },
};
