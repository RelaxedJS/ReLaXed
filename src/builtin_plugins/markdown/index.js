var hljs = require('highlight.js') // https://highlightjs.org/
var markdown = require('markdown-it')
var mdFootnote = require('markdown-it-footnote')
var mdKatex = require('markdown-it-katex')

exports.constructor = async function (params) {
  var href = "https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.11.1/katex.min.css"
  return {
    pugFilters: { markdown: MarkdownPugFilter },
    headElements: `<link rel="stylesheet" href="${href}"></link>`
  }
}
function MarkdownPugFilter (text, options) {
  var md = markdown({
    ...options,
    highlight: function (str, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return '<pre class="hljs"><code>' +
                  hljs.highlight(lang, str, true).value +
                  '</code></pre>';
        } catch (__) {}
      }
      return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>'
    }
  })
  md.use(mdFootnote)
  md.use(mdKatex)
  return md.render(text)
}


