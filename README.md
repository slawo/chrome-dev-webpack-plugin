# Chrome development plugin for webpack

Adds chrome related development features to webpack. Helps with generating and synchronizing the manifest.json.

## Why?
For every chrome extension (standalone or paired with a web application) the same tasks are required and the same issues with version synchronization arise.
To standardize the development process with webpack generated chrome extensions this plugin was created.

## How to
Add the plugin to your webpack configuration file.

    //webpack.config.js
    var ChromeDevPlugin = require("chrome-dev-webpack-plugin");
    var path = require("path");

    var manifestFile = "manifest.json";
    var sourcePath = path.join(__dirname, "src");
    var distPath = path.join(__dirname, "dist");
    var sourceManifest = path.join(sourcePath, manifestFile); // ./src/manifest.json
    module.exports = {
      context: path.resolve(sourcePath),
      entry:  {
        background: [path.join(sourcePath, "background.js")],
      },
      output: {
        path: distPath,
        filename: "[name].bundle.js"
      },
      plugins: [
        new ChromeDevPlugin({
          entry:sourceManifest,
          output:manifestFile,
          package:"./package.json",
        }),
      ]
    }

## manifest.json
The manifest.json file doesn't need to be complete. You can omit some of the fields and the plugin will automatically fill them with the information found in package.json.
Ex:

    {
      "manifest_version": 2,
      "description": "An example without version or name",
      "background": {
        "scripts": ["background.js"]
      }
    }

## options

 - `entry`: the path to the source manifest file (tries to find one if none provided)
 - `output`: the path to the resulting manifest file (defaults to `"manifest.json"`)
 - `package`: the path to the source package.json file (defaults to `"./package.json"`)

### logging

 - `log`: the logging function you would like use. Will override `warn` and `error` if they are not provided.
 - `warn`: the logging function you would like use for warnings
 - `error`: the logging function you would like use for errors


## default manifest.json
If you don't set `entry` the plugin will try to find a manifest.json file:

- if another plugin already emits a manifest file (ex:[CopyWebpackPlugin](https://github.com/kevlened/copy-webpack-plugin)) this file will be used as an `entry`. `output` will be auto filled if it has not been set.
- otherwise the plugin expects to find a manifest.json file in the `context` path of your project.

## Features 
The plugin has the following functions to help with chrome extensions development:

- [x] emit a manifest file.
- [x] synchronizes the missing fields in the manifest file from a package.json file.
- [x] if no manifest is given uses the manifest.json emitted by another plugin.
- [x] if no manifest is given uses the one in the context folder if available.
- [x] if no package.json is given uses the package.json found in cwd.
- [] update all the references to js files in manifest.json to references to the resulting compiled bundle files.
- [] automatically add files listed in manifest.json to the build pipeline
- [] adds a build number to the version field (ex: 1.2.3.9878)
- [] generates a build number from a file
- [] auto completes the list of files upon bundles splitting.

## License

Copyright (c) 2017, Slawomir CALUCH

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
