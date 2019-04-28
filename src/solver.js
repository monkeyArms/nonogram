import {PuzzleLine} from '../src/puzzle-line.js';
import {Utility} from '../src/utility.js';


export {Solver};

/**
 * @class
 * @type {Solver}
 * @this Solver
 *
 * a class that solves nonogram puzzles using logical techniques a human might use
 *
 * @property {Puzzle} puzzle
 * @property {number} elapsedTime
 * @property {boolean} isReset
 * @property {array} lines
 * @property {array} solutionLog
 */
const Solver = class
{

	/**
	 * @param {Puzzle} puzzle
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
		const start      = new Date().getTime();
		let lastProgress = -1,
			pass         = 1,
			solved, passStart, passEnd, end, passElapsedTime, totalElapsedTime, lineKey, line
		;

		if (!this.isReset) {
			this._reset();
		}

		this.isReset = false;
		this._log( 'Starting solve algorithm', 'info' );


		while (this._getProgress() > lastProgress && this._getTotalSolved() < this.puzzle.cells.length) {

			passStart    = new Date().getTime();
			lastProgress = this._getProgress();

			for (lineKey = 0; lineKey < this.lines.length; lineKey++) {

				line = this.lines[lineKey];

				if (!line.solved) {
					this.eliminateImpossibleFits( line );
				}
				if (!line.solved) {
					this.findKnownPositivesAndNegatives( line );
				}
				if (!line.solved) {
					this.findSectionDefiningChains( line );
				}
				if (!line.solved) {
					this.findAnchoredSections( line );
				}
				if (!line.solved) {
					this.findCompletedSections( line );
				}
				if (!line.solved) {
					this.findCompletedLines( line );
				}
			}

			passEnd         = new Date().getTime();
			passElapsedTime = (passEnd - passStart) / 1000;

			this._log( 'Pass ' + pass + ' completed in ' + passElapsedTime + ' seconds :: '
				+ this._getTotalSolved() + '/' + this.puzzle.cells.length + ' cells solved', 'info'
			);
			pass++;
		}

		solved           = this._getTotalSolved() === this.puzzle.cells.length;
		end              = new Date().getTime();
		totalElapsedTime = (end - start) / 1000;

		this._log( 'Solve algorithm finished in ' + totalElapsedTime + ' seconds.', 'info' );

		if (solved) {
			this._log( 'Solution Found.', 'success' );
		} else {
			this._log( 'Could not find solution.', 'failure' );
		}

		this.elapsedTime = totalElapsedTime;

		return solved;
	}


	//	#############################################################################################	solution algorithms

	/**
	 *
	 * @param {PuzzleLine} line
	 */
	eliminateImpossibleFits( line )
	{
		let minimumStartIndex = 0,
			maximumStartIndex = line.length - line.minimumSectionLength,
			i, section, possibleStartIndex, newPossibleStartIndexes, lineSectionKey, startIndexKey, testCell, end,
			lineCellKey, lineKey
		;


		// no sections

		if (line.sections.length === 0) {

			for (lineCellKey = 0; lineCellKey < line.cells.length; lineCellKey++) {
				this._setCellSolution( line.cells[lineCellKey], 0 );
			}
		}

		// tighten range if one or more known negative cells start the line

		for (lineKey = 0; lineKey < line.length; lineKey++) {

			if (line.cells[lineKey].aiSolution === 0) {
				minimumStartIndex++;
			} else {
				break;
			}
		}

		// tighten range if one or more known negative cells end the line

		for (lineKey = line.length - 1; lineKey >= 0; lineKey--) {
			if (line.cells[lineKey].aiSolution === 0) {
				maximumStartIndex--;
			} else {
				break;
			}
		}


		for (lineSectionKey = 0; lineSectionKey < line.sections.length; lineSectionKey++) {

			section                 = line.sections[lineSectionKey];
			newPossibleStartIndexes = Utility.cloneArray( section.possibleStartIndexes );

			// eliminate places where section does not fit

			for (startIndexKey = 0; startIndexKey < section.possibleStartIndexes.length; startIndexKey++) {

				possibleStartIndex = section.possibleStartIndexes[startIndexKey];

				testCell = line.cells[possibleStartIndex + section.length];

				// the total length of all sections including minimum gap(s) of one cell does not allow this section to fit:

				if (possibleStartIndex < minimumStartIndex || possibleStartIndex > maximumStartIndex) {
					newPossibleStartIndexes = Utility.removeFromArray( newPossibleStartIndexes, possibleStartIndex );
				}

				// there is a known positive cell immediately following the possible section placement, so section cannot start here

				if (testCell && testCell.aiSolution === 1) {
					newPossibleStartIndexes = Utility.removeFromArray( newPossibleStartIndexes, possibleStartIndex );
				}

				// there is a known impossible cell in this range, so section cannot fit here:

				end = possibleStartIndex + section.length - 1;
				end = (end > line.length - 1) ? line.length - 1 : end;

				for (i = possibleStartIndex; i <= end; i++) {
					if (i > line.length - 1 || line.cells[i].aiSolution === 0) {
						newPossibleStartIndexes = Utility.removeFromArray( newPossibleStartIndexes, possibleStartIndex );
					}
				}
			}


			minimumStartIndex += section.length + 1;
			maximumStartIndex += section.length + 1;

			section.possibleStartIndexes = newPossibleStartIndexes;
		}
	}


	/**
	 *
	 * @param {PuzzleLine} line
	 */
	findKnownPositivesAndNegatives( line )
	{
		const totalCellCounts = Utility.getZeroFilledArray( line.length );
		let sectionKey, section, cellCounts, startIndexKey, possibleStartIndex, start, end, i, cellCountKey, cellCount,
			cell;

		for (sectionKey = 0; sectionKey < line.sections.length; sectionKey++) {

			section    = line.sections[sectionKey];
			cellCounts = Utility.getZeroFilledArray( line.length );

			// keep two counts: 1) all common cells for this section, and 2) cells where no section can be

			for (startIndexKey = 0; startIndexKey < section.possibleStartIndexes.length; startIndexKey++) {

				possibleStartIndex = section.possibleStartIndexes[startIndexKey];
				start              = possibleStartIndex;
				end                = start + section.length - 1;

				for (i = start; i <= end; i++) {
					cellCounts[i]++;
					totalCellCounts[i]++;
				}
			}


			// common to all possibilities, solve as positive

			for (cellCountKey = 0; cellCountKey < cellCounts.length; cellCountKey++) {

				cellCount = cellCounts[cellCountKey];
				cell      = line.cells[cellCountKey];

				if (cell && cell.aiSolution === null && cellCount === section.possibleStartIndexes.length) {
					this._setCellSolution( cell, 1 );
				}
			}
		}

		// no possible cells, remove as a possibility

		for (cellCountKey = 0; cellCountKey < totalCellCounts.length; cellCountKey++) {

			cellCount = totalCellCounts[cellCountKey];
			cell      = line.cells[cellCountKey];

			if (cell && cell.aiSolution === null && cellCount === 0) {
				this._setCellSolution( cell, 0 );
			}
		}
	}


	/**
	 *
	 * @param {PuzzleLine} line
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
						this._setCellSolution( line.cells[i], 1 );
					}
				}
				if (line.cells[i]) {
					this._setCellSolution( line.cells[i], 0 );
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
						this._setCellSolution( line.cells[i], 1 );
					}
				}
				if (line.cells[fillRange[0] - 1]) {
					this._setCellSolution( line.cells[fillRange[0] - 1], 0 );
				}
			}
		}
	}


	/**
	 *
	 * @param {PuzzleLine} line
	 */
	findSectionDefiningChains( line )
	{
		let chains    = [],
			lastValue = 0,
			cellKey, cell, chain, chainKey, sectionsSorted, firstSortedSection
		;


		// sort sections by highest length to lowest

		sectionsSorted     = Utility.cloneArray( line.sections ).sort( function ( a, b )
		{
			return a.length > b.length ? -1 : 1;
		} );
		firstSortedSection = sectionsSorted[0];


		// loop through all cells, creating array of connectors

		for (cellKey = 0; cellKey < line.cells.length; cellKey++) {

			cell = line.cells[cellKey];

			if (cell.aiSolution === 1) {

				if (lastValue !== 1) {
					chain = {
						start:  cellKey,
						length: 1
					};
					chains.push( chain );
				} else if (chain) {
					chain.length++;
				}
			}

			lastValue = cell.aiSolution;
		}


		// if a connector is found with the first section's length, place negatives around it and mark the section as complete & continue

		for (chainKey = 0; chainKey < chains.length; chainKey++) {

			chain = chains[chainKey];

			if (chain.length === firstSortedSection.length) {

				if (line.cells[chain.start - 1]) {
					this._setCellSolution( line.cells[chain.start - 1], 0 );
				}

				if (line.cells[chain.start + firstSortedSection.length]) {
					this._setCellSolution( line.cells[chain.start + firstSortedSection.length], 0 );
				}

				firstSortedSection.solved = true;
			}
		}
	}


	/**
	 *
	 * @param {PuzzleLine} line
	 */
	findCompletedSections( line )
	{
		let sectionKey, section, firstNegative, lastNegative;

		// complete lines where all sections have been found

		for (sectionKey = 0; sectionKey < line.sections.length; sectionKey++) {

			section = line.sections[sectionKey];


			// only one possible place...

			if (!section.solved && section.possibleStartIndexes.length === 1) {

				// make sure there is a negative cell on either side of the section

				firstNegative = section.possibleStartIndexes[0] - 1;
				lastNegative  = section.possibleStartIndexes[0] + section.length;

				if (line.cells[firstNegative] && line.cells[firstNegative].aiSolution === null) {
					this._setCellSolution( line.cells[firstNegative], 0 );
				}
				if (line.cells[lastNegative] && line.cells[lastNegative].aiSolution === null) {
					this._setCellSolution( line.cells[lastNegative], 0 );
				}

				section.solved = true;
			}
		}
	}


	/**
	 *
	 * @param {PuzzleLine} line
	 */
	findCompletedLines( line )
	{
		let totalSectionLength  = 0,
			totalPositiveSolved = 0,
			sectionKey, section, cellKey, cell
		;

		// complete lines where all sections have been found

		for (sectionKey = 0; sectionKey < line.sections.length; sectionKey++) {

			section = line.sections[sectionKey];
			totalSectionLength += section.length;
		}

		for (cellKey = 0; cellKey < line.cells.length; cellKey++) {

			cell = line.cells[cellKey];
			totalPositiveSolved += cell.aiSolution === 1;
		}

		if (totalSectionLength === totalPositiveSolved) {

			for (cellKey = 0; cellKey < line.cells.length; cellKey++) {

				cell = line.cells[cellKey];

				if (cell.aiSolution === null) {
					this._setCellSolution( cell, 0 );
				}
			}
		}
	}


	//	#############################################################################################	private methods


	/**
	 *
	 * @private
	 */
	_reset()
	{
		const possibleRowIndexes    = [],
			  possibleColumnIndexes = []
		;
		let i, cellKey, rowNumber, rowHints, rowCells, line, index, len, columnKey, columnHint;

		this.isReset     = true;
		this.elapsedTime = 0;
		this.solutionLog = [];
		this.lines       = [];

		this._log( 'Resetting variables', 'info' );

		// reset cell.aiSolution

		for (cellKey = 0; cellKey < this.puzzle.cells.length; cellKey++) {
			this.puzzle.cells[cellKey].aiSolution = null;
		}

		// reset possibleRowIndexes

		for (i = 0; i < this.puzzle.width; i++) {
			possibleRowIndexes.push( i );
		}

		// reset possibleColumnIndexes

		for (i = 0; i < this.puzzle.height; i++) {
			possibleColumnIndexes.push( i );
		}

		// reset rowHints

		for (rowNumber = 0; rowNumber < this.puzzle.rowHints.length; rowNumber++) {

			rowHints = this.puzzle.rowHints[rowNumber];
			rowCells = this.puzzle.getRowCells( rowNumber );

			if (rowCells) {

				line = new PuzzleLine( {
					type:   'row',
					index:  rowNumber,
					length: this.puzzle.width,
					cells:  rowCells
				} );

				for (index = 0; index < rowHints.length; index++) {

					len = rowHints[index];
					line.sections.push( {
						index:                index,
						length:               len,
						possibleStartIndexes: possibleRowIndexes,
						knownIndexes:         [],
						solved:               false
					} );

					line.minimumSectionLength += len + 1;
				}

				line.minimumSectionLength--;

				this.lines.push( line );
			}
		}

		// reset columnHints

		for (columnKey = 0; columnKey < this.puzzle.columnHints.length; columnKey++) {

			columnHint = this.puzzle.columnHints[columnKey];
			line       = new PuzzleLine( {
				type:   'column',
				index:  columnKey,
				length: this.puzzle.height,
				cells:  this.puzzle.getColumnCells( columnKey ),
			} );

			for (index = 0; index < columnHint.length; index++) {
				len = columnHint[index];
				line.sections.push( {
					index:                index,
					length:               len,
					possibleStartIndexes: possibleColumnIndexes,
					knownIndexes:         [],
					solved:               false
				} );

				line.minimumSectionLength += len + 1;
			}

			line.minimumSectionLength--;

			this.lines.push( line );
		}
	}


	/**
	 *
	 * @param {PuzzleCell} puzzleCell
	 * @param {number} value
	 * @private
	 */
	_setCellSolution( puzzleCell, value )
	{
		let lineKey, line, isRow, isCol, cellsSolved, cellKey, cell;

		if (puzzleCell.aiSolution !== null) {
			return;
		}

		for (lineKey = 0; lineKey < this.lines.length; lineKey++) {

			line        = this.lines[lineKey];
			isRow       = line.type === 'row' && line.index === puzzleCell.row;
			isCol       = line.type === 'column' && line.index === puzzleCell.column;
			cellsSolved = 0;

			if (isRow || isCol) {

				for (cellKey = 0; cellKey < line.cells.length; cellKey++) {

					cell = line.cells[cellKey];

					if (cell.index === puzzleCell.index) {
						cell.aiSolution = value;
						cellsSolved++;
					} else if (cell.aiSolution !== null) {
						cellsSolved++;
					}
				}

				if (cellsSolved === line.length) {
					line.solved = true;
				}
			}
		}
	}


	/**
	 *
	 * @param html
	 * @param cssClass
	 * @private
	 */
	_log( html, cssClass )
	{
		this.solutionLog.push( {
			html:     html,
			cssClass: cssClass || 'info'
		} );
	}


	/**
	 *
	 * @returns {number}
	 * @private
	 */
	_getTotalSolved()
	{
		let total = 0,
			cellKey
		;

		for (cellKey = 0; cellKey < this.puzzle.cells.length; cellKey++) {
			total += this.puzzle.cells[cellKey].aiSolution !== null;
		}

		return total;
	}


	/**
	 * calculate the maximum # of possible permutations, depending on the current state of the solving process.
	 *
	 * @returns {number}
	 * @private
	 */
	_getProgress()
	{
		let maxPossibilities   = 0,
			totalPossibilities = 0,
			lineKey, line, sectionKey
		;

		for (lineKey = 0; lineKey < this.lines.length; lineKey++) {

			line = this.lines[lineKey];
			maxPossibilities += line.sections.length * (line.type === 'row' ? this.puzzle.width : this.puzzle.height);

			for (sectionKey = 0; sectionKey < line.sections.length; sectionKey++) {
				totalPossibilities += line.sections[sectionKey].possibleStartIndexes.length;
			}
		}

		return maxPossibilities - totalPossibilities;
	}

};







