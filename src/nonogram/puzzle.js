import Nonogram from './nonogram';


/**
 * @class
 * @type {Nonogram.Puzzle}
 * @this Nonogram.Puzzle
 *
 * the main puzzle class containing the grid of cells, row/column hints, etc.
 *
 * @property {number} this.width
 * @property {number} this.height
 * @property {number} this.totalCells
 * @property {array} this.cells
 * @property {array} this.rowHints
 * @property {array} this.columnHints
 * @property {Nonogram.Creator|null} creator
 * @property {array} this.grid - a multi-dimensional array representing rows and columns.
 *                   for example a 2x2 grid could be represented by [[0,1],[0,0]]
 */
Nonogram.Puzzle = class
{
	/**
	 * @param {number} width - an integer >= 1 specifying the number of rows
	 * @param {number} height - an integer >= 1 specifying the number of columns
	 */
	constructor( width, height )
	{
		if ((width <= 0 || height <= 0) || (width === 1 && height === 1)) {
			throw('invalid dimensions: ' + width.toString() + ' x ' + height.toString());
		}

		this.width      = typeof width === 'number' ? width : parseInt( width.toString(), 10 );
		this.height     = typeof height === 'number' ? height : parseInt( height.toString(), 10 );
		this.totalCells = this.width * this.height;

		this.reset();
	}


	/**
	 * empty all arrays and create zero-filled multidimensional grid array
	 */
	reset()
	{
		const zeroFill = Nonogram.Utility.getZeroFilledArray;

		this.creator     = null;
		this.cells       = [];
		this.rowHints    = [];
		this.columnHints = [];
		this.grid        = zeroFill( this.height ).map( () =>
		{
			return zeroFill( this.width );
		} );
	}


	/**
	 * - accepts a multidimensional array
	 *
	 * @param {array} grid
	 */
	createFromGrid( grid )
	{
		const self = this;
		let columnHints, row, columnKey, cell, currentVal, lastVal;

		self.reset();

		self.grid = grid;

		// populate cells array

		self.grid.forEach( function ( row, rowKey )
		{
			row.forEach( function ( column, columnKey )
			{
				self.cells.push( new Nonogram.PuzzleCell( {
					index:    (rowKey * self.width) + columnKey,
					column:   columnKey,
					row:      rowKey,
					solution: column
				} ) );
			} );
		} );


		// populate row hints
		self.grid.forEach( ( row, rowKey ) =>
		{
			let rowHints = [];

			self.rowHints[rowKey] = [];

			row.forEach( ( column, columnKey ) =>
			{
				const currentVal = column,
					  lastVal    = columnKey > 0 ? self.grid[rowKey][columnKey - 1] : 0
				;

				if (currentVal === 1 && lastVal === 0) {
					rowHints.push( 1 );
				} else if (currentVal === 0 && lastVal === 1) {
					rowHints.push( 0 );
				} else if (currentVal === 1 && lastVal === 1) {
					rowHints[rowHints.length - 1]++;
				}
			} );

			// clean up row hints
			rowHints.forEach( ( hint ) =>
			{
				if (hint > 0) {
					self.rowHints[rowKey].push( hint );
				}
			} );
		} );

		// populate column hints

		for (columnKey = 0; columnKey < self.width; columnKey++) {

			self.columnHints[columnKey] = [];
			columnHints                 = [];

			for (cell = columnKey; cell < self.totalCells; cell += self.width) {

				row        = Math.floor( cell / self.width );
				currentVal = self.grid[row][columnKey];
				lastVal    = row > 0 ? self.grid[row - 1][columnKey] : 0;

				if (currentVal === 1 && lastVal === 0) {
					columnHints.push( 1 );
				} else if (currentVal === 0 && lastVal === 1) {
					columnHints.push( 0 );
				} else if (currentVal === 1 && lastVal === 1) {
					columnHints[columnHints.length - 1]++;
				}
			}

			// clean up column hints
			columnHints.forEach( ( hint ) =>
			{
				if (hint > 0) {
					self.columnHints[columnKey].push( hint );
				}
			} );
		}
	}


	// noinspection JSUnusedGlobalSymbols
	/**
	 * @param {object} hints
	 * @param {array} hints.row
	 * @param {array} hints.column
	 */
	createFromHints( hints )
	{
		const self = this;

		self.reset();

		self.rowHints    = hints.row;
		self.columnHints = hints.column;

		// populate cells array

		self.grid.forEach( ( row, rowKey ) =>
		{
			row.forEach( ( column, columnKey ) =>
			{
				self.cells.push( new Nonogram.PuzzleCell( {
					index:  (rowKey * self.width) + columnKey,
					column: columnKey,
					row:    rowKey
				} ) );
			} );
		} );
	}


	/**
	 * @returns {boolean}
	 */
	checkUserSolution()
	{
		return this.cells.every( ( cell ) =>
		{
			// cell.solution will be 0 or 1, but cell.userSolution might be null, 0 or 1
			const userValue = cell.userSolution === 1 ? 1 : 0;

			return cell.solution === userValue;
		} );
	}


	/**
	 * @param {number} row
	 * @returns {array|boolean}
	 */
	getRowCells( row )
	{
		const self  = this,
			  cells = [];

		self.cells.forEach( ( cell ) =>
		{
			if (cell.row === row) {
				cells.push( cell );
			}
		} );

		return cells.length > 0 ? cells : false;
	}


	/**
	 * @param {number} column
	 * @returns {array|boolean}
	 */
	getColumnCells( column )
	{
		const self  = this,
			  cells = [];

		self.cells.forEach( ( cell ) =>
		{
			if (cell.column === column) {
				cells.push( cell );
			}
		} );

		return cells.length > 0 ? cells : false;
	}


	/**
	 * @param {number|string} index
	 * @returns {object|boolean}
	 */
	getCellByIndex( index )
	{
		const indexInt = typeof index !== 'number' ? parseInt( index, 10 ) : index;

		return this.cells[indexInt] ? this.cells[indexInt] : false;
	}

};



