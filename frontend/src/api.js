const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...options,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      message = body.message || body.error || message;
    } catch {
      // Keep the HTTP status message when the server does not return JSON.
    }
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const repositoryApi = {
  getRoot() {
    return request("/pfccl");
  },

  getDivisions() {
    return request("/divisions");
  },

  getCompanies(division, year) {
    return request(`/divisions/${encodeURIComponent(division)}/years/${year}/companies`);
  },

  getCompany(companyId) {
    return request(`/companies/${encodeURIComponent(companyId)}`);
  },

  getCompanyDetail(companyId, detailKey) {
    return request(
      `/companies/${encodeURIComponent(companyId)}/details/${encodeURIComponent(detailKey)}`,
    );
  },

  createCompany(payload) {
    return request("/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  updateCompany(companyId, payload) {
    return request(`/companies/${encodeURIComponent(companyId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  deleteCompany(companyId) {
    return request(`/companies/${encodeURIComponent(companyId)}`, {
      method: "DELETE",
    });
  },

  uploadFiles({ companyId, detailKey, field, files }) {
    const formData = new FormData();
    Array.from(files || []).forEach((file) => formData.append("files", file));
    formData.append("field", field);
    formData.append("detailKey", detailKey);

    return request(
      `/companies/${encodeURIComponent(companyId)}/details/${encodeURIComponent(detailKey)}/files`,
      { method: "POST", body: formData },
    );
  },

  deleteFile({ companyId, detailKey, field, fileId }) {
    return request(
      `/companies/${encodeURIComponent(companyId)}/details/${encodeURIComponent(detailKey)}/files/${encodeURIComponent(fileId)}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field }),
      },
    );
  },
};


export const aiApi = {
  async getProviders() {
    const payload = await request('/ai/providers');
    return payload?.data ?? payload;
  },

  async chat(payload) {
    const response = await request('/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return response?.data ?? response;
  },
};

export { API_BASE_URL };
