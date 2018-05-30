# Changelog

## v0.1.6

Features:

- Now exposing ``require`` for use in in-Pug javascript
- Bibliography system, built-in.
- Shorthand ``--bo`` for ``--build-once``

Fixes:

- fixed typo breaking special converters (mermaid, etc.)
- faster PDF rendering by using chromium's DOM instead of cheerio.
- better (faster) stepSVG mixin

Internal:

- Lots of code reorganization, mostly by @Drew-S, and marks for future plugins.
- A test suite ! But not for interactive usage yet.
- Added project members to readme.

## v 0.1.5

- Some console output fixes
- Now avoiding new renderings when already busy.
- New "built-in" mixin ``stepsSVG`` for including progressive
  (i.e. animated) SVGs into slides
- New command-line utility ``pretty-pdf-thumbnail`` shipped with ReLaXed.

## v 0.1.4

Important release with speed and features improvements.

Breaking API changes:

- Now using ``template#page-footer``, ``template#page-header`` to define
  page header and footer.
- MathJax de-activated by default

New features:

- Command-line parameter ``--build-once`` for one-time builds
- New exposed javascript globals in templates:
  - Packages: ``fs``, ``cheerio``
  - Variables: ``basedir`` (indicating the base path of the master file)
- Experimental Katex filter now available
- Files with extension ``.o.svg`` are automatically converted to optimized
  svgs (``*_optimized.svg``).
- Console now shows a breakdown of rendering time.

Other changes in the code:

- First test suite !!
- Removed some jstransformer dependencies.
- Refactoring with utils.py
