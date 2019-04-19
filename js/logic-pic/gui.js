

LogicPic.Gui = function( puzzle, $container )
{
	var self = this;
	
	this.puzzle	= puzzle;
	
	$( window ).off( 'resize.resizeGrids' );
	$( window ).on( 'resize.resizeGrids', function()
	{
		self.sizeGrids();
	});
};



LogicPic.Gui.prototype.drawPuzzle = function( $puzzleContainer )
{
	var self			= this,
		html			= '',
		index			= 0,
		cellClasses		= {},
		maxColumnHints	= 0,
		markupColumnHints, i, j;
	
	
	this.$puzzleContainer = $puzzleContainer;
	
	cellClasses[0] = 'tl';
	cellClasses[this.puzzle.width-1] = 'tr';
	cellClasses[(this.puzzle.width*this.puzzle.height) - this.puzzle.width] = 'bl';
	cellClasses[(this.puzzle.width*this.puzzle.height)-1] = 'br';
		
	markupColumnHints = function( hints )
	{
		var html = '',
			key;
		
		for(key in hints) {
			html += '<span>'+hints[key]+'</span>';	
		}
		
		return html;
	};
	
	
	html += '<table class="logic-pic width-'+this.puzzle.width+' height-'+this.puzzle.height+'">';
	html += '	<tr>';
	for(i=0; i < this.puzzle.width + 1; i++) {
		if(i===0) {
			html += '<td class="preview"></td>';	
		} else {
			if(this.puzzle.columnHints[i-1].length > maxColumnHints) {
				maxColumnHints = this.puzzle.columnHints[i-1].length;	
			}
			html += '<td class="hint top" data-column="'+(i-1)+'">';
			html += '	<div class="fill">'+markupColumnHints( this.puzzle.columnHints[i-1] )+'</div>';
			html += '</td>';	
		}
	}
	html += '	</tr>';
	
	for(j=0; j < this.puzzle.height; j++) {
		
		html += '	<tr data-row="'+j+'">';
		
		for(i=0; i < this.puzzle.width + 1; i++) {
			if(i === 0) {
				html += '<td class="hint left" data-row="'+j+'">';
				html += '	<div class="fill">'+markupColumnHints( this.puzzle.rowHints[j] )+'</div>';
				html += '</td>';	
			} else {
				html += '<td class="puzzle-cell flippable '+(cellClasses[index] ? cellClasses[index] : '')+'"';
				html += '		data-index="'+index+'" data-column="'+(i - 1)+'" data-row="'+j+'">';
				html += '	<div class="fill"></div>';
				html += '</td>';	
				index++;
			}
		}
		html += '	</tr>';
	}
	
	html += '</table>';
	
	$( document ).ready( function()
	{
		self.$puzzleContainer.html( html );
		
		self.$puzzleContainer.find( '.logic-pic td.hint.top .fill' ).each( function()
		{
			for(i = $( this ).find( 'span' ).length; i < maxColumnHints; i++) {
				$( this ).prepend( '<span>&nbsp;</span>' );
			}
		});

		self.sizeGrids();
	});
};





LogicPic.Gui.prototype.makePuzzlePlayable = function()
{
	var self	= this,
		$cells, $table, $allCells;
		
		
	self.playerClickMode = 1;
	self.playerMouseDown = 0;
	self.lastPlayerModifiedCellIndex = null;
	self.lastPlayerCellClickValue	= null;
	
	
	$( document ).ready( function()
	{
		$table = self.$puzzleContainer.find( '.logic-pic' );
		$cells = self.$puzzleContainer.find( '.logic-pic td.puzzle-cell' );
		$allCells = self.$puzzleContainer.find( '.logic-pic td' );
		
		$cells.addClass( 'playable' );


		$cells.on( 'mouseenter touchmove', function( e )
		{
			var row			= $( this ).attr( 'data-row' ),
				column		= $( this ).attr( 'data-column' ),
				cellIndex, elem, $elem, touch;


			$allCells.each( function()
			{
				if($( this ).attr( 'data-row' ) == row || $( this ).attr( 'data-column' ) == column) {
					$( this ).addClass( 'row-column-highlight' );
				} else {
					$( this ).removeClass( 'row-column-highlight' );
				}
			});
			
			if(self.playerMouseDown ) {

				if(e.originalEvent.touches) {
					touch = e.originalEvent.touches[0];
					elem = document.elementFromPoint( touch.pageX, touch.pageY - $( window ).scrollTop() );
					cellIndex = $( elem ).attr( 'data-index' );
				} else {
					cellIndex = $( this ).attr( 'data-index' );	
				}
				
				self.handleUserCellSelection( cellIndex );
			}
		});
		
		$cells.on( 'mousedown touchstart', function( e )
		{
			var cellIndex	= $( this ).attr( 'data-index' ),
				cell		= self.puzzle.getCellByIndex( cellIndex );
			
			e.preventDefault();
			self.playerMouseDown = 1;
			self.lastPlayerCellClickValue = cell.userSolution;
			self.handleUserCellSelection( cellIndex );
		});
		
		$( 'body' ).on( 'mouseup touchend', function()
		{
			self.playerMouseDown = 0;
			self.lastPlayerModifiedCellIndex = null;
		});
		
		$table.on( 'mouseleave touchend', function()
		{
			self.playerMouseDown = 0;
			self.lastPlayerModifiedCellIndex = null;
			$allCells.removeClass( 'row-column-highlight' );
		});
	});
};




LogicPic.Gui.prototype.handleUserCellSelection = function( cellIndex )
{
	var self	= this,
		$cell	= self.$puzzleContainer.find( '.logic-pic td.puzzle-cell[data-index="'+cellIndex+'"]' ),
		cell, cellValue;
	
	if(self.playerMouseDown) {
		
		cell = self.puzzle.getCellByIndex( cellIndex );
		
		if(self.lastPlayerModifiedCellIndex != cell.index) {

			if(cell.userSolution === null) {
				cellValue = self.playerClickMode;
			} else if(cell.userSolution === 1) {
				if(self.lastPlayerCellClickValue !== null) {
					cellValue = self.playerClickMode === 1 ? null : 1;
				} else {
					cellValue = 1;
				}
			} else {
				if(self.lastPlayerCellClickValue !== null) {
					cellValue = self.playerClickMode === 0 ? null : 0;
				} else {
					cellValue = 0;
				}
			}

			self.setUserSolutionForCell( cell, cellValue );
			self.lastPlayerModifiedCellIndex = cell.index;
			
			$cell.removeClass( 'user-solved user-positive user-negative' );

			if(cellValue === 1) {
				$cell.addClass( 'user-solved user-positive' );
			} else if(cellValue === 0) {
				$cell.addClass( 'user-solved user-negative' );
			}
			
			$cell.toggleClass( 'flipped' );
			
			self.drawPreviewUserSolution( self.$puzzleContainer.find( '.logic-pic .preview' ) );
			
			if(self.puzzle.checkUserSolution()) {
				self.showPuzzleSolvedAnimation();
			}
		}
	}
};



LogicPic.Gui.prototype.setUserSolutionForCell = function( cell, value )
{
	cell.userSolution = value;
};



LogicPic.Gui.prototype.drawSolution = function()
{
	var self	= this,
		index	= 0,
		row, column, $cell;
	
	$( document ).ready( function()
	{
		self.$puzzleContainer.find( 'td' ).removeClass( 'filled' );
		
		for(row in self.puzzle.grid) {
			
			for(column in self.puzzle.grid[row]) {
				
				$cell = self.$puzzleContainer.find( 'td[data-index="'+index+'"]' );
				
				if(self.puzzle.grid[row][column] == 1) {
					$cell.addClass( 'solution-positive' );
				} else {
					$cell.addClass( 'solution-negative' );
				}
				index++;
			}
		}
	});
};


LogicPic.Gui.prototype.drawAiSolution = function( $container )
{
	var self	= this,
		index	= 0,
		cell, cssClass;
	
	$( document ).ready( function()
	{
		self.$puzzleContainer.find( 'td' ).removeClass( 'ai-solved, ai-positive, ai-negative' );
		
		while(cell = self.puzzle.getCellByIndex( index )) {
			if(cell.aiSolution !== null) {
				cssClass = cell.aiSolution  ? 'ai-solved ai-positive' : 'ai-solved ai-negative';
				self.$puzzleContainer.find( 'td[data-index="'+cell.index+'"]' ).addClass( cssClass );
			}
			index++;	
		}
	});
};


LogicPic.Gui.prototype.drawAiSolutionLog = function( solver, $container )
{
	var self = this,
		logItem, i;
	
	for(i=0; i < solver.solutionLog.length; i++) {
		logItem = solver.solutionLog[i];
		$container.append( '<div class="'+logItem.cssClass+'">'+logItem.html+'</div>' );	
	}
	
	$container.find( 'span[data-index]' ).hover(
		function()
		{
			self.$puzzleContainer.find( 'td[data-index="'+$( this ).attr( 'data-index' )+'"]' ).addClass( 'highlight' );
		},
		function()
		{
			self.$puzzleContainer.find( 'td[data-index="'+$( this ).attr( 'data-index' )+'"]' ).removeClass( 'highlight' );
		}
	);
};




LogicPic.Gui.prototype.drawUserControls = function( $container )
{
	var self	= this,
		html	= '';
	
	
	html += '<div class="fill-type">';
	html += '	<button class="button icon fill-positive selected" data-action="" data-foo="" title="Fill Squares (press X to toggle)"></button>';
	html += '	<button class="button icon fill-negative" data-action="" data-foo="" title="Negate Squares (press X to toggle)"></button>';
	html += '</div>';
	html += '<div class="actions">';
	html += '	<button class="button icon reset" data-action="" data-foo="">Reset</button>';
	html += '	<button class="button icon solve" data-action="" data-foo="">Solve</button>';
	html += '</div>';

	$container.html( html );
	
	$container.find( '.button.fill-positive' ).click( function()
	{
		self.playerClickMode = 1;
		$( this ).addClass( 'selected' );
		$container.find( '.button.fill-negative' ).removeClass( 'selected' );
	});
	
	$container.find( '.button.fill-negative' ).click( function()
	{
		self.playerClickMode = 0;
		$( this ).addClass( 'selected' );
		$container.find( '.button.fill-positive' ).removeClass( 'selected' );
	});
	
	$container.find( '.button.reset' ).click( function()
	{
		var key;
		
		if(confirm( 'Are you sure you want to reset the puzzle?' )) {
			for(key in self.puzzle.cells) {
				self.puzzle.cells[key].userSolution = null;	
			}
			
			self.makePuzzlePlayable();
			self.$puzzleContainer.find( '.logic-pic td.puzzle-cell' ).removeClass( 'user-solved user-positive user-negative solution-positive solution-negative' );
			self.$puzzleContainer.find( '.logic-pic .preview' ).html( '' );
		}
	});
	
	$container.find( '.button.solve' ).click( function()
	{
		if(confirm( 'Are you sure you want to see the answer?' )) {
			self.drawSolution();
			self.drawPreviewTrueSolution( self.$puzzleContainer.find( '.logic-pic .preview' ) );
		}
	});
	

	$( document ).off( 'keyup.toggleButtons' ).on( 'keyup.toggleButtons', function( e )
	{
		if(e.keyCode === 88) {
			$container.find( '.fill-type .button:not(.selected)' ).click();
		}
	});
};


LogicPic.Gui.prototype.drawCreatorLog = function( creator, $container )
{
	var html	= '',
		logItem, i;

	for(i=0; i < creator.log.length; i++) {
		logItem = creator.log[i];
		html += '<div>'+creator.log[i]+'</div>';	
	}
	
	$container.html( html );
};


LogicPic.Gui.prototype.drawPreviewSolution = function( $container, solutionType )
{
	var self	= this,
		index	= 0,
		html	= '',
		cell, i, j;
		
		
	html += '<table class="logic-pic-preview width-'+this.puzzle.width+' height-'+this.puzzle.height+'">';
	
	for(j=0; j < this.puzzle.height; j++) {
		
		html += '<tr>';
		
		for(i=0; i < this.puzzle.width; i++) {
			cell = self.puzzle.getCellByIndex( index );
			html += '<td data-index="'+index+'" class="'+(cell[solutionType] ? 'filled' : '')+'"></td>';	
			index++;
		}
		
		html += '</tr>';
	}
	
	html += '</table>';
	

	$( document ).ready( function()
	{
		$container.html( html );
		self.sizeGrids();
	});
};


LogicPic.Gui.prototype.showPuzzleSolvedAnimation = function()
{
	var self	= this,
		index	= 0,
		interval,
		animateCell;
		
		
	animateCell = function()
	{
		var $cell = self.$puzzleContainer.find( '.logic-pic td.puzzle-cell[data-index="'+index+'"]' );

		if(!$cell.length) {
			clearInterval( interval );
		} else {
			$cell.toggleClass( 'flipped' );
			index++;
		}
	};
	
	interval = setInterval( animateCell, 10 );
	
	self.$puzzleContainer.find( '.logic-pic' ).addClass( 'solved' );	
};


LogicPic.Gui.prototype.drawPreviewUserSolution = function( $container )
{
	this.drawPreviewSolution( $container, 'userSolution' );
};


LogicPic.Gui.prototype.drawPreviewAiSolution = function( $container )
{
	this.drawPreviewSolution( $container, 'aiSolution' );
};

LogicPic.Gui.prototype.drawPreviewTrueSolution = function( $container )
{
	this.drawPreviewSolution( $container, 'solution' );
};



LogicPic.Gui.prototype.sizeGrids = function()
{
	var self	= this;

	$( 'table.logic-pic' ).each( function()
	{
		var $cells			= $( this ).find( 'td.puzzle-cell' ),
			$rowHints		= $( this ).find( 'td.hint.left' ),
			tableW			= $( this ).parent().parent().parent().innerWidth(),
			rowHintsW		= parseInt( $rowHints.first().outerWidth(), 10 ),
			cellW			= (tableW - rowHintsW) / self.puzzle.width,
			maxW			= parseInt( $cells.first().css( 'max-width' ), 10 );

		cellW = cellW > maxW ? maxW : cellW;
		$cells.css( { width: cellW+'px', height: cellW+'px' } );
		$rowHints.css( { width: rowHintsW+'px', height: cellW+'px' } );
		$rowHints.find( '.fill' ).css( {	lineHeight: ((cellW/2)+4)+'px'  } );
		
		$( 'td.hint.top' ).css( {	height: $( 'td.hint.top' ).height()+'px'	} );
	});
	
	
	$( 'table.logic-pic-preview' ).each( function()
	{
		var $cells			= $( this ).find( 'td' ),
			tableW			= $( this ).parent().width(),
			cellW			= tableW / self.puzzle.width,
			maxW			= parseInt( $cells.first().css( 'max-width' ), 10 );

		cellW = cellW > maxW ? maxW : cellW;
		$cells.css( { width: cellW+'px', height: cellW+'px' } );
	});
};
