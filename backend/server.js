import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';

// Import routes
import customerRouter from './src/routes/customers.js';
import segmentRouter from './src/routes/segments.js';
import campaignRouter from './src/routes/campaigns.js';
import callbackRouter from './src/routes/callback.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to MongoDB
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// Log incoming API calls
app.use((req, res, next) => {
  console.log(`[CRM Backend] ${req.method} ${req.url}`);
  next();
});

// Mount routes
app.use('/api/customers', customerRouter);
app.use('/api/segments', segmentRouter);
app.use('/api/campaigns', campaignRouter);
app.use('/api/callback', callbackRouter);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'AI-native Mini CRM Backend API is active.' });
});

app.listen(PORT, () => {
  console.log(`[CRM Backend] Server running on port ${PORT}`);
});
