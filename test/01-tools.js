var expect = require("chai").expect;
var tools = require("../lib/tools");

var parseBuildNumber = [
  ["12", 12],
  [11, 11],
  ["b11", undefined],
  ["", undefined],
  ["0", 0],
];

var parseManifestVersion = [
  ["1.2.3", "1.2.3"],
  ["1.2", "1.2"],
  ["v1.2.3", "1.2.3"],
  ["1.2.3beta", "1.2.3"],
  ["1.2.3-rc.1", "1.2.3"],
];


describe("tools", function () {
  describe("parseBuildNumber", function () {
    parseBuildNumber.forEach(function (tuples) {
      var input = tuples[0];
      var expected = tuples[1];
      it("should parse " + (typeof input) + " " + input + " to " + (typeof expected) + " " + expected, function () {
        var result = tools.parseBuildNumber(input);
        expect(result).to.equal(expected);
        expect(result).to.be.a(typeof expected);
      });
    });
  });
  describe("parseManifestVersion", function () {
    parseManifestVersion.forEach(function (tuples) {
      var input = tuples[0];
      var expected = tuples[1];
      it("should parse " + (typeof input) + " " + input + " to " + (typeof expected) + " " + expected, function () {
        var result = tools.parseManifestVersion(input);
        expect(result).to.equal(expected);
        expect(result).to.be.a(typeof expected);
      });
    });
  });
  describe("setLoader", function () {
    it("should convert a string", function () {
      var result = tools.setLoader("file");
      expect(result.loadJson).to.be.a.function;
      expect(result.hasLatestData).to.be.a.function;
    });
    it("should load a JsonLoader", function () {
      var result = tools.setLoader(new (require("../lib/json-loader"))());
      expect(result.loadJson).to.be.a.function;
      expect(result.hasLatestData).to.be.a.function;
    });
    it("should load a valid object", function () {
      var result = tools.setLoader({loadJson:function(){}, hasLatestData:function() {} });
      expect(result.loadJson).to.be.a.function;
      expect(result.hasLatestData).to.be.a.function;
    });
    it("should fail with an invalid object", function () {
      var result = tools.setLoader({});
      expect(result).to.be.undefined;
    });
  });

  describe("getLogs", function () {
    it("should set all functions to console.log", function () {
      var logs = tools.getLogs({log:console.log});
      expect(logs).to.be.an("object");
      expect(logs).to.have.all.keys("log", "warn", "error");
      expect(logs.log).to.equal(console.log);
      expect(logs.warn).to.equal(console.log);
      expect(logs.error).to.equal(console.log);
    });
    it("should set all functions to a function by default", function () {
      var logs = tools.getLogs();
      expect(logs).to.be.an("object");
      expect(logs).to.have.all.keys("log", "warn", "error");
      expect(logs.log).to.be.a("function");
      expect(logs.warn).to.be.a("function");
      expect(logs.error).to.be.a("function");
    });
    it("should set logs to console", function () {
      var logs = tools.getLogs({log:console});
      expect(logs).to.be.an("object");
      expect(logs.log).to.equal(console.log);
      expect(logs.warn).to.equal(console.warn);
      expect(logs.error).to.equal(console.error);
    });
  });
});
