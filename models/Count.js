const mongoose = require('mongoose');

const countSchema = new mongoose.Schema({
  timestamp_hour: Date,

  conditions: {
    // Weather
  },

  // Support averaging.
  num_samples: Number,
  total_samples: Number,

  // Data resolution - per 15 mins.
  counts: [ Number ],
});

const Count = mongoose.model('Count', countSchema);

module.exports = Count;
