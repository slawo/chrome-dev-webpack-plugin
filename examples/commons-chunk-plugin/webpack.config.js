"use strict";

var webpack = require("webpack");
var path = require("path");
var WebpackChromeDevPlugin = require("../..");
var webpackMajorVersion = require("webpack/package.json").version.split(".")[0];

var manifestFile = "manifest.json";

var sourcePath = path.join(__dirname, "src");
var distPath = path.join(__dirname, "dist/webpack-" + webpackMajorVersion);
var sourceManifest = path.join(sourcePath, manifestFile);

//The plugin we are testing!
var plugins = [
  new WebpackChromeDevPlugin({
    entry:sourceManifest,
    output:manifestFile,
    package:path.join(__dirname,"./package.json"),
  }),
  //Testing CommonsChunkPlugin
  new webpack.optimize.CommonsChunkPlugin( {names:[
    "common",
    "commonOptOut",
    "vendor",
  ]}),
];

module.exports = {
  context: path.resolve(sourcePath),
  entry:  {
    background: ["./background.js"],
    content: [path.join(sourcePath, "content.js")],
    //Testing CommonsChunkPlugin
    common: [path.join(sourcePath, "common.js")],
    commonOptOut: [path.join(sourcePath, "commonOptOut.js")],
    vendor: [path.join(sourcePath, "test.js")],
  },
  output: {
    path: distPath,
    filename: "[name].bundle.js"
  },
  plugins:plugins,
};
