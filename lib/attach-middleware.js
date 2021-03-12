const detectMemoryLeak = require("./detect-memory-leak");
const inventoryClasses = require("./inventory-classes");

module.exports = function attachMiddleware({ app, addon }) {
  app.get("/detect_memory_leak", handleDetectMemoryLinkRequest(addon));
};

function handleDetectMemoryLinkRequest(addon) {
  return async function (req, res) {
    const config = addon.readConfig();
    try {

      const results = await detectMemoryLeak({
        port: config.remoteDebuggingPort,
        title: decodeURI(req.query.title),
        classes: inventoryClasses(addon),
      });

      const retainedClasses = results.filter(([name]) => name !== 'App');

      const leakedClasses = retainedClasses.filter(
        ([name]) => !config.ignoreClasses.includes(name)
      );
      const ignoredLeakedClasses = retainedClasses.filter(([name]) =>
        config.ignoreClasses.includes(name)
      );

      res.json({ failWithLeakedClasses: config.failTests, leakedClasses, ignoredLeakedClasses });
    } catch (error) {
      addon.ui.writeError({ message: `${addon.name}: ${error}` });
      res.json({ error: `${error}` });
    }
  };
}
