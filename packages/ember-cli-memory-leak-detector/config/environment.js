"use strict";

module.exports = function (/* environment, appConfig */) {
  return {
    "ember-cli-memory-leak-detector": {
      enabled: true,
      failTests: true,
      remoteDebuggingPort: 9222,
      timeout: null,
      ignoreClasses: [],
      writeSnapshot: false,
    },
  };
};
