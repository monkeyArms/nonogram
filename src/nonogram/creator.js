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
	 * populates the puzzle
	 *
	 * @param {number|null} density - a floating point number between 0 and 1 (optional) that controls the percentage of filled cell likelihood.
	 *                                    If not supplied a random value between 0.2 and 0.8 will be generated.
	 * @returns {Nonogram.Puzzle|Puzzle|class}
	 */
	createRandom( density )
	{
		const start      = new Date().getTime();
		let puzzleValid  = false,
			densityValid = typeof density === 'number' && density >= 0 && density <= 1,
			chanceOfCellFill, solutionGrid, rowArray, cellValue, solver, i, elapsed
		;


		while (puzzleValid === false) {

			chanceOfCellFill = densityValid ? density : Nonogram.Utility.getRandomIntBetween( 200, 800 ) / 1000;
			solutionGrid     = [];
			rowArray         = [];

			this.log.push( 'Creating random ' + this.puzzle.width + 'x' + this.puzzle.height + ' puzzle with density of ' + chanceOfCellFill + '...' );

			for (i = 0; i < this.puzzle.totalCells; i++) {

				cellValue = Math.random() < chanceOfCellFill ? 1 : 0;

				if (i % this.puzzle.width === 0 && i > 0) {
					solutionGrid.push( rowArray );
					rowArray = [];
				}

				rowArray.push( cellValue );
			}

			solutionGrid.push( rowArray );

			this.log.push( 'Attempting to solve puzzle to confirm validity...' );

			this.puzzle.createFromGrid( solutionGrid );

			solver = new Nonogram.Solver( this.puzzle );

			if (solver.solve()) {

				puzzleValid = true;
				elapsed     = (new Date().getTime() - start) / 1000;

				this.log.push( 'Puzzle is valid.' );
				this.log.push( '-----------------------------------' );
				this.log.push( 'Puzzle generated in ' + elapsed + ' seconds.' );

			} else {

				this.log.push( 'Puzzle cannot be solved.  Trying again...' );
			}

			this.log.push( '-----------------------------------' );
		}

		return this.puzzle;
	}

};

