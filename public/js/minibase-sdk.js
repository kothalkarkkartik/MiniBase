// MiniBase Lightweight Browser/Node Client SDK

export class MiniBaseClient {
  constructor(baseUrl = window.location.origin) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.token = null;
    this.authStore = { token: null, model: null };
    this.eventSource = null;
    this.sseSubscribers = new Map();
  }

  async request(path, options = {}) {
    const headers = { ...(options.headers || {}) };

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
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }

    return data;
  }

  admins = {
    authWithPassword: async (email, password) => {
      const res = await this.request('/api/admins/auth-with-password', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      this.token = res.token;
      this.authStore = { token: res.token, model: res.admin };
      return res;
    },
    getStats: async () => this.request('/api/admins/stats'),
    getLogs: async (page = 1, perPage = 50) => this.request(`/api/admins/logs?page=${page}&perPage=${perPage}`),
  };

  collections = {
    getList: async () => this.request('/api/collections'),
    getOne: async (nameOrId) => this.request(`/api/collections/${nameOrId}`),
    create: async (data) => this.request('/api/collections', { method: 'POST', body: JSON.stringify(data) }),
    update: async (nameOrId, data) => this.request(`/api/collections/${nameOrId}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: async (nameOrId) => this.request(`/api/collections/${nameOrId}`, { method: 'DELETE' }),
  };

  collection(name) {
    const self = this;
    return {
      getList: async (page = 1, perPage = 30, options = {}) => {
        const q = new URLSearchParams({ page: String(page), perPage: String(perPage) });
        if (options.filter) q.append('filter', options.filter);
        if (options.sort) q.append('sort', options.sort);
        if (options.expand) q.append('expand', options.expand);
        if (options.search) q.append('search', options.search);
        return self.request(`/api/collections/${name}/records?${q.toString()}`);
      },
      getOne: async (id, options = {}) => {
        const q = options.expand ? `?expand=${options.expand}` : '';
        return self.request(`/api/collections/${name}/records/${id}${q}`);
      },
      create: async (body) => {
        const isForm = body instanceof FormData;
        return self.request(`/api/collections/${name}/records`, {
          method: 'POST',
          body: isForm ? body : JSON.stringify(body),
        });
      },
      update: async (id, body) => {
        const isForm = body instanceof FormData;
        return self.request(`/api/collections/${name}/records/${id}`, {
          method: 'PATCH',
          body: isForm ? body : JSON.stringify(body),
        });
      },
      delete: async (id) => {
        return self.request(`/api/collections/${name}/records/${id}`, { method: 'DELETE' });
      },
      authWithPassword: async (identity, password) => {
        const res = await self.request(`/api/collections/${name}/auth-with-password`, {
          method: 'POST',
          body: JSON.stringify({ identity, password }),
        });
        self.token = res.token;
        self.authStore = { token: res.token, model: res.record };
        return res;
      },
      getAuthMethods: async () => {
        return self.request(`/api/collections/${name}/auth-methods`);
      },
      authWithOAuth2: async (provider, code, redirectUrl) => {
        const res = await self.request(`/api/collections/${name}/auth-with-oauth2`, {
          method: 'POST',
          body: JSON.stringify({ provider, code, redirectUrl }),
        });
        self.token = res.token;
        self.authStore = { token: res.token, model: res.record };
        return res;
      },
      requestPasswordReset: async (email) => {
        return self.request(`/api/collections/${name}/request-password-reset`, {
          method: 'POST',
          body: JSON.stringify({ email }),
        });
      },
      confirmPasswordReset: async (token, password, passwordConfirm) => {
        return self.request(`/api/collections/${name}/confirm-password-reset`, {
          method: 'POST',
          body: JSON.stringify({ token, password, passwordConfirm }),
        });
      },
      requestVerification: async (email) => {
        return self.request(`/api/collections/${name}/request-verification`, {
          method: 'POST',
          body: JSON.stringify({ email }),
        });
      },
      confirmVerification: async (token) => {
        return self.request(`/api/collections/${name}/confirm-verification`, {
          method: 'POST',
          body: JSON.stringify({ token }),
        });
      },
      subscribe: (topic, callback) => {
        const fullTopic = topic === '*' ? name : `${name}/${topic}`;
        self.initRealtime();
        if (!self.sseSubscribers.has(fullTopic)) {
          self.sseSubscribers.set(fullTopic, new Set());
        }
        self.sseSubscribers.get(fullTopic).add(callback);
      },
    };
  }

  batch(requests) {
    return this.request('/api/batch', {
      method: 'POST',
      body: JSON.stringify({ requests }),
    });
  }

  getFileUrl(collectionNameOrId, recordId, filename, thumb) {
    const q = thumb ? `?thumb=${thumb}` : '';
    return `${this.baseUrl}/api/files/${collectionNameOrId}/${recordId}/${filename}${q}`;
  }

  initRealtime() {
    if (this.eventSource || typeof window === 'undefined' || !window.EventSource) return;

    this.eventSource = new EventSource(`${this.baseUrl}/api/realtime`);

    const handleEvent = (e) => {
      try {
        const eventData = JSON.parse(e.data);
        const col = eventData.collection;
        const recId = eventData.record?.id;

        const colSubs = this.sseSubscribers.get(col);
        if (colSubs) colSubs.forEach(cb => cb(eventData));

        const recSubs = this.sseSubscribers.get(`${col}/${recId}`);
        if (recSubs) recSubs.forEach(cb => cb(eventData));

        const allSubs = this.sseSubscribers.get('*');
        if (allSubs) allSubs.forEach(cb => cb(eventData));
      } catch {
        //
      }
    };

    this.eventSource.addEventListener('create', handleEvent);
    this.eventSource.addEventListener('update', handleEvent);
    this.eventSource.addEventListener('delete', handleEvent);
  }
}

if (typeof window !== 'undefined') {
  window.MiniBaseClient = MiniBaseClient;
  window.MiniBase = MiniBaseClient;
}

