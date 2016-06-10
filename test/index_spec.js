/* globals describe, it: false */
'use strict';

var assert = require('assert');
var assign = require('object-assign');
var fork = require('child_process').fork;
var featureGates = require('../index');
var path = require('path');

describe('confab-feature-gates', function () {

  it('defaults values to false', function () {
    var config = featureGates(['widgets', 'existing'])({});
    assert.equal(config.features.widgets, false);
  });

  it('respects pre-defined values', function () {
    var config = featureGates(['widgets', 'existing'])({
      features: {
        existing: true
      }
    });
    assert.equal(config.features.existing, true);
  });

  it('throws on invalid values', function () {
    var initialConfig = {
      features: {
        widgets: 'non-committal'
      }
    };

    try {
      featureGates(['widgets', 'existing'])(initialConfig);
    }
    catch (err) {
      assert.ok(err.message.match(/Invalid value/) !== null);
    }
  });

  it('throws on undefined features', function () {
    var initialConfig = {
      features: {
        fizzzz: true
      }
    };

    try {
      featureGates([])(initialConfig);
    }
    catch (err) {
      assert.ok(err.message.match(/Invalid feature/) !== null);
    }
  });

  describe('when opts.configKey is something else entirely', function () {
    it('assigns features to the specified key', function () {
      var initialConfig = {
        fafhrd: {
          existing: true
        }
      };

      var config = featureGates(['widgets', 'existing'], {
        configKey: 'fafhrd'
      })(initialConfig);

      assert.equal(config.fafhrd.existing, true);
    });
  });

  describe('when opts.validate is disabled', function () {
    it('silently passes invalid keys', function () {
      var initialConfig = {
        features: {
          existing: 'invalid'
        }
      };

      var config = featureGates(['widgets', 'existing'], {
        validate: false
      })(initialConfig);

      assert.equal(config.features.existing, 'invalid');
    });
  });

  describe('when environment variables override', function () {

    function execTestAppWithEnv (env, callback) {
      var testAppPath = path.resolve(__dirname, 'app.js');
      var opts = { env: assign({}, process.env, env) };
      var child = fork(testAppPath, [], opts);
      child.on('error', callback);
      child.on('message', function (message) {
        if (message.name !== 'FEATURES') {
          return callback(new Error('Unexpected message' + JSON.stringify(message)));
        }

        callback(null, message.data);
      });
    }

    it('keeps existing values', function (done) {
      execTestAppWithEnv({
        'CONFIG_FEATURES_WIDGETS': 'true'
      }, function (err, features) {
        if (err) return done(err);
        assert.equal(features.widgets, true);
        assert.equal(features.existing, true);
        done();
      });
    });

    it('merges them', function (done) {
      execTestAppWithEnv({
        'CONFIG_FEATURES_EXISTING': 'false'
      }, function (err, features) {
        if (err) return done(err);
        assert.equal(features.existing, false);
        done();
      });
    });

    it('ignores unknown features', function (done) {
      execTestAppWithEnv({
        'CONFIG_FEATURES_UNKNOWN': 'true'
      }, function (err, features) {
        if (err) return done(err);
        assert.equal(Object.keys(features).toString(), 'existing,widgets');
        done();
      });
    });
  });
});
