<p align="center"><img width='270px' src="https://github.com/RelaxedJS/ReLaXed/raw/master/logo-blue.png" /></p>

# ReLaXed

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

Install ReLaXed via [NPM](https://www.npmjs.com/):

```
npm i -g relaxedjs
```

This will provide your system with the ``relaxed`` command. If the installation fails, refer to the [troubleshooting page](https://github.com/RelaxedJS/ReLaXed/wiki/Troubleshooting).


## Getting started

To start a project, create a new, empty ``my_document.pug`` file, and start a ReLaXed process from a terminal:

```
relaxed my_document.pug
```

ReLaXed will watch ``my_document.pug`` and its directory. Every time a file changes, ``my_document.pug`` will be compiled as ``my_document.pdf``.

Now write and save the following in ``my_document.pug``:

```pug
h1 My document's title
p A paragraph in my document
```
A new file, ``my_document.pdf``, will be created. Every time you modify and save the sources, the file is automatically updated (make sure you use a PDF viewer with auto-refresh to see your changes happen in *real-time*). That's all there is to know to start creating your first document!

To go further:

- Learn more about the capabilities of the [Pug language](https://pugjs.org/api/getting-started.html)
- Browse the [examples](https://github.com/RelaxedJS/ReLaXed-examples)
- Read about our [recommended setup](https://github.com/RelaxedJS/ReLaXed/wiki/Tips-and-recommendations) to use ReLaXed
- Learn some [advanced features](https://github.com/RelaxedJS/ReLaXed/wiki/Features) of ReLaxed
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

## Contribute!

ReLaXed is an open-source framework originally written by [Zulko](https://github.com/Zulko) and released on [Github](https://github.com/RelaxedJS/ReLaXed) under the ISC licence. Everyone is welcome to contribute!

## License

[ISC](https://github.com/RelaxedJS/ReLaXed/blob/master/LICENCE.txt)
