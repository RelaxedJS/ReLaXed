<p align="center"><img width='270px' src="https://github.com/RelaxedJS/ReLaXed/raw/master/logo-blue.png" /></p>

# ReLaXed

[![Build Status](https://travis-ci.org/RelaxedJS/ReLaXed.svg?branch=master)](https://travis-ci.org/RelaxedJS/ReLaXed)

ReLaXed creates PDF documents interactively using HTML or [Pug](https://pugjs.org/api/getting-started.html) (a shorthand for HTML). It allows complex layouts to be defined with CSS and JavaScript, while writing the content in a friendly, minimal syntax close to Markdown or LaTeX.

Here it is in action in the Atom editor:

<p align='center'><img src="https://i.imgur.com/4N4fSYY.gif" title="source: imgur.com" /></p>

And here are a few output examples:

<table>
  <tr align="center">
    <td width="25%">
      <a href="https://github.com/RelaxedJS/ReLaXed-examples/blob/master/examples/book/book.pdf">
        <img src="https://github.com/RelaxedJS/ReLaXed-examples/raw/master/examples/book/book_screenshot.png" />
      </a>
      Book -
      <a href="https://github.com/RelaxedJS/ReLaXed-examples/tree/master/examples/book/"> source </a> /
      <a href="https://github.com/RelaxedJS/ReLaXed-examples/blob/master/examples/book/book.pdf"> PDF </a>
    </td>
    <td width="25%">
      <a href="https://github.com/RelaxedJS/ReLaXed-examples/blob/master/examples/letter/letter.pdf">
        <img src="https://github.com/RelaxedJS/ReLaXed-examples/raw/master/examples/letter/letter_screenshot.png" />
      </a>
      Letter -
      <a href="https://github.com/RelaxedJS/ReLaXed-examples/tree/master/examples/letter/"> Source </a> /
      <a href="https://github.com/RelaxedJS/ReLaXed-examples/blob/master/examples/letter/letter.pdf"> PDF </a>
    </td>
    <td width="25%">
      <a href="https://github.com/RelaxedJS/ReLaXed-examples/blob/master/examples/resume/resume.pdf">
        <img src="https://github.com/RelaxedJS/ReLaXed-examples/raw/master/examples/resume/resume_screenshot.png" />
      </a>
      Resume -
      <a href="https://github.com/RelaxedJS/ReLaXed-examples/tree/master/examples/resume/"> Source </a> /
      <a href="https://github.com/RelaxedJS/ReLaXed-examples/blob/master/examples/resume/resume.pdf"> PDF </a>
    </td>
    <td width="25%">
      <a href="https://github.com/RelaxedJS/ReLaXed-examples/blob/master/examples/business-card/business-card.pdf">
      <img src="https://github.com/RelaxedJS/ReLaXed-examples/raw/master/examples/business-card/businesscard_screenshot.png" /></a>
      Visit card -
      <a href="https://github.com/RelaxedJS/ReLaXed-examples/tree/master/examples/business-card/"> Source </a> /
      <a href="https://github.com/RelaxedJS/ReLaXed-examples/blob/master/examples/business-card/business-card.pdf"> PDF </a>
    </td>
  </tr>
</table>
<table>
  <tr align="center">
    <td width="25%">
      <a href="https://github.com/RelaxedJS/ReLaXed-examples/blob/master/examples/slides/slides.pdf">
        <img src="https://github.com/RelaxedJS/ReLaXed-examples/raw/master/examples/slides/slides_screenshot.png" />
      </a>
      Slides -
      <a href="https://github.com/RelaxedJS/ReLaXed-examples/tree/master/examples/slides/"> Source </a> /
      <a href="https://github.com/RelaxedJS/ReLaXed-examples/blob/master/examples/slides/slides.pdf"> PDF </a>
    </td>
    <td width="25%">
      <a href="https://github.com/RelaxedJS/ReLaXed-examples/blob/master/examples/report/report.pdf">
        <img src="https://github.com/RelaxedJS/ReLaXed-examples/raw/master/examples/report/report_screenshot.png" />
      </a>
      Report -
      <a href="https://github.com/RelaxedJS/ReLaXed-examples/tree/master/examples/report/"> Source </a> /
      <a href="https://github.com/RelaxedJS/ReLaXed-examples/blob/master/examples/report/report.pdf"> PDF </a>
    </td>
    <td width="25%">
       <a href="https://github.com/RelaxedJS/ReLaXed-examples/blob/master/examples/paper/paper.pdf">
         <img src="https://github.com/RelaxedJS/ReLaXed-examples/raw/master/examples/paper/paper_screenshot.png" />
       </a>
       Paper -
       <a href="https://github.com/RelaxedJS/ReLaXed-examples/tree/master/examples/paper/"> Source </a> /
       <a href="https://github.com/RelaxedJS/ReLaXed-examples/blob/master/examples/paper/paper.pdf"> PDF </a>
     </td>
   <td width="25%">
     <a href="https://github.com/RelaxedJS/ReLaXed-examples/blob/master/examples/poster/poster.pdf">
       <img src="https://github.com/RelaxedJS/ReLaXed-examples/raw/master/examples/poster/poster_screenshot.png" />
     </a>
     Poster -
     <a href="https://github.com/RelaxedJS/ReLaXed-examples/tree/master/examples/poster/"> Source </a> /
     <a href="https://github.com/RelaxedJS/ReLaXed-examples/blob/master/examples/poster/poster.pdf"> PDF </a>
   </td>
  </tr>
</table>

ReLaXed has support for Markdown, LaTeX-style mathematical equations (via [MathJax](https://www.mathjax.org/)), CSV conversion to HTML tables, plot generation (via [Vega-Lite](https://vega.github.io/vega-lite/) or [Chart.js](https://www.chartjs.org/)), and diagram generation (via [mermaid](https://mermaidjs.github.io/)). Many more features can be added simply by importing an existing JavaScript or CSS framework.

## Installing ReLaXed

Install ReLaXed via [NPM](https://www.npmjs.com/) with this command (do not use ``sudo``):

```
npm i -g relaxedjs
```

This will provide your system with the ``relaxed`` command. If the installation fails, refer to the [troubleshooting page](https://github.com/RelaxedJS/ReLaXed/wiki/Troubleshooting). You can also use ReLaXed via Docker (see [this repository](https://github.com/jonathanasquier/ReLaXed-docker/blob/master/Dockerfile))


## Getting started

To start a project, create a new document ``my_document.pug`` with the following Pug content:

```pug
h1 My document's title
p A paragraph in my document
```

Then start ReLaXed from a terminal:

```
relaxed my_document.pug
```

ReLaXed will generate ``my_document.pdf`` from ``my_document.pug``, then watch its directory and subdirectories so that every time a file changes, ``my_document.pdf`` will be re-generated.

It is also possible to generate the PDF file just once, with no sub-sequent file-watching, with this command:

```
relaxed my_document.pug --build-once
```

To go further:

- Read more about [usage and options](https://github.com/RelaxedJS/ReLaXed/wiki/Command-line-options) of the ``relaxed`` command.
- Learn more about the capabilities of the [Pug language](https://pugjs.org/api/getting-started.html)
- Learn how to use or write [ReLaXed plugins](https://github.com/RelaxedJS/ReLaXed/wiki/Plugins)
- Browse the [examples](https://github.com/RelaxedJS/ReLaXed-examples)
- Read about our [recommended setup](https://github.com/RelaxedJS/ReLaXed/wiki/Tips-and-recommendations) to use ReLaXed
- read about [special file rendering](https://github.com/RelaxedJS/ReLaXed/wiki/Special-file-renderings) in ReLaxed
- Read [these comparisons](https://github.com/RelaxedJS/ReLaXed/wiki/ReLaXed-vs-other-solutions) between ReLaXed and other document-editing systems

## Why yet another PDF document creator?

Many of us prefer markup languages (Markdown, LaTeX, etc.) to GUI document-editors like MS Office or Google Docs. This is because markup languages make it easier to quickly write documents in a consistent style.

However, Markdown is limited to the title/sections/paragraphs structure, and LaTeX has obscure syntax and errors that also make it difficult to stray from the beaten track.

On the other hand, web technologies have never looked so good.

- Beautiful CSS frameworks make sure your documents look clean and modern.
- There are JavaScript libraries for pretty much anything: plotting, highlight code, rendering equations...
- Millions of people (and growing) know how to use these.
- Shorthand languages like Pug and SCSS are finally making it fun to write HTML and CSS.
- (Headless) web browsers can easily turn web documents into PDF, on any platform.

ReLaXed is an attempt at finding the most comfortable way to leverage this for desktop PDF creation.

## How ReLaXed works

ReLaXed consists of a few lines of code binding together other software. It uses [Chokidar](https://github.com/paulmillr/chokidar) to watch the file system. When a file is changed, several JavaScript libraries are used to compile SCSS, Pug, Markdown, and diagram files (mermaid, flowchart.js, Chart.js) into an HTML page which is then printed to a PDF file by a headless instance of Chromium (via [Puppeteer](https://github.com/GoogleChrome/puppeteer)).

<p align="center"><img width='600px' src="https://github.com/RelaxedJS/ReLaXed/raw/master/docs/relaxed_stack.png" /></p>

## Using it as a Node Module
**MasterToPDF.js** is exposed by default as main package, which can be used directly.

An Example: 

```javascript
const { masterToPDF } = require('relaxedjs');
const puppeteer = require('puppeteer');
const plugins = require('relaxedjs/src/plugins');
const path = require('path');

class HTML2PDF {
  constructor() {
    this.puppeteerConfig = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-translate',
        '--disable-extensions',
        '--disable-sync',
      ],
    };

    this.relaxedGlobals = {
      busy: false,
      config: {},
      configPlugins: [],
    };

    this._initializedPlugins = false;
  }

  async _initializePlugins() {
    if (this._initializedPlugins) return; // Do not initialize plugins twice
    for (const [i, plugin] of plugins.builtinDefaultPlugins.entries()) {
      plugins.builtinDefaultPlugins[i] = await plugin.constructor();
    }
    await plugins.updateRegisteredPlugins(this.relaxedGlobals, '/');

    const chrome = await puppeteer.launch(this.puppeteerConfig);
    this.relaxedGlobals.puppeteerPage = await chrome.newPage();
    this._initializedPlugins = true;
  }

  async pdf(templatePath, json_data, tempHtmlPath, outputPdfPath) {
    await this._initializePlugins();
    if (this._initializedPlugins) {
      // Paths must be absolute
      const defaultTempHtmlPath = tempHtmlPath || path.resolve('temp.html');
      const defaultOutputPdfPath =
        outputPdfPath || path.resolve('output.pdf');

      await masterToPDF(
        templatePath,
        this.relaxedGlobals,
        defaultTempHtmlPath,
        defaultOutputPdfPath,
        json_data
      );
    }
  }
}

module.exports = new HTML2PDF();
```
Usage:

```javascript
const HTML2PDF = require('./HTML2PDF.js');
(async () => {
    await HTML2PDF.pdf('./template.pug', {"a":"b", "c":"d"});
})();
```


## Contribute!

ReLaXed is an open-source framework originally written by [Zulko](https://github.com/Zulko) and released on [Github](https://github.com/RelaxedJS/ReLaXed) under the ISC licence. Everyone is welcome to contribute!

For bugs and feature requests, open a Github issue. For support or Pug/HTML-related questions, ask on Stackoverflow or on the brand new [reddit/r/relaxedjs](https://www.reddit.com/r/relaxedjs/) forum, which can be used for any kind of discussion.

**Projects members:**

- [@Zulko](https://github.com/Zulko) (Owner)
- [@Drew-S](https://github.com/Drew-S) (architecture, plugins)
- [@DanielRuf](https://github.com/DanielRuf)
- [@benperiton](https://github.com/benperiton)

## License

[ISC](https://github.com/RelaxedJS/ReLaXed/blob/master/LICENCE.txt)
