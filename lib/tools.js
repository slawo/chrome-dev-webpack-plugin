"use strict";
var ChromeDevJsonLoader = require ("./json-loader");
var ChromeDevJsonLoaderFile = require ("./json-loader-file");

module.exports = {
  parseBuildNumber:parseBuildNumber,
  parseManifestVersion:parseManifestVersion,
  setLoader:setLoader,
};

function parseManifestVersion (version) {
  var parts = [];
  if (version) {
    var valid = true;
    var allParts = version.split("-");
    var versionParts = allParts[0].split(".");

    var regex = /\d+/;
    if (versionParts && 0 < versionParts.length) {
      versionParts[0] = versionParts[0].match(regex)[0];
      if (2 < versionParts.length) {
        var lastIdx = versionParts.length - 1;
        versionParts[lastIdx] = versionParts[lastIdx].match(regex)[0];
      }
    }
    else {
      valid = false;
    }

    for (var i = 0, len = versionParts.length; valid && i < len; ++i) {
      var part = versionParts[i];
      var num = parseInt(part);
      if ("number" === typeof num && parts.length < 4) {
        parts.push(num);
      } else {
        valid = false;
      }
    }

    if (valid) {
      return parts.join(".");
    }
  }
}

function parseBuildNumber (buildNumber) {
  if ("number" === typeof buildNumber) {
    return buildNumber;
  }
  if ("string" === typeof buildNumber) {
    var res = parseInt(buildNumber);
    if (buildNumber !== ""+res) {
      return;
    }
    return res;
  }
  return;
}

function setLoader (file) {
  if ("undefined" === typeof file || !file) {
    return;
  } else if ("string" === typeof file) {
    return new ChromeDevJsonLoaderFile(file);
  } else if (file instanceof ChromeDevJsonLoader) {
    return file;
  } else if ("function" === typeof file.loadJson && "function" === typeof file.hasLatestData) {
    return file;
  }
}
