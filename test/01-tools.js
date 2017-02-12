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
});
