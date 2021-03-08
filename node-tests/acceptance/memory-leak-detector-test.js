"use strict";

const assert = require("assert");
const execa = require("execa");

describe("Acceptance | Memory leak detection", function () {
  this.timeout(60 * 1000);

  it("fails tests when memory leak is detected", async function () {
    try {
      await execa("ember", ["test"]);
    } catch ({ exitCode, stdout }) {
      assert.strictEqual(exitCode, 1, "Exits with non-zero status code");
      assert(stdout.includes("LeakyService"), "Reports the leaked service");
      assert(
        !stdout.includes("NonleakyService"),
        "Only reports the leaked service"
      );
    }
  });

  it("passes tests if no memory leaks are detected", async function () {
    let { exitCode } = await execa("ember", ["test", "--filter=nonleaky"]);
    assert.strictEqual(exitCode, 0, "Exits with a zero status code");
  });
});
