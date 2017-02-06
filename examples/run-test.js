var webpack = require("webpack");
var fs = require ("fs");
var path = require ("path");



/**
 * Runs one of the example folders and tests the resulting
 * files against the expected result.
 *
 * @param {!string} exampleName
 * @param {runExampleCallback} callback
 */
function runExample (test) {
  return new Promise (function (resolve, reject) {
    if ("string" === typeof test) {
      test = JSON.parse(test);
    }
    var options;
    try {
      options = require(path.join(test.source, "webpack.config"));
    } catch(e) {
      reject(e);
    }
    console.log("require webpack.config", options);
    webpack(options, function (err) {
      console.log("webpack ran");
      if (err) {
        reject(err);
      } else {
        fs.readFile(path.join(options.output.path, "manifest.json"), function (err, data) {
          if(err) {
            reject(err);
          } else {
            resolve(JSON.parse(data));
          }
        });
      }
    });
  });
}
module.exports = runExample;

runExample(process.argv[2]).then(function (result) {
  process.send(JSON.stringify({result: result}));
  process.exit();
}).catch(function (err) {
  process.send(JSON.stringify({error: err}));
  process.exit(1);
});
