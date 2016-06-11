var featureGates = require('../index');

var config = featureGates([
  'widgets',
  'existing'
])({
  features: {
    existing: true
  }
});

process.send({
  name: 'FEATURES',
  data: config.features()
});
