const CDP = require("chrome-remote-interface");
const fs = require("fs");
const { promisify } = require("util");
const writeFile = promisify(fs.writeFile);
const Heapsnapshot = require("heapsnapshot");

module.exports = async function detectMemoryLeak({
  title,
  classes,
  port,
  writeSnapshot,
}) {
  const client = await createCDPClient(title, port);
  const snapshot = await captureHeapSnapshot(client, writeSnapshot);
  const retainedClasses = findRetainedClassesInSnapshot(classes, snapshot);

  return retainedClasses;
};

async function createCDPClient(title, port) {
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
    throw new Error(`Unable to connect to chrome. ${e}`);
  }
}

async function captureHeapSnapshot(client, writeSnapshot) {
  let heapSnapshotChunks = [];
  client.on("HeapProfiler.addHeapSnapshotChunk", ({ chunk }) => {
    heapSnapshotChunks.push(chunk);
  });

  await client.HeapProfiler.takeHeapSnapshot({ reportProgress: false });

  if (writeSnapshot) {
    await writeFile("Heap.heapsnapshot", heapSnapshotChunks.join(""));
  }

  const parsedHeapSnapshot = JSON.parse(heapSnapshotChunks.join(""));

  return new Heapsnapshot(parsedHeapSnapshot);
}

function findRetainedClassesInSnapshot(classes, snapshot) {
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
