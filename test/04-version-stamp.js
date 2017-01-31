var expect = require("chai").expect;
var fs = require("fs");
var temp = require("./tools/temp");
var VersionStamp = require("../lib/version-stamp");

var getVersion = [
  ["1.2.3", "1.2.3"],
  ["12.24.36", "12.24.36"],
  ["1.2", "1.2"],
  ["v1.2.3", "1.2.3"],
  ["v1.2.3-rc.2", "1.2.3"],
  ["1.2.3-rc.2", "1.2.3"],
];

var getVersionBuild10 = [
  ["1.2.3", "1.2.3.10"],
  ["12.24.36", "12.24.36.10"],
  ["v1.2.3", "1.2.3.10"],
  ["v1.2.3-rc.2", "1.2.3.10"],
  ["1.2.3-rc.2", "1.2.3.10"],
  ["1.2", "1.2.0.10"],
];

describe("version-stamp VersionStamp", function () {

  describe("stampVersion: default configuration", function () {
    var vs = new VersionStamp ();
    it("should not append a build id", function () {
      var input = "1.2.3";
      var expected = "1.2.3";
      var result = vs.stampVersion(input);
      expect(result).to.equal(expected);
      expect(result).to.be.a(typeof expected);
    }) ;
    it("should parse partial valid ids and semver", function () {
      getVersion.forEach(function (tuples) {
        var input = tuples[0];
        var expected = tuples[1];

        var result = vs.stampVersion(input);
        expect(result).to.equal(expected);
        expect(result).to.be.a(typeof expected);
      });
    });
  });
  describe("stampVersion: {version:version}", function () {
    it("should always return the same version", function () {
      var expected = "4.5.6";
      var vs = new VersionStamp ({version:expected});
      getVersion.forEach(function (tuples) {
        var input = tuples[0];

        var result = vs.stampVersion(input);
        expect(result).to.equal(expected);
        expect(result).to.be.a(typeof expected);
      });
    });
  });
  describe("stampVersion: {buildId:buildId}", function () {
    it("should patch all the valid versions with the number", function () {
      var vs = new VersionStamp ({buildId:10});
      getVersionBuild10.forEach(function (tuples) {
        var input = tuples[0];
        var expected = tuples[1];

        var result = vs.stampVersion(input);
        expect(result).to.equal(expected);
        expect(result).to.be.a(typeof expected);
      });
    });
  });
  describe("stampVersion: {version:version, buildId:buildId}", function () {
    var version = "4.5.6";
    var expected = "4.5.6.10";
    it("should always return the same version with the build id", function () {
      var vs = new VersionStamp ({version:version, buildId:10});
      getVersion.forEach(function (tuples) {
        var input = tuples[0];

        var result = vs.stampVersion(input);
        expect(result).to.equal(expected);
        expect(result).to.be.a(typeof expected);
      });
    });
  });
  describe("stampVersion: {buildId:\"filename\"}", function () {
    var testId = 0;
    var filename;
    before("create a temporary build file", function (done) {
      filename = temp.generateFileName("test-" + (++testId));
      fs.writeFile(filename, "1", function (err) {
        done(err);
      });
    });
    after("delete the temporary build file", function (done) {
      fs.unlink(filename);
      done();
    });
    it("should increment the build id for each run.", function () {
      var input = "1.2.3";
      var vs = new VersionStamp ({buildId:filename});
      for (var i = 0; i < 10; ++i) {
        var expected = input+"."+(i+2);
        var result = vs.stampVersion(input);
        expect(result).to.equal(expected);
      }
    });
  });
  describe("stampVersion: {buildId:{\"file\":\"filename\",\"autoIncrement\":false}}", function () {
    var testId = 0;
    var filename;
    before("create a temporary build file", function (done) {
      filename = temp.generateFileName("test-" + (++testId));
      fs.writeFile(filename, "1", function (err) {
        done(err);
      });
    });
    after("delete the temporary build file", function (done) {
      fs.unlink(filename);
      done();
    });
    it("should have the same build id for all the runs.", function () {
      var input = "1.2.3";
      var vs = new VersionStamp ({buildId:{file:filename, autoIncrement:false}});
      for (var i = 0; i < 10; ++i) {
        var expected = input+".1";
        var result = vs.stampVersion(input);
        expect(result).to.equal(expected);
      }
    });
  });
});
