const path = require('path')

module.exports = {
  target: 'electron-main',
  entry: './main.js',
  mode:'none',
  output: {
    path: path.resolve(__dirname, './build'),
    filename: 'main.js'
  },
  externals: {
    'any-promise': 'Promise',
  },
  node: {
    __dirname: false
  }
}