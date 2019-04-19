
var LogicPic = {};


LogicPic.Puzzle = function( width, height )
{
	this.width			= parseInt( width, 10);
	this.height			= parseInt( height, 10);
	this.totalCells		= this.width * this.height;
	
	this.reset();
};


LogicPic.Puzzle.prototype.reset = function()
{
	var row, column, rowArray;
	
	this.grid			= [];
	this.cells			= [];
	this.rowHints		= [];
	this.columnHints	= [];

	for(row=0; row < this.height; row++) {
		rowArray = [];
		for(column=0; column < this.width; column++) {
			rowArray.push( 0 );
		}
		this.grid.push( rowArray );	
	}
};



LogicPic.Puzzle.prototype.createFromGrid = function( grid )
{
	var index	= 0,
		columnHints, rowHints, row, column, key, cell, currentVal, lastVal;
	
	
	this.reset();
	
	this.grid = grid;
	
	// populate cells array
	
	for(row in this.grid) {
		for(column in this.grid[row]) {
			
			cell = {
				index:			index,
				column:			column,
				row:			row,
				solution:		this.grid[row][column],
				userSolution:	null,
				aiSolution:		null
			};
			
			this.cells.push( cell );
			
			index++;
		}
	}
	
	// populate row hints

	for(row in this.grid) {
		
		this.rowHints[row] = [];
		rowHints = [];

		for(column in this.grid[row]) {

			currentVal = this.grid[row][column];
			lastVal = column > 0 ? this.grid[row][column-1] : 0;

			if(currentVal === 1 && lastVal === 0) {
				rowHints.push( 1 );
			} else if(currentVal === 0 && lastVal === 1) {
				rowHints.push( 0 );
			} else if(currentVal === 1 && lastVal === 1) {
				rowHints[rowHints.length-1]++;
			}
		}
		
		// clean up row hints
		for(key in rowHints) {
			if(rowHints[key] > 0) {
				this.rowHints[row].push( rowHints[key] );	
			}
		}
	}
	
	// populate column hints
	
	for(column = 0; column < this.width; column++) {
		
		this.columnHints[column] = [];
		columnHints	= [];
		
		for(cell = column; cell < this.totalCells; cell += this.width) {
			
			row = Math.floor( cell / this.width );

			currentVal = this.grid[row][column];
			lastVal = row > 0 ? this.grid[row-1][column] : 0;

			if(currentVal === 1 && lastVal === 0) {
				columnHints.push( 1 );
			} else if(currentVal === 0 && lastVal === 1) {
				columnHints.push( 0 );
			} else if(currentVal === 1 && lastVal === 1) {
				columnHints[columnHints.length-1]++;
			}
		}
		
		// clean up column hints
		for(key in columnHints) {
			if(columnHints[key] > 0) {
				this.columnHints[column].push( columnHints[key] );	
			}
		}
	}
};



LogicPic.Puzzle.prototype.createFromHints = function( hints )
{
	var index	= 0,
		row, column, cell;
	
	
	this.reset();
	
	this.rowHints = hints.row;
	this.columnHints = hints.column;

	// populate cells array

	for(row in this.grid) {
		for(column in this.grid[row]) {
			
			cell = {
				index:			index,
				column:			column,
				row:			row,
				solution:		null,
				userSolution:	null,
				aiSolution:		null
			};
			
			this.cells.push( cell );

			index++;
		}
	}
};


LogicPic.Puzzle.prototype.checkUserSolution = function()
{
	var valid = true,
		key;
	
	for(key in this.cells) {
		if(this.cells[key].solution === 1 && this.cells[key].userSolution !== 1) {
			valid = false;
			break;
		}
	}

	return valid;
};


LogicPic.Puzzle.prototype.getRowCells = function( row )
{
	var cells = [],
		key;
	
	for(key in this.cells) {
		if(this.cells[key].row == row) {
			cells.push( this.cells[key] );	
		}
	}

	return cells.length > 0 ? cells : false;
};



LogicPic.Puzzle.prototype.getColumnCells = function( column )
{
	var cells = [],
		key;
	
	for(key in this.cells) {
		if(this.cells[key].column == column) {
			cells.push( this.cells[key] );	
		}
	}
	
	return cells.length > 0 ? cells : false;
};



LogicPic.Puzzle.prototype.getCellByIndex = function( index )
{
	return this.cells[index];
};


