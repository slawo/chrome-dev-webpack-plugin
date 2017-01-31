"use strict";
var mPromise = require("./promise");

module.exports = class JsonLoader {
  constructor(readFile, testInvalid) {
    this.readFile = readFile;
    this.testInvalid = testInvalid;
  }

  hasLatestData () {
    return new mPromise(function (resolve, reject) {
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
    return new mPromise((resolve, reject) => {
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
