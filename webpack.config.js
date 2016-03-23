var autoprefixer = require('autoprefixer');

var HtmlWebpackPlugin = require('html-webpack-plugin');
var HtmlWebpackPluginConfig = new HtmlWebpackPlugin({
  template: __dirname + '/app/index.html',
  filename: 'index.html',
  inject: 'body'
});

var ExtractTextPlugin = require('extract-text-webpack-plugin');
var ExtractTextPluginConfig = new ExtractTextPlugin('style.css');

module.exports = {
  entry: [
    './app/index.js'
  ],
  output: {
    path: __dirname + '/dist',
    filename: 'index_bundle.js'
  },
  module: {
    loaders: [
      {test: /\.jsx?$/, exclude: /node_modules/, loader: 'babel-loader'},
      {
        test: /\.scss$/,
        exclude: /node_modules/,
        loader: ExtractTextPlugin.extract('style-loader', ['css-loader', 'postcss-loader', 'sass-loader'])
      },
      {
        test: /.(png|jpg)$/,
        loader: 'url?limit=8192'
      }
    ]
  },
  postcss: function() {
    return [autoprefixer];
  },
  plugins: [
    HtmlWebpackPluginConfig,
    ExtractTextPluginConfig
  ]
}
