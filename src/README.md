# nonogram

[![License MIT](https://img.shields.io/badge/licence-MIT-3498db.svg?style=popout-square)](https://choosealicense.com/licenses/mit/)
[![No Dependencies](https://img.shields.io/badge/dependencies-none-27ae60.svg?style=popout-square)]()

A small javascript library for creating, solving, and playing nonogram puzzles.

## About
[Nonograms](https://en.wikipedia.org/wiki/Nonogram) (or Picross puzzles, or 20 other names) are a fun type of logic puzzle.

The original version of this library was written in the fall of 2016 when I discovered nonograms, found them very fun, and decided to throw together a web app for personal use to generate, play and solve the puzzles.  I've since refactored it using ES6 classes, and eliminating all dependencies such as jQuery, Foundation, FontAwesome, etc.

## Features

- Lightweight
- No dependencies
- Fast solving alogorithm that uses human techniques instead of brute force.
- Simple, themable GUI (optional)

#Demo

[Live Demo](https://monkeyarms.github.io/nonogram/)

## Basic Usage

(See `example` directory for a simple implementation.)

Include nonogram:

`<script src="nonogram/dist/nonogram.min.js"></script>`

Set up containers to hold the gui elements (`data-nonogram-{x}` attributes are required for the GUI to work, but you can place the containers anywhere you like):

```html
<div data-nonogram-generate-controls></div>
<div data-nonogram-puzzle-grid></div>
<div data-nonogram-game-controls></div>
<div data-nonogram-console></div>
```
Create a random 5x5 puzzle and tell the GUI to render everything:
```html
<script>

const creator = new Nonogram.Creator();
const puzzle  = creator.createRandom( 5, 5 );
const gui = new Nonogram.Gui();

gui.draw( puzzle );

</script>
```
## Theming
Copy the `default` directory in `dist/themes` and rename it to "my-theme" (or whatever).  Change the stylesheet or gui templates, then tell the GUI to load it in the constructor:

```javascript
const gui = new Nonogram.Gui( 'my-theme' );
```
The theme stylesheet is automatically prepended to your pages `<head>` element so that any other stylesheets can override it.  Theme templates are loaded asynchronously in the background.













