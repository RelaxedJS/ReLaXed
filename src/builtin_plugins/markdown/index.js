const sass = require('markdown-it')
var hljs = require('highlight.js'); // https://highlightjs.org/

exports.constructor = async function (params) {
  return {
    pugFilters: { markdown: MarkdownPugFilter }
  }
}

function MarkdownPugFilter (text, options) {
  var md = require('markdown-it')({
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
  }).use(require('markdown-it-footnote'))
  return md.render(text)
}
