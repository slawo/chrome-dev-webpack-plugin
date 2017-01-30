"use strict";

module.exports = class JsonLoader {
  constructor(readFile, testInvalid) {
    this.readFile = readFile;
    this.testInvalid = testInvalid;
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
