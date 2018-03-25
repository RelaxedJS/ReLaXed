<p align="center"><img width='270px' src="https://github.com/RelaxedJS/ReLaXed/raw/master/logo-blue.png" /></p>

# ReLaXed

ReLaXed is a software to create PDF documents interactively using the Pug language (a shorthand for HTML). It enables to define complex layouts with CSS and Javascript while writing the content in a friendly, minimal syntax close to Markdown or LaTeX.

Here it is in action in the Atom editor:


<p align='center'><img src="https://i.imgur.com/4N4fSYY.gif" title="source: imgur.com" /></p>

 And here are a few output examples:


<table>
  <tr align="center">
    <td width="25%">
      <img src="https://github.com/RelaxedJS/ReLaXed-examples/raw/master/examples/book/book_screenshot.png" />
      Book -
      <a href="https://github.com/RelaxedJS/ReLaXed-examples/tree/master/examples/book/"> source </a> /
      <a href="https://github.com/RelaxedJS/ReLaXed-examples/blob/master/examples/book/book.pdf"> PDF </a>
    </td>
    <td width="25%">
      <img src="https://github.com/RelaxedJS/ReLaXed-examples/raw/master/examples/letter/letter_screenshot.png" />
      Letter -
      <a href="https://github.com/RelaxedJS/ReLaXed-examples/tree/master/examples/letter/"> Source </a> /
      <a href="https://github.com/RelaxedJS/ReLaXed-examples/blob/master/examples/letter/letter.pdf"> PDF </a>
    </td>
    <td width="25%">
      <img src="https://github.com/RelaxedJS/ReLaXed-examples/raw/master/examples/resume/resume_screenshot.png" />
      Resume -
      <a href="https://github.com/RelaxedJS/ReLaXed-examples/tree/master/examples/resume/"> Source </a> /
      <a href="https://github.com/RelaxedJS/ReLaXed-examples/blob/master/examples/resume/resume.pdf"> PDF </a>
    </td>
    <td width="25%">
      <img src="https://github.com/RelaxedJS/ReLaXed-examples/raw/master/examples/business-card/businesscard_screenshot.png" />
      Visit card -
      <a href="https://github.com/RelaxedJS/ReLaXed-examples/tree/master/examples/business-card/"> Source </a> /
      <a href="https://github.com/RelaxedJS/ReLaXed-examples/blob/master/examples/business-card/business-card.pdf"> PDF </a>
    </td>
  </tr>
  <tr align="center">
    <td width="25%">
      <img src="https://github.com/RelaxedJS/ReLaXed-examples/raw/master/examples/slides/slides_screenshot.png" />
      Slides -
      <a href="https://github.com/RelaxedJS/ReLaXed-examples/tree/master/examples/slides/"> Source </a> /
      <a href="https://github.com/RelaxedJS/ReLaXed-examples/blob/master/examples/slides/slides.pdf"> PDF </a>
    </td>
    <td width="25%">
      <img src="https://github.com/RelaxedJS/ReLaXed-examples/raw/master/examples/report/report_screenshot.png" />
      Report -
      <a href="https://github.com/RelaxedJS/ReLaXed-examples/tree/master/examples/report/"> Source </a> /
      <a href="https://github.com/RelaxedJS/ReLaXed-examples/blob/master/examples/report/report.pdf"> PDF </a>
    </td>
    <td width="25%">
       <img src="https://github.com/RelaxedJS/ReLaXed-examples/raw/master/examples/paper/paper_screenshot.png" />
       Paper -
       <a href="https://github.com/RelaxedJS/ReLaXed-examples/tree/master/examples/paper/"> Source </a> /
       <a href="https://github.com/RelaxedJS/ReLaXed-examples/blob/master/examples/paper/paper.pdf"> PDF </a>
     </td>
  </tr>
</table>

## Installing ReLaXed

At the moment, the best solution is to install ReLaXed in an empty directory as follows:

```
git clone https://github.com/RelaxedJS/ReLaXed.git .
npm install
sudo npm link --unsafe-perm=true
```

This provides your system with the ``relaxed`` command.

Hopefully in the future install will be as simple as ``npm i -g relaxedjs``, but there are known [issues](https://github.com/GoogleChrome/puppeteer/issues/375#issuecomment-363466257) with puppeteer. In case it doesn't work for you, have a look at the [troubleshooting](https://github.com/RelaxedJS/ReLaXed/wiki/Troubleshooting) page. Any help towards a simpler install procedure is welcome.


## Getting started

To start a project, create a new empty file ``my_document.pug``, and start a ReLaXed process from a terminal:

```
relaxed my_document.pug
```

ReLaXed will watch ``my_document.pug`` and its directory. Everytime a file changes,  ``my_document.pug`` will be compiled as ``my_document.pdf``.

Now write and save the following in ``my_document.pug``:

```pug
h1 My document's title
p A paragraph in my document
```
A new file ``my_document.pdf`` will be created. Every time you modify and save the sources, the file is automatically updated (make sure to use a PDF viewer with auto-refresh to see you changes happen in *real-time*). That's all there is to know to start writing your first documents !

To go further:

- Learn more about the capabilities of the [Pug language](https://pugjs.org/api/getting-started.html).
- Browse the [examples](https://github.com/RelaxedJS/ReLaXed-examples)
- Read about our [recommended setup](https://github.com/RelaxedJS/ReLaXed/wiki/Tips-and-recommendations) to use ReLaXed
- Learn some [advanced features](https://github.com/RelaxedJS/ReLaXed/wiki/Features) of ReLaxed
- Read [these comparisons](https://github.com/RelaxedJS/ReLaXed/wiki/ReLaXed-vs-other-solutions) of ReLaXed and other document editing systems

## Why yet another PDF document editor ?

Many of us prefer mark-up languages (Markdown, LaTeX, etc.) to interfaced document editors like Ms Office or Google Docs. This is because mark-up languages make it easier to quickly write documents with consistent style.

However, Markdown is limited to the title/sections/paragraphs structure, and LaTeX has obscure syntax and errors that also make it difficult to go off the beaten tracks.

On the other hand, web technologies have never looked so good.

- Beautiful CSS frameworks will make sure your documents look clean and modern.
- There are Javascript libraries for pretty much anything: plotting, highlight code, rendering equations...
- Millions of people (and growing) know how to use these.
- Shorthand languages like Pug and SCSS are finally making it fun to write HTML and CSS.
- (Headless) web browsers can easily turn web documents into PDF, on any platform.

ReLaXed is an attempt at finding the most comfortable way to leverage this for desktop PDF creation.

## How ReLaXed works

ReLaxed consists of few lines of code binding together other software. It uses [chokidar](https://github.com/paulmillr/chokidar) to watch the file system. when a file is changed, several javascript libraries are used to compile SCSS, Pug, Markdown, and [diagram files] into an HTML page which is then printed to a PDF file by a headless instance of Chromium (via [puppeteer](https://github.com/GoogleChrome/puppeteer)).

## Contribute !

ReLaXed is an open source framework originally written by [Zulko](https://github.com/Zulko) and released on [Github](https://github.com/Zulko/relaxed) under the ISC licence. Everyone is welcome to contribute!
