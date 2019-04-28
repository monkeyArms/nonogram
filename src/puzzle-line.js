export {PuzzleLine};


/**
 * @class
 * @type {PuzzleLine}
 * @this PuzzleLine
 *
 * a container representing a complete row or column of grid cells
 *
 * @property {string} type - either 'row' or 'column'
 * @property {number} index - the column or row index
 * @property {number} length
 * @property {number} minimumSectionLength
 * @property {array} sections
 * @property {array} cells
 * @property {boolean} solved
 */
const PuzzleLine = class
{
	constructor( params )
	{
		this.type                 = '';
		this.index                = -1;
		this.length               = 0;
		this.minimumSectionLength = 0;
		this.sections             = [];
		this.cells                = [];
		this.solved               = false;

		Object.assign( this, params );
	}
};




