import {GuiTemplate} from '../src/gui-template.js';
import {PuzzleLibrary} from '../src/puzzle-library.js';
import {Creator} from '../src/creator.js';


export {Gui};

/**
 * @class
 * @type {Gui}
 * @this Gui
 *
 * provides a user interface for interacting with nonogram puzzles
 *
 * @property {Puzzle} puzzle
 * @property {HTMLElement} gridContainer - container element for the puzzle grid ui
 * @property {array} templates - array of GuiTemplate objects
 * @property {array} templatesLoaded - array of Promises from each loaded template
 * @property {string|null} theme - the theme to use, located in the themes/ directory
 * @property {string} themePath - the path to the specified theme located in themes/{theme}
 * @property {string} themeStylesheetPath - the path to the theme stylesheet located in themes/{theme}/styles.css
 * @property {string} themeTemplatesPath - the path to the theme template directory located in themes/{theme}/templates
 * @property {int} playerClickMode - whether to fill or cross a cell on click
 */
const Gui = class
{

	/**
	 *
	 * @param {string|null} themePath - the path to the theme directory.  Defaults to ./themes/default
	 */
	constructor( themePath )
	{
		const head = document.querySelector( 'head' ),
			  link = document.createElement( 'link' )
		;

		// set up board sizes
		this.boardSizes = [
			{ name: 'Tiny', handle: 'tiny', size: 1 },
			{ name: 'Small', handle: 'small', size: 2 },
			{ name: 'Medium', handle: 'medium', size: 3 },
			{ name: 'Large', handle: 'large', size: 4 },
		];
		this.boardSize  = this.boardSizes[2];

		// set up theme
		this.themePath = themePath || './themes/default';

		// load theme stylesheet
		this.themeStylesheetPath = this.themePath + '/styles.css';
		link.rel                 = 'stylesheet';
		link.type                = 'text/css';
		link.href                = this.themeStylesheetPath;
		head.prepend( link );

		// set up templates
		this.templatesLoaded    = [];
		this.themeTemplatesPath = this.themePath + '/templates';
		this.templates          = [
			new GuiTemplate( 'gameControls', this.themeTemplatesPath + '/controls-game.html' ),
			new GuiTemplate( 'generateControls', this.themeTemplatesPath + '/controls-generate.html' ),
			new GuiTemplate( 'console', this.themeTemplatesPath + '/console.html' ),
			new GuiTemplate( 'previewGrid', this.themeTemplatesPath + '/preview-grid.html' ),
			new GuiTemplate( 'puzzleGrid', this.themeTemplatesPath + '/puzzle-grid.html' ),
		];

		// load templates
		this.templates.forEach( ( template ) =>
		{
			this.templatesLoaded.push(
				template.load()
			);
		} );
	}


	// ######################################################################################	public drawing methods

	/**
	 * - draw all user interfaces once templates are loaded
	 */
	draw( puzzle )
	{
		this.puzzle = puzzle;

		Promise.all( this.templatesLoaded ).then( () =>
		{
			this.drawGenerateControls();
			this.drawPuzzle( puzzle );
			this.drawGameControls();
			this.drawConsole();
		} );
	}


	/**
	 * - draw the puzzle ui
	 *
	 * @param {Puzzle} puzzle
	 */
	drawPuzzle( puzzle )
	{
		Promise.all( this.templatesLoaded ).then( () =>
		{
			const template = this._getTemplate( 'puzzleGrid' );

			this.puzzle        = puzzle;
			this.gridContainer = document.querySelector( '[data-nonogram-puzzle-grid]' );


			if (!this.gridContainer) {
				return;
			}

			const container       = this.gridContainer,
				  node            = template.getNode(),
				  theadThTemplate = node.querySelector( '[data-nonogram-puzzle-grid-table-thead-th]' ),
				  rowTemplate     = node.querySelector( '[data-nonogram-puzzle-grid-table-row]' ),
				  cellClasses     = {
					  tl: 0,
					  tr: this.puzzle.width - 1,
					  bl: (this.puzzle.width * this.puzzle.height) - this.puzzle.width,
					  br: (this.puzzle.width * this.puzzle.height) - 1,
				  }
			;

			// table header
			this.puzzle.columnHints.forEach( ( hints, columnIndex ) =>
			{
				const clonedTheadThTemplate = document.importNode( theadThTemplate.content, true ),
					  theadTh               = clonedTheadThTemplate.querySelector( 'th' ),
					  fillDiv               = theadTh.querySelector( '.fill' );

				theadTh.setAttribute( 'data-column', columnIndex.toString() );
				theadTh.classList.add( 'hint', 'top' );

				// add hints
				hints.forEach( ( hint ) =>
				{
					let span = document.createElement( 'span' );

					span.textContent = hint;
					fillDiv.appendChild( span );
				} );

				theadThTemplate.parentNode.insertBefore( theadTh, theadThTemplate );
			} );


			// table rows

			this.puzzle.grid.forEach( ( row, rowKey ) =>
			{
				const cells             = this.puzzle.getRowCells( rowKey ),
					  clonedRowTemplate = document.importNode( rowTemplate.content, true ),
					  tr                = clonedRowTemplate.querySelector( 'tr' ),
					  cellTemplate      = tr.querySelector( '[data-nonogram-puzzle-grid-table-cell]' ),
					  hintsFillDiv      = tr.querySelector( '[data-row-hints] .fill' )
				;

				tr.setAttribute( 'data-row', rowKey.toString() );

				// hint cell
				this.puzzle.rowHints[rowKey].forEach( ( hint ) =>
				{
					let span = document.createElement( 'span' );

					span.textContent = hint;
					hintsFillDiv.appendChild( span );
				} );

				// grid cells
				cells.forEach( ( cell ) =>
				{
					const clonedCellTemplate = document.importNode( cellTemplate.content, true ),
						  td                 = clonedCellTemplate.querySelector( 'td' )
					;

					td.setAttribute( 'data-index', cell.index );
					td.setAttribute( 'data-column', cell.column );
					td.setAttribute( 'data-row', cell.row );
					td.classList.add( 'puzzle-cell', 'flippable' );

					Object.keys( cellClasses ).forEach( ( cssClass ) =>
					{
						if (cell.index === cellClasses[cssClass]) {
							td.classList.add( cssClass );
						}
					} );

					tr.appendChild( td );
				} );

				rowTemplate.parentNode.appendChild( tr );
			} );


			// insert template
			container.innerHtml = container.textContent = '';
			container.appendChild( node );

			// set board size
			document.querySelector( '[data-nonogram-puzzle-grid-table]' ).classList.add( this.boardSize.handle );

			this._resizeBoardForAvailableScreen();
			this._makePuzzlePlayable();
			this.drawPreview( 'userSolution' );
		} );
	}


	/**
	 *    - draw the game controls ui
	 */
	drawGameControls()
	{
		Promise.all( this.templatesLoaded ).then( () =>
		{
			const template  = this._getTemplate( 'gameControls' ),
				  container = document.querySelector( '[data-nonogram-game-controls]' ),
				  node      = template.getNode()
			;
			let fillModeCheckbox;


			if (!container) {
				return;
			}

			// insert template
			container.innerHtml = container.textContent = '';
			container.appendChild( node );

			// add event handlers
			fillModeCheckbox = document.querySelector( '#nonogram-puzzle-fill-mode' );

			fillModeCheckbox.addEventListener( 'change', () =>
			{
				const fillModeLabel = document.querySelector( '[for="nonogram-puzzle-fill-mode"]' ),
					  prevActive    = fillModeLabel.querySelector( '.active' ),
					  prevInactive  = fillModeLabel.querySelector( '.inactive' )
				;

				prevActive.classList.remove( 'active' );
				prevActive.classList.add( 'inactive' );
				prevInactive.classList.remove( 'inactive' );
				prevInactive.classList.add( 'active' );

				if (fillModeCheckbox.checked) {
					fillModeLabel.classList.add( 'on' );
					this.playerClickMode = 0;
				} else {
					fillModeLabel.classList.remove( 'on' );
					this.playerClickMode = 1;
				}
			} );

			window.removeEventListener( 'keyup', Gui._keypressCallback );
			window.addEventListener( 'keyup', Gui._keypressCallback );
		} );
	}


	/**
	 * - draw puzzle generating/solving/resetting ui
	 */
	drawGenerateControls()
	{
		Promise.all( this.templatesLoaded ).then( () =>
		{
			const template            = this._getTemplate( 'generateControls' ),
				  container           = document.querySelector( '[data-nonogram-generate-controls]' ),
				  node                = template.getNode(),
				  widthSelect         = node.querySelector( '[data-nonogram-generate-width]' ),
				  heightSelect        = node.querySelector( '[data-nonogram-generate-height]' ),
				  widthOptions        = node.querySelector( '[data-nonogram-generate-width-options]' ),
				  heightOptions       = node.querySelector( '[data-nonogram-generate-height-options]' ),
				  chooseExampleSelect = node.querySelector( '[data-nonogram-choose-predefined]' ),
				  boardSizeSelect     = node.querySelector( '[data-nonogram-board-size]' ),
				  boardSizeOptions    = node.querySelector( '[data-nonogram-board-size-options]' )
			;
			let i, clonedWidthOptions, cloneHeightOptions, widthOption, heightOption, clonedExampleOptions,
				exampleOption, chooseSelect, boardSize, clonedSizeOptions, sizeOption, reset, solve, generate;


			if (!container) {
				return;
			}

			// populate width/height select elements
			for (i = 5; i <= 30; i++) {

				clonedWidthOptions       = document.importNode( widthOptions.content, true );
				cloneHeightOptions       = document.importNode( heightOptions.content, true );
				widthOption              = clonedWidthOptions.querySelector( 'option' );
				widthOption.textContent  = widthOption.value = i;
				heightOption             = cloneHeightOptions.querySelector( 'option' );
				heightOption.textContent = heightOption.value = i;

				if (this.puzzle.width === i) {
					widthOption.setAttribute( 'selected', 'selected' );
				}
				if (this.puzzle.height === i) {
					heightOption.setAttribute( 'selected', 'selected' );
				}

				widthSelect.appendChild( widthOption );
				heightSelect.appendChild( heightOption );
			}

			// populate predefined puzzles

			Object.keys( PuzzleLibrary ).forEach( ( puzzleName ) =>
			{
				clonedExampleOptions = document.importNode( widthOptions.content, true );
				exampleOption        = clonedExampleOptions.querySelector( 'option' );

				exampleOption.textContent = exampleOption.value = puzzleName;

				if (puzzleName === this.selectedExample) {
					exampleOption.setAttribute( 'selected', 'selected' );
				}

				chooseExampleSelect.appendChild( exampleOption );
			} );

			// populate board size
			this.boardSizes.forEach( ( sizeObj ) =>
			{
				clonedSizeOptions = document.importNode( boardSizeOptions.content, true );
				sizeOption        = clonedSizeOptions.querySelector( 'option' );

				sizeOption.value       = sizeObj.handle;
				sizeOption.textContent = sizeObj.name;


				if (sizeObj.handle === this.boardSize.handle) {
					sizeOption.setAttribute( 'selected', 'selected' );
				}

				boardSizeSelect.appendChild( sizeOption );
			} );

			// insert template
			container.innerHtml = container.textContent = '';
			container.appendChild( node );

			// add event handlers
			generate     = document.querySelector( '[data-nonogram-generate-button]' );
			chooseSelect = document.querySelector( '[data-nonogram-choose-predefined]' );
			boardSize    = document.querySelector( '[data-nonogram-board-size]' );
			reset        = document.querySelector( '[data-nonogram-game-reset]' );
			solve        = document.querySelector( '[data-nonogram-game-solve]' );

			generate.addEventListener( 'click', () =>
			{
				const widthSelect    = document.querySelector( '[data-nonogram-generate-width]' ),
					  heightSelect   = document.querySelector( '[data-nonogram-generate-height]' ),
					  width          = widthSelect.value,
					  height         = heightSelect.value,
					  creator        = new Creator(),
					  puzzle         = creator.createRandom( width, height, null )
				;
				this.selectedExample = null;
				this.draw( puzzle );
				this._resizeBoardForAvailableScreen();
			} );

			chooseSelect.addEventListener( 'change', () =>
			{
				const creator = new Creator();
				let puzzleDef, puzzle;

				if (chooseSelect.value !== '') {
					Object.keys( PuzzleLibrary ).forEach( ( puzzleName ) =>
					{
						if (chooseSelect.value === puzzleName) {

							puzzleDef            = PuzzleLibrary[puzzleName];
							this.selectedExample = puzzleName;

							if (puzzleDef.solutionGrid) {
								puzzle = creator.createFromGrid( puzzleDef.solutionGrid );
							} else if (puzzleDef.hints) {
								puzzle = creator.createFromHints( puzzleDef.hints );
							}
						}
					} );

					if (puzzle) {
						this.draw( puzzle );
						this._resizeBoardForAvailableScreen();
					}
				}
			} );

			boardSize.addEventListener( 'change', () =>
			{
				this.boardSizes.forEach( ( item ) =>
				{
					if (item.handle === boardSize.value) {
						this._changeBoardSize( item );
					}
				} );
			} );

			reset.addEventListener( 'click', () =>
			{
				this._resetPuzzle();
			} );

			solve.addEventListener( 'click', () =>
			{
				this.drawSolution();
				this.drawPreview( 'solution' );
				this._showPuzzleSolved();
			} );
		} );
	}


	/**
	 * - draw the console and populate with Creator _log
	 */
	drawConsole()
	{
		Promise.all( this.templatesLoaded ).then( () =>
		{
			const template  = this._getTemplate( 'console' ),
				  container = document.querySelector( '[data-nonogram-console]' ),
				  node      = template.getNode(),
				  output    = node.querySelector( '[data-nonogram-console-output]' ),
				  line      = node.querySelector( '[data-nonogram-console-line]' )
			;

			if (!container) {
				return;
			}

			if (this.puzzle.creator instanceof Creator) {
				this.puzzle.creator.log.forEach( ( text ) =>
				{
					const clonedLine = document.importNode( line.content, true ),
						  code       = clonedLine.querySelector( 'code' );

					code.textContent = text.toString();
					output.appendChild( code );
				} );
			}

			// insert template
			container.innerHtml = container.textContent = '';
			container.appendChild( node );
		} );
	}


	/**
	 * - draw the preview grid for the current state of the puzzle
	 *
	 * @param solutionType
	 */
	drawPreview( solutionType )
	{
		Promise.all( this.templatesLoaded ).then( () =>
		{
			const template  = this._getTemplate( 'previewGrid' ),
				  container = document.querySelector( '[data-nonogram-preview-grid]' ),
				  node      = template.getNode()
			;

			// insert template

			container.innerHtml = container.textContent = '';
			container.appendChild( node.querySelector( '[data-nonogram-preview]' ) );


			// draw preview canvas

			const canvas          = document.querySelector( '[data-nonogram-preview-canvas]' ),
				  ctx             = canvas.getContext( '2d' ),
				  parentContainer = canvas.parentElement.parentElement.parentElement,
				  parentWidth     = parentContainer.offsetWidth,
				  parentHeight    = parentContainer.offsetHeight,
				  containerRatio  = parentWidth / parentHeight,
				  puzzleRatio     = this.puzzle.width / this.puzzle.height
			;
			let cellSize;

			if (containerRatio > puzzleRatio) {
				cellSize = Math.floor( parentHeight / this.puzzle.height );
			} else {
				cellSize = Math.floor( parentWidth / this.puzzle.width );
			}

			canvas.width  = cellSize * this.puzzle.width;
			canvas.height = cellSize * this.puzzle.height;

			this.puzzle.cells.forEach( ( cell ) =>
			{
				if (cell[solutionType] === 1) {
					ctx.fillRect( cell.column * cellSize, cell.row * cellSize, cellSize, cellSize );
				}
			} );
		} );
	}


	/**
	 * - draw the solution to the current puzzle
	 */
	drawSolution()
	{
		Promise.all( this.templatesLoaded ).then( () =>
		{
			const filledTds = this.gridContainer.querySelectorAll( 'td.filled' );


			filledTds.forEach( ( td ) =>
			{
				td.classList.remove( 'filled', 'solution-positive', 'solution-negative', 'user-positive', 'user-negative', 'flipped' );
			} );

			this.puzzle.cells.forEach( ( cell ) =>
			{
				const cellElem = this.gridContainer.querySelector( 'td[data-index="' + cell.index + '"]' );

				cell.userSolution = cell.solution;
				cellElem.classList.add( 'user-solved' );

				if (cell.solution === 1) {
					cellElem.classList.add( 'solution-positive', 'user-positive', 'flipped' );
				} else {
					cellElem.classList.add( 'solution-negative', 'user-negative' );
				}
			} );
		} );
	}


	// ######################################################################################	private methods


	/**
	 *
	 * @param {object} boardSize
	 * @private
	 */
	_changeBoardSize( boardSize )
	{
		const puzzleTable = document.querySelector( '[data-nonogram-puzzle-grid-table]' ),
			  sizeSelect  = document.querySelector( '[data-nonogram-board-size]' )
		;

		if (puzzleTable && sizeSelect) {

			puzzleTable.classList.remove( 'tiny', 'small', 'medium', 'large' );
			puzzleTable.classList.add( boardSize.handle );
			sizeSelect.value = boardSize.handle;

			this.boardSize = boardSize;

			this.drawPreview();
		}
	}


	/**
	 *
	 * @private
	 */
	_resizeBoardForAvailableScreen()
	{
		const table            = this.gridContainer.querySelector( '.nonogram-puzzle-grid' ),
			  availableWidth   = this.gridContainer.clientWidth,
			  sortedBoardSizes = this.boardSizes.sort( ( a, b ) =>
			  {
				  return a.size > b.size ? -1 : 1;
			  } )
		;
		let i;


		//if (this.puzzle.creator) {
		//this.puzzle.creator.log.push( 'tableWidth: ' + table.clientWidth + ', availableWidth: ' + availableWidth );
		//}

		if (table.clientWidth > availableWidth) {

			for (i = 0; i < sortedBoardSizes.length; i++) {

				if (sortedBoardSizes[i].size < this.boardSize.size) {

					this._changeBoardSize( sortedBoardSizes[i] );
				}

				if (this.puzzle.creator) {

					//this.puzzle.creator.log.push( sortedBoardSizes[i].handle +
					//	', tableWidth: ' + table.clientWidth + ', availableWidth: ' + availableWidth
					//);
				}

				if (table.clientWidth <= availableWidth) {
					break;
				}
			}
		}

		this.drawConsole();
	}


	/**
	 *
	 * @private
	 */
	_makePuzzlePlayable()
	{
		const table    = this.gridContainer.querySelector( '.nonogram-puzzle-grid' ),
			  cells    = this.gridContainer.querySelectorAll( '.nonogram-puzzle-grid td.puzzle-cell' ),
			  allCells = this.gridContainer.querySelectorAll( '.nonogram-puzzle-grid td' )
		;

		this.playerClickMode = 1;

		// set css classes and event handlers for puzzle cells

		cells.forEach( ( cellElem ) =>
		{
			cellElem.classList.add( 'playable' );

			// highlight row/column on mouse hover

			cellElem.addEventListener( 'mouseenter', ( e ) =>
			{
				const hoverCell = e.currentTarget,
					  row       = hoverCell.getAttribute( 'data-row' ),
					  column    = hoverCell.getAttribute( 'data-column' )
				;

				allCells.forEach( ( cellElem ) =>
				{
					if (cellElem.getAttribute( 'data-row' ) === row || cellElem.getAttribute( 'data-column' ) === column) {
						cellElem.classList.add( 'row-column-highlight' );
					} else {
						cellElem.classList.remove( 'row-column-highlight' );
					}
				} );
			} );

			// add cell click event handler

			cellElem.addEventListener( 'click', ( e ) =>
			{
				const cellElem  = e.currentTarget,
					  cellIndex = cellElem.getAttribute( 'data-index' ),
					  cell      = this.puzzle.getCellByIndex( cellIndex ),
					  solvedP   = document.querySelector( '[data-nonogram-puzzle-grid-solved]' )
				;

				e.preventDefault();

				cell.userSolution = cell.userSolution === this.playerClickMode ? null : this.playerClickMode;

				table.classList.remove( 'solved' );
				cellElem.classList.remove( 'user-solved', 'user-positive', 'user-negative', 'solution-positive', 'solution-negative' );

				if (cell.userSolution === 1) {
					cellElem.classList.add( 'user-solved', 'user-positive' );
				} else if (cell.userSolution === 0) {
					cellElem.classList.add( 'user-solved', 'user-negative' );
				}

				cellElem.classList.toggle( 'flipped' );

				this.drawPreview( 'userSolution' );

				if (this.puzzle.checkUserSolution()) {
					this._showPuzzleSolved();
				} else {
					solvedP.textContent = '';
				}
			} );
		} );

		// remove highlighted cells on puzzle grid mouseout

		table.addEventListener( 'mouseleave', () =>
		{
			allCells.forEach( ( cellElem ) =>
			{
				cellElem.classList.remove( 'row-column-highlight' );
			} );
		} );
	}


	/**
	 *
	 * @private
	 */
	_resetPuzzle()
	{
		const cellElements = this.gridContainer.querySelectorAll( '.nonogram-puzzle-grid td.puzzle-cell' ),
			  puzzleGrid   = this.gridContainer.querySelector( '.nonogram-puzzle-grid' ),
			  solvedP      = document.querySelector( '[data-nonogram-puzzle-grid-solved]' )
		;

		puzzleGrid.classList.remove( 'solved' );
		solvedP.textContent = '';

		this.puzzle.cells.forEach( ( cell ) =>
		{
			cell.userSolution = null;
		} );

		cellElements.forEach( ( cellElem ) =>
		{
			cellElem.classList.remove( 'user-solved', 'user-positive', 'user-negative', 'solution-positive', 'solution-negative' );
		} );

		this.gridContainer.querySelector( '[data-nonogram-preview-grid]' ).innerHTML = '';

		this.drawPreview( 'userSolution' );
	}


	/**
	 *
	 * @private
	 */
	_showPuzzleSolved()
	{
		const grid       = this.gridContainer.querySelector( '.nonogram-puzzle-grid' ),
			  tableCells = document.querySelectorAll( '[data-nonogram-puzzle-grid-table] .puzzle-cell' ),
			  solvedP    = document.querySelector( '[data-nonogram-puzzle-grid-solved]' )
		;

		tableCells.forEach( ( cellElem ) =>
		{
			cellElem.classList.remove( 'row-column-highlight' )
		} );

		grid.classList.add( 'solved' );
		solvedP.textContent = 'Solved!';
	}


	/**
	 *
	 * @param name
	 * @returns {GuiTemplate}
	 * @throws - error if template could not be found
	 * @private
	 */
	_getTemplate( name )
	{
		const ret = this.templates.find( ( template ) =>
		{
			return template.name === name;
		} );

		if (!(ret instanceof GuiTemplate)) {
			throw '"' + name + '" template not found.';
		}

		return ret;
	}


	/**
	 * handle window keypress events
	 *
	 * @param {KeyboardEvent} e
	 * @private
	 */
	static _keypressCallback( e )
	{
		if (e.key && e.key === 'x') {
			document.querySelector( '#nonogram-puzzle-fill-mode' ).dispatchEvent( new MouseEvent( 'click' ) );
		}
	}


};



