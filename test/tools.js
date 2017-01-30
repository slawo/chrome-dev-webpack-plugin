var expect = require("chai").expect;
var tools = require("../src/tools");

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
    parseBuildNumber.forEach((tuples) => {
      var input = tuples[0];
      var expected = tuples[1];
      it("should parse " + (typeof input) + " " + input + " to " + (typeof expected) + " " + expected, function() {
        var result = tools.parseBuildNumber(input);
        expect(result).to.equal(expected);
        expect(result).to.be.a(typeof expected);
      });
    });
  });
  describe("parseManifestVersion", function () {
    parseManifestVersion.forEach((tuples) => {
      var input = tuples[0];
      var expected = tuples[1];
      it("should parse " + (typeof input) + " " + input + " to " + (typeof expected) + " " + expected, function() {
        var result = tools.parseManifestVersion(input);
        expect(result).to.equal(expected);
        expect(result).to.be.a(typeof expected);
      });
    });
  });
});
