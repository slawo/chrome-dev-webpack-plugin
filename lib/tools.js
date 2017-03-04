"use strict";

var JsonLoader = require ("./json-loader");
var JsonLoaderFile = require ("./json-loader-file");

module.exports = {
  parseBuildNumber:parseBuildNumber,
  parseManifestVersion:parseManifestVersion,
  setLoader:setLoader,
  getLogs:getLogs,
};

function extractLogFunction (entry, name) {
  //Override the function to nothing if the user has opted out.
  if (false === entry || null === entry) {
    return function () {};
  }

  if (!entry) {return;}
  if (!name || "string" !== typeof name) {return;}

  let named = entry[name];
  if (!named) {return;}

  switch (typeof named) {
  case "undefined": return;
  case "function": return named;
  case "object": return ("function" === typeof named[name]) ? named[name] : undefined;
  }
  return;
}

function getLogs (options) {
  let out = {};
  options = options || {};

  let logger;

  if ("object" === typeof options.log) {
    logger = options.log;
  }

  out.log = extractLogFunction(options, "log") || extractLogFunction(logger, "log") || function () {};
  out.warn = extractLogFunction(options, "warn") || extractLogFunction(logger, "warn") || out.log;
  out.error = extractLogFunction(options, "error") || extractLogFunction(logger, "error") || out.log;

  return out;
}

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
    return new JsonLoaderFile(file);
  } else if (file instanceof JsonLoader) {
    return file;
  } else if ("function" === typeof file.loadJson && "function" === typeof file.hasLatestData) {
    return file;
  }
}
