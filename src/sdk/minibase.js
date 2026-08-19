export class MiniBaseClient {
  baseUrl;
  token = null;
  authStore = { token: null, model: null };
  eventSource = null;
  clientId = null;
  sseSubscribers = new Map();

  constructor(baseUrl = 'http://localhost:8090') {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
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

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }

    return data;
  }

  admins = {
    authWithPassword: async (email, pass) => {
      const res = await this.request('/api/admins/auth-with-password', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass }),
      });
      this.token = res.token;
      this.authStore = { token: res.token, model: res.admin };
      return res;
    },
    hasAdmin: async () => {
      return this.request('/api/admins/has-admin');
    },
    setup: async (email, pass) => {
      const res = await this.request('/api/admins/setup', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass }),
      });
      this.token = res.token;
      this.authStore = { token: res.token, model: res.admin };
      return res;
    },
    getStats: async () => {
      return this.request('/api/admins/stats');
    },
    getLogs: async (page = 1, perPage = 50, status) => {
      const q = new URLSearchParams({ page: String(page), perPage: String(perPage) });
      if (status) q.append('status', String(status));
      return this.request(`/api/admins/logs?${q.toString()}`);
    },
  };

  collections = {
    getList: async () => {
      return this.request('/api/collections');
    },
    getOne: async (nameOrId) => {
      return this.request(`/api/collections/${nameOrId}`);
    },
    create: async (data) => {
      return this.request('/api/collections', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (nameOrId, data) => {
      return this.request(`/api/collections/${nameOrId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    delete: async (nameOrId) => {
      return this.request(`/api/collections/${nameOrId}`, {
        method: 'DELETE',
      });
    },
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
        return self.request(`/api/collections/${name}/records/${id}`, {
          method: 'DELETE',
        });
      },
      authWithPassword: async (identity, pass) => {
        const res = await self.request(`/api/collections/${name}/auth-with-password`, {
          method: 'POST',
          body: JSON.stringify({ identity, password: pass }),
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
    const globalObj = typeof globalThis !== 'undefined' ? globalThis : null;
    const ES = globalObj?.EventSource;
    if (this.eventSource || !ES) return;

    this.eventSource = new ES(`${this.baseUrl}/api/realtime`);

    const handleConnect = (e) => {
      const data = JSON.parse(e.data);
      this.clientId = data.clientId;
    };

    this.eventSource.addEventListener('MB_CONNECT', handleConnect);
    this.eventSource.addEventListener('PB_CONNECT', handleConnect);

    const handleEvent = (e) => {
      try {
        const eventData = JSON.parse(e.data);
        const col = eventData.collection;
        const recId = eventData.record?.id;

        // Notify specific collection subscribers
        const colSubs = this.sseSubscribers.get(col);
        if (colSubs) colSubs.forEach(cb => cb(eventData));

        // Notify specific record subscribers
        const recSubs = this.sseSubscribers.get(`${col}/${recId}`);
        if (recSubs) recSubs.forEach(cb => cb(eventData));

        // Notify global subscribers
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
