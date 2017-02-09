# Chrome development plugin for webpack

Adds chrome related development features to webpack. Helps with generating and synchronizing the manifest.json.

[![License][npm-license-image]][npmjs-url]
[![Latest version on npm][npm-version-image]][npmjs-url]
[![Build Status][travis-image]][travis-url]
[![Dependency Status][dependency-image]][dependency-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]

## install

```bash
    npm install --save-dev chrome-dev-webpack-plugin
```

Add the plugin to your webpack configuration file:

```js
//webpack.config.js
var ChromeDevPlugin = require("chrome-dev-webpack-plugin");
var path = require("path");

module.exports = {
  context: path.join(__dirname, "src"),
  entry:  {
    background: [path.join(__dirname, "src", "background.js")],
  },
  output: {
    path: path.join(__dirname, "dist"),
    filename: "[name].bundle.js"
  },
  plugins: [new ChromeDevPlugin()]
}
```

## Features
This plugin helps streamlining chrome extension development by providing features for maintaining and synchronizing manifest.json files.

### manifest.json
By default the plugin expects a `manifest.json` file to be present in the `context` path. It will generate a new manifest.json in the `output.path`.

### auto completion
The `manifest.json` file doesn't need to be complete. You can omit some of the keys (`name`, `description`, `version`) as long as they are present in the `package.json`.
The missing keys in the `manifest.json` will be filled from the project's `package.json` file.

If the `version` key is filled, the semver notation will be translated to be compliant with chrome's version notation.

### build number
Chrome's versions are composed of up to 4 fields contrarily to the semver notation.

Optionally the 4th field in `version` can be filled with a build number. It can be generated or set manually.

### resources mapping
The plugin will automatically try to map resources with resulting bundles (ex: `background.js` to `background.bundle.js`).

Additionally if a resulting bundle ends-up being optimized (using `webpack.optimize.CommonsChunkPlugin`) all the resulting scripts lists will have the optimized bundles prepended (ex: `['background.js']` to `['vendor.bundle.js', 'background.bundle.js']`).

## Options

```js
//webpack.config.js
var ChromeDevPlugin = require("chrome-dev-webpack-plugin");
var path = require("path");

var manifestFile = "manifest.json";
var sourcePath = path.join(__dirname, "src");
var distPath = path.join(__dirname, "dist");
var sourceManifest = path.join(sourcePath, manifestFile); // ./src/manifest.json

var plugins = [
  new ChromeDevPlugin({
    //The source manifest file you want to use for your extension 
    //(defaults to {$context}/"manifest.json")
    entry:sourceManifest,

    //The resulting manifest to emit (defaults to "manifest.json")
    output:manifestFile,
    
    //The package.json file you want to use to sync data from
    package:"./package.json",

    //Sets the logging functions
    log:console.log,
    warm:console.warn,
    error:console.error,

    //Will set the version to 1.2.3 no matter what the manifest.json and
    //the package.json contains
    version: "1.2.3",

    //Will not stamp the resulting manifest.json version with a build 
    //number (default behavior).
    buildId:false,

    //sets the build number to 10 and disables file and autoIncrement.
    buildId: 10,
    buildId: "10",

    //Will use the file "./.build" to read and save the build number.
    //Will also auto-increment the build id for every successfull
    //webpack run.
    buildId:true,
    buildId:".build",
    buildId: {
      file:".build",
      autoIncrement:true,
    }
  }),
];

module.exports = {
  context: path.resolve(sourcePath),
  entry:  {
    background: [path.join(sourcePath, "background.js")],
  },
  output: {
    path: distPath,
    filename: "[name].bundle.js"
  },
  plugins: plugins
}
```

## options

 - `entry`: the path to the source manifest file (tries to find one if none provided)
 - `output`: the path to the resulting manifest file (defaults to `"manifest.json"`)
 - `package`: the path to the source package.json file (defaults to `"./package.json"`)

### logging

 - `log`: the logging function you would like use. Will override `warn` and `error` if they are not provided.
 - `warn`: the logging function you would like use for warnings
 - `error`: the logging function you would like use for errors

### override version
You can completely override the version by specifying a string:

 - `version`: the version number you want to set in your manifest.json (overrides the version found in json files)

### build number
You can choose to stamp the version in your manifest.json with a build number.

To simplify development and deployment the build id can be automatically generated when new files are emitted. First the build Id is read from a file, increased applied and saved. To enable this feature set `buildId` to true, or to a filename.

If you pass a build number instead, the build number will be used as is.
- `buildId`: activates the stamping of the version with a build number. 

```js
config = {
  buildId = process.env.TRAVIS_BUILD_NUMBER || "./.BUILDID"
}
```

## default manifest.json
If you don't set the `entry` option the plugin will try to find a manifest.json file:

- if another plugin already emits a manifest file (ex:[CopyWebpackPlugin](https://github.com/kevlened/copy-webpack-plugin)) this file will be used as an `entry`. `output` will also be automatically filled if it has not been set.
- otherwise the plugin expects to find a manifest.json file in the `context` path of your project.

## Progress
Here is the status of the features:

- [x] emit a manifest file.
- [x] synchronize the missing mandatory keys in the manifest file from a package.json file.
- [x] if no manifest is given uses the manifest.json emitted by another plugin.
- [x] if no manifest is given uses the one in the context folder if available.
- [x] if no package.json is given uses the package.json found in cwd.
- [x] map all the js files in manifest.json to the resulting compiled bundle files.
- [x] files split with the `webpack.optimize.CommonsChunkPlugin` have their dependencies prepended.
- [x] can add a build number to the version key (ex: 1.2.3.9878)
- [x] generate a build number from a file or from a given parameter
- [x] auto increments the build number and saves it to file by default
- [x] examples
- [x] testing with examples
- [ ] automatically add files listed in manifest.json to the build pipeline (if they are not already there).
- [ ] automatically reset the build number if a reset is requested on `major`, `minor`, or `patch` increase.

## License

Copyright (c) 2017, Slawomir CALUCH

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

[travis-image]: https://img.shields.io/travis/slawo/chrome-dev-webpack-plugin.svg?branch=master&style=flat-square
[travis-url]: https://travis-ci.org/slawo/chrome-dev-webpack-plugin

[dependency-image]: https://img.shields.io/gemnasium/slawo/chrome-dev-webpack-plugin.svg?style=flat-square
[dependency-url]: https://gemnasium.com/slawo/chrome-dev-webpack-plugin

[snyk-image]: https://snyk.io/test/github/slawo/chrome-dev-webpack-plugin/master/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/github/slawo/chrome-dev-webpack-plugin

[nodei-image]: https://nodei.co/npm/chrome-dev-webpack-plugin.png
[npmjs-url]: https://www.npmjs.com/package/chrome-dev-webpack-plugin

[npm-license-image]: https://img.shields.io/npm/l/chrome-dev-webpack-plugin.svg?style=flat-square
[npm-version-image]: https://img.shields.io/npm/v/chrome-dev-webpack-plugin.svg?style=flat-square