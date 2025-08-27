// controllers/activityController.js
const redisClient = require('../redisClient'); // Redis client
const ActivityLog = require('../models/ActivityLog');

// POST /activity - Log wellness activity
const logActivity = async (req, res) => {
  const { user_id, date, hydration_liters, sleep_hours, exercise_minutes, meditation_minutes, source } = req.body;

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
  const cacheKey = `activity_logs:${userId}:${start}:${end}`;

  try {
    // 1. Check Redis for cached data
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      // 2. If cache hit, return the cached data
      console.log('Cache hit');
      return res.status(200).json(JSON.parse(cachedData)); // Redis stores data as string, so parse it
    }

    // 3. If no cache, query MongoDB
    console.log('Cache miss');
    const query = { user_id: userId };
    if (start && end) {
      query.date = { $gte: start, $lte: end }; // Filter by date range if provided
    }

    const activityLogs = await ActivityLog.find(query);

    if (!activityLogs.length) {
      return res.status(404).json({ message: 'No activity logs found for this user in the specified range' });
    }

    // 4. Cache the data in Redis (with an expiration time)
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(activityLogs)); // Cache for 1 hour

    // 5. Return the data from MongoDB
    return res.status(200).json(activityLogs);
  } catch (err) {
    console.error('Error retrieving activity logs:', err);
    res.status(500).json({ error: 'Error retrieving activity logs' });
  }
};

module.exports = { logActivity, getActivityLogs };
