"use strict";

var mPromise;
try {
  mPromise = require("bluebird");
}
catch(e) {
  //Using the default promises;
}

module.exports = mPromise || Promise;
