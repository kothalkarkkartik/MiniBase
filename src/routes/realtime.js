import { Router } from 'express';
import { RealtimeHub } from '../core/realtime.js';

export const realtimeRouter = Router();

// SSE connection endpoint
realtimeRouter.get('/', (req, res) => {
  RealtimeHub.addClient(res, req.auth);
});

// Update client subscriptions
realtimeRouter.post('/subscriptions', (req, res) => {
  const { clientId, subscriptions } = req.body;

  if (!clientId || !Array.isArray(subscriptions)) {
    res.status(400).json({ code: 400, message: 'clientId and subscriptions array are required' });
    return;
  }

  const success = RealtimeHub.setSubscriptions(clientId, subscriptions);
  if (success) {
    res.json({ message: 'Subscriptions updated', subscriptions });
  } else {
    res.status(404).json({ code: 404, message: 'Client connection not found or expired' });
  }
});
