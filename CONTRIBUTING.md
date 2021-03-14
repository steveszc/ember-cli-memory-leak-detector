# How To Contribute

## Installation

* `git clone <repository-url>`
* `cd ember-cli-memory-leak-detector`
* `npm install`

## Linting

* `cd packages/ember-cli-memory-leak-detector`
* `npm run lint:hbs`
* `npm run lint:js`
* `npm run lint:js -- --fix`

## Running tests

* `npm run test:node` - Runs the monorepo node tests, which verify memory leak detection behavior.

* `cd packages/ember-cli-memory-leak-detector`
* `ember test` – Runs the dummy app test suite on the current Ember version. Will fail with a memory leak detection.
* `ember test --server` – Runs the dummy app test suite in "watch mode"
* `ember try:each` – Runs the dummy app test suite against multiple Ember versions

## Running the dummy application

* `cd packages/ember-cli-memory-leak-detector`
* `ember serve`
* Visit the dummy application at [http://localhost:4200](http://localhost:4200).

For more information on using ember-cli, visit [https://ember-cli.com/](https://ember-cli.com/).

## Debugging

Since most of this addon's functionality takes place in node, it can be helpful to run commands with a node debugger enabled. 

1. Place a debugger anywhere in the `lib` directory js files.
1. Visit `chrome://inspect` in Chrome
1. Click `Open dedicated DevTools for Node`
1. Run `node --inspect node_modules/.bin/ember test`, for example, to run the dummy app tests and stop on the debugger once memory leak detection runs.
