const CDP = require("chrome-remote-interface");
const { getHeapSnapshot } = require("headless-devtools");

function attachMiddleware(app) {
  app.get("/detect_memory_leak", async function (req, res, next) {
    const payload = await detectMemoryLeak({
      title: decodeURI(req.query.title),
      classes: req.query.classes.split(","),
    });

    if (payload.hasMemoryLeak) {
      console.warn(`
      ------ Fail: Memory leak detected -------`);
    }

    res.json(payload);
  });
}

async function detectMemoryLeak({ title, classes }) {
  try {
    const client = await connectToClient(title);
    const heapSnapshot = await captureHeapSnapshot(client);

    const _classes = {};

    classes.forEach((_class) => {
      let hasLeak = heapSnapshot.strings.includes(_class);
      _classes[_class] = {
        leak: hasLeak,
        retainedCount: hasLeak ? 1 : 0,
      };
    });

    const hasMemoryLeak = classes.some((_class) => _classes[_class].leak);

    return {
      snapshotSize: heapSnapshot.totalSize,
      hasMemoryLeak,
      classes: _classes,
    };
  } catch (e) {
    console.warn(`error detecting memory leak: ${e}`);
    return { hasMemoryLeak: false, errors: [e] };
  }
}

async function connectToClient(title) {
  try {
    const targets = await CDP.List();
    const testTarget = targets.find((target) => target.title === title);
    if (!testTarget) {
      throw new Error();
    }
    const client = await CDP({ target: testTarget });
    console.log(`connected to chrome via CDP: ${testTarget.url}`);
    return client;
  } catch (e) {
    throw new Error(`unable to connect to chrome tab with title ${title}`);
  }
}

async function captureHeapSnapshot(client) {
  try {
    let heapSnapshotChunks = [];
    client.on("HeapProfiler.addHeapSnapshotChunk", ({ chunk }) => {
      heapSnapshotChunks.push(chunk);
    });

    await client.HeapProfiler.takeHeapSnapshot({ reportProgress: false });

    const heapSnapshot = await getHeapSnapshot(heapSnapshotChunks);
    console.log(`Captured heap snap shot of size: ${heapSnapshot.totalSize} B`);

    return heapSnapshot;
  } catch (e) {
    throw new Error(`error taking heap snapshot: ${e}`);
  }
}

module.exports = attachMiddleware;
