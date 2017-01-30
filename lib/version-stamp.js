var fs = require("fs");
var tools = require("./tools");

var BUILD_KEY = "buildId";
var DEFAULT_BUILD_FILE = ".build";
var DEFAULT_AUTO_INCREMENT = true;

/**
 * Handles the version stamping and the management of the build number.
 *
 * @param {any} options
 */
var ChromeDevVersionStamp = module.exports = function ChromeDevVersionStamp(options) {
  options = options || {};
  /*eslint-disable no-console */
  this.warn = options.warn || options.log || console.warn;
  this.error = options.error || options.log || console.error;
  this.log = options.log || function() {};
  /*eslint-enable no-console */

  this.readBuildNumber = false;
  this.writeBuildNumber = false;

  if (options) {
    if(options.hasOwnProperty("version")) {
      if ("string" === typeof options.version) {
        this.semver = options.version;
      }
    }

    if (!options.hasOwnProperty(BUILD_KEY)) {
      return;
    }
    //gather the build options:
    var o = options[BUILD_KEY];
    var buildId = tools.parseBuildNumber(o);
    var buildOptions = {};

    if (true === o) {
      //default options:
      buildOptions.file = DEFAULT_BUILD_FILE;
    } else if("number" === typeof buildId) {
      //fixed build number
      this.build = buildId;
      buildOptions.file = false;
      buildOptions.autoIncrement = false;
    } else if ("string" === typeof o) {
      //select file
      buildOptions.file = o;
    } else {
      if (o.hasOwnProperty("file")) {
        buildOptions.file = o.file;
      }
      if (o.hasOwnProperty("autoIncrement")) {
        buildOptions.autoIncrement = o.autoIncrement;
      }
    }
    if (buildOptions.file && !buildOptions.hasOwnProperty("autoIncrement")) {
      buildOptions.autoIncrement = DEFAULT_AUTO_INCREMENT;
    }

    if ("string" === typeof buildOptions.file) {
      this.log("build id with file:",buildOptions.file);
      this.buildFile = buildOptions.file;
      this.autoIncrement = buildOptions.autoIncrement;

      var cached = false;
      this.buildId = 1;

      this.readBuildNumber = function () {
        if (false !== cached) {
          return cached;
        }
        try {
          cached = (tools.parseBuildNumber(fs.readFileSync(this.buildFile).toString()) || 0);
          this.log("read build number from:",this.buildFile, cached);
          return cached;
        } catch (e) {
          if (e.code == "ENOENT") {
            this.log("Missing file " + this.buildFile + ", setting build id to " + this.buildId);
            return this.buildId;
          } else {
            this.error(e);
          }
        }
      }.bind(this);

      this.writeBuildNumber = function (buildNumber) {
        if (buildNumber !== cached) {
          cached = false;
          try {
            fs.writeFileSync(this.buildFile, buildNumber);
          } catch (e) {
            this.error(e);
          }
        }
      }.bind(this);
    } else if ("number" === typeof this.build) {
      this.build = buildId;
      this.readBuildNumber = function () {
        return this.build;
      }.bind(this);

      this.writeBuildNumber = function (buildNumber) {
        this.build = buildNumber;
      }.bind(this);
    }
  }
};

ChromeDevVersionStamp.prototype.getBuildNumber = function () {
  var buildNumber;
  if (this.readBuildNumber && "function" === typeof this.readBuildNumber) {
    buildNumber = this.readBuildNumber();
    if (this.autoIncrement && ("number" === typeof buildNumber)) {
      buildNumber += 1;
    }
  }
  return buildNumber;
};

ChromeDevVersionStamp.prototype.stampVersion = function (version) {
  var useVersion = tools.parseManifestVersion(this.semver ? this.semver : version);
  var parts = [];

  if (useVersion) {
    parts = useVersion.split(".");
  }
  if(this.readBuildNumber) {
    var buildId = this.getBuildNumber();
    if ("number" === typeof buildId) {
      this.build = buildId;
      this.log("stampVersion", buildId);
      while (parts.length < 4) {
        parts.push(0);
      }
      parts[3] = buildId;
      this.save();
    }
  }
  return parts.join(".");
};

ChromeDevVersionStamp.prototype.save = function () {
  if (this.writeBuildNumber && ("function" === typeof this.writeBuildNumber)) {
    this.writeBuildNumber(this.build);
  }
};
