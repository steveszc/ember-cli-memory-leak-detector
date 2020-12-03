"use strict";

const path = require("path");
const fs = require("fs");
const attachMiddleware = require("./lib/attach-middleware");

module.exports = {
  name: require("./package").name,

  config() {
    return {
      "ember-cli-memory-leak-detector": {
        enabled: true,
        error: true,
        remoteDebuggingPort: 9222,
        ignoreClasses: ["App"],
      },
    };
  },

  contentFor(type, config) {
    if (
      type === "test-body-footer" &&
      config["ember-cli-memory-leak-detector"] &&
      config["ember-cli-memory-leak-detector"].enabled &&
      this.isEnabled()
    ) {
      const template = fs
        .readFileSync(
          path.join(__dirname, "lib", "templates", "test-body-footer.html")
        )
        .toString();
      return template;
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

  isEnabled() {
    const isDirectDependency = this.parent === this.project;
    return isDirectDependency;
  },
};
