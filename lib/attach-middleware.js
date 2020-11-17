const CDP = require("chrome-remote-interface");
const glob = require("glob");
const fs = require("fs-extra");
const Heapsnapshot = require("heapsnapshot");

function attachMiddleware({ app, addon }) {
  const config = readConfig(addon);
  const classes = getAppClasses(addon);

  app.get("/detect_memory_leak", async function (req, res) {
    const title = decodeURI(req.query.title);
    const retainedClasses = await detectMemoryLeak({ title, classes }, config);
    const payload = buildPayload(retainedClasses, config);
    res.json(payload);
  });
}

function getAppClasses(addon) {
  const appJsFiles = glob.sync(addon.app.trees.app + "/**/*.js");
  const classNames = appJsFiles
    .map((file) => {
      const content = fs.readFileSync(file, { encoding: "utf-8" });
      return getClassNameFromFile(content);
    })
    .filter(Boolean);
  return ["Container", ...classNames];
}

function getClassNameFromFile(fileContents) {
  const _export_default_class = "export default class ";
  const _extends = " extends ";
  const classNameIndex = fileContents.indexOf(_export_default_class);
  if (classNameIndex > -1) {
    const classNameStart = classNameIndex + _export_default_class.length;
    const classNameEnd = fileContents.indexOf(_extends);
    return fileContents.slice(classNameStart, classNameEnd);
  }

  return false;
}

async function detectMemoryLeak({ title, classes }, config) {
  try {
    const browserTab = await connectToTestBrowserTab(title, config.port);
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

    return retainedClasses;
  } catch (e) {
    console.warn(`error detecting memory leak: ${e}`);
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
    console.log(`connected to chrome via CDP: ${testTarget.url}`);
    return client;
  } catch (e) {
    throw new Error(
      `unable to connect to chrome tab with title ${title}. ${e}`
    );
  }
}

async function captureHeapSnapshot(client) {
  try {
    let heapSnapshotChunks = [];
    client.on("HeapProfiler.addHeapSnapshotChunk", ({ chunk }) => {
      heapSnapshotChunks.push(chunk);
    });

    await client.HeapProfiler.takeHeapSnapshot({ reportProgress: false });

    await fs.writeFile("Heap.heapsnapshot", heapSnapshotChunks.join(""));

    const snapshot = Heapsnapshot.fromFileSync("Heap.heapsnapshot");

    fs.unlink("Heap.heapsnapshot");

    return snapshot;
  } catch (e) {
    throw new Error(`error taking heap snapshot: ${e}`);
  }
}

function readConfig(addon) {
  let app = addon.app;
  let config = app.project.config(app.env);
  return config[addon.name];
}

module.exports = attachMiddleware;
