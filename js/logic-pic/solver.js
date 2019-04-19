

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
		end;

	this.reset();
	this.log( 'Starting solve algorithm' );

	while(this.getProgress() > lastProgress && this.getTotalSolved() < this.puzzle.cells.length) {
		
		lastProgress = this.getProgress();

		this.eliminateImpossibleFits();
		this.findKnownPositivesAndNegatives();
		this.findForcedConnectors();
		this.findSectionDefiningChains();
		this.findAnchoredSections();
		this.findCompletedSections();
		this.findCompletedLines();
		
		this.log( 'Pass complete - '+this.getTotalSolved()+'/'+this.puzzle.cells.length+' cells solved' );
	}
	
	solved = this.getTotalSolved() == this.puzzle.cells.length;
	end = new Date().getTime();
	
	this.log( 'Solve algorithm finished in '+((end - start)/1000)+' seconds. '+(solved ? ' Solution Found' : 'Could not find solution') );
	
	return solved;
};




//	#############################################################################################	
//	#############################################################################################	solution algorithms
//	#############################################################################################	


LogicPic.Solver.prototype.eliminateImpossibleFits = function()
{
	var line, section, lineKey, sectionKey, possibleStartIndex, psiKey, i, end, minimumStartIndex, maximumStartIndex, newPossibleStartIndexes;
	
	
	this.log( 'Running "eliminateImpossibleFits()" algorithm' );
	
	for(lineKey in this.lines) {
		
		line = this.lines[lineKey];
		
		if(!line.solved) {

			// no sections 
			
			if(line.sections.length == 0) {
				for(i=0; i < line.cells.length; i++) {
					this.setCellSolution( line.cells[i].index, 0 );
				}
			}

			// eliminate possibilities

			minimumStartIndex = 0;
			maximumStartIndex = line.length - line.minimumSectionLength;
			
			// tighten range if one or more known negative cells start the line
			for(i=0; i < line.length; i++) {
				if(line.cells[i].aiSolution == 0) {
					minimumStartIndex++;
				} else {
					break;	
				}
			}
			
			// tighten range if one or more known negative cells end the line
			for(i=line.length-1; i >= 0; i--) {
				if(line.cells[i].aiSolution == 0) {
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

					// the total length of all sections including minimum gap of one cell does not allow this section to fit:
					
					if(possibleStartIndex < minimumStartIndex || possibleStartIndex > maximumStartIndex) {
						newPossibleStartIndexes = this.removeFromArray( newPossibleStartIndexes, possibleStartIndex );
					}
					
					// there is a known positive cell immediately following the possible section placement
					if(line.cells[possibleStartIndex+section.length] && line.cells[possibleStartIndex+section.length].aiSolution == 1) {
						newPossibleStartIndexes = this.removeFromArray( newPossibleStartIndexes, possibleStartIndex );
					}
					
					// there is a known impossible cell in this range, so section cannot fit here:

					end = possibleStartIndex + section.length - 1;
					end = (end > line.length - 1) ? line.length - 1 : end;

					for(i=possibleStartIndex; i <= end; i++) {
						if(i > line.length - 1 || line.cells[i].aiSolution == 0) {
							newPossibleStartIndexes = this.removeFromArray( newPossibleStartIndexes, possibleStartIndex );
						}
					}

				}

				minimumStartIndex += section.length + 1;
				maximumStartIndex += section.length + 1;
				section.possibleStartIndexes = newPossibleStartIndexes;
			}
			
if(line.type == 'row' && line.index == 4) {
	for(var q = 0; q < line.sections.length; q++) {
		//console.log(	line.sections[q].index, line.sections[q].possibleStartIndexes	);	
	}
}
		}
	}
};





LogicPic.Solver.prototype.findKnownPositivesAndNegatives = function()
{
	var lineKey, line, totalCellCounts, sectionKey, section, cellCounts, psiKey, possibleStartIndex, start, end, i, cellCountKey, cell;
	
	
	this.log( 'Running "findKnownPositivesAndNegatives()" algorithm' );

	for(lineKey in this.lines) {
		
		line = this.lines[lineKey];
		
		if(!line.solved) {

			totalCellCounts = this.getZeroFilledArray( line.length );
			
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
						this.setCellSolution( cell.index, 1 );
					}
				}
			}
			
			// no possible cells, remove as a possibility	
			
			for(cellCountKey in totalCellCounts) {
				
				cell = line.cells[cellCountKey];
	
				if(cell && cell.aiSolution === null && totalCellCounts[cellCountKey] == 0) { 
					this.setCellSolution( cell.index, 0 );
				}
			}
		}
	}
};





LogicPic.Solver.prototype.findForcedConnectors = function()
{
	var lineKey, sectionKey, key, line, section, i, cell, firstPositive, lastPositive;
	
	
	this.log( 'Running "findForcedConnectors()" algorithm' );

	// find situations with one section - any unknown gaps in between cells must be filled

	for(lineKey in this.lines) {

		line = this.lines[lineKey];
		
		if(!line.solved) {
			
			if(line.sections.length == 1) {
				
				firstPositive = null;
				lastPositive = null;
				
				for(i=0; i < line.cells.length; i++) {
					
					cell = line.cells[i];
					
					if(cell.aiSolution == 1) {
						if(firstPositive === null) {
							firstPositive = i;
						} else {
							lastPositive = i;
						}
					}
				}
				
				if(firstPositive !== null && lastPositive !== null) {
					for(i=firstPositive; i < lastPositive; i++) {
						if(line.cells[i].aiSolution === null) {
							this.setCellSolution( line.cells[i].index, 1 );	
						}
					}
				}
			}
		}
	}
};




LogicPic.Solver.prototype.findAnchoredSections = function()
{
	var lineKey, sectionKey, key, fillRange, line, section, psiKey, i, firstSection, lastSection;
	
	
	this.log( 'Running "findAnchoredSections()" algorithm' );


	for(lineKey in this.lines) {

		line = this.lines[lineKey];
		
		if(!line.solved) {

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
						this.setCellSolution( line.cells[i].index, 1 );
					}
					if(line.cells[i]) {
						this.setCellSolution( line.cells[i].index, 0 );
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
						this.setCellSolution( line.cells[i].index, 1 );
					}
					if(line.cells[fillRange[0] - 1]) {
						this.setCellSolution( line.cells[fillRange[0] - 1].index, 0 );
					}
				}
			}	
		}
	}
};


/*

findAnchoredSectionForcedCells

- look at the first section
- find the first possible cell the section can start on
- find a cell exists in the minimum range (i.e. 4 length section, cell at 0, 1, 2, or 3) - X
- if so, fill any cells from X to maximum cell length

- repeat for last

*/





LogicPic.Solver.prototype.findSectionDefiningChains = function()
{
	var lineKey, sectionKey, key, line, section, psiKey, chains, cellKey, cell, lastValue, chainKey, chain;
	
	
	this.log( 'Running "findSectionDefiningChains()" algorithm' );


	for(lineKey in this.lines) {

		line = this.lines[lineKey];
		
		// sort sections by highest length to lowest
		
		sectionsSorted = this.cloneArray( line.sections );
		sectionsSorted.sort( function( a, b )
		{
			return a.length > b.length ? -1 : 1;
		});
		
		if(!line.solved) {
			
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
							this.setCellSolution( line.cells[chain.start-1].index, 0 );
						}
						
						if(line.cells[chain.start+section.length]) {
							this.setCellSolution( line.cells[chain.start+section.length].index, 0 );
						}
						section.solved = true;
						continue;
					}
				}
				break;
			}
		}
	}
};




LogicPic.Solver.prototype.findCompletedSections = function()
{
	var lineKey, sectionKey, key, line, section, psiKey, firstNegative, lastNegative;
	
	
	this.log( 'Running "findCompletedSections()" algorithm' );

	// complete lines where all sections have been found

	for(lineKey in this.lines) {

		line = this.lines[lineKey];
		
		if(!line.solved) {
			
			for(sectionKey in line.sections) {

				section = line.sections[sectionKey];
if(line.type == 'row' && line.index == 12 && sectionKey == '3') {
	//console.log( section);	
}
				if(!section.solved) {
					
					// only one possible place...
					if(section.possibleStartIndexes.length == 1) {
						
						// make sure there is a negative cell on either side of the section
						firstNegative = section.possibleStartIndexes[0] - 1;
						lastNegative = section.possibleStartIndexes[0] + section.length;
//console.log( line.type, line.index, 'section '+section.index, 'negating '+firstNegative+' and '+lastNegative, section );

						if(line.cells[firstNegative] && line.cells[firstNegative].aiSolution === null) {
							this.setCellSolution( line.cells[firstNegative].index, 0 );
						}
						if(line.cells[lastNegative] && line.cells[lastNegative].aiSolution === null) {
							this.setCellSolution( line.cells[lastNegative].index, 0 );
						}
						section.solved = true;
					}
				}
			}
		}
	}
};



LogicPic.Solver.prototype.findCompletedLines = function()
{
	var lineKey, totalSectionLength, totalPositiveSolved, sectionKey, key, line;
	
	
	this.log( 'Running "findCompletedLines()" algorithm' );

	// complete lines where all sections have been found

	for(lineKey in this.lines) {
		
		line = this.lines[lineKey];
		
		if(!line.solved) {
			
			totalSectionLength	= 0;
			totalPositiveSolved	= 0;

			for(sectionKey in line.sections) {
				totalSectionLength += line.sections[sectionKey].length;	
			}
			
			for(key in line.cells) {
				totalPositiveSolved += line.cells[key].aiSolution == 1;	
			}
			
			if(totalSectionLength == totalPositiveSolved) {
				for(key in line.cells) {
					if(line.cells[key].aiSolution == null) {
						this.setCellSolution( line.cells[key].index, 0 );
					}
				}
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
	
	
	this.solutionLog	= [];
	this.lines			= [];
	
	this.log( 'Resetting variables' );
	
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
			type:				'row',
			index:				key,
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



LogicPic.Solver.prototype.setCellSolution = function( cellIndex, value )
{
	var cellsSolved, lineKey, cellKey, line, cell;

	for(lineKey in this.lines) {
		
		cellsSolved = 0;
		line = this.lines[lineKey];
		
		for(cellKey in line.cells) {
			
			cell = line.cells[cellKey];
			
			if(cell.index == cellIndex) {
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
};



LogicPic.Solver.prototype.log = function( html )
{
	this.solutionLog.push( html );
};


LogicPic.Solver.prototype.logCellSolution = function( cell, method )
{
	var html = '';
	
	html += 'Cell <span data-index="'+cell.index+'">'+cell.row+','+cell.column+'</span>';
	html += cell.aiSolution ? ' must' : ' cannot';
	html += ' be filled';
	html += ' :: '+method+'()';
	
	this.solutionLog.push( html );
};




LogicPic.Solver.prototype.getTotalSolved = function()
{
	var total = 0,
		key;
	
	for(key in this.puzzle.cells) {
		total += this.puzzle.cells[key].aiSolution != null;
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







