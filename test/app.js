var featureGates = require('../index');

var config = featureGates([
  'widgets',
  'existing'
])({
  features: {
    existing: true
  }
});

process.stdout.write(JSON.stringify(config));
