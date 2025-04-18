var path = require('path');
var webpack = require('webpack');

module.exports = {
  devtool: 'eval',
  entry: [
    'babel-polyfill',
    'webpack-dev-server/client?http://localhost:7531',
    'webpack/hot/only-dev-server',
    './src/client'
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/static/'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin()
  ],
  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: [
          'react-hot',
          'babel'
        ],
        include: path.join(__dirname, 'src')
      },
      {
        test: /\.css$/,
	      loader: "style-loader!css-loader"
      }
    ],
  }
};
