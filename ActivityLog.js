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
