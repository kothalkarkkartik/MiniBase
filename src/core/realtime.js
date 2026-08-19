import { generateId } from '../utils/id.js';

export class RealtimeHub {
  static clients = new Map();
  static heartbeatTimer = null;

  static init() {
    if (!this.heartbeatTimer) {
      this.heartbeatTimer = setInterval(() => {
        this.broadcastPing();
      }, 25000);
    }
  }

  static addClient(res, auth) {
    const clientId = generateId(16);

    // Setup SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    res.flushHeaders?.();

    const client = {
      id: clientId,
      res,
      subscriptions: new Set(['*']), // Default subscribe to all or specific
      auth,
      created: Date.now(),
    };

    this.clients.set(clientId, client);

    // Send initial connect event
    this.sendEventToClient(client, 'MB_CONNECT', {
      clientId,
      timestamp: new Date().toISOString(),
    });

    // Cleanup on disconnect
    res.on('close', () => {
      this.clients.delete(clientId);
    });

    return clientId;
  }

  static subscribe(clientId, topics) {
    const client = this.clients.get(clientId);
    if (!client) return false;

    for (const topic of topics) {
      client.subscriptions.add(topic);
    }
    return true;
  }

  static unsubscribe(clientId, topics) {
    const client = this.clients.get(clientId);
    if (!client) return false;

    for (const topic of topics) {
      client.subscriptions.delete(topic);
    }
    return true;
  }

  static setSubscriptions(clientId, topics) {
    const client = this.clients.get(clientId);
    if (!client) return false;

    client.subscriptions = new Set(topics);
    return true;
  }

  static dispatch(action, collectionName, record) {
    const event = {
      action,
      collection: collectionName,
      record,
      timestamp: new Date().toISOString(),
    };

    const targetTopic1 = '*';
    const targetTopic2 = collectionName;
    const targetTopic3 = `${collectionName}/${record.id}`;

    for (const [, client] of this.clients) {
      const subs = client.subscriptions;
      if (
        subs.has(targetTopic1) ||
        subs.has(targetTopic2) ||
        subs.has(targetTopic3) ||
        subs.has(`${collectionName}/*`)
      ) {
        this.sendEventToClient(client, action, event);
      }
    }
  }

  static getActiveClientCount() {
    return this.clients.size;
  }

  static sendEventToClient(client, eventName, data) {
    try {
      client.res.write(`event: ${eventName}\n`);
      client.res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch {
      this.clients.delete(client.id);
    }
  }

  static broadcastPing() {
    for (const [id, client] of this.clients) {
      try {
        client.res.write(': ping\n\n');
      } catch {
        this.clients.delete(id);
      }
    }
  }
}

RealtimeHub.init();
