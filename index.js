'use strict';

var confab = require('confab');
var assign = require('object-assign');

/**
 *  @private
 *  @type Function
 *  @return Function
 *  @param {Array<String, Feature>} knownFeatureByKey - a map of features
 *  @param {Object<String, Boolean>} configFeatureValuesByKey - a map of feature
 *            values
 */
function mergeConfigFeatureValuesByKey (knownFeaturesByKey, configFeatureValuesByKey) {
  var keys = Object.keys(knownFeaturesByKey).sort();
  return keys.reduce(function (allFeatureValuesByKey, k) {
    if (!allFeatureValuesByKey.hasOwnProperty(k)) {
      allFeatureValuesByKey[k] = knownFeaturesByKey[k].value;
    }
    return allFeatureValuesByKey;
  }, assign({}, configFeatureValuesByKey));
}

/**
 *  @private
 *  @type Function
 *  @return Function
 *  @param {Array<String>} knownKeys - a list of known feature keys
 *  @param {Object<String, Boolean>} featureValuesByKey - a map of feature
 *            values
 */
function validateFeatureValuesByKey (knownKeys, featureValuesByKey) {
  Object.keys(featureValuesByKey).forEach(function (k) {
    var val = featureValuesByKey[k];
    if (knownKeys.indexOf(k) === -1) {
      throw new Error('Invalid feature defined "' + k + '"');
    }
    else if (typeof val !== 'boolean') {
      throw new Error('Invalid value ("' + val + '") for "' + k + '"');
    }
  });
}

/**
 * Extends the configuration with a list of enabled features.
 *
 *     var confab = require('confab');
 *     var features = require('confab-features');
 *
 *     var config = confab([
 *       features([
 *         {
 *           key: 'new_campaign',
 *           description: 'A switch to flip'
 *         },
 *         'new_ui' // equivalent to `{ key: 'new_ui }`
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
 * The set of all defined features can be retrieved by invoking
 * `config.features` directly:
 *
 *     config.features().forEach(function (feature) {
 *       console.log(feature.key, feature.description);
 *     });
 *
 * @id features
 * @group Reference
 * @type Function
 * @param {Array} keys - a list of name features
 * @param {Object} userOpts - optional overrides for the `configKey` (default:
 *   `"features"`) and strict validation (default: `true`)
 * @return Function
 */
module.exports = function features (features, userOpts) {

  var DEFAULT_DESCRIPTION = 'no description';

  var opts = assign({
    configKey: 'features',
    validate: true
  }, userOpts);

  function createEnvKey (key) {
    var prefix = ('config_' + opts.configKey + '_').toUpperCase();
    return prefix + key.toUpperCase();
  }

  function Feature (attrs) {
    if (!(attrs && attrs.key)) {
      throw new ReferenceError('feature key is required');
    }

    this.key = attrs.key;
    this.description = attrs.description || DEFAULT_DESCRIPTION;
    this.envKey = attrs.envKey || createEnvKey(this.key);
    this.value = false;
  }

  function createFeature (item) {
    var type = !!item && typeof item;
    switch (type) {
      case 'string':
        return new Feature({ key: item });
      case 'object':
        return new Feature(item);
    }
  }

  // `definedFeaturesByKey` is the primary store of feature descriptions
  var definedFeaturesByKey = features.reduce(function (featuresByKey, item, i) {
    var feature = createFeature(item);
    var key = feature.key;
    if (featuresByKey.hasOwnProperty(key)) {
      throw new Error('features[' + i + '] is previously defined');
    }

    featuresByKey[key] = feature;
    return featuresByKey;
  }, {});

  // `definedFeatureKeys` is a convenience-only list of known feature keys
  var definedFeatureKeys = Object.keys(definedFeaturesByKey).sort();

  // `envMap` maps environment variables to config keys
  var envMap = definedFeatureKeys.reduce(function (envMap, k) {
    envMap[definedFeaturesByKey[k].envKey] = k;
    return envMap;
  }, {});

  var loadEnvironment = confab.loadEnvironment(envMap, {
    resolveBooleans: true
  });

  // Merges configuration with defined features
  return function (config) {

    var newConfig;

    // Merge default values for features missing from the `config`
    var configFeaturesValueByKey = config[opts.configKey];
    var allFeatureValuesByKey = mergeConfigFeatureValuesByKey(definedFeaturesByKey, configFeaturesValueByKey);

    // Merge environmental overrides
    var finalFeatureValuesByKey = loadEnvironment(allFeatureValuesByKey);

    // Perform optional, strict validation
    if (opts.validate) {
      validateFeatureValuesByKey(definedFeatureKeys, finalFeatureValuesByKey);
    }

    newConfig = assign({}, config);
    newConfig[opts.configKey] = assign(function () {
      // Return feature definitions, updating `value`s with any config /
      // environmental overrides
      return definedFeatureKeys.map(function (k) {
        var feature = assign({}, definedFeaturesByKey[k]);
        feature.value = finalFeatureValuesByKey[k];
        return feature;
      });
    }, finalFeatureValuesByKey);

    return newConfig;
  };
};
