"use strict";
var chai = require("chai");
var expect = chai.expect;
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

var JsonLoader = require("../lib/json-loader");

describe("JsonLoader", function () {
  var current = "{ \"version\":\"1.2.3\", \"name\":\"test\" }";
  var cache;
  var readFunction = function () {
    cache = ""+current;
    return cache;
  };
  var invalidFunction = function () {
    return cache !== current;
  };
  it("should fail when no function are given.", function () {
    var emptyLoader = new JsonLoader();
    var resultHas = emptyLoader.hasLatestData();
    var resultLoad = emptyLoader.loadJson();
    return Promise.all([
      expect(resultHas).to.be.rejected,
      expect(resultLoad).to.be.rejected,
    ]);
  });
  it("should not fail when no invalid function are given.", function () {
    var emptyLoader = new JsonLoader(readFunction);
    var resultHas = emptyLoader.hasLatestData();
    var resultLoad = emptyLoader.loadJson();
    return Promise.all([
      expect(resultHas).to.be.rejected,
      expect(resultLoad).to.not.be.rejected,
    ]);
  });
  it("should succeed when all functions are given.", function () {
    var emptyLoader = new JsonLoader(readFunction, invalidFunction);
    var resultHas = emptyLoader.hasLatestData();
    var resultLoad = emptyLoader.loadJson();
    return Promise.all([
      expect(resultHas).to.not.be.rejected,
      expect(resultLoad).to.not.be.rejected,
    ]);
  });
});
