# 🧘 Wellness Tracker Backend

![Node.js](https://img.shields.io/badge/Node.js-18.x-green?logo=node.js)
![Express](https://img.shields.io/badge/Express.js-Backend-lightgrey?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green?logo=mongodb)
![Redis](https://img.shields.io/badge/Redis-Cache-red?logo=redis)

A Node.js + Express backend service for logging and retrieving wellness activities (hydration, sleep, exercise, meditation).  
Built with **MongoDB** for persistence and **Redis** for caching.

---

## 📂 Project Structure

```
wellness-tracker-backend/
├── controllers/
│ └── activityController.js
├── models/
│ └── ActivityLog.js
├── redisClient.js
├── routes/
│ └── activityRoutes.js
├── services/
│ └── deviceSyncService.js
├── server.js
├── .env
├── package.json
└── README.md
```
## Server Setup (server.js)
```
// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

require('dotenv').config();

const activityRoutes = require('./routes/activity');
const deviceSyncService = require('./services/deviceSyncService');
const app = express();
const PORT = process.env.PORT || 3000;


// Middleware
app.use(bodyParser.json());


// Routes
app.use('/activity', activityRoutes);
// Sync device data (can be scheduled or triggered manually)
app.post('/sync-device-data', async (req, res) => {
try {
await deviceSyncService.syncDeviceDataFromAPI();
res.status(200).json({ message: 'Device data synced successfully!' });
} catch (error) {
res.status(500).json({ error: 'Failed to sync device data' });
}
});


// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
useNewUrlParser: true,
useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected!'))
.catch(err => console.log(err));
// Start the server
app.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
});

```

## MongoDB Model (models/ActivityLog.js)

```
// models/ActivityLog.js
const mongoose = require('mongoose');
const activityLogSchema = new mongoose.Schema({
user_id: { type: String, required: true },
date: { type: String, required: true },
hydration_liters: { type: Number, required: true },
sleep_hours: { type: Number, required: true },
exercise_minutes: { type: Number, required: true },
meditation_minutes: { type: Number, required: true },
source: { type: String, default: 'manual' }, // 'manual' or 'device'
});
module.exports = mongoose.model('ActivityLog', activityLogSchema);

```
## Redis Client Setup (redisClient.js)

```
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
```
## Controller Implementation (Controllers/activityController.js)

```
// controllers/activityController.js
const redisClient = require('../redisClient'); // Redis client
const ActivityLog = require('../models/ActivityLog');
// POST /activity - Log wellness activity
const logActivity = async (req, res) => {
const { user_id, date, hydration_liters, sleep_hours, exercise_minutes,
meditation_minutes, source } = req.body;
try {
const newActivityLog = new ActivityLog({
user_id,
date,
hydration_liters,
sleep_hours,
exercise_minutes,
meditation_minutes,
source: source || 'manual',
});
await newActivityLog.save();
res.status(201).json(newActivityLog);
} catch (err) {
console.error('Error logging activity:', err);
res.status(500).json({ error: 'Error logging activity' });
}
};
// GET /activity/:userId - Get activity logs for a user
const getActivityLogs = async (req, res) => {
const { userId } = req.params;
const { start, end } = req.query;
// Construct the cache key based on userId and date range
const cacheKey = `activity_logs:${userId}:${start}:${end}`
;
try {
// 1. Check Redis for cached data
const cachedData = await redisClient.get(cacheKey);
if (cachedData) {
// 2. If cache hit, return the cached data
console.log('Cache hit');
return res.status(200).json(JSON.parse(cachedData)); // Redis stores data as
string, so parse it
}
// 3. If no cache, query MongoDB
console.log('Cache miss');
const query = { user_id: userId };
if (start && end) {
query.date = { $gte: start, $lte: end }; // Filter by date range if provided
}
const activityLogs = await ActivityLog.find(query);
if (!activityLogs.length) {
return res.status(404).json({ message: 'No activity logs found for this user in
the specified range' });
}
// 4. Cache the data in Redis (with an expiration time)
await redisClient.setEx(cacheKey, 3600, JSON.stringify(activityLogs)); // Cache for
1 hour
// 5. Return the data from MongoDB
return res.status(200).json(activityLogs);
} catch (err) {
console.error('Error retrieving activity logs:', err);
res.status(500).json({ error: 'Error retrieving activity logs' });
}
};
module.exports = { logActivity, getActivityLogs };
```
## Routes (routes/activity.js)

```
// routes/activity.js
const express = require('express');
const router = express.Router();
const { logActivity, getActivityLogs } = require('../controllers/activityController');
// POST /activity - Log wellness activity
router.post('/', logActivity);
// GET /activity/:userId - Retrieve logs for a user by date range
router.get('/:userId', getActivityLogs);
module.exports = router;
```

## Documentation

## A. Setup Instructions
**1. Install Dependencies:**

Ensure you have Node.js and npm installed. Then, install dependencies:

```
npm install

```

**2. Create .env file:**
Add your MongoDB connection URI and Redis configuration:

```
MONGO_URI=mongodb://localhost:27017/wellnessTracker
REDIS_HOST=localhost
REDIS_PORT=6379
```

## B. Run the Service:
**1. Start the backend service:**

```
node server.js
```

## C. API Usage
**1. Log Wellness Activity: Endpoint: POST /activity**

```
Request Body:
{
"user_id": "1234"
,
"date": "2023-08-01"
,
"hydration_liters": 2.0,
"sleep_hours": 7.5,
"exercise_minutes": 30,
"meditation_minutes": 10,
"source": "manual"
}

```
Response: A JSON object of the newly logged activity.

**2. Get Activity Logs for a User:**
```
Endpoint: GET

/activity/:userId?start=YYYY-MM-DD&end=YYYY-MM-DD

Example: GET /activity/1234?start=2023-08-01&end=2023-08-07

```
Response: A JSON array of the user’s activity logs within the date range.

## C. Assumptions Made

User data is identified by user_id.
The date format for activity logs is YYYY-MM-DD.
Redis stores cached data indefinitely (no TTL).
The system doesn't have authentication or authorization mechanisms (this can be added
if needed).


## Explanation of Tracking Logic

**1. Logging Activities:**

- When a user logs wellness data, the backend stores the data in MongoDB.
- If there is a valid source, it is stored as either 'manual' or 'device'.


## Caching

To improve performance and reduce database load, activity logs are cached in **Redis** for 1 hour.

- **Cache Miss** 
  When a `GET /activity/:userId` request is made, the server first queries **Redis** for cached data.  
  If no cache exists, the server queries **MongoDB**, stores the result in Redis, and returns the data.

- **Cache Hit** 
  If the requested data is already in Redis, the server skips the database query and returns the cached data directly, resulting in much faster responses.



