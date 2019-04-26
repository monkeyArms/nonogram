import Nonogram from './nonogram';


/**
 * @class
 * @type {Nonogram.Gui}
 * @this Nonogram.Gui
 *
 * provides a user interface for interacting with nonogram puzzles
 *
 * @property {Nonogram.Puzzle} this.puzzle
 * @property {HTMLElement} this.gridContainer - container element for the puzzle grid ui
 * @property {array} this.templates - array of Nonogram.GuiTemplate objects
 * @property {string|null} this.theme - the theme to use, located in the themes/ directory
 * @property {string} this.themePath - the path to the specified theme located in themes/{theme}
 * @property {string} this.themeStylesheetPath - the path to the theme stylesheet located in themes/{theme}/styles.css
 * @property {string} this.themeTemplatesPath - the path to the theme template directory located in themes/{theme}/templates
 * @property {int} this.playerClickMode - whether to fill or cross a cell on click
 */
Nonogram.Gui = class
{

	/**
	 *
	 * @param {string|null} theme - the theme to use, located in the themes/ directory
	 */
	constructor( theme )
	{
		const self = this,
			  head = document.querySelector( 'head' ),
			  link = document.createElement( 'link' )
		;

		// set up board sizes
		self.boardSizes = [
			{ name: 'Tiny', handle: 'tiny', size: 1 },
			{ name: 'Small', handle: 'small', size: 2 },
			{ name: 'Medium', handle: 'medium', size: 3 },
			{ name: 'Large', handle: 'large', size: 4 },
		];
		self.boardSize  = self.boardSizes[2];

		// set up theme
		self.theme     = theme || 'default';
		self.themePath = self._resolveThemePath() + '/' + this.theme;

		// load theme stylesheet
		self.themeStylesheetPath = self.themePath + '/styles.css';
		link.rel                 = 'stylesheet';
		link.type                = 'text/css';
		link.href                = self.themeStylesheetPath;
		head.prepend( link );

		// set up templates
		self.themeTemplatesPath = self.themePath + '/templates';
		self.templates          = [
			new Nonogram.GuiTemplate( 'gameControls', self.themeTemplatesPath + '/controls-game.html' ),
			new Nonogram.GuiTemplate( 'generateControls', self.themeTemplatesPath + '/controls-generate.html' ),
			new Nonogram.GuiTemplate( 'console', self.themeTemplatesPath + '/console.html' ),
			new Nonogram.GuiTemplate( 'previewGrid', self.themeTemplatesPath + '/preview-grid.html' ),
			new Nonogram.GuiTemplate( 'puzzleGrid', self.themeTemplatesPath + '/puzzle-grid.html' ),
		];

		// load templates
		self.templates.forEach( ( template ) =>
		{
			template.load();
		} );
	}


	// ######################################################################################	public drawing methods

	/**
	 * - draw all user interfaces
	 */
	draw( puzzle )
	{
		this.drawPuzzle( puzzle );
		this.drawGameControls();
		this.drawGenerateControls();
		this.drawConsole();
	}


	/**
	 * - draw the puzzle ui
	 *
	 * @param {Nonogram.Puzzle} puzzle
	 */
	drawPuzzle( puzzle )
	{
		const self     = this,
			  template = self._getTemplate( 'puzzleGrid' )
		;

		self.puzzle        = puzzle;
		self.gridContainer = document.querySelector( '[data-nonogram-puzzle-grid]' );


		if (!self.gridContainer) {
			return;
		}


		const draw = () =>
		{
			const container       = self.gridContainer,
				  node            = template.getNode(),
				  theadThTemplate = node.querySelector( '[data-nonogram-puzzle-grid-table-thead-th]' ),
				  rowTemplate     = node.querySelector( '[data-nonogram-puzzle-grid-table-row]' ),
				  cellClasses     = {
					  tl: 0,
					  tr: self.puzzle.width - 1,
					  bl: (self.puzzle.width * self.puzzle.height) - self.puzzle.width,
					  br: (self.puzzle.width * self.puzzle.height) - 1,
				  }
			;

			// table header
			self.puzzle.columnHints.forEach( ( hints, columnIndex ) =>
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

			self.puzzle.grid.forEach( ( row, rowKey ) =>
			{
				const cells             = self.puzzle.getRowCells( rowKey ),
					  clonedRowTemplate = document.importNode( rowTemplate.content, true ),
					  tr                = clonedRowTemplate.querySelector( 'tr' ),
					  cellTemplate      = tr.querySelector( '[data-nonogram-puzzle-grid-table-cell]' ),
					  hintsFillDiv      = tr.querySelector( '[data-row-hints] .fill' )
				;

				tr.setAttribute( 'data-row', rowKey.toString() );

				// hint cell
				self.puzzle.rowHints[rowKey].forEach( ( hint ) =>
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
			document.querySelector( '[data-nonogram-puzzle-grid-table]' ).classList.add( self.boardSize.handle );

			self._resizeBoardForAvailableScreen();

			self._makePuzzlePlayable();
			self.drawPreview( 'userSolution' );
		};

		// fire draw method
		if (!template.isLoaded) {
			template.loaded( draw );
		} else {
			draw();
		}
	}


	/**
	 *    - draw the game controls ui
	 */
	drawGameControls()
	{
		const self     = this,
			  template = self._getTemplate( 'gameControls' );


		const draw = () =>
		{
			const container = document.querySelector( '[data-nonogram-game-controls]' ),
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
					self.playerClickMode = 0;
				} else {
					fillModeLabel.classList.remove( 'on' );
					self.playerClickMode = 1;
				}
			} );

			window.addEventListener( 'keyup', ( e ) =>
			{
				if (e.key && e.key === 'x') {
					fillModeCheckbox.dispatchEvent( new MouseEvent( 'click' ) );
				}
			} );
		};

		// fire draw method
		if (!template.isLoaded) {
			template.loaded( draw );
		} else {
			draw();
		}
	}


	/**
	 * - draw puzzle generating/solving/resetting ui
	 */
	drawGenerateControls()
	{
		const self     = this,
			  template = self._getTemplate( 'generateControls' );


		const draw = () =>
		{
			const container           = document.querySelector( '[data-nonogram-generate-controls]' ),
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

				if (self.puzzle.width === i) {
					widthOption.setAttribute( 'selected', 'selected' );
				}
				if (self.puzzle.height === i) {
					heightOption.setAttribute( 'selected', 'selected' );
				}

				widthSelect.appendChild( widthOption );
				heightSelect.appendChild( heightOption );
			}

			// populate predefined puzzles

			Object.keys( Nonogram.PuzzleLibrary ).forEach( ( puzzleName ) =>
			{
				clonedExampleOptions = document.importNode( widthOptions.content, true );
				exampleOption        = clonedExampleOptions.querySelector( 'option' );

				exampleOption.textContent = exampleOption.value = puzzleName;

				if (puzzleName === self.selectedExample) {
					exampleOption.setAttribute( 'selected', 'selected' );
				}

				chooseExampleSelect.appendChild( exampleOption );
			} );

			// populate board size
			self.boardSizes.forEach( ( sizeObj ) =>
			{
				clonedSizeOptions = document.importNode( boardSizeOptions.content, true );
				sizeOption        = clonedSizeOptions.querySelector( 'option' );

				sizeOption.value       = sizeObj.handle;
				sizeOption.textContent = sizeObj.name;


				if (sizeObj.handle === self.boardSize.handle) {
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
					  creator        = new Nonogram.Creator(),
					  puzzle         = creator.createRandom( width, height, null )
				;
				self.selectedExample = null;
				self.draw( puzzle );
				self._resizeBoardForAvailableScreen();
			} );

			chooseSelect.addEventListener( 'change', () =>
			{
				const creator = new Nonogram.Creator();
				let puzzleDef, puzzle;

				if (chooseSelect.value !== '') {
					Object.keys( Nonogram.PuzzleLibrary ).forEach( ( puzzleName ) =>
					{
						if (chooseSelect.value === puzzleName) {

							puzzleDef            = Nonogram.PuzzleLibrary[puzzleName];
							self.selectedExample = puzzleName;

							if (puzzleDef.solutionGrid) {
								puzzle = creator.createFromGrid( puzzleDef.solutionGrid );
							} else if (puzzleDef.hints) {
								puzzle = creator.createFromHints( puzzleDef.hints );
							}
						}
					} );

					if (puzzle) {
						self.draw( puzzle );
						self._resizeBoardForAvailableScreen();
					}
				}
			} );

			boardSize.addEventListener( 'change', () =>
			{
				self.boardSizes.forEach( ( item ) =>
				{
					if (item.handle === boardSize.value) {
						self._changeBoardSize( item );
					}
				} );
			} );

			reset.addEventListener( 'click', () =>
			{
				self._resetPuzzle();
			} );

			solve.addEventListener( 'click', () =>
			{
				// TODO: uncomment confirm ?

				//if (confirm( 'Are you sure you want to see the answer?' )) {
				self.drawSolution();
				self.drawPreview( 'solution' );
				self._showPuzzleSolved();
				//}
			} );
		};


		// fire draw method
		if (!template.isLoaded) {
			template.loaded( draw );
		} else {
			draw();
		}
	}


	/**
	 * - draw the console
	 */
	drawConsole()
	{
		const self     = this,
			  template = self._getTemplate( 'console' )
		;

		const draw = () =>
		{
			self.updateConsole();
		};

		// fire draw method
		if (!template.isLoaded) {
			template.loaded( draw );
		} else {
			draw();
		}
	}


	/**
	 * - update console with Nonogram.Creator log
	 */
	updateConsole()
	{
		const self      = this,
			  template  = self._getTemplate( 'console' ),
			  container = document.querySelector( '[data-nonogram-console]' ),
			  node      = template.getNode(),
			  output    = node.querySelector( '[data-nonogram-console-output]' ),
			  line      = node.querySelector( '[data-nonogram-console-line]' )
		;

		if (!container) {
			return;
		}

		if (self.puzzle.creator instanceof Nonogram.Creator) {
			self.puzzle.creator.log.forEach( ( text ) =>
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
	}


	/**
	 * - draw the preview grid for the current state of the puzzle
	 *
	 * @param solutionType
	 */
	drawPreview( solutionType )
	{
		const self     = this,
			  template = self._getTemplate( 'previewGrid' )
		;

		const draw = () =>
		{
			const container = document.querySelector( '[data-nonogram-preview-grid]' ),
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
				  puzzleRatio     = self.puzzle.width / self.puzzle.height
			;
			let cellSize;

			if (containerRatio > puzzleRatio) {
				cellSize = Math.floor( parentHeight / self.puzzle.height );
			} else {
				cellSize = Math.floor( parentWidth / self.puzzle.width );
			}

			canvas.width  = cellSize * self.puzzle.width;
			canvas.height = cellSize * self.puzzle.height;

			self.puzzle.cells.forEach( ( cell ) =>
			{
				if (cell[solutionType] === 1) {
					ctx.fillRect( cell.column * cellSize, cell.row * cellSize, cellSize, cellSize );
				}
			} );
		};

		// fire draw method
		if (!template.isLoaded) {
			template.loaded( draw );
		} else {
			draw();
		}
	}


	/**
	 * - draw the solution to the current puzzle
	 */
	drawSolution()
	{
		const self      = this,
			  filledTds = self.gridContainer.querySelectorAll( 'td.filled' )
		;

		filledTds.forEach( ( td ) =>
		{
			td.classList.remove( 'filled', 'solution-positive', 'solution-negative', 'user-positive', 'user-negative', 'flipped' );
		} );

		self.puzzle.cells.forEach( ( cell ) =>
		{
			const cellElem = self.gridContainer.querySelector( 'td[data-index="' + cell.index + '"]' );

			cell.userSolution = cell.solution;
			cellElem.classList.add( 'user-solved' );

			if (cell.solution === 1) {
				cellElem.classList.add( 'solution-positive', 'user-positive', 'flipped' );
			} else {
				cellElem.classList.add( 'solution-negative', 'user-negative' );
			}
		} );

	}


	// ######################################################################################	private methods


	_changeBoardSize( boardSize )
	{
		const self     = this,
			  template = self._getTemplate( 'generateControls' );


		const doChange = () =>
		{
			const puzzleTable = document.querySelector( '[data-nonogram-puzzle-grid-table]' ),
				  sizeSelect  = document.querySelector( '[data-nonogram-board-size' )
			;

			puzzleTable.classList.remove( 'tiny', 'small', 'medium', 'large' );
			puzzleTable.classList.add( boardSize.handle );
			sizeSelect.value = boardSize.handle;


			self.boardSize = boardSize;
			self.drawPreview();
		};

		// fire method
		if (!template.isLoaded) {
			template.loaded( doChange );
		} else {
			doChange();
		}
	}


	_resizeBoardForAvailableScreen()
	{
		const self             = this,
			  table            = self.gridContainer.querySelector( '.nonogram-puzzle-grid' ),
			  availableWidth   = self.gridContainer.clientWidth,
			  sortedBoardSizes = self.boardSizes.sort( ( a, b ) =>
			  {
				  return a.size > b.size ? -1 : 1;
			  } )
		;
		let i;

		console.log( '_resizeBoardForAvailableScreen() fired' );


		if (table.clientWidth > availableWidth) {

			for (i = 0; i < sortedBoardSizes.length; i++) {

				if (sortedBoardSizes[i].size < self.boardSize.size) {

					self._changeBoardSize( sortedBoardSizes[i] );
				}


				if (self.puzzle.creator) {
					self.puzzle.creator.log.push( sortedBoardSizes[i].handle +
						', tableWidth: ' + table.clientWidth + ', availableWidth: ' + availableWidth
					);
				}

				if (table.clientWidth <= availableWidth) {
					break;
				}
			}
		}

		self.updateConsole();
	}


	/**
	 *
	 */
	_makePuzzlePlayable()
	{
		const self     = this,
			  table    = self.gridContainer.querySelector( '.nonogram-puzzle-grid' ),
			  cells    = self.gridContainer.querySelectorAll( '.nonogram-puzzle-grid td.puzzle-cell' ),
			  allCells = self.gridContainer.querySelectorAll( '.nonogram-puzzle-grid td' )
		;

		self.playerClickMode = 1;

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
					  cell      = self.puzzle.getCellByIndex( cellIndex ),
					  solvedP   = document.querySelector( '[data-nonogram-puzzle-grid-solved]' )
				;

				e.preventDefault();

				cell.userSolution = cell.userSolution === self.playerClickMode ? null : self.playerClickMode;

				table.classList.remove( 'solved' );
				cellElem.classList.remove( 'user-solved', 'user-positive', 'user-negative', 'solution-positive', 'solution-negative' );

				if (cell.userSolution === 1) {
					cellElem.classList.add( 'user-solved', 'user-positive' );
				} else if (cell.userSolution === 0) {
					cellElem.classList.add( 'user-solved', 'user-negative' );
				}

				cellElem.classList.toggle( 'flipped' );

				self.drawPreview( 'userSolution' );

				if (self.puzzle.checkUserSolution()) {
					self._showPuzzleSolved();
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
	 */
	_resetPuzzle()
	{
		const self       = this,
			  cellElems  = self.gridContainer.querySelectorAll( '.nonogram-puzzle-grid td.puzzle-cell' ),
			  puzzleGrid = this.gridContainer.querySelector( '.nonogram-puzzle-grid' ),
			  solvedP    = document.querySelector( '[data-nonogram-puzzle-grid-solved]' )
		;

		// TODO: uncomment confirm ?
		//if (confirm( 'Are you sure you want to _reset the puzzle?' )) {

		puzzleGrid.classList.remove( 'solved' );
		solvedP.textContent = '';

		self.puzzle.cells.forEach( ( cell ) =>
		{
			cell.userSolution = null;
		} );

		cellElems.forEach( ( cellElem ) =>
		{
			cellElem.classList.remove( 'user-solved', 'user-positive', 'user-negative', 'solution-positive', 'solution-negative' );
		} );

		self.gridContainer.querySelector( '[data-nonogram-preview-grid]' ).innerHTML = '';

		self.drawPreview( 'userSolution' );

		//}
	}


	/**
	 *
	 */
	_showPuzzleSolved()
	{
		const grid    = this.gridContainer.querySelector( '.nonogram-puzzle-grid' ),
			  solvedP = document.querySelector( '[data-nonogram-puzzle-grid-solved]' )
		;

		grid.classList.add( 'solved' );
		solvedP.textContent = 'Solved!';
	}


	/**
	 *
	 * @param name
	 * @returns {Nonogram.GuiTemplate}
	 * @throws - error if template could not be found
	 */
	_getTemplate( name )
	{
		const ret = this.templates.find( ( template ) =>
		{
			return template.name === name;
		} );

		if (!ret instanceof Nonogram.GuiTemplate) {
			throw '"' + name + '" template not found.';
		}

		return ret;
	}


	/**
	 *
	 * @returns {string}
	 */
	_resolveThemePath()
	{
		let path = '';

		document.querySelectorAll( 'script' ).forEach( ( script ) =>
		{
			try {
				const url      = new URL( script.src ),
					  parts    = url.pathname.split( '/' ),
					  fileName = parts.pop()
				;

				if (fileName === 'nonogram.min.js') {
					path = url.href.replace( fileName, '' ) + 'themes';
				}

			} catch (err) {
			}
		} );

		return path;
	}


};

