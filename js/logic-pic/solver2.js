

LogicPic.Solver = function( puzzle )
{
	this.puzzle = puzzle;

	this.reset();
};




LogicPic.Solver.prototype.solve = function()
{
	var lastProgress	= -1,
		solved			= false,
		start			= new Date().getTime(),
		c				= 1,
		passStart, passEnd, end, lineKey, line, elapsed;
	
	
	if(!this.isReset) {
		this.reset();	
	}
	
	this.isReset = false;
	this.log( 'Starting solve algorithm', 'info' );
	

	while(this.getProgress() > lastProgress && this.getTotalSolved() < this.puzzle.cells.length) {
		
		passStart = new Date().getTime();
		lastProgress = this.getProgress();
		
		for(lineKey in this.lines) {
		
			line = this.lines[lineKey];
		
			if(!line.solved)  {

				this.eliminateImpossibleFits( line );
				this.findKnownPositivesAndNegatives( line );
				this.findSectionDefiningChains( line );
				this.findAnchoredSections( line );
				this.findCompletedSections( line );
				this.findCompletedLines( line );
			}
		}
		
		passEnd = new Date().getTime();
		elapsed = (passEnd - passStart)/1000;
		
		this.log( 'Pass '+c+' completed in '+elapsed+' seconds :: '+this.getTotalSolved()+'/'+this.puzzle.cells.length+' cells solved', 'info' );
		c++;
	}
	
	solved = this.getTotalSolved() == this.puzzle.cells.length;
	end = new Date().getTime();
	
	this.log( 'Solve algorithm finished in '+((end - start)/1000)+' seconds.', 'info' );
	
	if(solved) {
		this.log( 'Solution Found.', 'success' );
	} else {
		this.log( 'Could not find solution.', 'failure' );
	}
	
	return solved;
};




//	#############################################################################################	
//	#############################################################################################	solution algorithms
//	#############################################################################################	


LogicPic.Solver.prototype.eliminateImpossibleFits = function( line )
{
	var minimumStartIndex	= 0,
		maximumStartIndex	= line.length - line.minimumSectionLength,
		section, sectionKey, possibleStartIndex, psiKey, i, end, newPossibleStartIndexes;
	
	
	// no sections 
			
	if(line.sections.length == 0) {
		for(i=0; i < line.cells.length; i++) {
			this.setCellSolution( line.cells[i].index, 0 );
		}
	}

	// tighten range if one or more known negative cells start the line
	
	for(i=0; i < line.length; i++) {
		if(line.cells[i].aiSolution === 0) {
			minimumStartIndex++;
		} else {
			break;	
		}
	}
	
	// tighten range if one or more known negative cells end the line
	
	for(i=line.length-1; i >= 0; i--) {
		if(line.cells[i].aiSolution === 0) {
			maximumStartIndex--;
		} else {
			break;	
		}
	}

	for(sectionKey in line.sections) {
		
		section = line.sections[sectionKey];
		newPossibleStartIndexes = this.cloneArray( section.possibleStartIndexes );

		// eliminate places where section does not fit

		for(psiKey in section.possibleStartIndexes) {
			
			possibleStartIndex = section.possibleStartIndexes[psiKey];

			// the total length of all sections including minimum gap(s) of one cell does not allow this section to fit:
			
			if(possibleStartIndex < minimumStartIndex || possibleStartIndex > maximumStartIndex) {
				newPossibleStartIndexes = this.removeFromArray( newPossibleStartIndexes, possibleStartIndex );
			}
			
			// there is a known positive cell immediately following the possible section placement, so section cannot start here
			
			if(line.cells[possibleStartIndex+section.length] && line.cells[possibleStartIndex+section.length].aiSolution == 1) {
				newPossibleStartIndexes = this.removeFromArray( newPossibleStartIndexes, possibleStartIndex );
			}
			
			// there is a known impossible cell in this range, so section cannot fit here:

			end = possibleStartIndex + section.length - 1;
			end = (end > line.length - 1) ? line.length - 1 : end;

			for(i=possibleStartIndex; i <= end; i++) {
				if(i > line.length - 1 || line.cells[i].aiSolution === 0) {
					newPossibleStartIndexes = this.removeFromArray( newPossibleStartIndexes, possibleStartIndex );
				}
			}

		}

		minimumStartIndex += section.length + 1;
		maximumStartIndex += section.length + 1;
		section.possibleStartIndexes = newPossibleStartIndexes;
	}
};





LogicPic.Solver.prototype.findKnownPositivesAndNegatives = function( line )
{
	var totalCellCounts = this.getZeroFilledArray( line.length ),
		sectionKey, section, cellCounts, psiKey, possibleStartIndex, start, end, i, cellCountKey, cell;


	for(sectionKey in line.sections) {
			
		section = line.sections[sectionKey];
		cellCounts = this.getZeroFilledArray( line.length );

		// keep two counts: 1) all common cells for this section, and 2) cells where no section can be

		for(psiKey in section.possibleStartIndexes) {

			possibleStartIndex = section.possibleStartIndexes[psiKey];
			start = possibleStartIndex;
			end = start + section.length - 1;
			
			for(i=start; i <= end; i++) {
				cellCounts[i]++;
				totalCellCounts[i]++;
			}
		}

		// common to all possibilities, solve as positive
		
		for(cellCountKey in cellCounts) {
			
			cell = line.cells[cellCountKey];

			if(cell && cell.aiSolution === null && cellCounts[cellCountKey] == section.possibleStartIndexes.length) { 
				this.setCellSolution( cell, 1 );
			}
		}
	}
	
	// no possible cells, remove as a possibility	
	
	for(cellCountKey in totalCellCounts) {
		
		cell = line.cells[cellCountKey];

		if(cell && cell.aiSolution === null && totalCellCounts[cellCountKey] === 0) { 
			this.setCellSolution( cell, 0 );
		}
	}
};




LogicPic.Solver.prototype.findAnchoredSections = function( line )
{
	var key, fillRange, i, firstSection, lastSection;
	
	
	if(line.sections.length > 0) {
		
		firstSection = line.sections[0];
		lastSection = line.sections[line.sections.length-1];
		
		// find sections anchored to start of line
		
		fillRange = null;
		
		for(key=0; key < line.cells.length; key++) {
			if(line.cells[key].aiSolution === null) {
				break;	
			} else if(line.cells[key].aiSolution === 1) {
				fillRange = [key, key + firstSection.length-1];
				break;
			}
		}
		
		if(fillRange !== null) {
			for(i=fillRange[0]; i <= fillRange[1]; i++) {
				if(line.cells[i]) {
					this.setCellSolution( line.cells[i], 1 );
				}
			}
			if(line.cells[i]) {
				this.setCellSolution( line.cells[i], 0 );
			}
		}

	
		// find sections anchored to end of line

		fillRange = null;

		for(key=line.cells.length-1; key >= 0; key--) {
			if(line.cells[key].aiSolution === null) {
				break;	
			} else if(line.cells[key].aiSolution === 1) {
				fillRange = [key - lastSection.length + 1, key];
				break;
			}
		}
		
		if(fillRange !== null) {
			for(i=fillRange[0]; i <= fillRange[1]; i++) {
				if(line.cells[i]) {
					this.setCellSolution( line.cells[i], 1 );
				}
			}
			if(line.cells[fillRange[0] - 1]) {
				this.setCellSolution( line.cells[fillRange[0] - 1], 0 );
			}
		}
	}	
};






LogicPic.Solver.prototype.findSectionDefiningChains = function( line )
{
	var sectionKey, section, chains, cellKey, cell, lastValue, chainKey, chain, sectionsSorted;
	

	// sort sections by highest length to lowest
	
	sectionsSorted = this.cloneArray( line.sections );
	sectionsSorted.sort( function( a, b )
	{
		return a.length > b.length ? -1 : 1;
	});
	

	// loop through all cells, creating array of connectors
	
	chains = [];
	lastValue = 0;
	
	for(cellKey in line.cells) {
		
		cell = line.cells[cellKey];
		
		if(cell.aiSolution == 1) {
			if(lastValue != 1) {
				chain = { start: parseInt( cellKey, 10 ), length: 1 };
				chains.push( chain );
			} else {
				chain.length++;
			}
		}
		
		lastValue = cell.aiSolution;
	}

	// for each section, if a connector is found with that length, place negatives around it and mark the section as complete & continue

	for(sectionKey in sectionsSorted) {
		for(chainKey in chains) {
			
			chain = chains[chainKey];
			section = sectionsSorted[sectionKey];
			
			if(chain.length == section.length) {
				if(line.cells[chain.start-1]) {
					this.setCellSolution( line.cells[chain.start-1], 0 );
				}
				
				if(line.cells[chain.start+section.length]) {
					this.setCellSolution( line.cells[chain.start+section.length], 0 );
				}
				section.solved = true;
				continue;
			}
		}
		break;
	}
};




LogicPic.Solver.prototype.findCompletedSections = function( line )
{
	var sectionKey, section, firstNegative, lastNegative;
	

	// complete lines where all sections have been found

	for(sectionKey in line.sections) {

		section = line.sections[sectionKey];

		if(!section.solved) {
			
			// only one possible place...
			if(section.possibleStartIndexes.length == 1) {
				
				// make sure there is a negative cell on either side of the section
				firstNegative = section.possibleStartIndexes[0] - 1;
				lastNegative = section.possibleStartIndexes[0] + section.length;

				if(line.cells[firstNegative] && line.cells[firstNegative].aiSolution === null) {
					this.setCellSolution( line.cells[firstNegative], 0 );
				}
				if(line.cells[lastNegative] && line.cells[lastNegative].aiSolution === null) {
					this.setCellSolution( line.cells[lastNegative], 0 );
				}
				section.solved = true;
			}
		}
	}
};



LogicPic.Solver.prototype.findCompletedLines = function( line )
{
	var totalSectionLength	= 0,
		totalPositiveSolved	= 0,
		sectionKey, key;


	// complete lines where all sections have been found

	for(sectionKey in line.sections) {
		totalSectionLength += line.sections[sectionKey].length;	
	}
	
	for(key in line.cells) {
		totalPositiveSolved += line.cells[key].aiSolution == 1;	
	}
	
	if(totalSectionLength == totalPositiveSolved) {
		for(key in line.cells) {
			if(line.cells[key].aiSolution === null) {
				this.setCellSolution( line.cells[key], 0 );
			}
		}
	}
};




//	#############################################################################################	
//	#############################################################################################	other methods
//	#############################################################################################	


LogicPic.Solver.prototype.reset = function()
{
	var possibleRowIndexes		= [],
		possibleColumnIndexes	= [],
		line, key, key2, i;
	
	this.isReset		= true;
	this.solutionLog	= [];
	this.lines			= [];
	
	this.log( 'Resetting variables', 'info' );
	
	for(key in this.puzzle.cells) {
		this.puzzle.cells[key].aiSolution = null;	
	}
	
	for(i=0; i < this.puzzle.width; i++) {
		possibleRowIndexes.push( i );	
	}
	
	for(i=0; i < this.puzzle.height; i++) {
		possibleColumnIndexes.push( i );	
	}

	for(key in this.puzzle.rowHints) {

		line = {
			type:					'row',
			index:					key,
			length:					this.puzzle.width,
			minimumSectionLength:	0,
			sections:				[],
			cells:					this.puzzle.getRowCells( key ),
			solved:					false
		};

		for(key2 in this.puzzle.rowHints[key]) {

			line.sections.push( {
				index:					key2,
				length:					this.puzzle.rowHints[key][key2],
				possibleStartIndexes:	possibleRowIndexes,
				knownIndexes:			[],
				solved:					false
			});
			
			line.minimumSectionLength += this.puzzle.rowHints[key][key2] + 1;
		}
		
		line.minimumSectionLength--;
		
		this.lines.push( line );
	}
	
	for(key in this.puzzle.columnHints) {
		line = {
			type:				'column',
			index:				key,
			length:					this.puzzle.height,
			minimumSectionLength:	0,
			sections:				[],
			cells:					this.puzzle.getColumnCells( key ),
			solved:					false
		};

		for(key2 in this.puzzle.columnHints[key]) {

			line.sections.push( {
				index:					key2,
				length:					this.puzzle.columnHints[key][key2],
				possibleStartIndexes:	possibleColumnIndexes,
				knownIndexes:			[],
				solved:					false
			});
			
			line.minimumSectionLength += this.puzzle.columnHints[key][key2] + 1;
		}
		
		line.minimumSectionLength--;
		
		this.lines.push( line );
	}
};



LogicPic.Solver.prototype.setCellSolution = function( cellObj, value )
{
	var cellsSolved, lineKey, cellKey, line, cell;
	
//if(!cellObj) {	console.log( 'setCellSolution(): no cell', this.puzzle );	}

	if(cellObj.aiSolution !== null) {	return;	}
		

	for(lineKey in this.lines) {
		
		line = this.lines[lineKey];
		
		if((line.type == 'row' && line.index == cellObj.row) || (line.type == 'column' && line.index == cellObj.column)) {
			
			cellsSolved = 0;

			for(cellKey in line.cells) {
				
				cell = line.cells[cellKey];
				
				if(cell.index == cellObj.index) {
					cell.aiSolution = value;
					cellsSolved++;
				} else if(cell.aiSolution !== null) {
					cellsSolved++;	
				}
			}
			
			if(cellsSolved == line.length) {
				line.solved = true;
			}
		}
	}
};



LogicPic.Solver.prototype.log = function( html, cssClass )
{
	this.solutionLog.push( { html: html, cssClass: cssClass } );
};



LogicPic.Solver.prototype.getTotalSolved = function()
{
	var total = 0,
		key;
	
	for(key in this.puzzle.cells) {
		total += this.puzzle.cells[key].aiSolution !== null;
	}
	
	return total;
};



LogicPic.Solver.prototype.getProgress = function()
{
	var maxPossibilities	= 0,
		totalPossibilities	= 0,
		line, section, lineKey, sectionKey;
	
	for(lineKey in this.lines) {
		
		line = this.lines[lineKey];
		
		maxPossibilities += line.sections.length * (line.type == 'row' ? this.puzzle.width : this.puzzle.height);
		
		for(sectionKey in line.sections) {
				
			section = line.sections[sectionKey];
			totalPossibilities += section.possibleStartIndexes.length;
		}
	}

	return maxPossibilities - totalPossibilities;
};



//	#############################################################################################	
//	#############################################################################################	misc helper functions
//	#############################################################################################	


LogicPic.Solver.prototype.removeFromArray = function( array, value )
{
	var index = array.indexOf( value );

	if(index !== -1) {
		array.splice( index, 1 );	
	}

	return array;
};



LogicPic.Solver.prototype.getZeroFilledArray = function( length )
{
	var arr = [],
		i;
		
	for(i=0; i < length; i++) {
		arr.push( 0 );	
	}
	
	return arr;
};




LogicPic.Solver.prototype.cloneArray = function( array )
{
	return array.slice( 0 );
};







