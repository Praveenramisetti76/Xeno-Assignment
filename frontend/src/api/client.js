const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

async function fetchJson(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    data = { error: 'Failed to parse JSON response' };
  }

  if (!response.ok) {
    throw new Error(data.error || response.statusText || 'API Request failed');
  }

  return data;
}

export const api = {
  customers: {
    getAll: () => fetchJson('/customers'),
    getDetail: (id) => fetchJson(`/customers/${id}`),
    seed: () => fetchJson('/customers/seed', { method: 'POST' }),
  },
  segments: {
    preview: (filter) => fetchJson('/segments/preview', {
      method: 'POST',
      body: JSON.stringify({ filter }),
    }),
    aiSuggest: (prompt) => fetchJson('/segments/ai-suggest', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),
  },
  campaigns: {
    getAll: () => fetchJson('/campaigns'),
    getDetail: (id) => fetchJson(`/campaigns/${id}`),
    create: (campaign) => fetchJson('/campaigns', {
      method: 'POST',
      body: JSON.stringify(campaign),
    }),
    send: (id) => fetchJson(`/campaigns/${id}/send`, { method: 'POST' }),
    draftMessage: (prompt, channel) => fetchJson('/campaigns/draft-message', {
      method: 'POST',
      body: JSON.stringify({ prompt, channel }),
    }),
  },
};
