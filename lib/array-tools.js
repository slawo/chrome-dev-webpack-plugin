"use strict";

module.exports = {
  addUniques:addUniques,
};

function addUniques (destination, array) {
  if(Array.isArray(array) && 0 < array.length) {
    for (var i = 0, len = array.length; i <len; ++i) {
      var entry = array[i];
      if (-1 === destination.indexOf(entry)) {
        destination.push(entry);
      }
    }
  }
}
