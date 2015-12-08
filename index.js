'use strict';

var confab = require('confab');
var assign = require('object-assign');

/**
 * Extends the configuration with a list of enabled features.
 *
 *     var confab = require('confab');
 *     var features = require('confab-features');
 *
 *     var config = confab([
 *       features([
 *        'new_ui'
 *       ])
 *     ]);
 *
 * Run the app with features set by either a previous transformation or
 * environment overrides:
 *
 *     $ CONFIG_FEATURES_NEW_UI=true \
 *       node app.js
 *
 * Then, inside the app, retrieve the feature configurations from a processed
 * confab `config`:
 *
 *     if (config.features.new_ui) {
 *       renderNewUi();
 *     }
 *     else {
 *       renderLegacyUi();
 *     }
 *
 * @id features
 * @group Reference
 * @type Function
 * @param {Array} keys - a list of name features
 * @param {Object} userOpts - optional overrides for the `configKey` (default:
 *   `"features"`) and strict validation (default: `true`)
 * @return Function
 */
module.exports = function features (names, userOpts) {

  var opts = assign({
    configKey: 'features',
    validate: true
  }, userOpts);

  var envKeyPrefix = ('config_' + opts.configKey + '_').toUpperCase();

  var envMap = names.reduce(function (envMap, k) {
    envMap[envKeyPrefix + k.toUpperCase()] = k;
    return envMap;
  }, {});

  var loadEnvironment = confab.loadEnvironment(envMap, {
    resolveBooleans: true
  });

  return function (config) {
    var newConfig;
    var features = assign({}, config[opts.configKey]);

    names.forEach(function (k) {
      if (!features.hasOwnProperty(k)) {
        features[k] = false;
      }
    });

    features = loadEnvironment(features);

    if (opts.validate) {
      Object.keys(features).forEach(function (k) {
        var val = features[k];
        if (names.indexOf(k) === -1) {
          throw new Error('Invalid feature defined "' + k + '"');
        }
        else if (val !== true && val !== false) {
          throw new Error('Invalid value ("' + val + '") for "' + k + '"');
        }
      });
    }

    newConfig = assign({}, config);
    newConfig[opts.configKey] = features;
    return newConfig;
  };
};
