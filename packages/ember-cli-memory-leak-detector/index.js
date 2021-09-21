"use strict";

const deprecate = require('ember-cli/lib/utilities/deprecate');
const path = require("path");
const fs = require("fs");
const attachMiddleware = require("./lib/attach-middleware");

const DEFAULT_CONFIG = {
  enabled: true,
  failTests: true,
  ignoreClasses: [],
  remoteDebuggingPort: 9222,
  timeout: null,
  writeSnapshot: false,
};

module.exports = {
  isConfigDeprecationTriggered: false,
  name: require("./package").name,

  contentFor(type) {
    let { timeout, failTests } = this.readConfig();
    if (type === "test-body-footer" && this.isEnabled()) {
      const template = fs
        .readFileSync(
          path.join(__dirname, "lib", "templates", "test-body-footer.html")
        )
        .toString();
      return template.replace('{%TIMEOUT%}', timeout).replace('{%FAIL_TESTS%}', failTests);
    }

    return undefined;
  },

  serverMiddleware({ app }) {
    if (this.isEnabled()) {
      attachMiddleware({ app, addon: this });
    }
  },

  testemMiddleware(app) {
    if (this.isEnabled()) {
      attachMiddleware({ app, addon: this });
    }
  },

  readConfig() {
    const hostEnvConfig = this.project.config()[this.name];
    const hostBuildConfig = this._findHost().options[this.name];

    if (hostEnvConfig && this.isConfigDeprecationTriggered === false) {
      this.isConfigDeprecationTriggered = true;

      deprecate(
        'Configuring "ember-cli-memory-leak-detector" via "config/environment.js" is deprecated. Please use "ember-cli-build.js" instead.',
        true
      );

      return hostEnvConfig;
    }

    return hostBuildConfig || DEFAULT_CONFIG;
  },

  isEnabled() {
    const isDirectDependency = this.parent === this.project;
    const { enabled } = this.readConfig();
    return isDirectDependency && enabled;
  },
};
