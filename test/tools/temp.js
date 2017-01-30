"use strict";
var os = require("os");
var path = require("path");
var crypto = require("crypto");
var mkdirp = require("mkdirp");

var generateFileName =  function (name) {
  var filename = "cdwp"+crypto.randomBytes(12).readUInt32LE(0)+(name ? name : "");
  filename = path.join(os.tmpdir(), filename);
  return filename;
};
var generateFolder = function (filename) {
  filename = filename || generateFileName();
  return new Promise(function (resolve, reject) {
    mkdirp(filename, function(err) {
      if (err) {
        reject (err);
      }
      resolve (filename);
    });
  });
};

module.exports = {
  generateFileName: generateFileName,
  generateFolder: generateFolder,
};
