import Nonogram from './nonogram';


/**
 * @class
 * @type {Nonogram.Creator}
 * @this Nonogram.Creator
 *
 * creates nonogram puzzles
 *
 * @property {Nonogram.Puzzle} puzzle
 * @property {array} _log
 * @property {number} creationTime
 * @property {number} solvingTime
 * @property {number} elapsedTime
 */
Nonogram.Creator = class
{


	_reset()
	{
		this.log          = [];
		this.creationTime = 0;
		this.solvingTime  = 0;
		this.elapsedTime  = 0;
	}


	// ######################################################################################	public methods

	/**
	 * populates the puzzles rows and columns with random, solvable values
	 *
	 * @param {number} width
	 * @param {number} height
	 * @param {number|null} density - a floating point number between 0 and 1 (optional) that controls the percentage of filled cell likelihood.
	 *                                    If not supplied a random value between 0.2 and 0.8 will be generated.
	 *                                    Note that this does not make a puzzle grid filled in by the percentage,
	 *                                    rather it's a 'suggestion' that is run through randomization on a cell-by-cell basis.
	 * @returns {Nonogram.Puzzle|Puzzle|class}
	 */
	createRandom( width, height, density )
	{
		const start      = new Date().getTime();
		let puzzleValid  = false,
			densityValid = typeof density === 'number' && density >= 0 && density <= 1,
			cellsFilled, chanceOfCellFill, solutionGrid, rowArray, cellValue, solver, i, elapsed
		;


		this.puzzle = new Nonogram.Puzzle( width, height );
		this._reset();


		while (puzzleValid === false) {

			chanceOfCellFill = densityValid ? density : Nonogram.Utility.getRandomIntBetween( 200, 800 ) / 1000;
			solutionGrid     = [];
			rowArray         = [];
			cellsFilled      = 0;

			this._log( 'Creating random ' +
				this.puzzle.width + 'x' + this.puzzle.height +
				' puzzle with density of ' + chanceOfCellFill + '...'
			);

			// create puzzle grid randomly using density as a factor

			for (i = 0; i < this.puzzle.totalCells; i++) {

				cellValue = Math.random() < chanceOfCellFill ? 1 : 0;

				cellsFilled += cellValue;

				if (i % this.puzzle.width === 0 && i > 0) {
					solutionGrid.push( rowArray );
					rowArray = [];
				}

				rowArray.push( cellValue );
			}

			// ensure that at least one cell is filled, and that not all of them are

			if (cellsFilled === 0) {

				this._log( 'Generated puzzle has no cells filled.  Trying again...' );
				continue;

			} else if (cellsFilled === this.puzzle.totalCells) {

				this._log( 'Generated puzzle has all cells filled.  Trying again...' );
				continue;
			}


			// populate the solution grid
			solutionGrid.push( rowArray );

			// populate the grid
			this.puzzle = Nonogram.Creator._populatePuzzleFromGrid( this.puzzle, solutionGrid );


			// ensure that puzzle is solvable
			solver = new Nonogram.Solver( this.puzzle );

			if (solver.solve()) {

				puzzleValid = true;
				elapsed     = (new Date().getTime() - start) / 1000;

				this._log( 'Puzzle is solvable - solved in ' + solver.elapsedTime + ' seconds' );
				this._logLine();
				this._log( 'Puzzle generated in ' + elapsed + ' seconds.' );

				this.creationTime = elapsed - solver.elapsedTime;
				this.solvingTime  = solver.elapsedTime;
				this.elapsedTime  = elapsed;

			} else {

				this._log( 'Puzzle cannot be solved.  Trying again...' );
			}

			this._logLine();
		}

		this.puzzle.creator = this;

		return this.puzzle;
	}


	/**
	 * - create a puzzle using a grid
	 *
	 * @param {array} grid - a multi-dimensional array representing rows and columns.
	 *                         for example a 2x2 grid could be represented by [[0,1],[0,0]]
	 * @throws - error if grid is invalid
	 */
	createFromGrid( grid )
	{
		const start = new Date();
		let width   = 0,
			height  = 0,
			puzzle, solver, elapsed
		;

		this._reset();

		this._log( 'creating puzzle from grid array.' );

		// make sure grid is valid and get width & height
		if (!grid instanceof Array) {
			throw 'grid is not an array';
		}


		grid.forEach( ( row, rowKey ) =>
		{
			if (!row instanceof Array) {
				throw 'grid is not a multi-dimensional array';
			}

			if (width === 0) {
				width = row.length;
			} else if (row.length !== width) {
				throw 'row ' + rowKey + ' has an invalid length (' + row.length + ') - expecting ' + width;
			}

			height++;
		} );

		this._log( 'grid is valid' );
		this._log( 'populating ' + width + 'x' + height + ' puzzle' );

		puzzle = new Nonogram.Puzzle( width, height );

		this.puzzle         = Nonogram.Creator._populatePuzzleFromGrid( puzzle, grid );
		this.puzzle.creator = this;

		// ensure that puzzle is solvable

		solver = new Nonogram.Solver( this.puzzle );


		if (solver.solve()) {

			this._log( 'Puzzle is solvable.' );
			this._logLine();

		} else {

			this._log( 'Puzzle cannot be solved.' );
			this._logLine();
			return false;
		}

		elapsed = (new Date().getTime() - start) / 1000;

		this._log( 'Puzzle built and solved in ' + elapsed + ' seconds.' );
		this._logLine();

		return this.puzzle;
	}


	/**
	 * - create a puzzle from a hint object
	 *
	 * @param {object} hints - structured like this:  {
	 * 									row: [[3], [5], [5], [2, 3], [1, 5], [2, 1, 1], [2, 5], [1, 3]],
										column: [[1, 3], [4], [], [2, 3], [5, 2], [5, 2], [5, 2], [2, 3]]
									}
	 * @param {array} hints.row
	 * @param {array} hints.column
	 * @throws - error if hints object is structured incorrectly
	 */
	createFromHints( hints )
	{
		const start = new Date();
		let width, height, puzzle, solver, elapsed;

		this._reset();

		this._log( 'creating puzzle from hints' );

		// make sure row & column properties exist

		if (typeof hints !== 'object' || !hints.row || !hints.column) {

			throw 'parameter passed to createFromHints() must be an object containing "row" and "column" properties';

		} else if (!hints.row instanceof Array || !hints.column instanceof Array) {

			throw 'hints.row or hints.column must be an array.';
		}
		this._log( 'found row and column hints' );

		width              = hints.column.length;
		height             = hints.row.length;
		puzzle             = new Nonogram.Puzzle( width, height );
		puzzle.rowHints    = hints.row;
		puzzle.columnHints = hints.column;
		puzzle.creator     = this;

		this._log( 'populating ' + width + 'x' + height + ' puzzle' );


		// populate cells array

		puzzle.grid.forEach( ( row, rowKey ) =>
		{
			row.forEach( ( column, columnKey ) =>
			{
				puzzle.cells.push( new Nonogram.PuzzleCell( {
					index:  (rowKey * puzzle.width) + columnKey,
					column: columnKey,
					row:    rowKey
				} ) );
			} );
		} );

		this.puzzle = puzzle;


		// ensure that puzzle is solvable

		solver = new Nonogram.Solver( this.puzzle );


		if (solver.solve()) {

			this._log( 'Puzzle is solvable.' );
			this._logLine();

		} else {

			this._log( 'Puzzle cannot be solved.' );
			this._logLine();
			return false;
		}

		// set solution on puzzle cells

		solver.puzzle.cells.forEach( ( solvedCell, cellIndex ) =>
		{
			const puzzleCell = this.puzzle.getCellByIndex( cellIndex );

			puzzleCell.aiSolution = solvedCell.aiSolution;
			puzzleCell.solution   = solvedCell.aiSolution;
		} );

		elapsed = (new Date().getTime() - start) / 1000;

		this._log( 'Puzzle built and solved in ' + elapsed + ' seconds.' );
		this._logLine();

		return this.puzzle;
	}


	// ######################################################################################	private methods

	/**
	 *
	 * @param {Nonogram.Puzzle} puzzle
	 * @param {array} grid - a multidimensional array
	 * @returns {Nonogram.Puzzle} puzzle
	 * @private
	 */
	static _populatePuzzleFromGrid( puzzle, grid )
	{
		let columnHints, rowKey, row, columnKey, column, cell, currentVal, lastVal, rowHints, hintKey, hint;

		puzzle.reset();

		puzzle.grid = grid;


		for (rowKey = 0; rowKey < puzzle.grid.length; rowKey++) {

			row      = puzzle.grid[rowKey];
			rowHints = [];

			puzzle.rowHints[rowKey] = [];

			for (columnKey = 0; columnKey < row.length; columnKey++) {

				column     = row[columnKey];
				currentVal = column;
				lastVal    = columnKey > 0 ? puzzle.grid[rowKey][columnKey - 1] : 0;

				// populate cells

				puzzle.cells.push( new Nonogram.PuzzleCell( {
					index:    (rowKey * puzzle.width) + columnKey,
					column:   columnKey,
					row:      rowKey,
					solution: column
				} ) );

				// populate row hints

				if (currentVal === 1 && lastVal === 0) {
					rowHints.push( 1 );
				} else if (currentVal === 0 && lastVal === 1) {
					rowHints.push( 0 );
				} else if (currentVal === 1 && lastVal === 1) {
					rowHints[rowHints.length - 1]++;
				}
			}

			// clean up row hints

			for (hintKey = 0; hintKey < rowHints.length; hintKey++) {

				hint = rowHints[hintKey];

				if (hint > 0) {
					puzzle.rowHints[rowKey].push( hint );
				}
			}
		}

		// populate column hints

		for (columnKey = 0; columnKey < puzzle.width; columnKey++) {

			puzzle.columnHints[columnKey] = [];
			columnHints                   = [];

			for (cell = columnKey; cell < puzzle.totalCells; cell += puzzle.width) {

				row        = Math.floor( cell / puzzle.width );
				currentVal = puzzle.grid[row][columnKey];
				lastVal    = row > 0 ? puzzle.grid[row - 1][columnKey] : 0;

				if (currentVal === 1 && lastVal === 0) {
					columnHints.push( 1 );
				} else if (currentVal === 0 && lastVal === 1) {
					columnHints.push( 0 );
				} else if (currentVal === 1 && lastVal === 1) {
					columnHints[columnHints.length - 1]++;
				}
			}

			// clean up column hints

			for (hintKey = 0; hintKey < columnHints.length; hintKey++) {

				hint = rowHints[hintKey];

				if (hint > 0) {
					puzzle.columnHints[columnKey].push( hint );
				}
			}
		}

		return puzzle;
	}


	/**
	 *
	 * @param msg
	 * @private
	 */
	_log( msg )
	{
		this.log.push( msg );
	}


	/**
	 *
	 * @private
	 */
	_logLine()
	{
		this.log.push( '-----------------------------------' );
	}


	/**
	 * @private
	 */
	_reset()
	{
		this.log          = [];
		this.creationTime = 0;
		this.solvingTime  = 0;
	}


};

