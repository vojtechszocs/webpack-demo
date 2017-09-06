'use strict'

// https://webpack.js.org/configuration/

const path = require('path')
const webpack = require('webpack')
const webpackMerge = require('webpack-merge')

const CleanPlugin = require('clean-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')
const HtmlPlugin = require('html-webpack-plugin')

const baseDir = __dirname
const srcDir = `${baseDir}/src`
const staticDir = `${baseDir}/static`
const distDir = `${baseDir}/dist`

const env = process.env.NODE_ENV || 'development'
const isDev = env === 'development'

const useSourceMap = true
const devServerPort = 9000

const htmlPluginInstance = ({ appEntryChunk, title }) => {
  return new HtmlPlugin({
    chunks: ['runtime', 'vendor', 'common', appEntryChunk],
    chunksSortMode: 'manual',
    filename: `${appEntryChunk}.html`,
    template: `${srcDir}/templates/app-index.html.ejs`,
    title,
    inject: 'body',
    hash: true,
    minify: isDev ? false : {
      html5: true,
      collapseWhitespace: true,
      removeComments: true
    }
  })
}

// common build configuration
const baseConfig = {

  // base directory for resolving entry point paths
  context: srcDir,

  // entry points, each one represented by a separate bundle
  entry: {
    // put application-specific entry modules here
    app1: './app1.js',
    app2: './app2.js',
    // put vendor (external, 3rd party) modules here
    vendor: ['babel-polyfill']
  },

  // compilation output settings
  output: {
    // configure output path
    path: distDir,
    // specify initial bundle (entry chunk) filename
    filename: isDev ? '[name].js' : '[name].[chunkhash].js',
    // specify lazy bundle (non-entry chunk) filename
    chunkFilename: isDev ? '[id].js' : '[id].[chunkhash].js',
    // add extra module information into generated code
    pathinfo: isDev
  },

  // configure output for use with developer tooling
  devtool: isDev ? 'cheap-source-map' : 'source-map',

  // customize how webpack resolves modules
  resolve: {
    // plug application's dependencies into module resolution
    modules: ['node_modules'],
    // when importing modules, auto-resolve file extensions
    extensions: ['.js', '.json', '*']
  },

  // configure how webpack treats different kinds of modules
  module: {

    // specify how files get transformed into modules
    rules: [
      // this loader handles JavaScript files
      {
        // regular expression to match files of given type
        test: /\.js$/,
        // limit this rule to a specific directory
        include: srcDir,
        // an ordered list of loaders to process the files
        use: [
          {
            // notice the separate .babelrc file
            loader: 'babel-loader'
          }
        ]
      },
      // this loader handles images and fonts
      {
        test: /\.(png|jpg|svg|eot|ttf|woff|woff2)$/,
        use: [
          {
            loader: 'url-loader',
            // custom options passed to the loader
            options: {
              // specify the output filename
              name: isDev ? '[name].[ext]' : '[name].[hash].[ext]',
              // return data URL if the file size is below the given limit
              limit: 10000 // 10 kB
            }
          }
        ]
      }
    ]

  },

  // use webpack plugins to enhance the compilation
  plugins: [

    // global constants, with values replaced during compilation
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(isDev ? 'development' : 'production'),
      '__DEV__': JSON.stringify(isDev)
    }),

    // vendor chunk: vendor-specific code needed by all entry points
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: Infinity
    }),

    // common chunk: application-specific code shared between entry points
    new webpack.optimize.CommonsChunkPlugin({
      name: 'common',
      chunks: ['app1', 'app2']
    }),

    // runtime chunk: code needed to bootstrap the application
    new webpack.optimize.CommonsChunkPlugin({
      name: 'runtime'
    }),

    // make sure to clean build output directory
    new CleanPlugin([distDir], {
      root: baseDir,
      verbose: isDev
    }),

    // copy additional static content into build output directory
    new CopyPlugin([
      { from: staticDir }
    ]),

    // generate HTML pages for application's entry points
    htmlPluginInstance({
      appEntryChunk: 'app1',
      title: 'webpack demo :: app1'
    }),
    htmlPluginInstance({
      appEntryChunk: 'app2',
      title: 'webpack demo :: app2'
    })

  ]

}

// development build configuration
const devConfig = webpackMerge(baseConfig, {

  // configure webpack dev-server
  devServer: {
    // this option can be used to serve additional static content
    contentBase: staticDir,
    // port number used by the dev-server
    port: devServerPort,
    // use gzip compression for everything served through dev-server
    compress: true,
    // show an overlay in the browser in case of compile errors
    overlay: true
  }

})

// production build configuration
const prodConfig = webpackMerge(baseConfig, {

  // additional plugins used for production
  plugins: [

    // run UglifyJS tool to minimize application code
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: useSourceMap
    }),

    // merge smaller chunks into bigger ones, if possible
    new webpack.optimize.MinChunkSizePlugin({
      minChunkSize: 512000 // 512 kB
    }),

    // avoid module ID changes from affecting chunk hashes
    new webpack.HashedModuleIdsPlugin()

  ]

})

module.exports = isDev ? devConfig : prodConfig
