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
