"use strict";
var expect = require("chai").expect;

var fs = require("fs");
var path = require("path");
var temp = require("./tools/temp");

var JsonLoaderFile = require("../lib/json-loader-file");

describe("JsonLoaderFile", function () {
  var mainLoader;
  var folder = temp.generateFileName();
  var fileName = path.join(folder, "package.json");
  before("setup the environment", (done) => {
    temp.generateFolder(folder).then( () => {
      mainLoader = new JsonLoaderFile(fileName);
      fs.writeFile(fileName, "{\"version\":\"1.2.3\"}", done);
    },done);
  });
  after("cleanup the environment", function (done) {
    fs.unlink(fileName, (err) => {
      if(err) {
        this.warn(err);
        done();
      }
      else {fs.unlink(folder, (err) => {
        console.warn(err);
        done();
      });}
    });
  });
  describe("load", () => {
    it("should tell when the file has not been loaded.", function (done) {
      mainLoader.hasLatestData().then( (hasLatest) => {
        expect(hasLatest).to.be.false;
        done();
      }).catch(done);
    });
    it("should load the data", function (done) {
      mainLoader.loadJson().then ( (result) => {
        expect(result).to.be.json;
        expect(result).to.have.property("version");
        expect(result.version).to.equal("1.2.3");
        done();
      }).catch(done);
    });
    it("should tell when the file has not changed.", function (done) {
      mainLoader.hasLatestData().then( (hasLatest) => {
        expect(hasLatest).to.be.true;
        done();
      }).catch(done);
    });
  });
  describe("re-load", () => {
    before("rewrite the file", function (done) {
      this.timeout(1300);
      setTimeout( () => {
        fs.writeFile(fileName, "{\"version\":\"1.2.4\"}", done);
      }, 1000);
    });
    it("should tell when the file has changed.", function (done) {
      mainLoader.hasLatestData().then( (hasLatest) => {
        expect(hasLatest).to.be.false;
        done();
      }).catch(done);
    });
    it("should re-load the data and provide the new content", function (done) {
      mainLoader.loadJson().then ( (result) => {
        expect(result).to.be.json;
        expect(result).to.have.property("version");
        expect(result.version).to.equal("1.2.4");
        done();
      }).catch(done);
    });
    it("should tell when the file has not changed.", function (done) {
      mainLoader.hasLatestData().then( (hasLatest) => {
        expect(hasLatest).to.be.true;
        done();
      }).catch(done);
    });
  });
});
