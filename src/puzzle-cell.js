import Nonogram from './nonogram';


/**
 * @class
 * @type {Nonogram.PuzzleCell}
 * @this Nonogram.PuzzleCell
 *
 * a container representing a single cell in the puzzle grid
 *
 * @property {number} index
 * @property {number} column
 * @property {number} row
 * @property {number|null} solution
 * @property {number|null} userSolution
 * @property {number|null} aiSolution
 */
Nonogram.PuzzleCell = class
{
	constructor( params )
	{
		this.index        = -1;
		this.column       = -1;
		this.row          = -1;
		this.solution     = null;
		this.userSolution = null;
		this.aiSolution   = null;

		Object.assign( this, params );
	}
};
