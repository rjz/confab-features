confab-features
===============================================================================

[![Build
Status](https://travis-ci.org/rjz/confab-features.svg?branch=master)](https://travis-ci.org/rjz/confab-features)
[![Coverage
Status](https://coveralls.io/repos/rjz/confab-features/badge.svg?branch=master)](https://coveralls.io/r/rjz/confab-features?branch=master)

Feature gates for [confab][confab]. Declare a list of features that can be
toggled on and off:

```js
var confab = require('confab');
var features = require('confab-features');

var config = confab([
  features([
    'new_ui'
  ])
]);
```

Run the app with gates set by either a previous transformation or environment
overrides:

```sh
$ CONFIG_FEATURES_NEW_UI=true \
  node app.js
```

Then, inside the app, retrieve the feature configurations from a processed
confab `config`:

```js
if (config.features.new_ui) {
  renderNewUi();
}
else {
  renderLegacyUi();
}
```

The full list of configured features is available by invoking `config.features`
directly:

```js
config.features().forEach(function (feature) {
  console.log(feature.key, feature.description);
});
```

API
-------------------------------------------------------------------------------

`confab-features` exports:

```js
features(items: Array<Object|String>, opts: Map<String, any>): Map<String, Boolean>
```

Note that `items` may contain both string `keys` and simple object with a `key`
and (optional) description of the feature:

```
[
  'new_ui',
  { key: 'new_campaign', description: 'A switch to flip' }
]
```

#### opts

Name        | Type      | Description
----------- | --------- | --------------------------------
`configKey` | `String`  | The `config` key for `'features'` and environment variables (default: `'features'`)
`validate`  | `Boolean` | Throw on undeclared or invalid feature settings (default: `true`)

> Quis configiet ipsos configes?

Development
-------------------------------------------------------------------------------

Clone this repository:

    $ git clone git@github.com:rjz/confab-features.git

...and copy, fork, customize, and whatever you need to do.

Testing
-------------------------------------------------------------------------------

Lint and run test suite:

    $ npm test

License
-------------------------------------------------------------------------------

MIT

[confab]: https://github.com/rjz/confab

