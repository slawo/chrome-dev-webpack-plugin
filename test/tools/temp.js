"use strict";
var os = require("os");
var path = require("path");
var crypto = require("crypto");
var mkdirp = require("mkdirp");

var generateFileName =  (name) => {
  var filename = crypto.randomBytes(12).readUInt32LE(0)+(name ? name : "");
  filename = path.join(os.tmpdir(), "com.caluch.chrome-dev-webpack-plugin", filename);
  return filename;
};
var generateFolder = (filename) => {
  filename = filename || generateFileName();
  return new Promise( (resolve, reject) => {
    mkdirp(filename, (err) => {
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
