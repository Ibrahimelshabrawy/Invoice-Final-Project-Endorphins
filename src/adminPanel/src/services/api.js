/**
 * Endorphins Invoicing API Client
 * Connects to the real backend endpoints under /api/invoicing/*
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/invoicing';
const TOKEN_KEY = 'endorphins_admin_token';

export const getStoredToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch (e) {
    return '';
  }
};

export const setStoredToken = (token) => {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (e) {
    console.error('Failed to update local storage token', e);
  }
};

/**
 * Universal request wrapper for all /api/invoicing endpoints
 */
export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers = {
    'Accept': 'application/json',
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  };

  const token = getStoredToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `admin ${token}`;
  }

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkError) {
    throw new Error('Unable to connect to Endorphins API server. Please ensure the backend is running on port 3000.');
  }

  // Handle unauthorized
  if (response.status === 401) {
    setStoredToken('');
    // Dispatch custom event so React AuthContext can react without full page reload
    window.dispatchEvent(new CustomEvent('endorphins:unauthorized'));
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Session expired. Please log in again.');
  }

  // Handle PDF stream or blob response if requested
  if (options.responseType === 'blob') {
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `Download failed with HTTP ${response.status}`);
    }
    const blob = await response.blob();
    return {
      blob,
      tempPdfId: response.headers.get('X-Temp-Pdf-Id') || '',
      expiresAt: response.headers.get('X-Temp-Pdf-Expires-At') || '',
      expiresInSeconds: response.headers.get('X-Temp-Pdf-Expires-In-Seconds') || '',
    };
  }

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    let errorMsg = result.message || `Request failed with HTTP status ${response.status}`;
    if (Array.isArray(result.errors) && result.errors.length > 0) {
      const fieldErrors = result.errors.map(err => `${err.path || err.key || 'Field'}: ${err.message}`).join(', ');
      errorMsg = `${errorMsg} (${fieldErrors})`;
    }
    const err = new Error(errorMsg);
    err.status = response.status;
    err.errors = result.errors;
    throw err;
  }

  return result;
}

// ==========================================
// Authentication APIs
// ==========================================
export const authApi = {
  login: async ({ password }) => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    if (res.data?.access_token) {
      setStoredToken(res.data.access_token);
    }
    return res.data;
  },
  me: async () => {
    const res = await apiRequest('/auth/me', { method: 'GET' });
    return res.data;
  },
  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      setStoredToken('');
    }
  },
};

// ==========================================
// Categories & Subcategories APIs
// ==========================================
export const categoryApi = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.isActive !== undefined) query.set('isActive', String(params.isActive));
    const res = await apiRequest(`/categories${query.toString() ? `?${query}` : ''}`, { method: 'GET' });
    return res.data || [];
  },
  getById: async (id) => {
    const res = await apiRequest(`/categories/${id}`, { method: 'GET' });
    return res.data;
  },
  create: async (data) => {
    const res = await apiRequest('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },
  update: async (id, data) => {
    const res = await apiRequest(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.data;
  },
  activate: async (id) => {
    const res = await apiRequest(`/categories/${id}/activate`, { method: 'PATCH' });
    return res.data;
  },
  deactivate: async (id) => {
    const res = await apiRequest(`/categories/${id}/deactivate`, { method: 'PATCH' });
    return res.data;
  },
  delete: async (id) => {
    const res = await apiRequest(`/categories/${id}`, { method: 'DELETE' });
    return res;
  },

  // Subcategories
  getAllSubcategories: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.categoryId) query.set('categoryId', String(params.categoryId));
    if (params.isActive !== undefined) query.set('isActive', String(params.isActive));
    const res = await apiRequest(`/categories/subcategories${query.toString() ? `?${query}` : ''}`, { method: 'GET' });
    return res.data || [];
  },
  getSubcategoriesByCategory: async (categoryId) => {
    const res = await apiRequest(`/categories/${categoryId}/subcategories`, { method: 'GET' });
    return res.data || [];
  },
  createSubcategory: async (categoryId, data) => {
    const res = await apiRequest(`/categories/${categoryId}/subcategories`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },
};

// ==========================================
// Services APIs
// ==========================================
export const serviceApi = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.categoryId) query.set('categoryId', String(params.categoryId));
    if (params.subcategoryId) query.set('subcategoryId', String(params.subcategoryId));
    if (params.isActive !== undefined && params.isActive !== '') query.set('isActive', String(params.isActive));
    if (params.unitType) query.set('unitType', params.unitType);
    if (params.search) query.set('search', params.search);
    const res = await apiRequest(`/services${query.toString() ? `?${query}` : ''}`, { method: 'GET' });
    return res.data || [];
  },
  getById: async (id) => {
    const res = await apiRequest(`/services/${id}`, { method: 'GET' });
    return res.data;
  },
  create: async (data) => {
    const res = await apiRequest('/services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },
  update: async (id, data) => {
    const res = await apiRequest(`/services/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.data;
  },
  activate: async (id) => {
    const res = await apiRequest(`/services/${id}/activate`, { method: 'PATCH' });
    return res.data;
  },
  deactivate: async (id) => {
    const res = await apiRequest(`/services/${id}/deactivate`, { method: 'PATCH' });
    return res.data;
  },
  delete: async (id) => {
    const res = await apiRequest(`/services/${id}`, { method: 'DELETE' });
    return res;
  },
};

// ==========================================
// Bundles APIs
// ==========================================
export const bundleApi = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.isActive !== undefined && params.isActive !== '') query.set('isActive', String(params.isActive));
    if (params.search) query.set('search', params.search);
    const res = await apiRequest(`/bundles${query.toString() ? `?${query}` : ''}`, { method: 'GET' });
    return res.data || [];
  },
  getById: async (id) => {
    const res = await apiRequest(`/bundles/${id}`, { method: 'GET' });
    return res.data;
  },
  create: async (data) => {
    const res = await apiRequest('/bundles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },
  update: async (id, data) => {
    const res = await apiRequest(`/bundles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.data;
  },
  activate: async (id) => {
    const res = await apiRequest(`/bundles/${id}/activate`, { method: 'PATCH' });
    return res.data;
  },
  deactivate: async (id) => {
    const res = await apiRequest(`/bundles/${id}/deactivate`, { method: 'PATCH' });
    return res.data;
  },
  delete: async (id) => {
    const res = await apiRequest(`/bundles/${id}`, { method: 'DELETE' });
    return res;
  },
};

// ==========================================
// Clients APIs
// ==========================================
export const clientApi = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.name) query.set('name', params.name);
    if (params.company) query.set('company', params.company);
    if (params.email) query.set('email', params.email);
    if (params.phone) query.set('phone', params.phone);
    if (params.taxNumber) query.set('taxNumber', params.taxNumber);
    const res = await apiRequest(`/clients${query.toString() ? `?${query}` : ''}`, { method: 'GET' });
    return res.data || [];
  },
  getById: async (id) => {
    const res = await apiRequest(`/clients/${id}`, { method: 'GET' });
    return res.data;
  },
  create: async (data) => {
    const res = await apiRequest('/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },
  update: async (id, data) => {
    const res = await apiRequest(`/clients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.data;
  },
  delete: async (id) => {
    const res = await apiRequest(`/clients/${id}`, { method: 'DELETE' });
    return res;
  },
};

// ==========================================
// Taxes APIs
// ==========================================
export const taxApi = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.isActive !== undefined && params.isActive !== '') query.set('isActive', String(params.isActive));
    if (params.search) query.set('search', params.search);
    const res = await apiRequest(`/taxes${query.toString() ? `?${query}` : ''}`, { method: 'GET' });
    return res.data || [];
  },
  getById: async (id) => {
    const res = await apiRequest(`/taxes/${id}`, { method: 'GET' });
    return res.data;
  },
  create: async (data) => {
    const res = await apiRequest('/taxes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },
  update: async (id, data) => {
    const res = await apiRequest(`/taxes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.data;
  },
  activate: async (id) => {
    const res = await apiRequest(`/taxes/${id}/activate`, { method: 'PATCH' });
    return res.data;
  },
  deactivate: async (id) => {
    const res = await apiRequest(`/taxes/${id}/deactivate`, { method: 'PATCH' });
    return res.data;
  },
  delete: async (id) => {
    const res = await apiRequest(`/taxes/${id}`, { method: 'DELETE' });
    return res;
  },
};

// ==========================================
// Invoices APIs
// ==========================================
export const invoiceApi = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.invoiceNumber) query.set('invoiceNumber', params.invoiceNumber);
    if (params.clientId) query.set('clientId', String(params.clientId));
    if (params.status) query.set('status', params.status);
    if (params.date) query.set('date', params.date);
    if (params.issueDate) query.set('issueDate', params.issueDate);
    if (params.dueDate) query.set('dueDate', params.dueDate);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.dueStartDate) query.set('dueStartDate', params.dueStartDate);
    if (params.dueEndDate) query.set('dueEndDate', params.dueEndDate);

    const res = await apiRequest(`/invoices${query.toString() ? `?${query}` : ''}`, { method: 'GET' });
    return {
      items: res.data || [],
      pagination: res.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 },
    };
  },
  getById: async (id) => {
    const res = await apiRequest(`/invoices/${id}`, { method: 'GET' });
    return res.data;
  },
  create: async (data) => {
    const res = await apiRequest('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },
  update: async (id, data) => {
    const res = await apiRequest(`/invoices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.data;
  },
  updateStatus: async (id, status) => {
    const res = await apiRequest(`/invoices/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res;
  },
  cancel: async (id) => {
    const res = await apiRequest(`/invoices/${id}/cancel`, { method: 'POST' });
    return res;
  },
  delete: async (id) => {
    const res = await apiRequest(`/invoices/${id}`, { method: 'DELETE' });
    return res;
  },

  // PDF Preview & Send Flow
  preview: async (id) => {
    const res = await apiRequest(`/invoices/${id}/preview`, { method: 'POST' });
    return res.data; // { tempPdfId, expiresAt, expiresInSeconds, filename, invoiceId }
  },
  downloadPdf: async (id) => {
    return await apiRequest(`/invoices/${id}/pdf`, {
      method: 'GET',
      responseType: 'blob',
    });
  },
  discardPdf: async (id, tempPdfId) => {
    const endpoint = id ? `/invoices/${id}/discard` : '/invoices/discard';
    const res = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({ tempPdfId }),
    });
    return res.data;
  },
  send: async (id, { tempPdfId, language = 'EN', cc = [] }) => {
    const res = await apiRequest(`/invoices/${id}/send`, {
      method: 'POST',
      body: JSON.stringify({
        tempPdfId,
        language,
        ...(cc && cc.length > 0 ? { cc } : {}),
      }),
    });
    return res.data;
  },
  getEmailLogs: async (id) => {
    const res = await apiRequest(`/invoices/${id}/email-logs`, { method: 'GET' });
    return res.data || [];
  },
};

// ==========================================
// Email Logs & Retry APIs
// ==========================================
export const emailLogApi = {
  retry: async (logId, { tempPdfId, language = 'EN' }) => {
    const res = await apiRequest(`/email-logs/${logId}/retry`, {
      method: 'POST',
      body: JSON.stringify({ tempPdfId, language }),
    });
    return res.data;
  },
};
