import express from 'express';
import Customer from '../models/Customer.js';
import Order from '../models/Order.js';

const router = express.Router();

// Get list of customers
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find().sort({ totalSpend: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get customer detail and orders
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    const orders = await Order.find({ customerId: customer._id }).sort({ orderDate: -1 });
    res.json({ customer, orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to trigger database seeding
router.post('/seed', async (req, res) => {
  try {
    // Clear
    await Customer.deleteMany({});
    await Order.deleteMany({});
    
    // Seed
    const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Arav', 'Krishna', 'Atharv', 'Diya', 'Ira', 'Ananya', 'Saanvi', 'Aadhya', 'Pari', 'Prisha', 'Riya', 'Anika', 'Aanya'];
    const lastNames = ['Sharma', 'Verma', 'Gupta', 'Patel', 'Reddy', 'Rao', 'Nair', 'Mehra', 'Joshi', 'Chawla', 'Singh', 'Kumar', 'Kapoor', 'Das', 'Sen', 'Mukherjee', 'Roy', 'Iyer', 'Pillai', 'Naidu'];
    const cities = ['Delhi', 'Mumbai', 'Pune', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Gurgaon'];
    const itemsList = ['Dark Roast Espresso', 'Arabica Coffee Beans', 'French Press Mug', 'Electric Milk Frother', 'Cold Brew Concentrate', 'Vanilla Coffee Syrup', 'Ceramic Pour-Over Cone', 'Paper Filter Pack', 'Stainless Steel Grinder', 'Double Walled Glass Mug'];

    const mockCustomers = [];
    for (let i = 1; i <= 60; i++) {
      const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const name = `${fName} ${lName}`;
      const email = `${fName.toLowerCase()}.${lName.toLowerCase()}.${i}@example.com`;
      const phone = `+91${Math.floor(6000000000 + Math.random() * 4000000000)}`;
      const city = cities[Math.floor(Math.random() * cities.length)];

      mockCustomers.push({
        name,
        email,
        phone,
        city,
        totalSpend: 0,
        orderCount: 0,
        lastPurchaseDate: null,
      });
    }

    const insertedCustomers = await Customer.insertMany(mockCustomers);
    const now = new Date();

    for (const customer of insertedCustomers) {
      if (Math.random() > 0.25) {
        const numOrders = Math.floor(Math.random() * 4) + 1;
        for (let o = 0; o < numOrders; o++) {
          const amount = Math.floor(150 + Math.random() * 1800);
          const daysAgo = Math.floor(Math.random() * 120) + 1;
          const orderDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
          
          const itemsCount = Math.floor(Math.random() * 3) + 1;
          const items = [];
          for (let itemIdx = 0; itemIdx < itemsCount; itemIdx++) {
            items.push(itemsList[Math.floor(Math.random() * itemsList.length)]);
          }

          const order = new Order({
            customerId: customer._id,
            amount,
            items,
            orderDate
          });
          await order.save();
        }
      }
    }

    res.json({ success: true, message: 'Database seeded successfully with 60 customers and orders!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
