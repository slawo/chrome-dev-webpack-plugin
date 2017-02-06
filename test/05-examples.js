/* eslint-env node, mocha */
"use strict";

var expect = require("chai").expect;
var fs = require("fs");
var path = require("path");

const TESTS_PATH = "../examples";

var updateTestPath = function (test) {
  return new Promise(function (resolve, reject) {
    if ("undefined" === typeof test.source) {
      var folder = path.join(__dirname, TESTS_PATH, test.name);
      test.source = folder;
    }
    fs.stat(test.source, function (err, stats) {
      if (err) {
        reject(err);
      } else if (stats.isDirectory) {
        resolve(test);
      } else {
        reject(new Error("failed to find the folder"));
      }
    });
  });
};

var updateTestscenarios = function (test) {
  return new Promise(function (resolve, reject) {
    fs.readFile(path.join(test.source, "fixture", "manifest.json"), function(err, data) {
      if (err) {
        reject(err);
      }
      console.log(data);
      test.fixture = JSON.parse(data);
      resolve(test);
    });
  });
};

var setupTest = function (name) {
  var test = name;
  if ("string" === typeof name) {
    test = {
      name: name,
    };
  }
  return Promise.resolve(test).then(function (test) {
    return updateTestPath(test);
  }).then(function(test) {
    return updateTestscenarios(test);
  });
  //retrieve the folder of the example
  //retrieve the config
  //retrieve the test
  //return the test scenario.
};

var spawnTest = function (test) {
  return new Promise(function (resolve, reject) {
    var result = null;

    var cp = require("child_process");
    var opts = {
      cwd: test.source
    };
    var child = cp.fork(path.join(__dirname, "..", "examples", "run-test.js"), [JSON.stringify(test)], opts);

    child.on("message", function(m) {
      // Receive results from child process
      console.log(" ==> received: " + m);
      m = JSON.parse(m);
      result = m;
    });

    // Send child process some work
    child.send("Please up-case this string");

    child.on("close", function (code) {
      console.log("child process exited with code " + code);
      if (0 === code) {
        {test.result = result.result;}
        resolve(test);
      } else {
        {test.result = result;}
        reject(result.error || new Error("Failed to run the test."));
      }
    });

  });
};

var runTest = function (test) {
  return setupTest(test).then(function (test) {
    console.log(test);
    return test;
  }).then (spawnTest).then(function (test) {
    console.log(test);
    return test;
  });
  // set cwd to the test folder
  // set output to a temp folder
  // run webpack with the given configuration.
  // return the path to the temp folder
  // run the tests on the results
};

var OUTPUT_DIR = path.join(__dirname, "../.tmp");


const examples = [
  "default",
  "absolute-path",
  //"absolute-path-subfolder",
  "commons-chunk-plugin",
  "copy-webpack-plugin",
  //"relative-path",
];

describe("examples", function () {
  for (var i = 0, len = examples.length; i < len; ++i) {
    (function (name) {
      it("should run the " +name+ " example.", function (done) {
        runTest(name).then(function (test) {
          expect (test).to.haveOwnProperty("result").to.be.an("object");
          expect (test).to.haveOwnProperty("fixture").to.be.an("object");
          expect (test.result).to.deep.equal(test.fixture);
          done();
        }).catch( function (err) {
          done(err);
        });
      });
    })(examples[i]);
  }
});
