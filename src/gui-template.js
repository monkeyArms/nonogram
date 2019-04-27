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
 * @property {Promise} loadedPromise - resolves once template has been onLoad and parsed
 * @property {boolean} isLoaded
 */
Nonogram.GuiTemplate = class
{
	/**
	 * class for loading an html template
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
	 * attach a callback to fire once template has loaded
	 *
	 * @param {function} callback
	 */
	onLoad( callback )
	{
		this.onLoadedCallbacks.push( callback );
	}


	/**
	 * fired when template is loaded.  executes all onLoad callbacks
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
	 * @throws - error if template cannot be onLoad
	 */
	load()
	{
		this.loadedPromise = new Promise( ( resolve ) =>
		{
			fetch( this.path ).then( ( response ) =>
			{
				if (response.ok) {

					response.text().then( ( text ) =>
					{
						this.html     = text;
						this.isLoaded = true;
						this.fireOnLoaded();

						resolve( this.name + ' onLoad and parsed' );
					} );

				} else {

					throw 'loading failed for "' + this.path + '"';
				}
			} );
		} );

		return this.loadedPromise;
	}


	/**
	 * get the html template as a DOM node
	 * @returns {HTMLDivElement}
	 */
	getNode()
	{
		const div = document.createElement( 'div' );

		div.innerHTML = this.html;

		return div;
	}

};


