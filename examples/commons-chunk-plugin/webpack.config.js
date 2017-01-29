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
  new webpack.optimize.CommonsChunkPlugin(/* chunkName= */"vendor", /* filename= */"vendor.bundle.js")
];

module.exports = {
  context: path.resolve(sourcePath),
  entry:  {
    background: [path.join(sourcePath, "background.js")],
    content: [path.join(sourcePath, "content.js")],
    //Testing CommonsChunkPlugin
    vendor: [path.join(sourcePath, "test.js")],
  },
  output: {
    path: distPath,
    filename: "[name].bundle.js"
  },
  plugins:plugins,
};
