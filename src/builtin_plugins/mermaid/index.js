const pug = require('pug')
const fs = require('fs')
const path = require('path')

exports.constructor = async function (params) {
  return {
    watchers: [
      {
        extensions: ['.mermaid'],
        handler: mermaidHandler
      }
    ]
  }
}

var mermaidHandler = async function (mermaidPath, page) {
  var mermaidSpec = fs.readFileSync(mermaidPath, 'utf8')
  var html = pug.renderFile(path.join(__dirname, 'template.pug'), {
    mermaidSpec
  })

  await page.setContent(html)
  await page.waitForSelector('#graph svg')

  var svg = await page.evaluate(function () {
    var el = document.querySelector('#graph svg')
    el.removeAttribute('height')
    el.classList.add('mermaid-svg')
    return el.outerHTML
  })

  var svgPath = mermaidPath.substr(0, mermaidPath.lastIndexOf('.')) + '.svg'

  fs.writeFileSync(svgPath, svg)
}
