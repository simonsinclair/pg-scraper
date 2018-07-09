const mongoose = require('mongoose');

let metric = new mongoose.Schema({
  timestamp_hour: Date,

  // Support averaging.
  num_samples: Number,
  total_samples: Number,

  type: String,

  // Data resolution - per minute.
  values: [ Number ],
});

let Metric = mongoose.model('Metric', metric);

module.exports = Metric;
