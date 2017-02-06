"use strict";

var path = require("path");
var WebpackChromeDevPlugin = require("../..");
var CopyWebpackPlugin = require("copy-webpack-plugin");
var webpackMajorVersion = require("webpack/package.json").version.split(".")[0];

var sourcePath = path.join(__dirname, "src");
var distPath = path.join(__dirname, "dist/webpack-" + webpackMajorVersion);

//The plugin we are testing!
var plugins = [
  new CopyWebpackPlugin([{ from: "./manifest.json" }]),
  new WebpackChromeDevPlugin({
    //log:console.log
  }),
];

module.exports = {
  context: path.resolve(sourcePath),
  entry:  {
    background: ["./background.js"],
    content: ["./content.js"],
  },
  output: {
    path: distPath,
    filename: "[name].bundle.js"
  },
  plugins:plugins,
};
