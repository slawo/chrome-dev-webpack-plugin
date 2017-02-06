var webpack = require("webpack");

// returns a Compiler instance
webpack(require("./webpack.config") , function(err, stats) {
  //console.log(stats);
});
