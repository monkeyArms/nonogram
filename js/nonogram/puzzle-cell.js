/**
 * @class
 * @type {Nonogram.PuzzleCell}
 * @this Nonogram.PuzzleCell
 *
 * @property {number} this.index
 * @property {number} this.column
 * @property {number} this.row
 * @property {number|null} this.solution
 * @property {number|null} this.userSolution
 * @property {number|null} this.aiSolution
 */
Nonogram.PuzzleCell = class
{
	constructor( params )
	{
		this.index        = null;
		this.column       = null;
		this.row          = null;
		this.solution     = null;
		this.userSolution = null;
		this.aiSolution   = null;

		Object.assign( this, params );
	}
};
