const mongoose = require('mongoose');

let metric = new mongoose.Schema({
  timestamp_minute: Date,
  type: String,
  values: [ Number ],
});

let Metric = mongoose.model('Metric', metric);

module.exports = Metric;
