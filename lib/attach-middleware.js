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

      const message = buildMessage(retainedClasses);

      if (retainedClasses.length) {
        if (config.error) {
          addon.ui.writeError({
            message: `${addon.name}: ${message}`,
          });
          res.json({ classes: retainedClasses, error: true });
        } else {
          addon.ui.writeWarnLine(`${addon.name}: ${message}`);
          res.json({ classes: retainedClasses });
        }
      } else {
        addon.ui.writeInfoLine(`${addon.name}: ${message}`);
        res.json({ classes: retainedClasses });
      }
    } catch (error) {
      addon.ui.writeError({ message: `${addon.name}: ${error}` });
      res.json({});
    }
  };
}

function buildMessage(retainedClasses = []) {
  const formattedListOfRetainedClasses = retainedClasses
    .map(([name, count]) => `${name} x${count}`)
    .join("\n");
  const report = `Memory leak detected. The following classes were retained in the heap after tests completed:\n ${formattedListOfRetainedClasses}`;

  return retainedClasses.length ? report : "All clear";
}
