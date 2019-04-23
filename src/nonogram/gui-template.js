import Nonogram from './nonogram';


/**
 * @class
 * @type {GuiTemplate}
 * @this GuiTemplate
 *
 * @property {string} name
 * @property {string} path
 * @property {string} html
 * @property {array} loadedCallbacks
 */
Nonogram.GuiTemplate = class
{
	/**
	 *
	 * @param name
	 * @param path
	 */
	constructor( name, path )
	{
		this.name            = name;
		this.path            = path;
		this.html            = '';
		this.loadedCallbacks = [];
	}


	/**
	 *
	 * @param {function} callback
	 */
	loaded( callback )
	{
		this.loadedCallbacks.push( callback );
	}


	/**
	 *
	 */
	fireLoaded()
	{
		this.loadedCallbacks.forEach( ( callback ) =>
		{
			callback();
		} );
	}


	/**
	 *
	 */
	load()
	{
		const self = this;

		fetch( self.path ).then( ( response ) =>
		{
			if (response.ok) {

				response.text().then( ( text ) =>
				{
					self.html = text;
					self.fireLoaded();
				} );

			} else {

				console.log( 'loading failed for "' + self.path + '"' );
			}
		} );
	}


	/**
	 *
	 * @returns {HTMLDivElement}
	 */
	getNode()
	{
		const div = document.createElement( 'div' );

		div.innerHTML = this.html;

		//console.log( div.childNodes );

		return div;
	}

};


