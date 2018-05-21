# Changelog

## v 0.1.4

Important release with speed and features improvements.

Breaking API changes:

- Now using ``template#page-footer``, ``template#page-header`` to define
  page header and footer.
- MathJax de-activated by default

New features:

- New exposed javascript globals in templates:
  - Packages: ``fs``, ``cheerio``
  - Variables: ``basedir`` (indicating the base path of the master file)
-  New "built-in" mixin ``stepsSVG`` for including "progressive"
   (i.e. animated) SVGs into slides
- Experimental Katex filter now available
- Files with extension ``.o.svg`` are automatically converted to optimized
  svgs (``*_optimized.svg``).
- Console now shows a breakdown of rendering time.

Other code changes:

- Removed some jstransformer dependencies.
- Refactoring with utils.py
