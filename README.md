# nonogram

[![License MIT](https://img.shields.io/badge/licence-MIT-3498db.svg?style=popout-square)](https://choosealicense.com/licenses/mit/)
[![No Dependencies](https://img.shields.io/badge/dependencies-none-27ae60.svg?style=popout-square)]()

A small javascript library for creating, solving, and playing nonogram puzzles.

## About

[Nonograms](https://en.wikipedia.org/wiki/Nonogram) (or "Picross" puzzles, or several other names) are a fun type of visual logic puzzle.  If you enjoy Sudoku, Kakuro, or other logic puzzles you might enjoy Nonograms.

The original version of this library was written in the fall of 2016 as a hobby project.

The library has been refactored to use ES6 classes, and eliminated all dependencies such as jQuery, Foundation, FontAwesome, etc.

## Features

- Lightweight (~8KB when gzipped)
- No dependencies
- Fast solving alogorithm that uses logical techniques instead of brute force.
- Can be used stand-alone to generate, parse or solve puzzles.
- Simple, themable GUI (optional)

## Demo

[Live Demo](https://monkeyarms.github.io/nonogram/)

## Basic Usage

(See `example` directory for a simple implementation.)

Place containers to hold the gui elements with `data-nonogram-{x}` attributes.  They can be placed anywhere in an HTML layout and none are required:

```html
<div data-nonogram-generate-controls></div>
<div data-nonogram-puzzle-grid></div>
<div data-nonogram-game-controls></div>
<div data-nonogram-console></div>
```

Include nonogram:

```html
<script src="./dist/nonogram.min.js"></script>
```

Create a random 8x8 puzzle and tell the GUI to render everything:
```html
<script>

	const creator = new Nonogram.Creator();
	const puzzle  = creator.createRandom( 8, 8 );
	const gui     = new Nonogram.Gui();

	gui.draw( puzzle );

</script>
```

## Usage via source ES6 modules

Replace the javascript above with the following:

```html
<script type="module">

	import {Creator, Gui} from './src/index.js';

	const creator = new Creator();
	const puzzle  = creator.createRandom( 8, 8 );
	const gui     = new Gui();

	gui.draw( puzzle );

</script>
```


## Theming

Copy the `default` directory in `dist/themes` and rename it to "my-theme", etc.  Modify the theme, then tell the GUI to load it in the constructor:

```javascript
const gui = new Gui( 'my-theme' );
```
The theme stylesheet is automatically prepended to your pages `<head>` element so that any other stylesheets can override it.  Theme templates are loaded asynchronously in the background.













