"use strict";

const path = require("path");
const fs = require("fs");
const attachMiddleware = require("./lib/attach-middleware");

module.exports = {
  name: require("./package").name,

  contentFor(type) {
    if (type === "test-body-footer" && this.isEnabled()) {
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
    const { enabled } = this.project.config()[this.name];
    return isDirectDependency && enabled;
  },
};
