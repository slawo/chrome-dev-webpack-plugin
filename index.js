"use strict";

/**
 * The plugin
 *
 * @param {Object} [options]
 * @param {string} [options.entry] The path to the original manifest.json file
 * @param {string} [options.output] The path to the resulting manifest.json file
 * @param {string} [options.package="./package.json"] The path to the package.json file
 * @param {Array} [options.fields=["version"]] The fields to copy from package.json to the resulting manifest.json.
 *
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
};
