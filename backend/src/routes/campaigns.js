import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import Campaign from '../models/Campaign.js';
import Customer from '../models/Customer.js';
import CommunicationLog from '../models/CommunicationLog.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const CHANNEL_SERVICE_URL = process.env.CHANNEL_SERVICE_URL || 'http://localhost:5002';

// Get all campaigns
router.get('/', async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get campaign detail with communication logs
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    const logs = await CommunicationLog.find({ campaignId: campaign._id }).sort({ createdAt: -1 });
    res.json({ campaign, logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new campaign
router.post('/', async (req, res) => {
  try {
    const { name, segmentName, segmentFilter, channel, messageTemplate } = req.body;
    
    if (!name || !segmentName || !segmentFilter || !channel || !messageTemplate) {
      return res.status(400).json({ error: 'Missing required campaign parameters' });
    }

    const campaign = new Campaign({
      name,
      segmentName,
      segmentFilter,
      channel,
      messageTemplate,
      status: 'draft',
      stats: { sent: 0, delivered: 0, failed: 0, opened: 0, clicked: 0, converted: 0, revenue: 0 }
    });

    await campaign.save();
    res.status(201).json(campaign);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Launch campaign (send messages)
router.post('/:id/send', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status === 'sending') {
      return res.status(400).json({ error: 'Campaign is already running' });
    }

    // Resolve matching customers
    const query = typeof campaign.segmentFilter === 'string' ? JSON.parse(campaign.segmentFilter) : campaign.segmentFilter;
    const customers = await Customer.find(query);

    if (customers.length === 0) {
      return res.status(400).json({ error: 'Segment contains 0 customers. Cannot launch campaign.' });
    }

    // Update status to sending and clear previous stats
    campaign.status = 'sending';
    campaign.stats = { sent: 0, delivered: 0, failed: 0, opened: 0, clicked: 0, converted: 0, revenue: 0 };
    await campaign.save();

    // Clear any previous logs for this campaign to avoid mixing logs
    await CommunicationLog.deleteMany({ campaignId: campaign._id });

    // Start dispatch asynchronously so backend doesn't timeout
    dispatchCampaign(campaign, customers);

    res.json({ success: true, message: `Campaign launch triggered for ${customers.length} recipients.`, recipientCount: customers.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Copywriting drafting endpoint using Gemini
router.post('/draft-message', async (req, res) => {
  const { prompt, channel } = req.body;

  if (!prompt || !channel) {
    return res.status(400).json({ error: 'Prompt and channel are required' });
  }

  if (!process.env.GEMINI_API_KEY) {
    console.warn('[Warning] GEMINI_API_KEY is not set. Using local mockup generator for copywriting.');
    const drafts = generateMockCopyDrafts(prompt, channel);
    return res.json({ drafts, isFallback: true });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemInstruction = `
You are an expert AI copywriter. Write marketing copy drafts for a retail coffee brand campaign.
You will write exactly 3 distinct copy options tailored for the channel "${channel}".
Use placeholders like {{name}} (for recipient's name), {{city}} (for recipient's city), and {{totalSpend}} (for recipient's total spent) to personalize messages.
Make them engaging, brief, and relevant to the user request.

Keep in mind character limits of channels:
- SMS: very short (max 160 characters)
- WhatsApp: personal, rich, can use emojis
- RCS: rich card styles or message with button suggestions
- Email: professional, includes Subject line

Output format: Return ONLY a valid JSON array of strings containing the 3 drafts. No markdown format blocks, no explanation. Just the JSON array of 3 strings.
Example output structure:
[
  "Draft 1 text...",
  "Draft 2 text...",
  "Draft 3 text..."
]
`;

    const response = await model.generateContent([systemInstruction, `Draft copy for: "${prompt}"`]);
    let responseText = response.response.text().trim();

    if (responseText.startsWith('```')) {
      responseText = responseText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    }

    const drafts = JSON.parse(responseText);
    res.json({ drafts, isFallback: false });
  } catch (error) {
    console.error('[AI Copy Error] Gemini API failed:', error);
    const mockDrafts = generateMockCopyDrafts(prompt, channel);
    res.json({ drafts: mockDrafts, isFallback: true, error: error.message });
  }
});

// Helper functions
async function dispatchCampaign(campaign, customers) {
  let sentCount = 0;

  for (const customer of customers) {
    try {
      // Personalize message Template
      let message = campaign.messageTemplate
        .replace(/\{\{name\}\}/gi, customer.name)
        .replace(/\{\{city\}\}/gi, customer.city)
        .replace(/\{\{totalSpend\}\}/gi, `$${customer.totalSpend}`);

      // Create log entry
      const log = new CommunicationLog({
        campaignId: campaign._id,
        customerId: customer._id,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        channel: campaign.channel,
        message: message,
        status: 'sent'
      });
      await log.save();

      // Dispatch HTTP call to Channel Service
      const recipient = campaign.channel === 'email' ? customer.email : customer.phone;
      await axios.post(`${CHANNEL_SERVICE_URL}/api/send`, {
        logId: log._id,
        customerId: customer._id,
        customerName: customer.name,
        recipient: recipient,
        message: message,
        channel: campaign.channel,
        campaignId: campaign._id
      });

      sentCount++;
    } catch (err) {
      console.error(`[Dispatch Error] Failed to send to customer ${customer._id}:`, err.message);
    }
  }

  // Finalize stats updates
  campaign.status = 'completed';
  campaign.stats.sent = sentCount;
  await campaign.save();
  console.log(`[Dispatch Complete] Campaign ${campaign._id} sent to ${sentCount} recipients.`);
}

function generateMockCopyDrafts(prompt, channel) {
  const c = channel.toLowerCase();
  if (c === 'email') {
    return [
      `Subject: Hey {{name}}, fresh beans await! ☕\n\nHi {{name}},\n\nWe noticed you love our coffee! To celebrate, here's 15% off your next order. Use code COFFEE15.\n\nWarmly,\nAroma Express`,
      `Subject: Fuel your day, {{name}}! ⚡\n\nHi {{name}},\n\nNeed a caffeine kick? Grab our premium Ceramic Pour-Over Cone today. Orders over $500 get free shipping!\n\nBest,\nAroma Express`,
      `Subject: Exclusive Pune Offer for {{name}}! 🌟\n\nHello {{name}},\n\nSince you are based in {{city}}, we wanted to extend a special discount. Get 20% off our French Press Mug this week!\n\nCheers,\nAroma Express`
    ];
  } else if (c === 'whatsapp') {
    return [
      `Hey {{name}}! ☕ Fresh coffee beans are roasting. Grab yours today and get 15% off! Code: ROAST15. Tap to buy!`,
      `Hi {{name}}! We love our {{city}} coffee lovers. 🌟 Get a free Milk Frother with your next order above $1000! Reply YES to redeem.`,
      `Hello {{name}}! 👋 Need a coffee refill? Try our Dark Roast Espresso. Specially selected for our top shoppers (like you, with {{totalSpend}} spent!).`
    ];
  } else {
    // SMS / RCS
    return [
      `Hi {{name}}! Get 15% off Aroma Express coffee! Code: COFFEE15. Buy now: https://aroma.ex`,
      `Hey {{name}}! Enjoy premium coffee beans delivered to {{city}}. Use code FRESH for free delivery this weekend!`,
      `Hello {{name}}! Refill your beans today. Order now and get 10% cashback. Aroma Express.`
    ];
  }
}

export default router;
