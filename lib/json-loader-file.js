var fs = require("fs");

var ChromeDevJsonLoaderFile = module.exports = function (filename) {
  this.filename = filename;

  var cachedData;
  var cachedMtime;
  var cachedFileName;

  this.readFile = function() {
    return this.testInvalid().then (function (isInvalid) {
      if (isInvalid) {
        var currentFile = this.filename;
        return new Promise (function(resolve, reject) {
          fs.readFile(filename, function (err, data) {
            if(err) {
              reject(err);
            }
            cachedMtime = Date.now();
            cachedFileName = currentFile;
            cachedData = data.toString();
            resolve(cachedData);
          }.bind(this));
        }.bind(this));
      } else {
        return cachedData;
      }
    }.bind(this));
  };

  this.testInvalid = function() {
    return new Promise(function (resolve, reject) {
      if(this.filename !== cachedFileName) {
        resolve(true);
      } else {
        fs.stat(this.filename, function (err, data) {
          if(err) {
            reject(err);
          }
          var mtime = data.mtime.getTime();
          resolve(cachedMtime < mtime);
        }.bind(this));
      }
    }.bind(this));
  };
};

ChromeDevJsonLoaderFile.prototype.hasLatestData = function () {
  return new Promise(function (resolve, reject) {
    if ("function" === typeof this.testInvalid) {
      resolve(this.testInvalid());
    } else {
      reject(new Error("No method to retrieve the status of the data."));
    }
  }.bind(this)).then(function (isInvalid) {
    return !isInvalid;
  });
};

ChromeDevJsonLoaderFile.prototype.loadJson = function () {
  return new Promise(function (resolve, reject) {
    if ("function" === typeof this.readFile) {
      resolve( this.readFile());
    } else {
      reject(new Error("No method to retrieve the file data."));
    }
  }.bind(this)).then(function (data) {
    return JSON.parse(data.toString());
  });
};
