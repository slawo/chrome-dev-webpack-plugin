"use strict";
var mPromise = Promise;
var chai = require("chai");
var expect = chai.expect;
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

var fs = require("fs");
var path = require("path");
var temp = require("./tools/temp");
var ManifestSync = require("../lib/manifest-sync");

var defaultManifest = "{\"name\":\"test-sync-extension\", \"manifest_version\":\"2\" }";
var defaultPackage = "{\"version\":\"1.2.3\", \"name\":\"test-sync\" }";

var manifestBlank = "{\"manifest_version\":\"2\"}";
var manifestWithFields = "{\"name\":\"test-sync-extension\", \"manifest_version\":\"2\", \"version\":\"3.2.3\" }";

class SyncManager {
  constructor(manifestContent, packageContent) {
    this.sync = null;
    this.folder = temp.generateFileName();

    this.manifestName = path.join(this.folder, "manifest.json");
    this.packageName = path.join(this.folder, "package.json");

    this.manifestContent = manifestContent || defaultManifest;
    this.packageContent = packageContent || defaultPackage;
  }

  init () {
    var writeFile = (filename, data) => {
      return new mPromise((resolve, reject) => {
        fs.writeFile(filename, data, (err) => {
          if(err) {reject(err);}
          else {resolve(filename);}
        });
      });
    };
    return temp.generateFolder(this.folder).then( () => {
      var fileWrites = [];

      if (null !== this.packageContent) {fileWrites.push(writeFile(this.packageName, this.packageContent));}
      if (null !== this.manifestContent) {fileWrites.push(writeFile(this.manifestName, this.manifestContent));}

      return mPromise.all(fileWrites);
    }).then ( () => {
      return this.sync = new ManifestSync(this.manifestName, this.packageName);
    });
  }
}

var initSync = function (manifestContent, packageContent) {
  var m = new SyncManager();
  m.manifestContent = manifestContent;
  m.packageContent = packageContent;
  return m.init();
};

describe("ManifestSync", function () {
  var mainManager = new SyncManager();
  var mainSync = null;
  before("setup the environment", function (done) {
    mainManager.init().then( function (result) { mainSync = result; done(); }).catch (done);
  });
  describe("Initialization:", function () {
    it("should have the given files", function () {
      var sync = mainSync;
      expect(sync.manifest).to.be.an("object");
      expect(sync.package).to.be.an("object");
    });

    it("should not have loaded the files", function () {
      var sync = mainSync;
      return mPromise.all([
        expect(sync.manifest.hasLatestData()).to.eventually.be.false,
        expect(sync.package.hasLatestData()).to.eventually.be.false,
      ]);
    });

    it("should read the given files", function () {
      var sync = mainSync;
      var loadManifest = sync.manifest.loadJson();
      var loadPackage = sync.package.loadJson();
      return mPromise.all([
        expect(loadPackage).to.eventually.be.json,
        expect(loadManifest).to.eventually.be.json,

        expect(loadManifest).to.eventually.have.property("name").equal("test-sync-extension"),
        expect(loadManifest).to.eventually.have.property("manifest_version").equal("2"),
        expect(loadManifest).to.eventually.not.have.property("version"),

        expect(loadPackage).to.eventually.have.property("version").equal("1.2.3"),
        expect(loadPackage).to.eventually.have.property("name").equal("test-sync"),
      ]);
    });
  });
  describe("sync", function () {
    it("should sync the all the required fields", function () {
      return initSync(manifestBlank, defaultPackage).then(function (sync) {
        var syncResult = sync.sync();
        return mPromise.all([
          expect(syncResult).to.eventually.be.json,
          expect(syncResult).to.eventually.have.property("manifest_version").equal("2"),
          expect(syncResult).to.eventually.have.property("name").equal("test-sync"),
          expect(syncResult).to.eventually.have.property("version").equal("1.2.3"),
        ]);
      });
    });
    it("should not sync the fields if they already exist in the manifest", function () {
      return initSync(manifestWithFields, defaultPackage).then(function (sync) {
        var syncResult = sync.sync();
        return mPromise.all([
          expect(syncResult).to.eventually.be.json,
          expect(syncResult).to.eventually.have.property("manifest_version").equal("2"),
          expect(syncResult).to.eventually.have.property("name").equal("test-sync-extension"),
          expect(syncResult).to.eventually.have.property("version").equal("3.2.3"),
        ]);
      });
    });
    it ("should fail on missing manifest", function () {
      return initSync(null, defaultPackage).then(function (sync) {
        var syncResult = sync.sync();
        return mPromise.all([
          expect(syncResult).to.be.rejected,
        ]);
      });
    });
    it ("should fail on missing files", function () {
      var sync = new ManifestSync();
      var syncResult = sync.sync();
      return mPromise.all([
        expect(syncResult).to.be.rejected,
      ]);
    });
    it ("should succeed on missing package", function () {
      return initSync(defaultManifest).then(function (sync) {
        var syncResult = sync.sync();
        return mPromise.all([
          expect(syncResult).not.to.be.rejected,
          expect(syncResult).to.eventually.have.property("name").equal("test-sync-extension"),
          expect(syncResult).to.eventually.have.property("manifest_version").equal("2"),
          expect(syncResult).to.eventually.not.have.property("version"),
        ]);
      });
    });
  });
});
