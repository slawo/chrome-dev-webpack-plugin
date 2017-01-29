"use strict";

var path = require("path");
var WebpackChromeDevPlugin = require("../..");
var CopyWebpackPlugin = require("copy-webpack-plugin");
var webpackMajorVersion = require("webpack/package.json").version.split(".")[0];

var sourcePath = path.join(__dirname, "src");
var distPath = path.join(__dirname, "dist/webpack-" + webpackMajorVersion);

//The plugin we are testing!
var plugins = [
  new WebpackChromeDevPlugin({
  }),
  new CopyWebpackPlugin([{ from: path.join(sourcePath,"/extension/manifest.json") }]),
];

module.exports = {
  context: path.resolve(sourcePath),
  entry:  {
    background: [path.join(sourcePath, "extension", "background.js")],
    content: [path.join(sourcePath, "extension", "content.js")],
  },
  output: {
    path: distPath,
    filename: "[name].bundle.js"
  },
  plugins:plugins,
};
