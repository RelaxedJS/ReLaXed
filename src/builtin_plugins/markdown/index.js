var hljs = require('highlight.js') // https://highlightjs.org/
var markdown = require('markdown-it')
var mdFootnote = require('markdown-it-footnote')
var mdKatex = require('@iktakahiro/markdown-it-katex')

exports.constructor = async function (params) {
  var href = "https://cdn.jsdelivr.net/npm/katex@0.11.1/dist/katex.min.css"
  return {
    pugFilters: { markdown: MarkdownPugFilter },
    headElements: `<link rel="stylesheet" href="${href}" />`
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
