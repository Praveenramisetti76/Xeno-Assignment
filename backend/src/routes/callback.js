import express from 'express';
import Campaign from '../models/Campaign.js';
import Order from '../models/Order.js';
import CommunicationLog from '../models/CommunicationLog.js';

const router = express.Router();

// Webhook for delivery receipts from the Channel Service
router.post('/receipt', async (req, res) => {
  const { logId, status } = req.body;

  if (!logId || !status) {
    return res.status(400).json({ error: 'Missing required parameters: logId, status' });
  }

  try {
    const log = await CommunicationLog.findById(logId);
    if (!log) {
      return res.status(404).json({ error: 'Communication log not found' });
    }

    // Status progression state machine check to avoid double counting
    const oldStatus = log.status;
    
    // We only progress forward: sent -> delivered/failed -> opened -> clicked -> converted
    const statusPriority = {
      'sent': 1,
      'failed': 2,
      'delivered': 2,
      'opened': 3,
      'clicked': 4,
      'converted': 5
    };

    if (statusPriority[status] <= statusPriority[oldStatus]) {
      // Already processed or further along in the lifecycle
      return res.json({ success: true, message: 'Status already processed or superseded' });
    }

    // Update log status
    log.status = status;
    await log.save();

    // Increment corresponding campaign metric
    const incrementFields = {};
    incrementFields[`stats.${status}`] = 1;
    
    // If transitioning from failed to delivered (unlikely) or just registering failure
    if (status === 'failed' && oldStatus === 'sent') {
      // Just failed
    }

    await Campaign.findByIdAndUpdate(log.campaignId, { $inc: incrementFields });

    res.json({ success: true, message: `Receipt logged: ${status}` });
  } catch (error) {
    console.error('[Callback Receipt Error]:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook to record simulated purchases/conversions
router.post('/order', async (req, res) => {
  const { customerId, amount, items, campaignId, logId } = req.body;

  if (!customerId || !amount || !campaignId || !logId) {
    return res.status(400).json({ error: 'Missing parameters: customerId, amount, campaignId, logId' });
  }

  try {
    // 1. Create the new Order
    const order = new Order({
      customerId,
      amount,
      items,
      orderDate: new Date()
    });
    await order.save(); // Mongoose post-save hook handles Customer totalSpend & orderCount

    // 2. Update communication log to 'converted'
    const log = await CommunicationLog.findById(logId);
    if (log && log.status !== 'converted') {
      log.status = 'converted';
      await log.save();

      // 3. Update campaign stats: increment conversion count and attribute revenue
      await Campaign.findByIdAndUpdate(campaignId, {
        $inc: {
          'stats.converted': 1,
          'stats.revenue': amount
        }
      });
    }

    res.json({ success: true, message: 'Conversion recorded successfully!' });
  } catch (error) {
    console.error('[Callback Order Conversion Error]:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
