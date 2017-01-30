var expect = require("chai").expect;
var crypto = require("crypto");
var path = require("path");
var fs = require("fs");
var os = require("os");
var ChromeDevVersionStamp = require("../src/version-stamp");

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
  ["1.2", "1.2.0.10"],
  ["v1.2.3", "1.2.3.10"],
  ["v1.2.3-rc.2", "1.2.3.10"],
  ["1.2.3-rc.2", "1.2.3.10"],
];

describe("version-stamp", function () {
  describe("default configuration: setVersion", function () {
    var vs = new ChromeDevVersionStamp ();
    it("should not append a build id", function () {
      var input = "1.2.3";
      var expected = "1.2.3";
      var result = vs.stampVersion(input);
      expect(result).to.equal(expected);
      expect(result).to.be.a(typeof expected);
    }) ;
    getVersion.forEach((tuples) => {
      it("should parse " + tuples[0] + " to " + tuples[1], function() {
        var input = tuples[0];
        var expected = tuples[1];
        var result = vs.stampVersion(input);
        expect(result).to.equal(expected);
        expect(result).to.be.a(typeof expected);
      });
    });
  });
  describe("with version", function () {
    it("should always return the same version", function() {
      var expected = "4.5.6";
      var vs = new ChromeDevVersionStamp ({version:expected});
      getVersion.forEach((tuples) => {
        var input = tuples[0];
        var result = vs.stampVersion(input);
        expect(result).to.equal(expected);
        expect(result).to.be.a(typeof expected);
      });
    });
  });
  describe("with version and build set", function () {
    var version = "4.5.6";
    var expected = "4.5.6.10";
    it("should always return the same version with the build id", function () {
      var vs = new ChromeDevVersionStamp ({version:version, buildId:10});
      getVersion.forEach((tuples) => {
        var input = tuples[0];
        var result = vs.stampVersion(input);
        expect(result).to.equal(expected);
        expect(result).to.be.a(typeof expected);
      });
    });
  });
  describe("with buildId.autoIncrement", function () {
    var testId = 0;
    var filename;
    before("create a temporary build file", function(done) {
      filename = "cdwp"+crypto.randomBytes(12).readUInt32LE(0)+"test-" + (++testId);
      filename = path.join(os.tmpdir(), filename);
      fs.writeFile(filename, "1", function (err) {
        done(err);
      });
    });
    after("delete the temporary build file", function(done) {
      fs.unlink(filename);
      done();
    });
    it("should increment the build id for each run.", function () {
      var version = "1.2.3";
      var vs = new ChromeDevVersionStamp ({buildId:filename});
      for (var i = 0; i < 10; ++i) {
        var expected = version+"."+(i+2);
        var result = vs.stampVersion(version);
        expect(result).to.equal(expected);
      }
    });
  });
});
