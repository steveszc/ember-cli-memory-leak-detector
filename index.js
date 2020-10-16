"use strict";

const path = require("path");
const fs = require("fs-extra");
const attachMiddleware = require("./lib/attach-middleware");

module.exports = {
  name: require("./package").name,

  contentFor(type) {
    if (type === "test-body-footer" && this._isMemoryLeakDetectionEnabled()) {
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
    if (this._isMemoryLeakDetectionEnabled()) {
      attachMiddleware(app);
    }
  },

  testemMiddleware(app) {
    if (this._isMemoryLeakDetectionEnabled()) {
      attachMiddleware(app);
    }
  },

  _isMemoryLeakDetectionEnabled() {
    return true;
  },
};
