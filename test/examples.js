/* eslint-env node, mocha */
"use strict";

var path = require("path");
var webpack = require("webpack");
var rimraf = require("rimraf");
var webpackMajorVersion = require("webpack/package.json").version.split(".")[0];

var OUTPUT_DIR = path.join(__dirname, "../.tmp");

/**
 * This callback is displayed as a global member.
 * @callback runExampleCallback
 * @param {number} responseCode
 * @param {string} responseMessage
 */

/**
 * Runs one of the example folders and tests the resulting
 * files against the expected result.
 *
 * @param {!string} exampleName
 * @param {runExampleCallback} callback
 */
function runExample (exampleName, callback) {
  var examplePath = path.resolve(__dirname, "..", "examples", exampleName);
  var exampleOutput = path.join(OUTPUT_DIR, exampleName);
  var fixturePath = path.join(examplePath, "dist", "webpack-" + webpackMajorVersion);

  var result = {
    root: examplePath,
    source: examplePath,
    dist: exampleOutput,
  };
  // Clear old results
  rimraf(exampleOutput, function () {
    var options = require(path.join(examplePath, "webpack.config.js"));
    options.context = examplePath;
    options.output.path = exampleOutput;
    webpack(options, function (err) {
      if (err) {
        callback(err);
      } else {
        callback(null, result);
      }
    });
  });
}

const examples = [
  "default",
];

describe("examples", function () {
  for (var i = 0, len = examples.length; i < len; ++i) {
    (function (name) {
      it("should run the " +name+ " example.", function (done) {
        runExample(name, function (err) {
          done(err);
        });
      });
    })(examples[i]);
  }
});
