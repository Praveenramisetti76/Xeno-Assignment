async function connectWithRetry(connectFn, retries = 5, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      await connectFn();
      console.log('Database connected successfully');
      return;
    } catch (err) {
      console.error(`Connection attempt ${i + 1} failed. Retrying in ${delay}ms...\n`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  throw new Error('Could not connect to database after maximum retries');
}

module.exports = { connectWithRetry };
