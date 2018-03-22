<p align="center"><img width='270px' src="https://github.com/RelaxedJS/ReLaXed/raw/master/logo-blue.png" /></p>

# ReLaXed

ReLaXed is a software to create PDF documents using the Pug language (a shorthand for HTML). It enables to define complex layouts with CSS and Javascript while writing the content in a friendly, minimal syntax close to Markdown or LaTeX.


<table>
  <tr align="center">
    <td>
      <img src="https://github.com/RelaxedJS/ReLaXed-examples/raw/master/examples/book/book_screenshot.png" />
      <a href="https://github.com/RelaxedJS/ReLaXed-examples/tree/master/examples/book/"> Book </a>
    </td>
    <td>
      <img src="https://github.com/RelaxedJS/ReLaXed-examples/raw/master/examples/letter/letter_screenshot.png" />
      <a href="https://github.com/RelaxedJS/ReLaXed-examples/tree/master/examples/letter/"> Letter </a>
    </td>
    <td>
      <img src="https://github.com/RelaxedJS/ReLaXed-examples/raw/master/examples/resume/resume_screenshot.png" />
      <a href="https://github.com/RelaxedJS/ReLaXed-examples/tree/master/examples/resume/"> Resume </a>
    </td>
    <td>
      <img src="https://github.com/RelaxedJS/ReLaXed-examples/raw/master/examples/business-card/businesscard_screenshot.png" />
      <a href="https://github.com/RelaxedJS/ReLaXed-examples/tree/master/examples/business-card/"> Business card </a>
    </td>
  </tr>
</table>
 
 
## Getting started


Install ReLaXed with [NPM](https://www.npmjs.com/get-npm):

```
npm install -h relaxedjs
```

To start a project, create a new empty file ``my_document.pug`, and start ReLaXed from a terminal:

```
relaxed my_document.pug
```

Now ReLaXed is watching ``my_document.pug`` and all its directory. Everytime a file changes,  ``my_document.pug`` will be compiled as ``my_document.pdf``. Tot est this, write the following in ``my_document.pug`` and save:

```pug
h1 My document's title
p A paragraph in my document
```

Now you know the basics and you can write your first documents ! To go further:
- Learn more about the capabilities of the [Pug language](https://pugjs.org/api/getting-started.html).
- Browse the [examples]()
- Read about our [recommended setup]() to use ReLaXed
- Learn some [advanced features]() of ReLaxed
- Read [this comparison]() of ReLaXed and other document editing systems

## How ReLaXed works

ReLaxed consists of few lines of code binding together other software. It uses [chokidar](https://github.com/paulmillr/chokidar) to watch the file system. when a file is changed, several javascript libraries are used to compile SCSS, Pug, Markdown, and [diagram files] into an HTML page which is then printed to a PDF file by a headless instance of Chromium (via [puppeteer](https://github.com/GoogleChrome/puppeteer)).

## Contribute

ReLaXed is an open source framework originally written by [Zulko](https://github.com/Zulko) and released on [Github](https://github.com/Zulko/relaxed) under the ISC licence. Everyone is welcome to contribute!
