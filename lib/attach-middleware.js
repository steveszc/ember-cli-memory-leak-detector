const detectMemoryLeak = require("./detect-memory-leak");
const inventoryClasses = require("./inventory-classes");

module.exports = function attachMiddleware({ app, addon }) {
  app.get("/detect_memory_leak", handleDetectMemoryLinkRequest(addon));
};

function handleDetectMemoryLinkRequest(addon) {
  return async function (req, res) {
    const config = addon.readConfig();
    try {
      addon.ui.startProgress(
        `${addon.name}: capturing and analyzing heap snapshot...\n`
      );

      const retainedClasses = await detectMemoryLeak({
        port: config.remoteDebuggingPort,
        title: decodeURI(req.query.title),
        classes: inventoryClasses(addon),
      });

      addon.ui.stopProgress();

      const errorClasses = retainedClasses.filter(
        ([name]) => !config.ignoreClasses.includes(name)
      );
      const warningClasses = retainedClasses.filter(([name]) =>
        config.ignoreClasses.includes(name)
      );

      logResults({ addon, errorClasses, warningClasses });

      if (config.error && errorClasses.length) {
        res.json({ error: true });
      } else {
        res.json({});
      }
    } catch (error) {
      addon.ui.writeError({ message: `${addon.name}: ${error}` });
      res.json({});
    }
  };
}

function logResults({ addon, errorClasses = [], warningClasses = [] }) {
  const config = addon.readConfig();

  const formatClassList = (classList = []) =>
    classList.map(([name, count]) => `  ${name} x${count}`).join("\n");

  const errorMessage = `Memory leak detected. \nThe following classes were retained in the heap after tests completed: \n${formatClassList(
    errorClasses
  )}`;

  const warningMessage = `The following ignored classes were retained in the heap after tests completed: \n${formatClassList(
    warningClasses
  )}`;

  if (errorClasses.length) {
    if (config.error) {
      addon.ui.writeError({ message: `${addon.name}: ${errorMessage}` });
    } else {
      addon.ui.writeWarnLine(`${addon.name}: ${errorMessage}`);
    }
  }

  if (warningClasses.length) {
    addon.ui.writeWarnLine(`${addon.name}: ${warningMessage}`);
  }

  if (!warningClasses.length && !errorClasses.length) {
    addon.ui.writeInfoLine(`${addon.name}: All clear`);
  }
}
