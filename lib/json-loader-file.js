"use strict";

var fs = require("fs");

module.exports = class ChromeDevJsonLoaderFile {
  constructor(filename) {
    this.filename = filename;

    var cachedData;
    var cachedMtime;
    var cachedFileName;

    this.readFile = () => {
      return this.testInvalid().then ((isInvalid) => {
        if (isInvalid) {
          var currentFile = this.filename;
          return new Promise ((resolve, reject) => {
            fs.readFile(filename, (err, data) => {
              if(err) {
                reject(err);
              }
              cachedMtime = Date.now();
              cachedFileName = currentFile;
              cachedData = data.toString();
              resolve(cachedData);
            });
          });
        } else {
          return cachedData;
        }
      });
    };

    this.testInvalid = () => {
      return new Promise( (resolve, reject) => {
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
  }

  hasLatestData () {
    return new Promise(function (resolve, reject) {
      if ("function" === typeof this.testInvalid) {
        resolve(this.testInvalid());
      } else {
        reject(new Error("No method to retrieve the status of the data."));
      }
    }.bind(this)).then(function (isInvalid) {
      return !isInvalid;
    });
  }

  loadJson () {
    return new Promise((resolve, reject) => {
      if ("function" === typeof this.readFile) {
        resolve(this.readFile());
      } else {
        reject(new Error("No method to retrieve the file data."));
      }
    }).then((data) => {
      return JSON.parse(data.toString());
    });
  }
};
