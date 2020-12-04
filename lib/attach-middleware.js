const CDP = require("chrome-remote-interface");
const glob = require("glob");
const fs = require("fs");
const Heapsnapshot = require("heapsnapshot");

function attachMiddleware({ app, addon }) {
  const config = readConfig(addon);
  const classes = getClassesToDetect(addon, config);

  app.get("/detect_memory_leak", async function (req, res) {
    try {
      addon.ui.startProgress(
        `${addon.name}: capturing and analyzing heap snapshot...\n`
      );

      const title = decodeURI(req.query.title);
      const retainedClasses = await detectMemoryLeak(
        { title, classes },
        config
      );

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
  });
}

function getClassesToDetect(addon, config) {
  let isSelf = addon.parent.name() === addon.name;
  let parentIsAddon = addon.parent.isEmberCLIAddon();
  let jsPath;

  if (isSelf) {
    jsPath = "tests/dummy/app";
  } else if (parentIsAddon) {
    jsPath = `${addon.parent.root}/addon`;
  } else {
    jsPath =
      (addon.app.trees.app && addon.app.trees.app._directoryPath) ||
      addon.app.trees.app;
  }
  const jsFiles = glob.sync(jsPath + "/**/*.js");
  const classNames = jsFiles
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
  const browserTab = await connectToTestBrowserTab(
    title,
    config.remoteDebuggingPort
  );
  const snapshot = await captureHeapSnapshot(browserTab);

  const classesSet = new Set(classes);
  const retainedClasses = new Map();

  for (const node of snapshot) {
    if (node.type === "object" && classesSet.has(node.name)) {
      let retainedCount = retainedClasses.get(node.name) || 0;
      retainedClasses.set(node.name, retainedCount + 1);
    }
  }

  return [...retainedClasses];
}

function buildMessage(retainedClasses = []) {
  const formattedListOfRetainedClasses = retainedClasses
    .map(([name, count]) => `${name} x${count}`)
    .join("\n");
  const report = `Memory leak detected. The following classes were retained in the heap after tests completed:\n ${formattedListOfRetainedClasses}`;

  return retainedClasses.length ? report : "All clear";
}

async function connectToTestBrowserTab(title, port) {
  try {
    const targets = await CDP.List({ port });
    const testTarget = targets.find((target) => target.title === title);
    if (!testTarget) {
      throw new Error(
        `Tab titled "${title}" did not match any of: ${targets
          .map((t) => `"${t.title}"`)
          .join(", ")}`
      );
    }
    const client = await CDP({ target: testTarget, port });
    return client;
  } catch (e) {
    throw new Error(
      `ember-cli-memory-leak-detector: unable to connect to chrome. ${e}`
    );
  }
}

async function captureHeapSnapshot(client) {
  let heapSnapshotChunks = [];
  client.on("HeapProfiler.addHeapSnapshotChunk", ({ chunk }) => {
    heapSnapshotChunks.push(chunk);
  });

  await client.HeapProfiler.takeHeapSnapshot({ reportProgress: false });

  const parsedHeapSnapshot = JSON.parse(heapSnapshotChunks.join(""));

  return new Heapsnapshot(parsedHeapSnapshot);
}

function readConfig(addon) {
  return addon.parent.config()[addon.name];
}

module.exports = attachMiddleware;
