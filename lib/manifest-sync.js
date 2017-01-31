"use strict";
var mPromise = require("./promise");
var tools = require ("./tools");

/**
 * The list of fields that are mandatory in a manifest.json.
 */
const manifestMandatory = ["name", "version", "manifest_version"];

module.exports = class ManifestSync {
  constructor (manifestJson, packageJson, options) {
    options = options || {};
    /*eslint-disable no-console */
    this.warn = options.warn || options.log || console.warn;
    this.error = options.error || options.log || console.error;
    this.log = options.log || function() {};
    /*eslint-enable no-console */

    this.setManifest(manifestJson);
    this.package = tools.setLoader(packageJson);
  }

  setManifest (file) {
    this.manifest = tools.setLoader(file);
  }

  sync () {
    if (!this.manifest) {
      return mPromise.reject(new Error("Missing manifest. Please provide a valid manifest before syncing."));
    }
    var allAdditional = [];
    if(this.package) {
      allAdditional.push(this.package.hasLatestData().catch( () => { return; } ));
    }
    allAdditional = mPromise.all(allAdditional);
    return mPromise.all([
      this.manifest.hasLatestData(),
      allAdditional,
    ]).then( (files) => {
      var needReload = (!this.cachedManifest) || files[0] || files[1].find( (item) => {
        return !item;
      }) || false;

      if (needReload) {
        return this.runFilesSync();
      }
      else {
        return JSON.parse(this.cachedManifest);
      }
    });
  }

  /**
   * Retrieves the files and writes the resulting.
   *
   * @returns
   */
  runFilesSync () {
    if (!this.manifest) {
      throw (new Error("Missing manifest. Please provide a valid manifest before trying to read it."));
    }
    var allAdditional = [];

    if(this.package) {
      allAdditional.push(this.package.loadJson().catch( () => { return; } ));
    }
    allAdditional = mPromise.all(allAdditional);
    return mPromise.all([
      this.manifest.loadJson(),
      allAdditional,
    ]).then( (files) => {
      var manifestJson = files[0];
      var packageJsonArray = 2 == files.length ? files[1] : null;

      //Fill the missing fields
      if (packageJsonArray) {
        packageJsonArray.forEach( (packageJson) => {
          if (("object" === typeof packageJson) && packageJson) {
            manifestMandatory.forEach( (key) => {
              if(!manifestJson.hasOwnProperty(key) && packageJson.hasOwnProperty(key)) {
                manifestJson[key] = packageJson[key];
              }
            });
          }
        });
      }

      var missingFields = manifestMandatory.filter( (key) => {
        return (!manifestJson.hasOwnProperty(key));
      });

      if (0 < missingFields.length) {
        this.warn("The resulting manifestJson is missing " +(1<missingFields.length?"fields":" a field")+ ": \"" + missingFields.join("\", \"") + "\".");
      }

      this.cachedManifest = JSON.stringify(manifestJson);

      return manifestJson;
    });
  }
};
