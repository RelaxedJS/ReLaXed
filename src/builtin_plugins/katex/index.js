const katex = require('katex')
const fs = require('fs')
const path = require('path')

exports.constructor = async function (params) {
  return {
    headElements: fs.readFileSync(path.join(__dirname, 'head.html')),
    pugFilters: {
      katex (text, options) { return katex.renderToString(text) }
    }
  }
}
