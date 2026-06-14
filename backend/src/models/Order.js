import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  items: {
    type: [String],
    default: [],
  },
  orderDate: {
    type: Date,
    default: Date.now,
  }
});

// Post-save hook to automatically update Customer aggregate fields
orderSchema.post('save', async function() {
  const Order = this.constructor;
  const Customer = mongoose.model('Customer');
  
  const stats = await Order.aggregate([
    { $match: { customerId: this.customerId } },
    {
      $group: {
        _id: '$customerId',
        totalSpend: { $sum: '$amount' },
        orderCount: { $sum: 1 },
        lastPurchaseDate: { $max: '$orderDate' }
      }
    }
  ]);

  if (stats.length > 0) {
    await Customer.findByIdAndUpdate(this.customerId, {
      totalSpend: stats[0].totalSpend,
      orderCount: stats[0].orderCount,
      lastPurchaseDate: stats[0].lastPurchaseDate
    });
  }
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
