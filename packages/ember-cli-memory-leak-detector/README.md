[![Node.js CI](https://github.com/steveszc/ember-cli-memory-leak-detector/actions/workflows/node.js.yml/badge.svg)](https://github.com/steveszc/ember-cli-memory-leak-detector/actions/workflows/node.js.yml)
[![Ember Observer Score](https://emberobserver.com/badges/ember-cli-memory-leak-detector.svg)](https://emberobserver.com/addons/ember-cli-memory-leak-detector)
[![npm version](https://badge.fury.io/js/ember-cli-memory-leak-detector.svg)](https://www.npmjs.com/package/ember-cli-memory-leak-detector)

ember-cli-memory-leak-detector
==============================================================================

An ember-cli addon that captures and analyzes a heap snapshot after your tests have finished running in Chrome, in order to detect memory leaks.
If any of your app's classes are retained in the heap, your tests will fail.

Compatibility
------------------------------------------------------------------------------

* Ember.js v3.16 or above
* Ember CLI v2.13 or above
* Node.js v10 or above


Installation
------------------------------------------------------------------------------

```
ember install ember-cli-memory-leak-detector
```

Update `testem.js` to use a `--remote-debugging-port=9222`. 9222 is the recommended default, but this port can be configured. You can not use ember-cli's default of `0`

```js
// testem.js
browser_args: {
  Chrome: {
    dev: ["--remote-debugging-port=9222"],
    ci: ["--remote-debugging-port=9222"]
  },
},
```

Usage
------------------------------------------------------------------------------

Whenever you run your tests in Chrome via Testem (via `ember test` or `ember test --server`), this addon will capture a heap snapshot after the tests complete and search the heap snapshot for any of your app or addon's ES classes. If any of your app or addon's classes are retained in heap snapshot (indicating a memory leak) your test suite will fail and a report of the retained class names will be logged.

### CI

When run in CI (via `ember test`/`ember exam`), this addon will ensure that your tests fail if a memory leak is introduced by a commit or PR.

#### A note about production and ci environments 
It may be desirable to run memory leak detection on a production build of the app using `ember test --environment=production`.
Production builds normally mangle class names, which breaks our ability to detect memory leaks, so this needs to be disabled.

```js
//ember-cli-build.js

'ember-cli-terser': {
  terser: {
    compress: { keep_classnames: true },
    mangle: { keep_classnames: true }
  }
}
```

Production and CI environments also (by default) add IE11 as a compile target, which will result in classes being transpiled away, so we need to remove this as well.
```js
//config/targets.js

'use strict';

const browsers = [
  'last 1 Chrome versions',
  'last 1 Firefox versions',
  'last 1 Safari versions'
];

// const isCI = Boolean(process.env.CI);
// const isProduction = process.env.EMBER_ENV === 'production';

// if (isCI || isProduction) {
//   browsers.push('ie 11');
// }

module.exports = {
  browsers
};
```

Both of these changes can be optionally implemented using ENV variables to ensure we are only making these changes when we want to run memory leak detection.

### Dev

When run during development, (via `ember test --server`) memory leaks can be detected after running individual tests or modules via the QUnit UI's filter input or module select. This enables a TDD-like experience for fixing memory leaks.

> **Note:** Memory leak detection currently relies on Testem and Chrome's remote debugging API, so it is not possible to detect memory leaks when running `ember server` and then visiting `localhost:4200/tests` in browser.

**The effectiveness of this addon is dependent on:**
1. **The coverage of your test suite.** If leaky code exists in your app but is not exercised by your tests then this add-on can not detect that leaky code.
2. **Your usage of ES classes.** This addon functions by getting a list of ES classes in your app/addon code and looking for those objects in the heap snapshot. The addon can only detect leaked objects that have a class name defined in your code.

Configuration
------------------------------------------------------------------------------

```js
// ember-cli-build.js

let app = new EmberApp(defaults, {
  'ember-cli-memory-leak-detector': {
    enabled: process.env.DETECT_MEMORY_LEAKS || false,
    failTests: false,
    ignoreClasses: ['ExpectedLeakyClass'],
    remoteDebuggingPort: '9222',
    timeout: 90000,
    writeSnapshot: true,
  },
});
```

1. `enabled` (default `true`)
Set to false to disables memory leak detection. Consider using an environment variable (`process.env.DETECT_MEMORY_LEAKS`) to control when memory leak detection is run.

1. `failTests`: (default `true`)
By default when a leak is detected we add a failed test. Set this to `false` to prevent memory leaks from causing your tests to fail, and instead log a console warning.

1. `ignoreClasses`: (default `[]`)
By default, the addon will discover all class names in your app and throw a test error if it detects any of them in the heap snapshot. Use this option to ignore specific classes that you expect to leak or plan to fix later. If any of these ignored classes are leaked they will be output as a warning in the test output. Note: framework-level classes such as App are ignored to avoid false positives.

1. `remoteDebuggingPort`: (default `9222`)
Configures which port to connect to the testem Chrome instance. This value must match the `--remote-debugging-port` flag set in your app's `testem.js`

1. `timeout`: (number, default `null`)
Configures the length of time, in milliseconds, to wait for the memory leak detection test to complete. This value will override any existing timeouts in your test framework. For example, QUnit has a default test timeout of 60s. If you expect memory leak detection to take longer than this it may be useful to specify a longer timeout for the memory leak detection test. 
*Note*: Currently this timeout is only used with QUnit

1. `writeSnapshot`: (default `false`)
Set this to `true` to write the heapsnapshot to disk as `Heap.heapsnapshot`. This is helpful for fixing memory leaks, since the file can be uploaded into Chrome DevTool's Memory panel for analysis.

Fixing memory leaks
------------------------------------------------------------------------------

Once this addon has helped you identify that your app or addon is leaking memory you can begin the process of fixing those memory leaks. 

Fixing memory leaks requires an understanding of how to find leaky application code in a heap snapshot, and an understanding of what code patterns cause memory leaks and how they can be refactored to prevent leaks. Teaching these things is outside the scope of this addon's documentation (for now, contributions welcome!) but there are some existing resources that can help you here.  

1. https://developers.google.com/web/tools/chrome-devtools/memory-problems is a great introduction to memory problems in the browser and the memory tools available in Chrome DevTools.

1. https://github.com/ember-best-practices/memory-leak-examples is a fantastic free ember-centric resource for learning about patterns that cause memory leaks, how to identify leaky code, and how to fix those leaks.

1. https://embermap.com/topics/memory-leaks Another ember-centric resource for learning about memory leaks in the context.

Most of these resources involve running some code/tests and manually capturing and analyzing a heap snapshot in Chrome DevTools. You may find that this addon paired with the `writeSnapshot` config option and `ember test`'s filter flag provide a handy way to speed up those manual processes.

Dealing with large heap snapshots
-------------------------------------------------------------------------------

Depending on the size of your app and the number of memory leaks it has you may find that the size of your heap snapshot causes problems during your test runs.

1. Consider setting the `enabled` config to an environment variable for more control over when memory leak detection is run, for example to only run in CI.

```js
'ember-cli-memory-leak-detector': {
  enabled: process.env.DETECT_MEMORY_LEAKS || false,
}
```

```bash
$ DETECT_MEMORY_LEAKS=true ember test
```

2. Allocate extra memory to node

You may find that node's default memory allocation of 512Mb is insufficient for analyzing your app's heap snapshot. In this case you may need to allocate extra memory to node, otherwise node will run out of memory and your test run will crash.

Use the `max_old_space_size` flag to allocate extra memory. The following example increases node's memory to 8Gb.

```bash
node --max_old_space_size=8192 node_modules/.bin/ember test
```

Additionally, if you are running memory leak detection in a CI environment, you may need to increase the size of your CI resource.


Contributing
------------------------------------------------------------------------------

See the [Contributing](CONTRIBUTING.md) guide for details.


License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
