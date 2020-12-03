const CDP = require("chrome-remote-interface");
const glob = require("glob");
const fs = require("fs");
const Heapsnapshot = require("heapsnapshot");

function attachMiddleware({ app, addon }) {
  const config = readConfig(addon);
  const classes = getAppClasses(addon, config);

  app.get("/detect_memory_leak", async function (req, res) {
    const title = decodeURI(req.query.title);
    const retainedClasses = await detectMemoryLeak({ title, classes }, config);
    const payload = buildPayload(retainedClasses, config);
    res.json(payload);
  });
}

function getAppClasses(addon, config) {
  const appPath =
    (addon.app.trees.app && addon.app.trees.app._directoryPath) ||
    addon.app.trees.app;
  const appJsFiles = glob.sync(appPath + "/**/*.js");
  const classNames = appJsFiles
    .map((file) => {
      const content = fs.readFileSync(file, { encoding: "utf-8" });
      return getClassNameFromFile(content);
    })
    .filter((name) => name && !config.ignoreClasses.includes(name));
  return classNames;
}

function getClassNameFromFile(fileContents) {
  const _export_default_class = "export default class ";
  const classNameIndex = fileContents.indexOf(_export_default_class);
  if (classNameIndex === -1) return false;

  const classNameStart = classNameIndex + _export_default_class.length;
  const classNameLength = fileContents.slice(classNameStart).indexOf(" ");
  return fileContents.slice(classNameStart, classNameStart + classNameLength);
}

async function detectMemoryLeak({ title, classes }, config) {
  try {
    const browserTab = await connectToTestBrowserTab(
      title,
      config.remoteDebuggingPort
    );
    console.log(`Memory leak detector: capturing heapsnapshot`);
    const snapshot = await captureHeapSnapshot(browserTab);
    const nodes = [...snapshot];

    const retainedClasses = [];

    classes.forEach((_class) => {
      let retainedClassNodes = nodes.filter(
        (node) => node.type === "object" && node.name === _class
      );
      if (retainedClassNodes.length > 0) {
        retainedClasses.push({
          name: _class,
          nodes: retainedClassNodes.length,
        });
      }
    });
    console.log(
      `Memory leak detector: ${
        retainedClasses.length ? "Leak detected" : "All clear"
      }`
    );
    return retainedClasses;
  } catch (e) {
    console.warn(`Memory leak detector: ${e}`);
    return [];
  }
}

function buildPayload(retainedClasses = [], config) {
  const message = `Memory leak detected. The following classes were retained after tests completed: ${retainedClasses
    .map((c) => c.name)
    .join(", ")}`;

  if (!retainedClasses.length) {
    return { classes: [] };
  } else if (config.error) {
    return { classes: retainedClasses, error: message };
  } else {
    console.warn(`warning: ${message}`);
    return { classes: retainedClasses };
  }
}

async function connectToTestBrowserTab(title, port) {
  try {
    const targets = await CDP.List({ port });
    const testTarget = targets.find((target) => target.title === title);
    if (!testTarget) {
      throw new Error();
    }
    const client = await CDP({ target: testTarget, port });
    return client;
  } catch (e) {
    throw new Error(`Memory leak detector: unable to connect to chrome. ${e}`);
  }
}

async function captureHeapSnapshot(client) {
  try {
    let heapSnapshotChunks = [];
    client.on("HeapProfiler.addHeapSnapshotChunk", ({ chunk }) => {
      heapSnapshotChunks.push(chunk);
    });

    await client.HeapProfiler.takeHeapSnapshot({ reportProgress: false });

    const parsedHeapSnapshot = JSON.parse(heapSnapshotChunks.join(""));

    return new Heapsnapshot(parsedHeapSnapshot);
  } catch (e) {
    throw new Error(`error taking heap snapshot: ${e}`);
  }
}

function readConfig(addon) {
  return addon.parent.config()[addon.name];
}

module.exports = attachMiddleware;
