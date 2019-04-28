export {Utility};


/**
 * @class
 * @type {Utility}
 * @this Utility
 */
const Utility = class
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


	/**
	 *
	 * @param min
	 * @param max
	 * @returns {number}
	 */
	static getRandomIntBetween( min, max )
	{
		let minCeil  = Math.ceil( min ),
			maxFloor = Math.floor( max )
		;

		return Math.floor( Math.random() * (maxFloor - minCeil + 1) ) + minCeil;
	}

};


