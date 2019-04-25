import Nonogram from './nonogram';


/**
 * @class
 * @type {Nonogram.Creator}
 * @this Nonogram.Creator
 *
 * creates nonogram puzzles
 *
 * @property {Nonogram.Puzzle} this.puzzle
 * @property {array} this.log
 */
Nonogram.Creator = class
{
	/**
	 * creates a new puzzle
	 *
	 * @param {number} width
	 * @param {number} height
	 */
	constructor( width, height )
	{
		this.puzzle = new Nonogram.Puzzle( width, height );
		this.log    = [];
	}


	/**
	 * populates the puzzles rows and columns with random, solvable values
	 *
	 * @param {number|null} density - a floating point number between 0 and 1 (optional) that controls the percentage of filled cell likelihood.
	 *                                    If not supplied a random value between 0.2 and 0.8 will be generated.
	 *                                    Note that this does not make a puzzle grid filled in by the percentage,
	 *                                    rather it's a 'suggestion' that is run through randomization on a cell-by-cell basis.
	 * @returns {Nonogram.Puzzle|Puzzle|class}
	 */
	createRandom( density )
	{
		const start      = new Date().getTime();
		let puzzleValid  = false,
			densityValid = typeof density === 'number' && density >= 0 && density <= 1,
			cellsFilled, chanceOfCellFill, solutionGrid, rowArray, cellValue, solver, i, elapsed
		;


		while (puzzleValid === false) {

			chanceOfCellFill = densityValid ? density : Nonogram.Utility.getRandomIntBetween( 200, 800 ) / 1000;
			solutionGrid     = [];
			rowArray         = [];
			cellsFilled      = 0;

			this.log.push( 'Creating random ' +
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

				this.log.push( 'Generated puzzle has no cells filled.  Trying again...' );
				continue;

			} else if (cellsFilled === this.puzzle.totalCells) {

				this.log.push( 'Generated puzzle has all cells filled.  Trying again...' );
				continue;
			}


			// populate the solution grid
			solutionGrid.push( rowArray );

			// populate the grid
			this.puzzle.createFromGrid( solutionGrid );

			// ensure that puzzle is solvable
			solver = new Nonogram.Solver( this.puzzle );

			if (solver.solve()) {

				puzzleValid = true;
				elapsed     = (new Date().getTime() - start) / 1000;

				this.log.push( 'Puzzle is solvable.' );
				this.log.push( '-----------------------------------' );
				this.log.push( 'Puzzle generated in ' + elapsed + ' seconds.' );

			} else {

				this.log.push( 'Puzzle cannot be solved.  Trying again...' );
			}

			this.log.push( '-----------------------------------' );
		}

		this.puzzle.creator = this;

		return this.puzzle;
	}

};

