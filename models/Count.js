const mongoose = require('mongoose');

const countSchema = new mongoose.Schema({
  timestamp: Date,
  value: Number,
});

const Count = mongoose.model('Count', countSchema);

module.exports = Count;
