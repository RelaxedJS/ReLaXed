const fs = require('fs')
const path = require('path')
const optimizeSVG = require('./optimizeSVG')

exports.constructor = async function (params) {
  return {
    pugHeaders: [
      fs.readFileSync(path.join(__dirname, './mixins.pug'), 'utf8')
    ],
    watchers: [
      {
        extensions: ['.o.svg'],
        async handler (svgPath, browserPage) {
          await optimizeSVG(svgPath, params['jpeg-quality'] || 85)
        }
      }
    ],
    htmlFilters: []
  }
}
