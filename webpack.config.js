const path       = require( 'path' );
const CopyPlugin = require( 'copy-webpack-plugin' );


module.exports = {

	watch: true,
	mode:  'development',

	entry: {
		'nonogram': [
			//path.resolve( __dirname, 'src/nonogram/index.js' ),

			path.resolve( __dirname, 'src/nonogram/nonogram.js' ),
			path.resolve( __dirname, 'src/nonogram/puzzle.js' ),
			path.resolve( __dirname, 'src/nonogram/puzzle-cell.js' ),
			path.resolve( __dirname, 'src/nonogram/puzzle-line.js' ),
			path.resolve( __dirname, 'src/nonogram/utility.js' ),
			path.resolve( __dirname, 'src/nonogram/creator.js' ),
			path.resolve( __dirname, 'src/nonogram/solver.js' ),
			path.resolve( __dirname, 'src/nonogram/gui.js' ),
			path.resolve( __dirname, 'src/nonogram/gui-template.js' ),
			path.resolve( __dirname, 'src/nonogram/export.js' ),
		]
	},

	output: {
		path:          `${__dirname}/dist/nonogram`,
		publicPath:    'dist/',
		filename:      '[name].min.js',
		library:       'Nonogram',
		libraryExport: 'default',
		libraryTarget: 'umd'
	},

	plugins: [
		new CopyPlugin( [
			{
				from: path.resolve( __dirname, 'src/nonogram/themes' ),
				to:   path.resolve( __dirname, 'dist/nonogram/themes' )
			},
		] )
	],
};