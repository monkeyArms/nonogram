import Nonogram from './nonogram';


/**
 * @class
 * @type {Nonogram.GuiTemplate}
 * @this Nonogram.GuiTemplate
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
		this.name              = name;
		this.path              = path;
		this.html              = '';
		this.onLoadedCallbacks = [];
		this.isLoaded          = false;
	}


	/**
	 *
	 * @param {function} callback
	 */
	loaded( callback )
	{
		this.onLoadedCallbacks.push( callback );
	}


	/**
	 *
	 */
	fireOnLoaded()
	{
		this.onLoadedCallbacks.forEach( ( callback ) =>
		{
			callback();
		} );
	}


	/**
	 * @throws - error if template cannot be loaded
	 */
	load()
	{
		const self = this;

		fetch( self.path ).then( ( response ) =>
		{
			if (response.ok) {

				response.text().then( ( text ) =>
				{
					self.html     = text;
					self.isLoaded = true;
					self.fireOnLoaded();
				} );

			} else {

				throw 'loading failed for "' + self.path + '"';
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

		return div;
	}

};


