const path = require('path')

module.exports = {

  entry: path.join(__dirname, '/client/src/index.js'),

  output: {
    path: path.join(__dirname, '/client/dist/js'),
    filename: 'app.js'
  },

  module: {
    loaders: [{
      test: /\.js?$/,
      include: path.join(__dirname, '/client/src'),
      loader: 'babel-loader',
      query: {
        presets: ['react', 'env']
      }
    }]
  },

  // watch: true
  watch: false
}
