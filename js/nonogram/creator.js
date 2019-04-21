Nonogram.Creator = function ( puzzle )
{
	this.puzzle = puzzle;
	this.log    = [];
};


Nonogram.Creator.prototype.create = function ()
{
	var validPuzzle = false,
		start       = new Date().getTime(),
		chanceOfCellFill, solutionGrid, rowArray, cellValue, solver, i, end;


	while (validPuzzle === false) {

		chanceOfCellFill = this.getRandomIntBetween( 200, 800 ) / 1000;
		solutionGrid     = [];
		rowArray         = [];

		this.log.push( 'Creating random ' + this.puzzle.width + 'x' + this.puzzle.height + ' puzzle...' );

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

			validPuzzle = true;
			end         = new Date().getTime();

			this.log.push( 'Puzzle is valid.' );
			this.log.push( '-----------------------------------' );
			this.log.push( 'Puzzle generated in ' + ((end - start) / 1000) + ' seconds.' );

		} else {

			this.log.push( 'Puzzle cannot be solved.  Trying again...' );
		}

		this.log.push( '-----------------------------------' );
	}
};


Nonogram.Creator.prototype.getRandomIntBetween = function ( min, max )
{
	min = Math.ceil( min );
	max = Math.floor( max );
	return Math.floor( Math.random() * (max - min + 1) ) + min;
};

	
