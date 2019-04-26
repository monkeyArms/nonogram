const webpack    = require( 'webpack' );
const path       = require( 'path' );
const CopyPlugin = require( 'copy-webpack-plugin' );


module.exports = {

	watch: true,
	mode:  'development',

	entry: {
		'nonogram': [
			path.resolve( __dirname, 'src/nonogram.js' ),
			path.resolve( __dirname, 'src/puzzle.js' ),
			path.resolve( __dirname, 'src/puzzle-cell.js' ),
			path.resolve( __dirname, 'src/puzzle-line.js' ),
			path.resolve( __dirname, 'src/utility.js' ),
			path.resolve( __dirname, 'src/creator.js' ),
			path.resolve( __dirname, 'src/solver.js' ),
			path.resolve( __dirname, 'src/gui.js' ),
			path.resolve( __dirname, 'src/gui-template.js' ),
			path.resolve( __dirname, 'src/puzzle-library.js' ),
			path.resolve( __dirname, 'src/export.js' ),
		]
	},

	output: {
		path:          `${__dirname}/dist/`,
		publicPath:    'dist/',
		filename:      '[name].min.js',
		library:       'Nonogram',
		libraryExport: 'default',
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
};