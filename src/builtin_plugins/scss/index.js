const sass = require('sass')

exports.constructor = async function (params) {
  return {
    pugFilters: { scss: ScssPugFilter }
  }
}

function ScssPugFilter (text, options) {
  if (options.filename.endsWith('scss'))
    return sass.compile(options.filename).css
  return sass.compileString(text).css
}
