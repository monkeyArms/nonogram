import Nonogram from './nonogram';


/**
 * @class
 * @type {Nonogram.Solver}
 * @this Nonogram.Solver
 *
 * a class that solves nonogram puzzles using logical techniques a human might use
 *
 * @property {Nonogram.Puzzle} this.puzzle
 * @property {boolean} this.isReset
 * @property {array} this.lines
 * @property {array} this.solutionLog
 */
Nonogram.Solver = class
{

	/**
	 * @param {Nonogram.Puzzle} puzzle
	 */
	constructor( puzzle )
	{
		this.puzzle = puzzle;

		this._reset();
	}


	/**
	 *
	 * @returns {boolean}
	 */
	solve()
	{
		const self       = this,
			  start      = new Date().getTime()
		;
		let lastProgress = -1,
			pass         = 1,
			solved, passStart, passEnd, end, passElapsedTime, totalElapsedTime
		;

		if (!self.isReset) {
			self._reset();
		}

		self.isReset = false;
		self.log( 'Starting solve algorithm', 'info' );


		while (self.getProgress() > lastProgress && self.getTotalSolved() < self.puzzle.cells.length) {

			passStart    = new Date().getTime();
			lastProgress = self.getProgress();

			self.lines.forEach( ( line ) =>
			{
				if (!line.solved) {
					self.eliminateImpossibleFits( line );
					self.findKnownPositivesAndNegatives( line );
					self.findSectionDefiningChains( line );
					self.findAnchoredSections( line );
					self.findCompletedSections( line );
					self.findCompletedLines( line );
				}
			} );

			passEnd         = new Date().getTime();
			passElapsedTime = (passEnd - passStart) / 1000;

			self.log( 'Pass ' + pass + ' completed in ' + passElapsedTime + ' seconds :: '
				+ self.getTotalSolved() + '/' + self.puzzle.cells.length + ' cells solved', 'info'
			);
			pass++;
		}

		solved           = self.getTotalSolved() === self.puzzle.cells.length;
		end              = new Date().getTime();
		totalElapsedTime = (end - start) / 1000;

		self.log( 'Solve algorithm finished in ' + totalElapsedTime + ' seconds.', 'info' );

		if (solved) {
			self.log( 'Solution Found.', 'success' );
		} else {
			self.log( 'Could not find solution.', 'failure' );
		}

		return solved;
	}


	//	#############################################################################################	solution algorithms

	/**
	 *
	 * @param {Nonogram.PuzzleLine} line
	 */
	eliminateImpossibleFits( line )
	{
		const self            = this;
		let minimumStartIndex = 0,
			maximumStartIndex = line.length - line.minimumSectionLength,
			i
		;


		// no sections

		if (line.sections.length === 0) {

			line.cells.forEach( ( cell ) =>
			{
				self.setCellSolution( cell, 0 );
			} );
		}

		// tighten range if one or more known negative cells start the line

		for (i = 0; i < line.length; i++) {

			if (line.cells[i].aiSolution === 0) {
				minimumStartIndex++;
			} else {
				break;
			}
		}

		// tighten range if one or more known negative cells end the line

		for (i = line.length - 1; i >= 0; i--) {
			if (line.cells[i].aiSolution === 0) {
				maximumStartIndex--;
			} else {
				break;
			}
		}

		line.sections.forEach( ( section ) =>
		{
			let newPossibleStartIndexes = Nonogram.Utility.cloneArray( section.possibleStartIndexes );

			// eliminate places where section does not fit

			section.possibleStartIndexes.forEach( ( possibleStartIndex ) =>
			{
				const testCell = line.cells[possibleStartIndex + section.length];
				let end;

				// the total length of all sections including minimum gap(s) of one cell does not allow this section to fit:

				if (possibleStartIndex < minimumStartIndex || possibleStartIndex > maximumStartIndex) {
					newPossibleStartIndexes = Nonogram.Utility.removeFromArray( newPossibleStartIndexes, possibleStartIndex );
				}

				// there is a known positive cell immediately following the possible section placement, so section cannot start here

				if (testCell && testCell.aiSolution === 1) {
					newPossibleStartIndexes = Nonogram.Utility.removeFromArray( newPossibleStartIndexes, possibleStartIndex );
				}

				// there is a known impossible cell in this range, so section cannot fit here:

				end = possibleStartIndex + section.length - 1;
				end = (end > line.length - 1) ? line.length - 1 : end;

				for (i = possibleStartIndex; i <= end; i++) {
					if (i > line.length - 1 || line.cells[i].aiSolution === 0) {
						newPossibleStartIndexes = Nonogram.Utility.removeFromArray( newPossibleStartIndexes, possibleStartIndex );
					}
				}
			} );

			minimumStartIndex += section.length + 1;
			maximumStartIndex += section.length + 1;

			section.possibleStartIndexes = newPossibleStartIndexes;
		} );
	}


	/**
	 *
	 * @param {Nonogram.PuzzleLine} line
	 */
	findKnownPositivesAndNegatives( line )
	{
		const totalCellCounts = Nonogram.Utility.getZeroFilledArray( line.length );


		line.sections.forEach( ( section ) =>
		{
			const cellCounts = Nonogram.Utility.getZeroFilledArray( line.length );

			// keep two counts: 1) all common cells for this section, and 2) cells where no section can be

			section.possibleStartIndexes.forEach( ( possibleStartIndex ) =>
			{
				const start = possibleStartIndex,
					  end   = start + section.length - 1
				;
				let i;

				for (i = start; i <= end; i++) {
					cellCounts[i]++;
					totalCellCounts[i]++;
				}
			} );

			// common to all possibilities, solve as positive

			cellCounts.forEach( ( cellCount, cellCountKey ) =>
			{
				const cell = line.cells[cellCountKey];

				if (cell && cell.aiSolution === null && cellCount === section.possibleStartIndexes.length) {
					this.setCellSolution( cell, 1 );
				}
			} );
		} );

		// no possible cells, remove as a possibility

		totalCellCounts.forEach( ( cellCount, cellCountKey ) =>
		{
			const cell = line.cells[cellCountKey];

			if (cell && cell.aiSolution === null && cellCount === 0) {
				this.setCellSolution( cell, 0 );
			}
		} );
	}


	/**
	 *
	 * @param {Nonogram.PuzzleLine} line
	 */
	findAnchoredSections( line )
	{
		let i, fillRange, firstSection, lastSection;


		if (line.sections.length > 0) {

			firstSection = line.sections[0];
			lastSection  = line.sections[line.sections.length - 1];

			// find sections anchored to start of line

			fillRange = null;

			for (i = 0; i < line.cells.length; i++) {

				if (line.cells[i].aiSolution === null) {
					break;
				} else if (line.cells[i].aiSolution === 1) {
					fillRange = [i, i + firstSection.length - 1];
					break;
				}
			}

			if (fillRange !== null) {

				for (i = fillRange[0]; i <= fillRange[1]; i++) {
					if (line.cells[i]) {
						this.setCellSolution( line.cells[i], 1 );
					}
				}
				if (line.cells[i]) {
					this.setCellSolution( line.cells[i], 0 );
				}
			}

			// find sections anchored to end of line

			fillRange = null;

			for (i = line.cells.length - 1; i >= 0; i--) {

				if (line.cells[i].aiSolution === null) {
					break;
				} else if (line.cells[i].aiSolution === 1) {
					fillRange = [i - lastSection.length + 1, i];
					break;
				}
			}

			if (fillRange !== null) {

				for (i = fillRange[0]; i <= fillRange[1]; i++) {
					if (line.cells[i]) {
						this.setCellSolution( line.cells[i], 1 );
					}
				}
				if (line.cells[fillRange[0] - 1]) {
					this.setCellSolution( line.cells[fillRange[0] - 1], 0 );
				}
			}
		}
	}


	/**
	 *
	 * @param {Nonogram.PuzzleLine} line
	 */
	findSectionDefiningChains( line )
	{
		const self    = this;
		let chains    = [],
			lastValue = 0,
			chain, sectionsSorted, firstSortedSection
		;


		// sort sections by highest length to lowest

		sectionsSorted     = Nonogram.Utility.cloneArray( line.sections ).sort( function ( a, b )
		{
			return a.length > b.length ? -1 : 1;
		} );
		firstSortedSection = sectionsSorted[0];


		// loop through all cells, creating array of connectors

		line.cells.forEach( ( cell, cellKey ) =>
		{
			if (cell.aiSolution === 1) {
				if (lastValue !== 1) {
					chain = {
						start:  cellKey,
						length: 1
					};
					chains.push( chain );
				} else {
					chain.length++;
				}
			}

			lastValue = cell.aiSolution;
		} );


		// if a connector is found with the first section's length, place negatives around it and mark the section as complete & continue

		chains.forEach( ( chain ) =>
		{
			if (chain.length === firstSortedSection.length) {

				if (line.cells[chain.start - 1]) {
					self.setCellSolution( line.cells[chain.start - 1], 0 );
				}

				if (line.cells[chain.start + firstSortedSection.length]) {
					self.setCellSolution( line.cells[chain.start + firstSortedSection.length], 0 );
				}

				firstSortedSection.solved = true;
			}
		} );
	}


	/**
	 *
	 * @param {Nonogram.PuzzleLine} line
	 */
	findCompletedSections( line )
	{
		// complete lines where all sections have been found

		line.sections.forEach( ( section ) =>
		{
			let firstNegative, lastNegative;


			// only one possible place...

			if (!section.solved && section.possibleStartIndexes.length === 1) {

				// make sure there is a negative cell on either side of the section

				firstNegative = section.possibleStartIndexes[0] - 1;
				lastNegative  = section.possibleStartIndexes[0] + section.length;

				if (line.cells[firstNegative] && line.cells[firstNegative].aiSolution === null) {
					this.setCellSolution( line.cells[firstNegative], 0 );
				}
				if (line.cells[lastNegative] && line.cells[lastNegative].aiSolution === null) {
					this.setCellSolution( line.cells[lastNegative], 0 );
				}

				section.solved = true;
			}
		} );
	}


	/**
	 *
	 * @param {Nonogram.PuzzleLine} line
	 */
	findCompletedLines( line )
	{
		let totalSectionLength  = 0,
			totalPositiveSolved = 0
		;

		// complete lines where all sections have been found

		line.sections.forEach( ( section ) =>
		{
			totalSectionLength += section.length;
		} );

		line.cells.forEach( ( cell ) =>
		{
			totalPositiveSolved += cell.aiSolution === 1;
		} );

		if (totalSectionLength === totalPositiveSolved) {

			line.cells.forEach( ( cell ) =>
			{
				if (cell.aiSolution === null) {
					this.setCellSolution( cell, 0 );
				}
			} );
		}
	}


	//	#############################################################################################	internal methods


	/**
	 *
	 */
	_reset()
	{
		const self                  = this,
			  possibleRowIndexes    = [],
			  possibleColumnIndexes = [];
		let i;

		self.isReset     = true;
		self.solutionLog = [];
		self.lines       = [];

		this.log( 'Resetting variables', 'info' );

		self.puzzle.cells.forEach( ( cell ) =>
		{
			cell.aiSolution = null;
		} );

		for (i = 0; i < self.puzzle.width; i++) {
			possibleRowIndexes.push( i );
		}

		for (i = 0; i < self.puzzle.height; i++) {
			possibleColumnIndexes.push( i );
		}

		//console.log( self.puzzle.rowHints );

		self.puzzle.rowHints.forEach( ( rowHints, rowNumber ) =>
		{
			const rowCells = self.puzzle.getRowCells( rowNumber );

			if (rowCells) {

				let line = new Nonogram.PuzzleLine( {
					type:   'row',
					index:  rowNumber,
					length: self.puzzle.width,
					cells:  rowCells
				} );

				rowHints.forEach( ( len, index ) =>
				{
					line.sections.push( {
						index:                index,
						length:               len,
						possibleStartIndexes: possibleRowIndexes,
						knownIndexes:         [],
						solved:               false
					} );

					line.minimumSectionLength += len + 1;
				} );

				line.minimumSectionLength--;

				self.lines.push( line );
			}
		} );


		self.puzzle.columnHints.forEach( ( columnHint, columnKey ) =>
		{
			const line = new Nonogram.PuzzleLine( {
				type:   'column',
				index:  columnKey,
				length: this.puzzle.height,
				cells:  this.puzzle.getColumnCells( columnKey ),
			} );

			columnHint.forEach( ( len, index ) =>
			{
				line.sections.push( {
					index:                index,
					length:               len,
					possibleStartIndexes: possibleColumnIndexes,
					knownIndexes:         [],
					solved:               false
				} );

				line.minimumSectionLength += len + 1;
			} );

			line.minimumSectionLength--;

			self.lines.push( line );
		} );
	}


	/**
	 *
	 * @param {Nonogram.PuzzleCell} puzzleCell
	 * @param {number} value
	 */
	setCellSolution( puzzleCell, value )
	{
		if (puzzleCell.aiSolution !== null) {
			return;
		}

		this.lines.forEach( ( line ) =>
		{
			const isRow     = line.type === 'row' && line.index === puzzleCell.row,
				  isCol     = line.type === 'column' && line.index === puzzleCell.column
			;
			let cellsSolved = 0;

			if (isRow || isCol) {

				line.cells.forEach( ( cell ) =>
				{
					if (cell.index === puzzleCell.index) {
						cell.aiSolution = value;
						cellsSolved++;
					} else if (cell.aiSolution !== null) {
						cellsSolved++;
					}
				} );

				if (cellsSolved === line.length) {
					line.solved = true;
				}
			}
		} );
	}


	/**
	 *
	 * @param html
	 * @param cssClass
	 */
	log( html, cssClass )
	{
		this.solutionLog.push( {
			html:     html,
			cssClass: cssClass
		} );
	}


	/**
	 *
	 * @returns {number}
	 */
	getTotalSolved()
	{
		let total = 0;

		this.puzzle.cells.forEach( ( cell ) =>
		{
			total += cell.aiSolution !== null;
		} );

		return total;
	}


	/**
	 * - calculate the maximum # of possible permutations, depending on the current state of the solving process.
	 *
	 * @returns {number}
	 */
	getProgress()
	{
		const self             = this;
		let maxPossibilities   = 0,
			totalPossibilities = 0
		;

		self.lines.forEach( ( line ) =>
		{
			maxPossibilities += line.sections.length * (line.type === 'row' ? this.puzzle.width : this.puzzle.height);

			line.sections.forEach( ( section ) =>
			{
				totalPossibilities += section.possibleStartIndexes.length;
			} );
		} );

		return maxPossibilities - totalPossibilities;
	}

};







