import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Customer from '../models/Customer.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Preview matching customers for a given filter
router.post('/preview', async (req, res) => {
  try {
    const { filter } = req.body;
    
    // Safely parse filter if it's sent as a string (useful for debugging/direct testing)
    let mongoQuery = {};
    if (filter) {
      mongoQuery = typeof filter === 'string' ? JSON.parse(filter) : filter;
    }

    const customers = await Customer.find(mongoQuery).sort({ totalSpend: -1 }).limit(100);
    const count = await Customer.countDocuments(mongoQuery);

    res.json({ count, customers });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// AI Segment generation using Gemini
router.post('/ai-suggest', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // Graceful fallback if no Gemini API Key is configured
  if (!process.env.GEMINI_API_KEY) {
    console.warn('[Warning] GEMINI_API_KEY is not set. Using rule-based fallback parser.');
    const query = fallbackAIParser(prompt);
    return res.json({
      filter: query,
      isFallback: true,
      message: 'Gemini API Key is not set. Utilizing mock rule-based segmentation parser.'
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const now = new Date();
    const systemInstruction = `
You are an expert MongoDB database developer. Convert a customer segmentation request into a valid JSON MongoDB filter object.
The 'Customer' collection schema:
- name (string)
- email (string)
- phone (string)
- city (string) - Matches city name exactly (e.g., 'Delhi', 'Mumbai', 'Pune', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Gurgaon'). Use case-insensitive regex if query describes general matching.
- totalSpend (number) - money spent
- orderCount (number) - number of orders
- lastPurchaseDate (date) - ISO Date string.

Current datetime is: ${now.toISOString()}.
If the user asks for "within last 30 days", calculate the date 30 days ago: ${new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()} and use { "lastPurchaseDate": { "$gte": "<date>" } }.
If the user asks for "not ordered in 90 days", calculate the date 90 days ago: ${new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()} and use { "lastPurchaseDate": { "$lt": "<date>", "$ne": null } }.

Response format: Return ONLY the raw JSON query object. Do NOT wrap it in markdown code fences or write any other text. No explanation. Just the JSON.
`;

    const response = await model.generateContent([systemInstruction, `Translate this query to MongoDB: "${prompt}"`]);
    let responseText = response.response.text().trim();
    
    // Clean up markdown block formatting if Gemini outputs it
    if (responseText.startsWith('```')) {
      responseText = responseText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    }

    const queryJson = JSON.parse(responseText);
    res.json({ filter: queryJson, isFallback: false });
  } catch (error) {
    console.error('[AI Segment Error] Failed generating MongoDB query:', error);
    // Fall back to rule-based logic in case of API failure
    const fallbackQuery = fallbackAIParser(prompt);
    res.json({
      filter: fallbackQuery,
      isFallback: true,
      message: `Gemini API call failed (${error.message}). Reverted to fallback parser.`
    });
  }
});

// Rule-based fallback parser for testing/no-key states
function fallbackAIParser(prompt) {
  const p = prompt.toLowerCase();
  const query = {};

  // Parse City
  const cities = ['delhi', 'mumbai', 'pune', 'bangalore', 'chennai', 'hyderabad', 'kolkata', 'ahmedabad', 'jaipur', 'gurgaon'];
  for (const city of cities) {
    if (p.includes(city)) {
      query.city = city.charAt(0).toUpperCase() + city.slice(1);
    }
  }

  // Parse totalSpend
  if (p.includes('spend') || p.includes('spent')) {
    const matchGt = p.match(/(?:over|more than|gt|>)\s*(\d+)/);
    const matchLt = p.match(/(?:under|less than|lt|<)\s*(\d+)/);
    if (matchGt) {
      query.totalSpend = { ...query.totalSpend, $gt: parseInt(matchGt[1]) };
    }
    if (matchLt) {
      query.totalSpend = { ...query.totalSpend, $lt: parseInt(matchLt[1]) };
    }
  }

  // Parse orderCount
  if (p.includes('order') || p.includes('orders')) {
    const matchCount = p.match(/(?:at least|more than|>|>=)\s*(\d+)\s*orders?/);
    if (matchCount) {
      query.orderCount = { $gte: parseInt(matchCount[1]) };
    }
  }

  // Parse last purchase date (fallback default last 30 days)
  if (p.includes('recent') || p.includes('last 30 days') || p.includes('month')) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    query.lastPurchaseDate = { $gte: thirtyDaysAgo };
  } else if (p.includes('inactive') || p.includes('not ordered') || p.includes('churn')) {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    query.lastPurchaseDate = { $lt: ninetyDaysAgo, $ne: null };
  }

  return query;
}

export default router;
