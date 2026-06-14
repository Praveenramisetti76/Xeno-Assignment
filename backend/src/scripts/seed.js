import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Customer from '../models/Customer.js';
import Order from '../models/Order.js';
import Campaign from '../models/Campaign.js';
import CommunicationLog from '../models/CommunicationLog.js';

const seedData = async () => {
  try {
    await connectDB();

    console.log('Clearing old database collection records...');
    await Customer.deleteMany({});
    await Order.deleteMany({});
    await Campaign.deleteMany({});
    await CommunicationLog.deleteMany({});
    console.log('Database cleared.');

    const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Arav', 'Krishna', 'Atharv', 'Diya', 'Ira', 'Ananya', 'Saanvi', 'Aadhya', 'Pari', 'Prisha', 'Riya', 'Anika', 'Aanya'];
    const lastNames = ['Sharma', 'Verma', 'Gupta', 'Patel', 'Reddy', 'Rao', 'Nair', 'Mehra', 'Joshi', 'Chawla', 'Singh', 'Kumar', 'Kapoor', 'Das', 'Sen', 'Mukherjee', 'Roy', 'Iyer', 'Pillai', 'Naidu'];
    const cities = ['Delhi', 'Mumbai', 'Pune', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Gurgaon'];
    const itemsList = ['Dark Roast Espresso', 'Arabica Coffee Beans', 'French Press Mug', 'Electric Milk Frother', 'Cold Brew Concentrate', 'Vanilla Coffee Syrup', 'Ceramic Pour-Over Cone', 'Paper Filter Pack', 'Stainless Steel Grinder', 'Double Walled Glass Mug'];

    const mockCustomers = [];

    console.log('Generating 100 realistic customers...');
    for (let i = 1; i <= 100; i++) {
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
    console.log(`Successfully seeded ${insertedCustomers.length} customers.`);

    console.log('Generating realistic orders and aggregate customer stats...');
    const now = new Date();
    
    // We want to give some customers orders, some none (for churn targeting)
    // 80% of customers have ordered
    for (const customer of insertedCustomers) {
      if (Math.random() > 0.2) {
        // Decide order count: 1 to 5
        const numOrders = Math.floor(Math.random() * 5) + 1;
        for (let o = 0; o < numOrders; o++) {
          const amount = Math.floor(100 + Math.random() * 2000); // 100 to 2100 rupees
          
          // Order date between 1 and 150 days ago
          const daysAgo = Math.floor(Math.random() * 150) + 1;
          const orderDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

          // Random 1 to 3 items
          const items = [];
          const itemsCount = Math.floor(Math.random() * 3) + 1;
          for (let itemIdx = 0; itemIdx < itemsCount; itemIdx++) {
            items.push(itemsList[Math.floor(Math.random() * itemsList.length)]);
          }

          const order = new Order({
            customerId: customer._id,
            amount,
            items,
            orderDate
          });
          
          // Saving order triggers the post-save aggregate hook automatically
          await order.save();
        }
      }
    }

    console.log('Database seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
