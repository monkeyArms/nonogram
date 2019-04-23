import Nonogram from './nonogram';


/**
 * @class
 * @type {Nonogram.PuzzleLine}
 * @this Nonogram.PuzzleLine
 *
 * a container representing a complete row or column of grid cells
 *
 * @property {string} this.type - either 'row' or 'column'
 * @property {number} this.index - the column or row index
 * @property {number} this.length
 * @property {number} this.minimumSectionLength
 * @property {array} this.sections
 * @property {array} this.cells
 * @property {boolean} this.solved
 */
Nonogram.PuzzleLine = class
{
	constructor( params )
	{
		this.type                 = null;
		this.index                = null;
		this.length               = null;
		this.minimumSectionLength = 0;
		this.sections             = [];
		this.cells                = [];
		this.solved               = false;

		Object.assign( this, params );
	}
};


