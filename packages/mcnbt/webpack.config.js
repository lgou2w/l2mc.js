const webpack = require('webpack')
const TerserPlugin = require('terser-webpack-plugin')
const isProduction = process.env.NODE_ENV === 'production'
const version = process.env.npm_package_version
const path = require('path')

const bannerPlugin = (options) => new webpack.BannerPlugin({
  ...options,
  banner: `
l2nbt.js v${version} https://github.com/lgou2w/l2nbt.js

Copyright (C) 2019-${new Date().getFullYear()} The lgou2w <lgou2w@hotmail.com>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
imitations under the License.
`
})

module.exports = {
  mode: isProduction ? 'production' : 'development',
  entry: {
    l2nbt: './src/index.ts',
    'l2nbt.min': './src/index.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'umd',
    library: 'l2nbt',
    umdNamedDefine: true
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  devtool: 'source-map',
  plugins: [
    bannerPlugin({ entryOnly: true })
  ],
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        cache: true,
        parallel: true,
        sourceMap: true,
        include: /\.min\.js$/,
        extractComments: {
          condition: false
        }
      }),
      bannerPlugin({ include: [/\.min\.js$/] })
    ]
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'awesome-typescript-loader',
        exclude: /node_modules/
      }
    ]
  }
}
