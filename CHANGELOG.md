# nonogram Release Notes


## 0.2.0

- Started git repo
- Started `CHANGELOG.md`
- Refactored JS syntax and cleaned up many linting errors.
    - Converted `var` declarations to `let` or `const`
    - Refactored the original `prototypes` into `ES6 classes` class declarations
    - Changed function arguments to use `arrow functions`
    - Modified various `for` and `for in` looping structures to use `forEach`, `for of`, `map`, `some`, `every`, and `fill`, which actually seems to have improved performance.
    - Fixed all `==` potential type coercion issues with `===`
    - Documented js library using `JSDoc`
 - Added the `Nonogram.Utility` class and moved some often used methods to here, declared statically.
 - Transitioned some previously anonymous objects into their own classes: `Nonogram.PuzzleCell` and`Nonogram.PuzzleLine`
 - Restructured into project into `src`, `dist`, and `example` directories
 - Added `.editorconfig`
 - Added `package.json`
 - Installed `ESLint` and added `.eslintrc.json`
 - Installed `webpack`
 - Added `webpack.config.js` and configured build
 - Added `LICENSE` file
 - Removed all JS, CSS and font dependencies
 - Added theme system
 - Started small example puzzle library and added ability to load/play examples
 - Created `README.md`
 - Added index.html file for github page
 - Improved UI - better layout and converted fill/cross controls to a switch
 
 ### TODO


 - Convert to ES6 Modules
  - Write tests


## 0.1.0

- The original version was written in the fall of 2016 when I discovered nonograms, found them very fun, and decided to throw together a web app for personal use to generate, play and solve the puzzles.

