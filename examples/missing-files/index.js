var webpack = require("webpack");

// returns a Compiler instance
webpack(require("./webpack.config") , function(err) {
  /*eslint-disable no-console */
  if(err) {console.error(err);}
  /*eslint-enable no-console */
});
