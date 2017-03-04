"use strict";

var path = require("path");
var tools = require("./tools");
var arrayTools = require("./array-tools");

module.exports = class BundleFileMapper {
  constructor (options) {
    options = options || {};
    Object.assign(this, tools.getLogs(options));
    this.context = options.context;
  }
  run(compilation, manifestJson) {
    if (!manifestJson) {
      return manifestJson;
    }

    var bundles = this.mapBundles(compilation);

    if (manifestJson.background && manifestJson.background.scripts) {
      manifestJson.background.scripts = this.replaceFilesWithBundles(bundles, manifestJson.background.scripts);
    }

    if (manifestJson.content_scripts && 0 < manifestJson.content_scripts.length) {
      manifestJson.content_scripts.forEach( (content_script) => {
        content_script.js = this.replaceFilesWithBundles(bundles, content_script.js);
      });
    }

    return manifestJson;
  }

  mapBundles(compilation) {
    var bundles = [];
    compilation.chunks.forEach( (chunk) => {
      var parents = this.getBundleRequirements(chunk);
      parents;
      var bundleOut = [].concat(chunk.files);
      var bundle = { output: bundleOut, chunk:chunk, files:this.mapFiles(chunk), sources:[]};
      bundles.push(bundle);
      for (var i = 0, len = bundleOut.length; i < len; ++i) {
        const key = bundleOut[i];

        var map = compilation.assets[key].map();
        if (map && map.sources) {
          arrayTools.addUniques(bundle.sources, map.sources);
        }
        compilation.assets[key];
      }
    });

    for (var i = 0, len = bundles.length; i < len; ++i) {
      var bundle = bundles[i];
      bundle.allFiles = [].concat(bundle.files);
      bundle.parents = bundle.chunk.parents.map ( (chunk) => {
        return bundles.find( (b) => {
          return b.chunk === chunk;
        });
      });

      bundle.parents.forEach ( (parent) => {
        //console.log(" -=-=-=-=- parent -=-=-=-=- ", parent);
        arrayTools.addUniques(bundle.allFiles, parent.files);
      });

      this.log("bundle:", bundle);
      //console.log(" parents:", bundle.parents);
    }

    return bundles;
  }

  replaceFilesWithBundles(bundles, arrayOfFiles) {
    if (false === this.mapFilesRelativeToManifest) {
      return arrayOfFiles;
    }

    var candidates = bundles.map( (bundle) => {
      return {
        bundle:bundle,
        score:0,
        distance:0,
        filesCount:0,
      };
    });

    var files = (arrayOfFiles || []).map ( (file) => { return { file:file, fullPath: path.join(this.context, file)}; });
    var filePaths = files.map( (file) => file.fullPath );
    // each bundle gains points if its source files are in the current files.
    // or it loses points for having files outside the scope.
    candidates.forEach( (cadidate) => {
      cadidate.bundle.files.forEach( (file) => {
        if (-1 === filePaths.indexOf(file)) {
          cadidate.score -= 1 / Math.max(cadidate.bundle.files.length, 0);
          cadidate.distance += 1;
        } else {
          cadidate.score += 1.1 / Math.max(cadidate.bundle.files.length, 0);
        }
      });

      cadidate.bundle.allFiles.forEach( (file) => {
        if (-1 !== filePaths.indexOf(file)) {
          cadidate.filesCount ++;
        }
      });
    });

    // sorts bundles by score
    candidates.sort( (a,b) => {
      if (b.distance === a.distance) {
        if (b.filesCount === a.filesCount) {
          return  b.score - a.score;
        } else {
          return b.filesCount - a.filesCount;
        }
      }
      return a.distance - b.distance;
    });

    var results = [].concat(files);
    var out = [];

    var brandFilesWithBundle = function (bundle) {
      bundle.parents.forEach( (parent) => {
        brandFilesWithBundle (parent);
      });
      for (var i = 0, len = results.length; i < len; ++i) {
        if(("object" === typeof results[i]) && ("string" === typeof results[i].fullPath) && -1 !== bundle.files.indexOf(results[i].fullPath)) {
          results[i] = bundle;
        }
      }
    };

    candidates.forEach( (candidate) => {
      brandFilesWithBundle(candidate.bundle);
    });


    var addUniqueParents = (bundle) => {
      if (bundle.parents) {
        bundle.parents.forEach( (parent) => {
          addUniqueParents(parent);
          arrayTools.addUniques(out, parent.output);
        });
      }
    };

    results.forEach( (result) => {
      if("object" === typeof result && result.output && Array.isArray(result.output)) {
        addUniqueParents(result);
        arrayTools.addUniques(out, result.output);
      } else if ("string" === typeof result) {
        arrayTools.addUniques(out, [result]);
      }
    });

/*
    console.log("   . ==== .   ==== .  . ==== .   ");
    //console.log("files : ",files.map( (f) => f.fullPath ));
    files.forEach( (f) => {
      console.log("->",f.fullPath);
    });

    candidates.forEach( (bundle) => {
      console.log(" - foundBundle : ",bundle.distance, bundle.filesCount, bundle.score, bundle.bundle.output);
      bundle.bundle.allFiles.forEach( (f) => {
        console.log("     +",f);
      });
      bundle.bundle.files.forEach( (f) => {
        console.log("     -",f);
      });

      out.forEach( (f) => {
        console.log("    ->",f);
      });
    });
    */

    return out;
  }

  getBundleRequirements (_module) {
    var requirements = [];
    if (_module.parents && 0 < _module.parents.length) {
      for (var i = 0, len = _module.parents.length; i < len; ++i) {
        var parent = _module.parents[i];
        if (parent.files && 0 < parent.files.length) {
          for (var f = 0, flen = parent.files.length; f < flen; ++f) {
            var file = parent.files[f];
            if(-1 === requirements.indexOf(file)) {
              requirements.push(file);
            }
          }
        }
      }
    }
    return requirements;
  }

  mapFiles (chunk) {
    var files = [];
    /*
    console.log("   ==================================   ");
    console.log("chunk.files:", chunk.files);
    console.log("chunk.origins:", chunk.origins);
    console.log("chunk.parents:", chunk.parents);
    console.log("chunk.modules:", chunk.modules);
    console.log("   ==================================   ");
    console.log("                                        ");
    */
    chunk.modules.forEach( (_module) => {
      arrayTools.addUniques(files, _module.fileDependencies);
    });
    return files;
  }
};
