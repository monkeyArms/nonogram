import Nonogram from './nonogram';


/**
 * @class
 * @type {Nonogram.Gui}
 * @this Nonogram.Gui
 *
 * provides a user interface for interacting with nonogram puzzles
 *
 * @property {Nonogram.Puzzle} this.puzzle
 * @property {int} playerClickMode
 */
Nonogram.Gui = class
{

	/**
	 *
	 * @param {string|null} theme
	 */
	constructor( theme )
	{
		const self = this,
			  head = document.querySelector( 'head' ),
			  link = document.createElement( 'link' )
		;

		// set up theme
		self.theme     = theme || 'default';
		self.themePath = self.resolveThemePath() + '/' + this.theme;

		// load stylesheet
		self.themeStylesheetPath = self.themePath + '/styles.css';
		link.rel                 = 'stylesheet';
		link.type                = 'text/css';
		link.href                = self.themeStylesheetPath;
		head.appendChild( link );

		// set up templates
		self.themeTemplatesPath = self.themePath + '/templates';
		self.templates          = [
			new Nonogram.GuiTemplate( 'gameControls', self.themeTemplatesPath + '/controls-game.html' ),
			new Nonogram.GuiTemplate( 'generateControls', self.themeTemplatesPath + '/controls-generate.html' ),
			new Nonogram.GuiTemplate( 'console', self.themeTemplatesPath + '/console.html' ),
		];

		// load templates
		self.templates.forEach( ( template ) =>
		{
			template.load();
		} );
	}


	/**
	 *
	 */
	drawGameControls()
	{
		const self     = this,
			  template = self.getTemplate( 'gameControls' );


		template && template.loaded( () =>
		{
			const container = document.querySelector( '[data-nonogram-game-controls]' ),
				  node      = template.getNode()
			;
			let fill, negative;

			// insert template
			container.innerHtml = container.textContent = '';
			container.appendChild( node );

			// add event handlers
			fill     = document.querySelector( '[data-nonogram-fill-squares]' );
			negative = document.querySelector( '[data-nonogram-negate-squares]' );


			fill.addEventListener( 'click', ( e ) =>
			{
				self.playerClickMode = 1;
				fill.classList.add( 'selected' );
				negative.classList.remove( 'selected' );
			} );

			negative.addEventListener( 'click', ( e ) =>
			{
				self.playerClickMode = 0;
				negative.classList.add( 'selected' );
				fill.classList.remove( 'selected' );
			} );
		} );
	}


	/**
	 *
	 */
	drawGenerateControls()
	{
		const self     = this,
			  template = self.getTemplate( 'generateControls' );


		template && template.loaded( () =>
		{
			const container     = document.querySelector( '[data-nonogram-generate-controls]' ),
				  node          = template.getNode(),
				  widthSelect   = node.querySelector( '[data-nonogram-generate-width]' ),
				  heightSelect  = node.querySelector( '[data-nonogram-generate-height]' ),
				  widthOptions  = node.querySelector( '[data-nonogram-generate-width-options]' ),
				  heightOptions = node.querySelector( '[data-nonogram-generate-height-options]' )
			;
			let i, clonedWidthOptions, cloneHeightOptions, widthOption, heightOption, generate, reset, solve;


			// populate width/height select elements
			for (i = 5; i <= 30; i++) {

				clonedWidthOptions       = document.importNode( widthOptions.content, true );
				cloneHeightOptions       = document.importNode( heightOptions.content, true );
				widthOption              = clonedWidthOptions.querySelector( 'option' );
				widthOption.textContent  = widthOption.value = i;
				heightOption             = cloneHeightOptions.querySelector( 'option' );
				heightOption.textContent = heightOption.value = i;

				widthSelect.appendChild( widthOption );
				heightSelect.appendChild( heightOption );
			}

			// insert template
			container.innerHtml = container.textContent = '';
			container.appendChild( node );

			// add event handlers
			generate = document.querySelector( '[data-nonogram-generate-button]' );
			reset    = document.querySelector( '[data-nonogram-game-reset]' );
			solve    = document.querySelector( '[data-nonogram-game-solve]' );

			generate.addEventListener( 'click', () =>
			{
				const widthSelect  = document.querySelector( '[data-nonogram-generate-width]' ),
					  heightSelect = document.querySelector( '[data-nonogram-generate-height]' ),
					  width        = widthSelect.value,
					  height       = heightSelect.value,
					  creator      = new Nonogram.Creator( width, height ),
					  puzzle       = creator.createRandom()
				;

				// TODO - move this into an init method or something

				this.creator = creator;

				self.drawPuzzle( puzzle );
				self.drawGameControls();
				self.drawGenerateControls();
				self.drawConsole();
				self.updateConsole();
				self.makePuzzlePlayable();
			} );

			reset.addEventListener( 'click', ( e ) =>
			{
				self.resetPuzzle();
			} );

			solve.addEventListener( 'click', ( e ) =>
			{
				if (confirm( 'Are you sure you want to see the answer?' )) {
					self.drawSolution();
					self.drawPreviewSolution( 'solution' );
				}
			} );
		} );
	}


	/**
	 *
	 */
	drawConsole()
	{
		const self     = this,
			  template = self.getTemplate( 'console' );


		template && template.loaded( () =>
		{
			self.updateConsole();
		} );
	}


	updateConsole()
	{
		const self      = this,
			  template  = self.getTemplate( 'console' ),
			  container = document.querySelector( '[data-nonogram-console]' ),
			  node      = template.getNode(),
			  output    = node.querySelector( '[data-nonogram-console-output]' ),
			  line      = node.querySelector( '[data-nonogram-console-line]' )
		;
		let clonedLine, code, i;

		for (i = 0; i < self.creator.log.length; i++) {
			clonedLine       = document.importNode( line.content, true );
			code             = clonedLine.querySelector( 'code' );
			code.textContent = self.creator.log[i];
			output.appendChild( code );
		}

		// insert template
		container.innerHtml = container.textContent = '';
		container.appendChild( node );
	}


	/**
	 *
	 * @param {Nonogram.Puzzle} puzzle
	 */
	drawPuzzle( puzzle )
	{
		const self         = this;
		let html           = '',
			index          = 0,
			cellClasses    = {},
			maxColumnHints = 0,
			markupColumnHints, i, j;

		self.puzzle = puzzle;


		this.$gridContainer = $( '[data-nonogram-puzzle-grid]' );

		cellClasses[0]                                                            = 'tl';
		cellClasses[this.puzzle.width - 1]                                        = 'tr';
		cellClasses[(this.puzzle.width * this.puzzle.height) - this.puzzle.width] = 'bl';
		cellClasses[(this.puzzle.width * this.puzzle.height) - 1]                 = 'br';

		markupColumnHints = function ( hints )
		{
			let html = '';

			hints.forEach( ( hint ) =>
			{
				html += '<span>' + hint + '</span>';
			} );

			return html;
		};


		html += '<table class="nonogram-puzzle-grid">';
		html += '<thead>';
		html += '	<tr>';
		for (i = 0; i < this.puzzle.width + 1; i++) {
			if (i === 0) {
				html += '<th class="preview"></th>';
			} else {
				if (this.puzzle.columnHints[i - 1].length > maxColumnHints) {
					maxColumnHints = this.puzzle.columnHints[i - 1].length;
				}
				html += '<th class="hint top" data-column="' + (i - 1) + '">';
				html += '	<div class="fill">' + markupColumnHints( this.puzzle.columnHints[i - 1] ) + '</div>';
				html += '</th>';
			}
		}
		html += '	</tr>';
		html += '</thead>';
		html += '<tbody>';

		for (j = 0; j < this.puzzle.height; j++) {

			html += '	<tr data-row="' + j + '">';

			for (i = 0; i < this.puzzle.width + 1; i++) {
				if (i === 0) {
					html += '<th class="hint left" data-row="' + j + '">';
					html += '	<div class="fill">' + markupColumnHints( this.puzzle.rowHints[j] ) + '</div>';
					html += '</th>';
				} else {
					html += '<td class="puzzle-cell flippable ' + (cellClasses[index] ? cellClasses[index] : '') + '"';
					html += '		data-index="' + index + '" data-column="' + (i - 1) + '" data-row="' + j + '">';
					html += '	<div class="fill"></div>';
					html += '</td>';
					index++;
				}
			}
			html += '	</tr>';
		}

		html += '</tbody>';

		html += '</table>';


		self.$gridContainer.html( html );

		self.$gridContainer.find( '.nonogram td.hint.top .fill' ).each( function ()
		{
			for (i = $( this ).find( 'span' ).length; i < maxColumnHints; i++) {
				$( this ).prepend( '<span>&nbsp;</span>' );
			}
		} );
	}


	/**
	 *
	 */
	makePuzzlePlayable()
	{
		const self = this;
		let $cells, $table, $allCells;


		self.playerClickMode             = 1;
		self.playerMouseDown             = 0;
		self.lastPlayerModifiedCellIndex = null;
		self.lastPlayerCellClickValue    = null;


		$table    = self.$gridContainer.find( '.nonogram-puzzle-grid' );
		$cells    = self.$gridContainer.find( '.nonogram-puzzle-grid td.puzzle-cell' );
		$allCells = self.$gridContainer.find( '.nonogram-puzzle-grid td' );

		$cells.addClass( 'playable' );


		$cells.on( 'mouseenter touchmove', function ( e )
		{
			const row    = $( this ).attr( 'data-row' ),
				  column = $( this ).attr( 'data-column' );
			let cellIndex, elem, touch;


			$allCells.each( function ()
			{
				if ($( this ).attr( 'data-row' ) === row || $( this ).attr( 'data-column' ) === column) {
					$( this ).addClass( 'row-column-highlight' );
				} else {
					$( this ).removeClass( 'row-column-highlight' );
				}
			} );

			if (self.playerMouseDown) {

				if (e.originalEvent.touches) {
					touch     = e.originalEvent.touches[0];
					elem      = document.elementFromPoint( touch.pageX, touch.pageY - $( window ).scrollTop() );
					cellIndex = $( elem ).attr( 'data-index' );
				} else {
					cellIndex = $( this ).attr( 'data-index' );
				}

				self.handleUserCellSelection( cellIndex );
			}
		} );

		$cells.on( 'mousedown touchstart', function ( e )
		{
			const cellIndex = $( this ).attr( 'data-index' ),
				  cell      = self.puzzle.getCellByIndex( cellIndex );

			e.preventDefault();
			self.playerMouseDown          = 1;
			self.lastPlayerCellClickValue = cell.userSolution;
			self.handleUserCellSelection( cellIndex );
		} );

		$( 'body' ).on( 'mouseup touchend', function ()
		{
			self.playerMouseDown             = 0;
			self.lastPlayerModifiedCellIndex = null;
		} );

		$table.on( 'mouseleave touchend', function ()
		{
			self.playerMouseDown             = 0;
			self.lastPlayerModifiedCellIndex = null;
			$allCells.removeClass( 'row-column-highlight' );
		} );
	}


	/**
	 *
	 * @param cellIndex
	 */
	handleUserCellSelection( cellIndex )
	{
		const self  = this,
			  $cell = self.$gridContainer.find( '.nonogram-puzzle-grid td.puzzle-cell[data-index="' + cellIndex + '"]' );
		let cell, cellValue;


		if (self.playerMouseDown) {

			cell = self.puzzle.getCellByIndex( cellIndex );

			if (self.lastPlayerModifiedCellIndex !== cell.index) {

				if (cell.userSolution === null) {
					cellValue = self.playerClickMode;
				} else if (cell.userSolution === 1) {
					if (self.lastPlayerCellClickValue !== null) {
						cellValue = self.playerClickMode === 1 ? null : 1;
					} else {
						cellValue = 1;
					}
				} else {
					if (self.lastPlayerCellClickValue !== null) {
						cellValue = self.playerClickMode === 0 ? null : 0;
					} else {
						cellValue = 0;
					}
				}

				cell.userSolution = cellValue;

				self.lastPlayerModifiedCellIndex = cell.index;

				$cell.removeClass( 'user-solved user-positive user-negative' );

				if (cellValue === 1) {
					$cell.addClass( 'user-solved user-positive' );
				} else if (cellValue === 0) {
					$cell.addClass( 'user-solved user-negative' );
				}

				$cell.toggleClass( 'flipped' );

				self.drawPreviewSolution( 'userSolution' );

				if (self.puzzle.checkUserSolution()) {
					self.showPuzzleSolvedAnimation();
				}
			}
		}
	}


	/**
	 *
	 */
	drawSolution()
	{
		const self = this;
		let index  = 0,
			$cell;

		self.$gridContainer.find( 'td' ).removeClass( 'filled' );

		self.puzzle.grid.forEach( ( row ) =>
		{
			row.forEach( ( column ) =>
			{
				$cell = self.$gridContainer.find( 'td[data-index="' + index + '"]' );

				if (column === 1) {
					$cell.addClass( 'solution-positive' );
				} else {
					$cell.addClass( 'solution-negative' );
				}
				index++;
			} );
		} );
	}


	/**
	 *
	 */
	resetPuzzle()
	{
		const self = this;


		if (confirm( 'Are you sure you want to reset the puzzle?' )) {

			self.puzzle.cells.forEach( ( cell ) =>
			{
				cell.userSolution = null;
			} );

			self.makePuzzlePlayable();
			self.$gridContainer.find( '.nonogram-puzzle-grid td.puzzle-cell' ).removeClass( 'user-solved user-positive user-negative solution-positive solution-negative' );
			self.$gridContainer.find( '.nonogram-puzzle-grid .preview' ).html( '' );
		}
	}


	/**
	 * @param solutionType
	 */
	drawPreviewSolution( solutionType )
	{
		const self = this;
		let index  = 0,
			html   = '',
			cell, i, j;

		let $container = this.$gridContainer.find( '.nonogram-puzzle-grid .preview' );

		html += '<table class="nonogram-preview width-' + this.puzzle.width + ' height-' + this.puzzle.height + '">';

		for (j = 0; j < this.puzzle.height; j++) {

			html += '<tr>';

			for (i = 0; i < this.puzzle.width; i++) {
				cell = self.puzzle.getCellByIndex( index );
				html += '<td data-index="' + index + '" class="' + (cell[solutionType] ? 'filled' : '') + '"></td>';
				index++;
			}

			html += '</tr>';
		}

		html += '</table>';


		$container.html( html );
	}


	/**
	 *
	 */
	showPuzzleSolvedAnimation()
	{
		const self = this;
		let index  = 0,
			interval,
			animateCell;


		animateCell = function ()
		{
			const $cell = self.$gridContainer.find( '.nonogram-puzzle-grid td.puzzle-cell[data-index="' + index + '"]' );

			if (!$cell.length) {
				clearInterval( interval );
			} else {
				$cell.toggleClass( 'flipped' );
				index++;
			}
		};

		interval = setInterval( animateCell, 10 );

		self.$gridContainer.find( '.nonogram-puzzle-grid' ).addClass( 'solved' );
	}


	/**
	 *
	 * @param name
	 * @returns {Nonogram.GuiTemplate}
	 */
	getTemplate( name )
	{
		return this.templates.find( ( template ) =>
		{
			return template.name === name;
		} );
	}


	/**
	 *
	 * @returns {string}
	 */
	resolveThemePath()
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

