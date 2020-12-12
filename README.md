ember-cli-memory-leak-detector
==============================================================================

An ember-cli addon that captures and analyzes a heap snapshot after you tests have finished running in Chrome, in order to detect memory leaks.
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
    dev: [
      "--remote-debugging-port=9222",
    ],
    ci: [
      "--remote-debugging-port=9222",
    ]
  },
},
```

Configuration
------------------------------------------------------------------------------

1. `enabled` (default `true`)
Set to false to disables memory leak detection. 

2. `error`: (default `true`)
By default, an error is thrown when a leak is detected, causing test failure. Set this to false to prevent memory leaks from causing your tests to fail, and instead log a console warning.

3. `remoteDebuggingPort`: (default `9222`)
Configures which port to connect to the testem Chrome instance. This value must match the `--remote-debugging-port` flag set in your app's `testem.js`

4. `ignoreClasses`: (default `["App"]`)
By default, the addon will discover all class names in your app and detect them in the heap snapshot. Use this to ignore specific classes that you expect to leak or plan to fix later. `App` should always be ignored since it will cause false positives in Ember's test environment.

5. `writeSnapshot`: (default `false`)
Set this to `true` to write the heapsnapshot to disk as `Heap.heapsnapshot`. This is helpful for fixing memory leaks, since the file can be uploaded into Chrome DevTool's Memory panel for analysis.

Usage
------------------------------------------------------------------------------

Whenever you run your tests in Chrome, this addon will capture a heap snapshot after the tests complete and search the heap snapshot for any of your app's ES classes. If any app classes are retained in heap snapshot (indicating a memory leak) your test suite will fail and a report of the retained class names will be logged.

**The effecitveness of this addon is dependent on:**
1. **The coverage of your test suite.** If leaky code exists in your app but is not exercised by your tests then this add-on can not detect that leaky code.
2. **Your usage of ES classes.** This addon functions by getting a list of ES classes in your app/addon code and looking for those objects in the heap snapshot. The addon can only detect leaked objects that have a class name defined in your code.

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

Depending on the size of your app and the number of memory leaks it has you may find that the size of your heapsnapshot causes problems during your test runs.

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
