"use strict";

var fs = require("fs");
var mPromise = require("./promise");

var JsonLoader = require("./json-loader");

module.exports = class JsonLoaderFile extends JsonLoader{
  constructor(filename) {

    var cachedData;
    var cachedMtime;
    var cachedFileName;

    var readFile = () => {
      return this.testInvalid().then ((isInvalid) => {
        if (isInvalid) {
          var currentFile = this.filename;
          return new mPromise ((resolve, reject) => {
            fs.readFile(filename, (err, data) => {
              if(err) {
                reject(err);
              } else {
                cachedFileName = currentFile;
                cachedData = data.toString();
                fs.stat(this.filename, (err, data) => {
                  cachedMtime = data.mtime.getTime();
                  resolve(cachedData);
                });
              }
            });
          });
        } else {
          return cachedData;
        }
      });
    };

    var testInvalid = () => {
      return new mPromise( (resolve, reject) => {
        if(this.filename !== cachedFileName) {
          resolve(true);
        } else {
          fs.stat(this.filename, (err, data) => {
            if(err) {
              reject(err);
            }
            var mtime = data.mtime.getTime();
            resolve(cachedMtime < mtime);
          });
        }
      });
    };
    super(readFile, testInvalid);

    this.filename = filename;
  }
};
