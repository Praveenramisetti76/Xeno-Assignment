import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  segmentName: {
    type: String,
    required: true,
  },
  segmentFilter: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  channel: {
    type: String,
    enum: ['email', 'whatsapp', 'sms', 'rcs'],
    required: true,
  },
  messageTemplate: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'sending', 'completed'],
    default: 'draft',
  },
  stats: {
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    converted: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const Campaign = mongoose.model('Campaign', campaignSchema);
export default Campaign;
