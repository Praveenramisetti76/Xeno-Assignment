import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

// Log incoming request info
app.use((req, res, next) => {
  console.log(`[Channel Service] ${req.method} ${req.url}`);
  next();
});

const CRM_RECEIPT_URL = process.env.CRM_RECEIPT_URL || 'http://localhost:5001/api/callback/receipt';
const CRM_ORDER_URL = process.env.CRM_ORDER_URL || 'http://localhost:5001/api/callback/order';

const coffeeItems = ['Arabica Coffee Beans', 'Ceramic Pour-Over Cone', 'Electric Milk Frother', 'French Press Mug', 'Dark Roast Espresso', 'Vanilla Coffee Syrup'];

// Send endpoint called by the CRM
app.post('/api/send', (req, res) => {
  const { logId, customerId, customerName, recipient, message, channel, campaignId } = req.body;

  if (!logId || !recipient || !channel || !campaignId) {
    return res.status(400).json({ error: 'Missing required parameters: logId, recipient, channel, campaignId' });
  }

  // Instant response to the CRM API to keep it non-blocking
  res.json({ success: true, status: 'queued', logId });

  // Start asynchronous simulation lifecycle
  simulateMessageLifecycle({ logId, customerId, customerName, recipient, channel, campaignId });
});

// Helper function to handle async state transitions
async function postCallback(url, payload) {
  try {
    await axios.post(url, payload);
    console.log(`[Callback Success] Posted to ${url}:`, payload);
  } catch (error) {
    console.error(`[Callback Error] Failed posting to ${url}:`, error.message);
  }
}

function simulateMessageLifecycle({ logId, customerId, customerName, recipient, channel, campaignId }) {
  console.log(`[Simulation Start] Log: ${logId} | Customer: ${customerName} | Channel: ${channel}`);

  // Step 1: Delivery status (1-2 seconds delay)
  setTimeout(async () => {
    const isDelivered = Math.random() < 0.95; // 95% delivery rate
    const deliveryStatus = isDelivered ? 'delivered' : 'failed';

    await postCallback(CRM_RECEIPT_URL, { logId, status: deliveryStatus });

    if (!isDelivered) {
      console.log(`[Simulation End] Log: ${logId} delivery failed.`);
      return;
    }

    // Step 2: Open/Read status (2-3 seconds delay after delivery)
    setTimeout(async () => {
      const openRates = { email: 0.3, whatsapp: 0.8, sms: 0.6, rcs: 0.75 };
      const rate = openRates[channel.toLowerCase()] || 0.5;
      const isOpened = Math.random() < rate;

      if (!isOpened) {
        console.log(`[Simulation End] Log: ${logId} not opened.`);
        return;
      }

      await postCallback(CRM_RECEIPT_URL, { logId, status: 'opened' });

      // Step 3: Click status (2-3 seconds delay after open)
      setTimeout(async () => {
        const clickRates = { email: 0.15, whatsapp: 0.45, sms: 0.2, rcs: 0.35 };
        const cRate = clickRates[channel.toLowerCase()] || 0.25;
        const isClicked = Math.random() < cRate;

        if (!isClicked) {
          console.log(`[Simulation End] Log: ${logId} not clicked.`);
          return;
        }

        await postCallback(CRM_RECEIPT_URL, { logId, status: 'clicked' });

        // Step 4: Conversion / Purchase status (3-4 seconds delay after click)
        setTimeout(async () => {
          const isConverted = Math.random() < 0.20; // 20% conversion rate from click

          if (!isConverted) {
            console.log(`[Simulation End] Log: ${logId} clicked but did not purchase.`);
            return;
          }

          // Trigger simulated purchase in CRM
          const orderAmount = Math.floor(250 + Math.random() * 1250); // 250 to 1500 rupees
          const itemCount = Math.floor(Math.random() * 2) + 1;
          const items = [];
          for (let i = 0; i < itemCount; i++) {
            items.push(coffeeItems[Math.floor(Math.random() * coffeeItems.length)]);
          }

          console.log(`[Simulation Conversion] Customer: ${customerName} bought items: [${items.join(', ')}] worth: $${orderAmount}`);

          await postCallback(CRM_ORDER_URL, {
            customerId,
            amount: orderAmount,
            items,
            campaignId,
            logId
          });

          console.log(`[Simulation End] Log: ${logId} fully converted!`);
        }, 3000 + Math.random() * 1000);

      }, 2000 + Math.random() * 1000);

    }, 2000 + Math.random() * 1000);

  }, 1000 + Math.random() * 1000);
}

app.listen(PORT, () => {
  console.log(`[Channel Service] Stubbed channel service running on port ${PORT}`);
});
