/* eslint-disable */
const webpack    = require( 'webpack' );
const path       = require( 'path' );
const CopyPlugin = require( 'copy-webpack-plugin' );


module.exports = {

	watch: true,

	mode: 'production',

	entry: {
		'nonogram': path.resolve( __dirname, 'src/nonogram.js' )
	},

	output: {
		path:          `${__dirname}/dist/`,
		publicPath:    'dist/',
		filename:      '[name].min.js',
		library:       'Nonogram',
		libraryTarget: 'umd'
	},

	plugins: [
		new CopyPlugin( [
			{
				from: path.resolve( __dirname, 'src/themes' ),
				to:   path.resolve( __dirname, 'dist/themes' )
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