/**
 * @module webpack-chrome-dev-plugin
 */

"use strict";
var fs = require("fs");

/**
 * The list of fields that are mandatory in a manifest.json.
 */
const manifestMandatory = ["name", "version", "manifest_version"];

/**
 * Creates a new instance of the chrome development plugin
 * @class
 *
 * @param {Object} [options]
 * @param {string} [options.entry] The path to the original manifest.json file
 * @param {string} [options.output] The path to the resulting manifest.json file
 * @param {string} [options.package="./package.json"] The path to the package.json file
 * @param {Array} [options.fields=["version"]] The list of fields to copy from package.json to the resulting manifest.json.
 *
 * @param {function} [options.log=console.log] A log function.
 * @param {function} [options.error=console.error] An error log function.
 */
var WebpackChromeDevPlugin = module.exports = function WebpackChromeDevPlugin(options) {
  options = options || {};
  /*eslint-disable no-console */
  this.log = options.log || console.log;
  this.error = options.error || console.error;
  /*eslint-enable no-console */

  //This is used to retrieve the current version. =>
  this.pathToPackageJson = options.package || "./package.json";
  //Where to look for the manifest file =>
  this.manifestInput = options.entry;
  //Where to output the manifest file <=
  this.manifestOutput = options.output;

  //The list of fields to copy from package.json to manifest.json
  this.syncFields = ["version"];

  if ("undefined" !== options.fields && Array.isArray(options.fields)) {
    this.syncFields = options.fields;
  }
  this.tabulations = "  ";
};

/**
 * Entry point. When the plugin is mounted this function is executed.
 *
 * @param {webpack.Compiler} compiler
 */
WebpackChromeDevPlugin.prototype.apply = function(compiler) {
  //Used to retrieve the latest source of the manifest file.
  this.actions = [];
  this.manifestSourceFunction = null;
  this.manifestJson = null;
  this.initialized = false;

  //Adds handlers
  compiler.plugin("emit", this.handleEmit.bind(this));
};

/**
 * Handles the webpack compiler emit event
 *
 * @param {webpack.Compilation} compilation
 * @param {function} callback
 */
WebpackChromeDevPlugin.prototype.handleEmit = function(compilation, callback) {
  this.log("handleEmit");
  var self = this;

  var runPluginRound = function () {
    self.log("handleEmit#runPluginRound");
    self.runPluginRound(compilation).then(function (result) {
      self.log("handleEmit#runPluginRound - done:", result.toString());
      callback();
    }).catch(function (err) {
      self.error("handleEmit#runPluginRound - error:", err);
      callback(err);
    });
  };

  if (!self.initialized) {
    self.initialize(compilation).then(function () {
      self.initialized = true;
      runPluginRound();
    });
  } else {
    runPluginRound();
  }
};

/**
 * Initializes the plugin (finds missing data).
 *
 * @param {webpack.Compilation} compilation
 * @returns
 */
WebpackChromeDevPlugin.prototype.initialize = function(compilation) {
  var self = this;
  self.log("initialize", compilation);
  return new Promise(function (resolve, reject) {

    self.log("self.manifestOutput", self.manifestOutput);
    self.log("self.manifestSourceFunction", self.manifestSourceFunction);

    if(!self.manifestOutput) {
      self.manifestOutput = findManifestInAssets(compilation.assets);
      self.log(" - look for manifestOutput:", self.manifestOutput);
    }

    //Initialize the manifestSourceFunction
    if ("function" !== typeof self.manifestSourceFunction)
    {
      if(self.manifestInput) {
        self.manifestSourceFunction = function () {
          return fs.readFileSync(self.manifestInput);
        };
      } else if (self.manifestOutput
        && "undefined" !== typeof compilation.assets[self.manifestOutput]
        && "function" === compilation.assets[self.manifestOutput].source) {
        self.manifestSourceFunction = compilation.assets[self.manifestOutput].source;
      }
    }

    resolve();
  });
};

WebpackChromeDevPlugin.prototype.updateManifestJson = function() {
  var self = this;
  self.log("updateManifestJson");

  var readManifest = function () {
    self.log("readManifest");
    return new Promise(function (resolve, reject) {
      if ("function" === typeof self.manifestSourceFunction) {
        resolve (self.manifestSourceFunction ().toString());
      } else if ("string" === typeof self.manifestInput) {
        fs.readFile(self.manifestInput, function (err, data) {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      } else {
        reject(new Error("No method to access to the original manifest.json"));
      }
    });
  };

  var readPackage = function () {
    self.log("readPackage");
    return new Promise(function (resolve, reject) {
      if ("string" === typeof self.pathToPackageJson) {
        fs.readFile(self.pathToPackageJson, function (err, data) {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      }
    });
  };

  var syncManifest = function (manifestData) {
    self.log("syncManifest");
    return new Promise(function (resolve, reject) {
      var manifestJson = JSON.parse(manifestData);

      var neededFields = [].concat(self.syncFields);
      manifestMandatory.forEach(function (key) {
        if("undefined" === typeof manifestJson[key]) {
          neededFields.push (key);
        }
      });

      if (0 < neededFields.length) {
        resolve (readPackage().then(function (packageData) {
          if (packageData) {
            var packageJson = JSON.parse(packageData) || {};
            neededFields.forEach(function (key) {
              manifestJson[key] = packageJson[key];
            });
            return manifestJson;
          }
        }));
      } else {
        resolve(manifestJson);
      }
    });
  };

  return readManifest()
  .then(syncManifest);
};

WebpackChromeDevPlugin.prototype.emitManifestJson = function(compilation) {
  var self = this;
  var manifestJsonData = JSON.stringify(self.manifestJson, null, "  ");
  return compilation.assets[self.manifestOutput] = {
    source: function() {
      return manifestJsonData;
    },
    size: function() {
      return manifestJsonData.length;
    }
  };
};


/**
 * Runs the default plugin operations.
 *
 * @param {webpack.Compilation} compilation
 * @returns Promise<object>
 */
WebpackChromeDevPlugin.prototype.runPluginRound = function(compilation) {
  var self = this;
  return self.updateManifestJson().then(function (manifestJson) {
    self.manifestJson = manifestJson || self.manifestJson;
    return self.emitManifestJson(compilation);
  });
};


/**
 * (Helper function) looks for an existing manifest.json that would have been emitted by
 * another plugin.
 *
 * @param {any} assets
 * @returns
 */
var findManifestInAssets = function (assets) {
  if ("undefined" === typeof assets) {
    throw new Error("assets are needed");
  }
  for (var filename in assets) {
    if(filename.endsWith("manifest.json")) {
      return filename;
    }
  }
  return;
};
