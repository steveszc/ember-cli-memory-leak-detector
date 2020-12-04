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

Usage
------------------------------------------------------------------------------

Whenever you run your tests in Chrome, this addon will capture a heap snapshot after the tests complete and search the heap snapshot for any of your app's ES classes. If any app classes are retained in heap snapshot (indicating a memory leak) your test suite will fail and a report of the retained class names will be logged.

This addon works best if your app is using ES class syntax (`export default class MyComponent extends Component {}`) since it detects class names.


Contributing
------------------------------------------------------------------------------

See the [Contributing](CONTRIBUTING.md) guide for details.


License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
