/**
 * @module chrome-dev-webpack-plugin
 */

"use strict";
var fs = require("fs");
var path = require("path");
var ChromeDevVersionStamp = require("./lib/version-stamp");

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
 * @param {function} [options.log] A log function.
 * @param {function} [options.warn=console.warn] A warning log function.
 * @param {function} [options.error=console.error] An error log function.
 */
module.exports = class ChromeDevWebpackPlugin {
  constructor(options) {

    options = options || {};
    /*eslint-disable no-console */
    this.warn = options.warn || options.log || console.warn;
    this.error = options.error || options.log || console.error;
    this.log = options.log || function() {};
    /*eslint-enable no-console */

    //This is used to retrieve the current version. =>
    this.pathToPackageJson = options.package || "./package.json";
    //Where to look for the manifest file =>
    this.manifestInput = options.entry;
    //Where to output the manifest file <=
    this.manifestOutput = options.output;

    this.syncFields = [];
    if(options.hasOwnProperty("version") && false === options.version) {
      //Do nothing about it
    } else {
      this.syncFields.push("version");
    }

    //The list of fields to copy from package.json to manifest.json

    if ("undefined" !== options.fields && Array.isArray(options.fields)) {
      this.syncFields = options.fields;
    }

    this.versionStamp = new ChromeDevVersionStamp(options);

    this.tabulations = "  ";
  }

  /**
   * Entry point. When the plugin is mounted this function is executed.
   *
   * @param {webpack.Compiler} compiler
   */
  apply (compiler) {
    //Used to retrieve the latest source of the manifest file.
    this.actions = [];
    this.manifestSourceFunction = null;
    this.manifestJson = null;
    this.initialized = false;
    this.chunkVersions = {};

    this.context = compiler.options.context || path.resolve("./");

    //Adds handlers
    compiler.plugin("emit", this.handleEmit.bind(this));
  }

  /**
   * Handles the webpack compiler emit event
   *
   * @param {webpack.Compilation} compilation
   * @param {function} callback
   */
  handleEmit (compilation, callback) {

    var runPluginRound = () => {
      var changedChunks = compilation.chunks.filter( (chunk) => {
        var oldVersion = this.chunkVersions[chunk.name];
        this.chunkVersions[chunk.name] = chunk.hash;
        return chunk.hash !== oldVersion;
      });

      if (0 < changedChunks.length) {
        this.runPluginRound(compilation).then( (result) => {
          this.log("chrome-dev-webpack-plugin - done:\n", result);
          callback();
        }).catch( (err) =>{
          this.error("chrome-dev-webpack-plugin - error:", err);
          callback(err);
        });
      } else {
        this.log("chrome-dev-webpack-plugin - run not required.");
        //If nothing changed, ignore this run.
        callback();
      }

    };

    if (!this.initialized) {
      this.initialize(compilation).then( () => {
        this.initialized = true;
        runPluginRound();
      });
    } else {
      runPluginRound();
    }
  }

  /**
   * Runs the default plugin operations.
   *
   * @param {webpack.Compilation} compilation
   * @returns Promise<object>
   */
  runPluginRound (compilation) {
    return this.updateManifestJson().then( (manifestJson) => {
      this.manifestJson = manifestJson = manifestJson || this.manifestJson;
      var missingFields = manifestMandatory.filter( (key) => {
        return (!manifestJson.hasOwnProperty(key));
      });
      if (0 < missingFields.length) {
        this.warn("The resulting manifestJson is missing " +(1<missingFields.length?"fields":" a field")+ ": \"" + missingFields.join("\", \"") + "\".");
      }

      var requireMap = [];

      if (manifestJson.background.scripts && 0 < manifestJson.background.scripts.length) {
        requireMap = requireMap.concat(manifestJson.background.scripts);
      }
      if (manifestJson.content_scripts && 0 < manifestJson.content_scripts.length) {
        requireMap = manifestJson.content_scripts.reduce( (currentMap, content_script) => {
          return (content_script.js && content_script.js.length) ? currentMap.concat(content_script.js) : currentMap;
        }, requireMap);
      }

      if(requireMap && requireMap.length) {
        var mappedValues = this.mapfilesToBundles(compilation, requireMap);

        if (manifestJson.background.scripts && 0 < manifestJson.background.scripts.length) {
          var files = [];
          manifestJson.background.scripts.forEach( (file) => {
            if ("undefined" !== mappedValues[file]) {
              files = files.concat(mappedValues[file]);
            } else {
              files.push(file);
            }
          });
          manifestJson.background.scripts = files;
        }

        if (manifestJson.content_scripts && 0 < manifestJson.content_scripts.length) {
          manifestJson.content_scripts.forEach( (content_script) => {
            if ("undefined" !== typeof content_script.js && 0 < content_script.js.length) {
              var files = [];
              content_script.js.forEach( (file) => {
                if ("undefined" !== mappedValues[file]) {
                  files = files.concat(mappedValues[file]);
                } else {
                  files.push(file);
                }
              });
              content_script.js = files;
            }
          });
        }
      }

      this.emitManifestJson(compilation, manifestJson);
      return manifestJson;
    });
  }

  /**
   * Initializes the plugin (finds missing data).
   *
   * @param {webpack.Compilation} compilation
   * @returns
   */
  initialize (compilation) {
    this.log("initialize");
    return new Promise( (resolve, reject) => {
      //If the manifest output is not set try to find the manifest in the emitted resources.
      if(!this.manifestOutput) {
        this.log("Looking for a valid manifest.json in the compilation assets.");
        this.manifestOutput = findManifestInAssets(compilation.assets);
        this.log(" - look for manifestOutput:", this.manifestOutput);
      }

      //If the function to retrieve the manifest data doesn't exist.
      if ("function" !== typeof this.manifestSourceFunction)
      {
        if(this.manifestInput) {
          this.log("Will read manifest.json from the given input path: " + this.manifestInput);
          //if the path to a source manifest file has been passed
          //read this file.
          this.manifestSourceFunction = () => {
            //TODO: replace this with an async mechanism.
            return fs.readFileSync(this.manifestInput);
          };
        } else if (this.manifestOutput
          && "undefined" !== typeof compilation.assets[this.manifestOutput]
          && "function" === compilation.assets[this.manifestOutput].source) {
          this.log("Will use the manifest.json from the compilation assets as the source.");
          //We have an output file which already provides the function.
          this.manifestSourceFunction = compilation.assets[this.manifestOutput].source;
        } else if(this.context) {
          var pathToManifest = path.join(this.context, "manifest.json");
          if (fs.existsSync(pathToManifest)) {
            this.log("Will use the manifest.json found in the context path.");
            //If a manifest file
            this.manifestSourceFunction = () => {
              //TODO: replace this with an async mechanism.
              return fs.readFileSync(pathToManifest);
            };
          }
        }
      }

      if ("function" !== typeof this.manifestSourceFunction) {
        this.warn("Failed to resolve access to 'manifest.json'. Please set the 'source' in the plugin options");
      }
      else if (!this.manifestOutput) {
        this.manifestOutput = "manifest.json";
      }

      resolve();
    });
  }

  mapfilesToBundles (compilation, files) {
    var filesBundlesMap = {};
    files = (files || []).map ( (file) => { return { file:file, fullPath: path.join(this.context, file)}; });

    var getParents = (_module) => {
      var parents = [];
      if (_module.parents && 0 < _module.parents.length) {
        for (var i = 0, len = _module.parents.length; i < len; ++i) {
          var parent = _module.parents[i];
          if (parent.files && 0 < parent.files.length) {
            for (var f = 0, flen = parent.files.length; f < flen; ++f) {
              var file = parent.files[f];
              if(!parents.includes(file)) {
                parents.push(file);
              }
            }
          }
        }
      }
      return parents;
    };
    // Explore each chunk (build output):
    compilation.chunks.forEach( (chunk) => {
      var parents = getParents(chunk);
      if (!chunk.files || 0 === chunk.files.length) {
        return;
      }
      chunk.modules.forEach( (_module) => {
        if(_module.fileDependencies) {
          // Explore each source file path that was included into the module:
          _module.fileDependencies.forEach( (filepath) => {
            if (filepath) {
              //this.outputs[]
              for (var i = 0, len = files.length; i < len; ++i) {
                var file = files[i];
                if (file.fullPath === filepath || file.file === filepath) {
                  filesBundlesMap[file.file] = parents.concat(chunk.files);
                }
              }
            }
          });
        }
      });
    });

    return filesBundlesMap;
  }

  updateManifestJson () {
    this.log("updateManifestJson");

    var readManifest = () => {
      this.log("readManifest");
      return new Promise( (resolve, reject) => {
        if ("function" === typeof this.manifestSourceFunction) {
          resolve (this.manifestSourceFunction ().toString());
        } else if ("string" === typeof this.manifestInput) {
          fs.readFile(this.manifestInput, (err, data) => {
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

    var readPackage = () => {
      this.log("readPackage");
      return new Promise( (resolve, reject) => {
        if ("string" === typeof this.pathToPackageJson) {
          fs.readFile(this.pathToPackageJson, (err, data) => {
            if (err) {
              reject(err);
            } else {
              resolve(data);
            }
          });
        }
      });
    };

    var syncManifest = (manifestData) => {
      this.log("syncManifest");
      return new Promise( (resolve, reject) => {
        var manifestJson = JSON.parse(manifestData);

        var neededFields = [].concat(this.syncFields);
        manifestMandatory.forEach( (key) => {
          if("undefined" === typeof manifestJson[key]) {
            neededFields.push (key);
          }
        });

        if (0 < neededFields.length) {
          resolve (readPackage().then( (packageData) => {
            if (packageData) {
              var packageJson = JSON.parse(packageData) || {};
              neededFields.forEach( (key) => {
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
  }

  emitManifestJson (compilation, manifestJson) {
    var manifestJsonData = JSON.stringify(manifestJson, null, "  ");
    compilation.assets[this.manifestOutput] = {
      source: () => {
        return manifestJsonData;
      },
      size: () => {
        return manifestJsonData.length;
      }
    };
  }
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
