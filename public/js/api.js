// MiniBase Admin Dashboard API Client

class AdminAPI {
  constructor() {
    this.baseUrl = window.location.origin;
    this.token = localStorage.getItem('minibase_admin_token') || null;
    this.admin = JSON.parse(localStorage.getItem('minibase_admin_user') || 'null');
    this.eventSource = null;
    this.realtimeListeners = new Set();
  }

  setAuth(token, admin) {
    this.token = token;
    this.admin = admin;
    if (token) {
      localStorage.setItem('minibase_admin_token', token);
      localStorage.setItem('minibase_admin_user', JSON.stringify(admin));
    } else {
      localStorage.removeItem('minibase_admin_token');
      localStorage.removeItem('minibase_admin_user');
    }
  }

  clearAuth() {
    this.setAuth(null, null);
  }

  isAuthenticated() {
    return Boolean(this.token);
  }

  async request(path, options = {}) {
    const headers = {
      ...(options.headers || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 401 && this.token) {
        this.clearAuth();
        window.location.reload();
      }
      throw new Error(data.message || `Request failed (${res.status})`);
    }

    return data;
  }

  // Admin Auth
  async hasAdmin() {
    return this.request('/api/admins/has-admin');
  }

  async setup(email, password) {
    const res = await this.request('/api/admins/setup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setAuth(res.token, res.admin);
    return res;
  }

  async login(email, password) {
    const res = await this.request('/api/admins/auth-with-password', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setAuth(res.token, res.admin);
    return res;
  }

  async requestPasswordReset(email) {
    return this.request('/api/admins/request-password-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async confirmPasswordReset(token, password, passwordConfirm) {
    return this.request('/api/admins/confirm-password-reset', {
      method: 'POST',
      body: JSON.stringify({ token, password, passwordConfirm }),
    });
  }

  async getStats() {
    return this.request('/api/admins/stats');
  }

  async getLogs(page = 1, perPage = 50, status = '') {
    let q = `?page=${page}&perPage=${perPage}`;
    if (status) q += `&status=${status}`;
    return this.request(`/api/admins/logs${q}`);
  }

  async clearLogs() {
    return this.request('/api/admins/logs', { method: 'DELETE' });
  }

  async getAdmins() {
    return this.request('/api/admins');
  }

  async createAdmin(email, password) {
    return this.request('/api/admins', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async deleteAdmin(id) {
    return this.request(`/api/admins/${id}`, { method: 'DELETE' });
  }

  // Collections
  async getCollections() {
    return this.request('/api/collections');
  }

  async getCollection(nameOrId) {
    return this.request(`/api/collections/${nameOrId}`);
  }

  async createCollection(data) {
    return this.request('/api/collections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCollection(nameOrId, data) {
    return this.request(`/api/collections/${nameOrId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCollection(nameOrId) {
    return this.request(`/api/collections/${nameOrId}`, {
      method: 'DELETE',
    });
  }

  // Records CRUD
  async getRecords(collectionName, params = {}) {
    const q = new URLSearchParams();
    if (params.page) q.append('page', params.page);
    if (params.perPage) q.append('perPage', params.perPage);
    if (params.filter) q.append('filter', params.filter);
    if (params.sort) q.append('sort', params.sort);
    if (params.expand) q.append('expand', params.expand);
    if (params.search) q.append('search', params.search);

    const queryStr = q.toString() ? `?${q.toString()}` : '';
    return this.request(`/api/collections/${collectionName}/records${queryStr}`);
  }

  async getRecord(collectionName, id, expand = '') {
    const q = expand ? `?expand=${expand}` : '';
    return this.request(`/api/collections/${collectionName}/records/${id}${q}`);
  }

  async createRecord(collectionName, formDataOrObj) {
    const isForm = formDataOrObj instanceof FormData;
    return this.request(`/api/collections/${collectionName}/records`, {
      method: 'POST',
      body: isForm ? formDataOrObj : JSON.stringify(formDataOrObj),
    });
  }

  async updateRecord(collectionName, id, formDataOrObj) {
    const isForm = formDataOrObj instanceof FormData;
    return this.request(`/api/collections/${collectionName}/records/${id}`, {
      method: 'PATCH',
      body: isForm ? formDataOrObj : JSON.stringify(formDataOrObj),
    });
  }

  async deleteRecord(collectionName, id) {
    return this.request(`/api/collections/${collectionName}/records/${id}`, {
      method: 'DELETE',
    });
  }

  // Realtime SSE
  initRealtime(onEvent) {
    if (onEvent) this.realtimeListeners.add(onEvent);

    if (this.eventSource) return;

    this.eventSource = new EventSource(`${this.baseUrl}/api/realtime`);

    const handle = (e) => {
      try {
        const data = JSON.parse(e.data);
        this.realtimeListeners.forEach(listener => listener(e.type, data));
      } catch {
        //
      }
    };

    this.eventSource.addEventListener('create', handle);
    this.eventSource.addEventListener('update', handle);
    this.eventSource.addEventListener('delete', handle);
    this.eventSource.addEventListener('MB_CONNECT', handle);
    this.eventSource.addEventListener('PB_CONNECT', handle);
  }

  onRealtime(fn) {
    this.realtimeListeners.add(fn);
    return () => this.realtimeListeners.delete(fn);
  }

  // System Settings
  async getSettings() {
    return this.request('/api/admins/settings');
  }

  async updateSettings(data) {
    return this.request('/api/admins/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async testEmail(email) {
    return this.request('/api/admins/test-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Backup & Disaster Recovery
  async exportBackup() {
    return this.request('/api/admins/backup/export');
  }

  async restoreBackup(backup) {
    return this.request('/api/admins/backup/restore', {
      method: 'POST',
      body: JSON.stringify({ backup }),
    });
  }

  // Batch Operations
  async batch(requests) {
    return this.request('/api/batch', {
      method: 'POST',
      body: JSON.stringify({ requests }),
    });
  }

  // Public Tunnel
  async getTunnelStatus() {
    return this.request('/api/tunnel');
  }

  async startTunnel() {
    return this.request('/api/tunnel', { method: 'POST' });
  }

  async stopTunnel() {
    return this.request('/api/tunnel', { method: 'DELETE' });
  }
}

window.api = new AdminAPI();
