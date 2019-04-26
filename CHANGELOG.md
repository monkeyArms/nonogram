# nonogram Release Notes


## 1.0.0

- Started git repo
- Started `CHANGELOG.md`
- Refactored JS syntax and cleaned up many linting errors.
    - converted `var` declarations to `let` or `const`
    - refactored the original `prototypes` into `ES6 classes` class declarations
    - changed function arguments to use `arrow functions`
    - modified various `for` and `for in` looping structures to use `forEach`, `for of`, `map`, `some`, `every`, and `fill`, which actually seems to have improved performance.
    - fixed all `==` potential type coercion issues with `===`
    - Documented js library using `JSDoc`
 - Added the `Nonogram.Utility` class and moved some often used methods to here, declared statically.
 - Transitioned some previously anonymous objects into their own classes: `Nonogram.PuzzleCell` and`Nonogram.PuzzleLine`
 - Restructured into project into `src`, `dist`, and `example` directories
 - Added `.editorconfig`
 - Added `package.json`
 - Installed `ESLint` and added `.eslintrc.json`
 - Installed `webpack`
 - added `webpack.config.js` and configured build
 - Added `LICENSE` file
 - Removed all JS, CSS and font dependencies
 - Added theme system
 - Added ability to load example puzzles
 - created `README.md`
 - added index.html file for github page


## 0.1.0

- The original version was written in the fall of 2016 when I discovered nonograms, found them very fun, and decided to throw together a web app for personal use to generate, play and solve the puzzles.

