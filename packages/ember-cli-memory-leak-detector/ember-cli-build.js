'use strict';

const EmberAddon = require('ember-cli/lib/broccoli/ember-addon');

module.exports = function(defaults) {
  let app = new EmberAddon(defaults, {
    'ember-cli-memory-leak-detector': {
      enabled: !process.env.DISABLE,
      failTests: !process.env.NOFAIL,
      ignoreClasses: ['LeakyComponent'],
    },
    'ember-cli-terser': {
      terser: {
        compress: { keep_classnames: true },
        mangle: { keep_classnames: true }
      }
    }
  });

  /*
    This build file specifies the options for the dummy test app of this
    addon, located in `/tests/dummy`
    This build file does *not* influence how the addon or the app using it
    behave. You most likely want to be modifying `./index.js` or app's build file
  */

  return app.toTree();
};
