const sass = require('node-sass')

exports.constructor = async function (params) {
  return {
    pugFilters: { scss: ScssPugFilter }
  }
}

function ScssPugFilter (text, options) {
  var file = options.filename
  options = file.endsWith('scss') ? { file } : { data: text }
  return sass.renderSync(options).css.toString('utf8')
}
