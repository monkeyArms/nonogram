export {PuzzleCell};


/**
 * @class
 * @type {PuzzleCell}
 * @this PuzzleCell
 *
 * a container representing a single cell in the puzzle grid
 *
 * @property {number} index
 * @property {number} column
 * @property {number} row
 * @property {*} solution - null, 0, or 1
 * @property {*} userSolution - null, 0, or 1
 * @property {*} aiSolution - null, 0, or 1
 */
const PuzzleCell = class
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

