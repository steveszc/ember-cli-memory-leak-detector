"use strict";

const assert = require("assert").strict;
const execa = require("execa");
const path = require('path');

const cwd = path.join(__dirname, 'my-app');

describe("Acceptance | Memory leak detection", function () {
  this.timeout(60 * 1000);

  it("fails tests when memory leak is detected", async function () {
    try {
      await execa("ember", ["test"], { cwd });
    } catch ({ exitCode, stdout }) {
      assert.equal(exitCode, 1, "Exits with non-zero status code");
      assert(stdout.includes('ember-cli-memory-leak-detector: detect memory leaks'), 'ran memory leak detection');
      assert(stdout.includes("LeakyService"), "Reports the leaked service");
      assert(stdout.includes('LeakyComponent 1x (ignored)'), "Warns about the ignored LeakyComponent")
      assert(!stdout.includes("NonleakyService"), "Only reports the leaked service");
    }
  });

  it("fails tests when memory leak is detected in production mode", async function () {
    try {
      await execa("ember", ["test", "--environment=production"], { cwd });
    } catch ({ exitCode, stdout }) {
      assert.equal(exitCode, 1, "Exits with non-zero status code");
      assert(stdout.includes('ember-cli-memory-leak-detector: detect memory leaks'), 'ran memory leak detection');
      assert(stdout.includes("LeakyService"), "Reports the leaked service");
      assert(stdout.includes('LeakyComponent 1x (ignored)'), "Warns about the ignored LeakyComponent")
      assert(!stdout.includes("NonleakyService"), "Only reports the leaked service");
    }
  });

  it("passes tests if only ignored classes are detected", async function () {
    let { exitCode, stdout } = await execa("ember", ["test", '--filter=leaky component'], { cwd });

    assert.equal(exitCode, 0, "Exits with a zero status code");
    assert(stdout.includes('LeakyComponent 1x (ignored)'), "Warns about the ignored LeakyComponent");
  });

  it("passes tests if no memory leaks are detected", async function () {
    let { exitCode, stdout } = await execa("ember", ["test", "--filter=nonleaky"], { cwd });

    assert.equal(exitCode, 0, "Exits with a zero status code");
    assert(stdout.includes('No memory leaks detected'), 'No memory leaks detected');
  });

  it("skips detection if config.enabled is false", async function () {
    let env = { DISABLE: true };
    let { exitCode, stdout } = await execa("ember", ["test"], { cwd, env });

    assert.equal(exitCode, 0, "Exits with a zero status code");
    assert(!stdout.includes('ember-cli-memory-leak-detector: detect memory leaks'), 'did not run memory leak detection');
  });

  it("passes tests if config.failTests is false", async function () {
    let env = { NOFAIL: true };
    let { exitCode, stdout } = await execa("ember", ["test"], { cwd, env });

    assert.equal(exitCode, 0, "Exits with a zero status code");
    assert(stdout.includes('WARN: The following classes were retained in the heap:'), 'Warns of leaked classes');
  });
});
