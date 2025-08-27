// redisClient.js
const { createClient } = require('@redis/client');

// Create Redis client
const client = createClient({
  url: 'redis://localhost:6379', // Use the correct URL for your Redis server
});

client.connect().catch((err) => {
  console.error('Redis connection error:', err);
});

client.on('connect', () => {
  console.log('Connected to Redis');
});

client.on('error', (err) => {
  console.error('Redis client error:', err);
});

module.exports = client;
