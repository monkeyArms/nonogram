/* eslint-disable */
const webpack    = require( 'webpack' );
const path       = require( 'path' );
const pkg        = require( './package.json' );
const CopyPlugin = require( 'copy-webpack-plugin' );

const production = true;

let mode, outputFilename, minimize;


if (production) {

	mode           = 'production';
	outputFilename = pkg.name + '.min.js';
	minimize       = true;

} else {

	mode           = 'development';
	outputFilename = pkg.name + '.js';
	minimize       = false;
}


module.exports = {

	watch: true,

	mode: mode,

	entry: {
		'nonogram': __dirname + '/src/index.js',
	},

	output: {
		path:           __dirname + '/dist/',
		publicPath:     'dist/',
		filename:       outputFilename,
		library:        'Nonogram',
		libraryTarget:  'umd',
		umdNamedDefine: true,
	},

	optimization: {
		minimize: minimize
	},

	plugins: [
		new CopyPlugin( [
			{
				from: __dirname + '/src/themes',
				to:   __dirname + '/dist/themes'
			},
		] ),
		new webpack.SourceMapDevToolPlugin( {
			filename: '[name].js.map',
		} ),
	],

	module: {
		rules: [
			{
				test:    /\.js$/,
				exclude: /(node_modules|bower_components)/,
				use:     {
					loader:  'babel-loader',
					options: {
						presets: ['@babel/preset-env']
					}
				}
			}
		]
	},

};