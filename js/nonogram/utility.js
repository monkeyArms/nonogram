/**
 * @class
 * @type {Nonogram.Utility}
 * @this Nonogram.Utility
 */
Nonogram.Utility = class
{

	/**
	 *
	 * @param array
	 * @param value
	 * @returns {array}
	 */
	static removeFromArray( array, value )
	{
		const index = array.indexOf( value );

		if (index !== -1) {
			array.splice( index, 1 );
		}

		return array;
	}


	/**
	 *
	 * @param length
	 * @returns {array}
	 */
	static getZeroFilledArray( length )
	{
		return new Array( length ).fill( 0 );
	}


	/**
	 *
	 * @param array
	 * @returns {array}
	 */
	static cloneArray( array )
	{
		return array.slice( 0 );
	}
};