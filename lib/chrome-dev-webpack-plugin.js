/**
 * @module chrome-dev-webpack-plugin
 */

"use strict";

var fs = require("fs");
var path = require("path");
var VersionStamp = require("./version-stamp");
var JsonLoader = require("./json-loader");
var ManifestSync = require ("./manifest-sync");

var mPromise = require("./promise");

/**
 * The list of fields that are mandatory in a manifest.json.
 */
const manifestMandatory = ["name", "version", "manifest_version"];

module.exports = class ChromeDevWebpackPlugin {
  /**
   * Creates an instance of ChromeDevWebpackPlugin.
   *
   * @param {Object} [options]
   * @param {string} [options.entry] The path to the original manifest.json file
   * @param {string} [options.output] The path to the resulting manifest.json file
   * @param {string} [options.package="./package.json"] The path to the package.json file
   *
   * @param {string} [options.version] Set the manifest.json to a specific version.
   * @param {string|number|object} [buildId]
   * @param {string} [buildId.file] The file where the build id is kept for future increments.
   * @param {boolean} [buildId.autoIncrement=true] Wherever the build id should be incremented or not.
   *
   * @param {function} [options.log] A log function.
   * @param {function} [options.warn=console.warn] A warning log function.
   * @param {function} [options.error=console.error] An error log function.
   */
  constructor(options) {
    options = options || {};
    /*eslint-disable no-console */
    this.warn = options.warn || options.log || console.warn;
    this.error = options.error || options.log || console.error;
    this.log = options.log || function () {};
    /*eslint-enable no-console */

    //This is used to retrieve the current version. =>
    this.pathToPackageJson = options.package || "./package.json";
    //Where to look for the manifest file =>
    this.manifestInput = options.entry || options.source;
    //Where to output the manifest file <=
    this.manifestOutput = options.output;
    this.versionStamp = new VersionStamp(options);

    this.mapFilesRelativeToManifest = false;

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
    this.log("this.initialized:", this.initialized);
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
    if ("object" !== typeof this.manifestSync) {
      return Promise.reject(new Error("Nothing to sync"));
    }
    return this.manifestSync.sync().then( (manifestJson) => {
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
        var mappedValues = this.mapFilesToBundles(compilation, requireMap);

        if (manifestJson.background.scripts && 0 < manifestJson.background.scripts.length) {
          var files = [];
          manifestJson.background.scripts.forEach( (file) => {
            if ("undefined" !== typeof mappedValues[file] && mappedValues[file]) {
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

      return manifestJson;
    }).then ( (manifestJson) => {
      if (manifestJson) {
        manifestJson.version = this.versionStamp.stampVersion(manifestJson.version);
      }
      return manifestJson;
    }).then( (manifestJson) => {
      this.emitManifestJson(compilation, manifestJson);
      return manifestJson;
    });
  }

  /**
   * Initializes the plugin (finds missing data).
   *
   * @param {webpack.Compilation} compilation
   * @returns {Promise<>}
   */
  initialize (compilation) {
    this.log("initialize");
    //If the manifest output is not set try to find the manifest in the emitted resources.
    if(!this.manifestOutput) {
      this.log("Looking for a valid manifest.json in the compilation assets.");
      this.manifestOutput = findManifestInAssets(compilation.assets);
      this.log(" - look for manifestOutput:", this.manifestOutput);
    }

    return this.findManifestSource(compilation).then ( (manifestSource) => {
      if (manifestSource) {
        this.manifestSync = new ManifestSync(manifestSource, this.pathToPackageJson);
      }
      if ("object" !== typeof this.manifestSync || "object" !== typeof this.manifestSync.manifest) {
        this.warn("Failed to resolve access to 'manifest.json'. Please set the 'source' in the plugin options");
      }
      else if (!this.manifestOutput) {
        this.manifestOutput = "manifest.json";
      }
      this.pathToPackageJson;
      return;
    });


  }

  /**
   * Tries to locate the manifest.json.
   *
   * @param {webpack.Compilation} compilation
   * @returns Promise<JsonLoader|string>
   */
  findManifestSource (compilation) {
    return new mPromise( (resolve, reject) => {
      this.log("findManifestSource");
      var resolveMapFilesRelativeToManifest = (filePath) => {
        if(filePath.startsWith(this.context)) {
          return path.parse(path.join ("./", "./" + (filePath.substring(0, this.context.length)))).dir;
        }
        return false;
      };

      var pathToContextManifest = path.join(this.context, "manifest.json");
      if(this.manifestInput) {
        this.log("Will read manifest.json from the given input path: " + this.manifestInput);
        this.mapFilesRelativeToManifest = resolveMapFilesRelativeToManifest(path.resolve(this.context, this.manifestInput));
        return resolve(this.manifestInput);
      } else if (this.manifestOutput
        && "undefined" !== typeof compilation.assets[this.manifestOutput]
        && "function" === typeof compilation.assets[this.manifestOutput].source) {
        this.log("Will use the manifest.json from the compilation assets as the source.");
        //We have an output file which already provides the function.
        var fileName = this.manifestOutput;
        var localCache = compilation.assets[fileName].source().toString();
        var manifestLoader = new JsonLoader(function () {
          return new mPromise (function (resolve) {
            resolve(localCache = compilation.assets[fileName].source().toString());
          });
        }, function () {
          return new mPromise (function (resolve) {
            resolve(localCache !== compilation.assets[fileName].source().toString());
          });
        });
        fs.exists(pathToContextManifest, (exists) => {
          this.mapFilesRelativeToManifest = exists ? resolveMapFilesRelativeToManifest(path.resolve(this.context, pathToContextManifest)) : false;
          resolve(manifestLoader);
        });
        return;
      } else if(this.context) {
        fs.exists(pathToContextManifest, (exists) => {
          if (!exists) {
            resolve();
          } else {
            this.log("Will use the manifest.json found in the context path.");
            this.mapFilesRelativeToManifest = resolveMapFilesRelativeToManifest(path.resolve(this.context, pathToContextManifest));
            resolve(pathToContextManifest);
          }
        });
        return;
      }
      reject(new Error("Impossible to determine a path to manifest.json"));
    });
  }

  /**
   * Maps the given source files to generated bundles.
   *
   * @param {webpack.Compilation} compilation
   * @param {any} files
   * @returns
   */
  mapFilesToBundles (compilation, files) {
    this.log("mapFilesToBundles:", this.mapFilesRelativeToManifest);
    var filesBundlesMap = {};
    if (false === this.mapFilesRelativeToManifest) {
      return filesBundlesMap;
    }

    files = (files || []).map ( (file) => { return { file:file, fullPath: path.join(this.context, file)}; });

    var getParents = (_module) => {
      var parents = [];
      if (_module.parents && 0 < _module.parents.length) {
        for (var i = 0, len = _module.parents.length; i < len; ++i) {
          var parent = _module.parents[i];
          if (parent.files && 0 < parent.files.length) {
            for (var f = 0, flen = parent.files.length; f < flen; ++f) {
              var file = parent.files[f];
              if(-1 === parents.indexOf(file)) {
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
      this.log("mapping ", chunk.files);
      if (!chunk.files || 0 === chunk.files.length) {
        return;
      }
      chunk.modules.forEach( (_module) => {
        if(_module.fileDependencies) {
          // Explore each source file path that was included into the module:
          _module.fileDependencies.forEach( (filepath) => {

            this.log(" - filepath ", filepath);
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

  /**
   * Emits the given manifest.json
   *
   * @param {any} compilation
   * @param {any} manifestJson
   */
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
