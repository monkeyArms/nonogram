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
 * @property {Promise} loadedPromise - resolves once template has been loaded and parsed
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
		this.loadedPromise     = null;
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
	 * attempts to fetch a template specified by this.path
	 *
	 * @returns {Promise} - complete when template has been fetched and parsed
	 * @throws - error if template cannot be loaded
	 */
	load()
	{
		const self = this;


		self.loadedPromise = new Promise( ( resolve ) =>
		{
			fetch( self.path ).then( ( response ) =>
			{
				if (response.ok) {

					response.text().then( ( text ) =>
					{
						self.html     = text;
						self.isLoaded = true;
						self.fireOnLoaded();

						resolve( self.name + ' loaded and parsed' );
					} );

				} else {

					throw 'loading failed for "' + self.path + '"';
				}
			} );
		} );

		return self.loadedPromise;
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


